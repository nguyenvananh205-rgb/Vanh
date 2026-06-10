const TOKEN_KEY = "slack_bot_token";
const BASE = "https://slack.com/api";

const nameCache = new Map<string, string>();

export function getSlackToken(): string { return localStorage.getItem(TOKEN_KEY) ?? ""; }
export function saveSlackToken(t: string) { localStorage.setItem(TOKEN_KEY, t.trim()); nameCache.clear(); }
export function clearSlackToken() { localStorage.removeItem(TOKEN_KEY); nameCache.clear(); }

// Small delay to stay within Slack rate limits (Tier 3: ~50 req/min)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function slackGet<T>(
  method: string,
  params: Record<string, string> = {}
): Promise<T & { ok: boolean; error?: string; has_more?: boolean; response_metadata?: { next_cursor?: string } }> {
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
    missing_scope: "Bot thiếu quyền. Vào OAuth & Permissions → thêm scope còn thiếu → Reinstall app.",
    not_in_channel: "Bot chưa được mời vào channel. Gõ /invite @TênBot trong channel đó.",
    ratelimited: "Quá nhiều request. Vui lòng thử lại sau vài giây.",
    invalid_cursor: "Lỗi phân trang. Vui lòng thử lại.",
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

// Fetches ALL channels with cursor-based pagination (handles workspaces with >200 channels)
export async function listChannels(): Promise<SlackChannel[]> {
  const all: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {
      types: "public_channel,private_channel",
      limit: "200",
      exclude_archived: "true",
    };
    if (cursor) params.cursor = cursor;

    const d = await slackGet<{
      channels: Array<{
        id: string;
        name: string;
        is_private: boolean;
        num_members: number;
        topic: { value: string };
      }>;
    }>("conversations.list", params);

    all.push(
      ...(d.channels ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        isPrivate: c.is_private,
        memberCount: c.num_members ?? 0,
        topic: c.topic?.value ?? "",
      }))
    );

    cursor = d.has_more ? (d.response_metadata?.next_cursor || undefined) : undefined;
    if (cursor) await sleep(300);
  } while (cursor);

  return all.sort((a, b) => a.name.localeCompare(b.name));
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

type RawMessage = {
  ts: string;
  user?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  subtype?: string;
};

// Fetches ALL messages in a channel for a date range using cursor pagination.
// Slack returns newest-first in pages; we collect all pages then reverse to oldest-first.
async function fetchAllHistory(
  channelId: string,
  oldest: string,
  latest: string,
  onPage?: (fetched: number) => void
): Promise<RawMessage[]> {
  const all: RawMessage[] = [];
  let cursor: string | undefined;

  do {
    const params: Record<string, string> = {
      channel: channelId,
      oldest,
      latest,
      limit: "200",
    };
    if (cursor) params.cursor = cursor;

    const d = await slackGet<{
      messages: RawMessage[];
    }>("conversations.history", params);

    const valid = (d.messages ?? []).filter(
      (m) => !m.subtype && m.user && m.text?.trim()
    );
    all.push(...valid);
    onPage?.(all.length);

    cursor = d.has_more ? (d.response_metadata?.next_cursor || undefined) : undefined;
    // Respect Slack Tier 3 rate limit (~50 req/min for conversations.history)
    if (cursor) await sleep(300);
  } while (cursor);

  // Slack returns newest-first; reverse to get oldest-first
  return all.reverse();
}

// Fetches ALL replies in a thread using cursor pagination.
async function fetchAllReplies(
  channelId: string,
  threadTs: string
): Promise<RawMessage[]> {
  const all: RawMessage[] = [];
  let cursor: string | undefined;
  let isFirstPage = true;

  do {
    const params: Record<string, string> = {
      channel: channelId,
      ts: threadTs,
      limit: "100",
    };
    if (cursor) params.cursor = cursor;

    const d = await slackGet<{ messages: RawMessage[] }>("conversations.replies", params);

    // First page includes the parent message at index 0 — skip it
    const replies = (d.messages ?? []).filter((m) => m.user && m.text?.trim());
    all.push(...(isFirstPage ? replies.slice(1) : replies));
    isFirstPage = false;

    cursor = d.has_more ? (d.response_metadata?.next_cursor || undefined) : undefined;
    if (cursor) await sleep(200);
  } while (cursor);

  return all;
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

export interface FetchProgress {
  channelName: string;
  channelIndex: number;
  totalChannels: number;
  messagesfetched: number;
  stage: "history" | "threads" | "done";
}

export async function fetchChannelMessages(
  channelId: string,
  from: Date,
  to: Date,
  includeThreads: boolean,
  onProgress?: (p: FetchProgress) => void
): Promise<SlackMessage[]> {
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const oldest = (from.getTime() / 1000).toString();
  const latest = (toEnd.getTime() / 1000).toString();

  // ── 1. Fetch all top-level messages (with pagination) ──────────────────────
  const raws = await fetchAllHistory(channelId, oldest, latest, (n) =>
    onProgress?.({ channelName: "", channelIndex: 0, totalChannels: 0, messagesfetched: n, stage: "history" })
  );

  // ── 2. Resolve all user names in one batch ─────────────────────────────────
  const userIds = [...new Set(raws.map((m) => m.user!))];
  await Promise.all(userIds.map(resolveUserName));

  // ── 3. Build messages, fetching thread replies where needed ────────────────
  const result: SlackMessage[] = [];

  for (const raw of raws) {
    const isThreadParent = raw.thread_ts === raw.ts && (raw.reply_count ?? 0) > 0;

    const msg: SlackMessage = {
      ts: raw.ts,
      time: tsToTime(raw.ts),
      userId: raw.user!,
      userName: nameCache.get(raw.user!) ?? raw.user!,
      text: cleanSlackText(raw.text),
      replyCount: raw.reply_count ?? 0,
      replies: [],
    };

    if (isThreadParent && includeThreads) {
      try {
        const replyRaws = await fetchAllReplies(channelId, raw.ts);
        await Promise.all(
          [...new Set(replyRaws.map((r) => r.user!))].map(resolveUserName)
        );
        msg.replies = replyRaws.map((r) => ({
          ts: r.ts,
          time: tsToTime(r.ts),
          userName: nameCache.get(r.user!) ?? r.user!,
          text: cleanSlackText(r.text),
        }));
      } catch {
        // Keep parent without replies if thread fetch fails
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
