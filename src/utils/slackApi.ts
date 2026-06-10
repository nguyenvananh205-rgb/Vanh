const TOKEN_KEY = "slack_bot_token";
const BASE = "https://slack.com/api";

const nameCache = new Map<string, string>();

export function getSlackToken(): string { return localStorage.getItem(TOKEN_KEY) ?? ""; }
export function saveSlackToken(t: string) { localStorage.setItem(TOKEN_KEY, t.trim()); nameCache.clear(); }
export function clearSlackToken() { localStorage.removeItem(TOKEN_KEY); nameCache.clear(); }

async function slackGet<T>(
  method: string,
  params: Record<string, string> = {}
): Promise<T & { ok: boolean; error?: string }> {
  const token = getSlackToken();
  if (!token) throw new Error("NO_SLACK_TOKEN");
  const url = new URL(`${BASE}/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(slackErrorMessage(data.error));
  return data;
}

async function slackPost<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T & { ok: boolean; error?: string }> {
  const token = getSlackToken();
  if (!token) throw new Error("NO_SLACK_TOKEN");
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(slackErrorMessage(data.error));
  return data;
}

function slackErrorMessage(code?: string): string {
  const map: Record<string, string> = {
    not_authed: "Token không hợp lệ. Vui lòng kiểm tra lại.",
    invalid_auth: "Token không hợp lệ hoặc đã hết hạn.",
    account_inactive: "Tài khoản Slack không còn hoạt động.",
    channel_not_found: "Không tìm thấy channel hoặc bot chưa được invite vào channel.",
    missing_scope: "Bot thiếu quyền. Vui lòng kiểm tra lại OAuth Scopes.",
    not_in_channel: "Bot chưa được mời vào channel này.",
    ratelimited: "Quá nhiều request. Vui lòng thử lại sau vài giây.",
  };
  return map[code ?? ""] ?? `Lỗi Slack: ${code ?? "unknown"}`;
}

export interface TeamInfo {
  userId: string;
  user: string;
  team: string;
}

export async function verifyToken(): Promise<TeamInfo> {
  const d = await slackGet<{ user_id: string; user: string; team: string }>("auth.test");
  return { userId: d.user_id, user: d.user, team: d.team };
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  topic: string;
}

export async function listChannels(): Promise<SlackChannel[]> {
  const d = await slackGet<{
    channels: Array<{
      id: string;
      name: string;
      is_private: boolean;
      num_members: number;
      topic: { value: string };
    }>;
  }>("conversations.list", {
    types: "public_channel,private_channel",
    limit: "200",
    exclude_archived: "true",
  });
  return (d.channels ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    isPrivate: c.is_private,
    memberCount: c.num_members ?? 0,
    topic: c.topic?.value ?? "",
  }));
}

async function resolveUserName(userId: string): Promise<string> {
  if (nameCache.has(userId)) return nameCache.get(userId)!;
  try {
    const d = await slackGet<{
      user: { real_name: string; profile: { display_name: string; real_name_normalized: string } };
    }>("users.info", { user: userId });
    const name =
      d.user.profile.display_name ||
      d.user.profile.real_name_normalized ||
      d.user.real_name ||
      userId;
    nameCache.set(userId, name);
    return name;
  } catch {
    nameCache.set(userId, userId);
    return userId;
  }
}

function cleanSlackText(text: string): string {
  return text
    .replace(/<@[A-Z0-9]+>/g, "@user")
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1")
    .replace(/<https?:\/\/[^|>]*\|([^>]+)>/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, "[link]")
    .replace(/<!channel>|<!here>|<!everyone>/g, "@mention")
    .trim();
}

function tsToTime(ts: string): string {
  return new Date(parseFloat(ts) * 1000).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface SlackReply {
  ts: string;
  time: string;
  userName: string;
  text: string;
}

export interface SlackMessage {
  ts: string;
  time: string;
  userId: string;
  userName: string;
  text: string;
  replyCount: number;
  replies: SlackReply[];
}

export async function fetchChannelMessages(
  channelId: string,
  from: Date,
  to: Date,
  includeThreads: boolean
): Promise<SlackMessage[]> {
  // Set to end of day for the "to" date
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const d = await slackGet<{
    messages: Array<{
      ts: string;
      user?: string;
      text: string;
      thread_ts?: string;
      reply_count?: number;
      subtype?: string;
    }>;
  }>("conversations.history", {
    channel: channelId,
    oldest: (from.getTime() / 1000).toString(),
    latest: (toEnd.getTime() / 1000).toString(),
    limit: "200",
  });

  const raws = (d.messages ?? [])
    .filter((m) => !m.subtype && m.user && m.text?.trim())
    .reverse();

  // Batch resolve user names
  const userIds = [...new Set(raws.map((m) => m.user!))];
  await Promise.all(userIds.map(resolveUserName));

  const result: SlackMessage[] = [];
  for (const raw of raws) {
    const isParent = raw.thread_ts === raw.ts && (raw.reply_count ?? 0) > 0;
    const msg: SlackMessage = {
      ts: raw.ts,
      time: tsToTime(raw.ts),
      userId: raw.user!,
      userName: nameCache.get(raw.user!) ?? raw.user!,
      text: cleanSlackText(raw.text),
      replyCount: raw.reply_count ?? 0,
      replies: [],
    };

    if (isParent && includeThreads) {
      try {
        const td = await slackGet<{
          messages: Array<{ ts: string; user?: string; text: string }>;
        }>("conversations.replies", { channel: channelId, ts: raw.ts, limit: "50" });
        const replyRaws = (td.messages ?? []).slice(1).filter((m) => m.user && m.text);
        await Promise.all([...new Set(replyRaws.map((m) => m.user!))].map(resolveUserName));
        msg.replies = replyRaws.map((r) => ({
          ts: r.ts,
          time: tsToTime(r.ts),
          userName: nameCache.get(r.user!) ?? r.user!,
          text: cleanSlackText(r.text),
        }));
      } catch {
        // If thread fails, keep the parent without replies
      }
    }
    result.push(msg);
  }
  return result;
}

export function formatMessagesForAI(
  channelName: string,
  dateLabel: string,
  messages: SlackMessage[]
): string {
  const lines: string[] = [`=== Channel: #${channelName} (${dateLabel}) ===`];
  for (const m of messages) {
    lines.push(`[${m.time}] ${m.userName}: ${m.text}`);
    for (const r of m.replies) {
      lines.push(`  ↳ [${r.time}] ${r.userName}: ${r.text}`);
    }
  }
  return lines.join("\n");
}

export async function postSummaryToSlack(channelId: string, text: string): Promise<void> {
  await slackPost("chat.postMessage", { channel: channelId, text });
}
