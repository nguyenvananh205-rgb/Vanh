import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, RefreshCw, ChevronDown,
  Search, Lock, Hash, Users, Loader2, AlertCircle, CheckCircle2,
  FileText, Layers, Download, Copy, Send, History, Plus, Trash2,
  User, Target, CheckSquare, ArrowRight, Tag, ChevronUp, X,
  ExternalLink, Eye, EyeOff,
} from "lucide-react";
import {
  getSlackToken, saveSlackToken, clearSlackToken,
  verifyToken, listChannels, fetchChannelMessages, formatMessagesForAI, postSummaryToSlack,
  type TeamInfo, type SlackChannel, type SlackMessage,
} from "../utils/slackApi";
import {
  summarizeConversations, generateUseCasesAndStories,
  type SlackAnalysisResult, type UseCase, type UserStory,
} from "../utils/slackAnalyzer";
import { getApiKey } from "../utils/visionParser";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelData {
  channel: SlackChannel;
  messages: SlackMessage[];
}

interface HistoryItem {
  id: string;
  createdAt: string;
  channels: string[];
  dateFrom: string;
  dateTo: string;
  summary: string;
  result: SlackAnalysisResult;
  totalMessages: number;
}

type MainView = "select" | "preview" | "result";

const HISTORY_KEY = "slack_analysis_history";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateVN(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
}

// ─── PRIORITY labels ──────────────────────────────────────────────────────────

const PRIO: Record<UserStory["priority"], { label: string; cls: string }> = {
  must:   { label: "Must Have",   cls: "bg-red-100 text-red-700" },
  should: { label: "Should Have", cls: "bg-amber-100 text-amber-700" },
  could:  { label: "Could Have",  cls: "bg-blue-100 text-blue-700" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function UseCaseCard({ uc }: { uc: UseCase }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">{uc.id}</span>
          <span className="font-medium text-slate-800 text-sm truncate">{uc.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            <User size={11} />{uc.actor}
          </span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Actor</p>
              <p className="text-sm text-slate-700">{uc.actor}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Điều kiện tiên quyết</p>
              <p className="text-sm text-slate-700">{uc.precondition}</p>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-700 mb-2">Luồng chính</p>
            <ol className="space-y-1.5">
              {uc.mainFlow.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <ArrowRight size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ol>
          </div>
          {uc.alternativeFlow && uc.alternativeFlow.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">Luồng thay thế / Ngoại lệ</p>
              <ul className="space-y-1">
                {uc.alternativeFlow.map((a, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-amber-500 flex-shrink-0">↳</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Kết quả (Post-condition)</p>
            <p className="text-sm text-slate-700">{uc.postcondition}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserStoryCard({ story }: { story: UserStory }) {
  const p = PRIO[story.priority];
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{story.id}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.cls}`}>{p.label}</span>
        {story.storyPoints !== undefined && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag size={10} />{story.storyPoints} SP
          </span>
        )}
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
        <span className="text-slate-500">Là một </span>
        <span className="font-semibold text-blue-700">{story.role}</span>
        <span className="text-slate-500">, tôi muốn </span>
        <span className="font-medium text-slate-800">{story.goal}</span>
        <span className="text-slate-500">, để </span>
        <span className="font-medium text-indigo-700">{story.benefit}</span>.
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CheckSquare size={13} className="text-emerald-600" />
          <p className="text-xs font-semibold text-slate-600">Tiêu chí chấp nhận</p>
        </div>
        <ul className="space-y-1.5">
          {story.acceptanceCriteria.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />{c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SetupGuide() {
  const [open, setOpen] = useState(false);
  const scopes = ["channels:history", "channels:read", "groups:history", "groups:read", "users:read", "chat:write"];
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <ExternalLink size={14} className="text-slate-400" />
          Hướng dẫn tạo Slack Bot Token
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="p-4 space-y-4 text-sm text-slate-700">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">1</span>
              <div>
                <p className="font-medium">Tạo Slack App</p>
                <p className="text-xs text-slate-500 mt-0.5">Truy cập <span className="text-emerald-600 font-mono">api.slack.com/apps</span> → "Create New App" → "From scratch" → đặt tên và chọn workspace.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">2</span>
              <div>
                <p className="font-medium">Thêm Bot Token Scopes</p>
                <p className="text-xs text-slate-500 mt-0.5">Vào <span className="font-mono text-xs bg-slate-100 px-1 rounded">OAuth &amp; Permissions</span> → phần <span className="font-mono text-xs bg-slate-100 px-1 rounded">Bot Token Scopes</span> → thêm các scope:</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scopes.map((s) => (
                    <span key={s} className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{s}</span>
                  ))}
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">3</span>
              <div>
                <p className="font-medium">Install App to Workspace</p>
                <p className="text-xs text-slate-500 mt-0.5">Vẫn ở trang <span className="font-mono text-xs bg-slate-100 px-1 rounded">OAuth &amp; Permissions</span> → nhấn "Install to Workspace" → Allow.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-emerald-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">4</span>
              <div>
                <p className="font-medium">Copy Bot OAuth Token</p>
                <p className="text-xs text-slate-500 mt-0.5">Copy token bắt đầu bằng <span className="font-mono text-xs bg-slate-100 px-1 rounded">xoxb-</span> và dán vào ô bên dưới.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-amber-400 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">5</span>
              <div>
                <p className="font-medium">Invite Bot vào channel</p>
                <p className="text-xs text-slate-500 mt-0.5">Trong mỗi channel Slack cần đọc, gõ <span className="font-mono text-xs bg-slate-100 px-1 rounded">/invite @TênBot</span> để bot có quyền đọc tin nhắn.</p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Result export helpers ────────────────────────────────────────────────────

function buildMarkdown(summary: string, result: SlackAnalysisResult): string {
  const lines: string[] = [
    "# Phân tích yêu cầu dự án",
    "",
    "## Tóm tắt",
    result.summary,
    "",
    "## Bối cảnh",
    result.projectContext,
    "",
    "---",
    "# USE CASES",
    "",
    ...result.useCases.flatMap((uc) => [
      `## ${uc.id}: ${uc.name}`,
      `- **Actor:** ${uc.actor}`,
      `- **Điều kiện tiên quyết:** ${uc.precondition}`,
      "- **Luồng chính:**",
      ...uc.mainFlow.map((s) => `  - ${s}`),
      ...(uc.alternativeFlow?.length
        ? ["- **Luồng thay thế:**", ...uc.alternativeFlow.map((s) => `  - ${s}`)]
        : []),
      `- **Kết quả:** ${uc.postcondition}`,
      "",
    ]),
    "---",
    "# USER STORIES",
    "",
    ...result.userStories.flatMap((us) => [
      `## ${us.id} [${PRIO[us.priority].label}]${us.storyPoints ? ` (${us.storyPoints} SP)` : ""}`,
      `**Là một** ${us.role}, **tôi muốn** ${us.goal}, **để** ${us.benefit}.`,
      "",
      "**Tiêu chí chấp nhận:**",
      ...us.acceptanceCriteria.map((c) => `- ${c}`),
      "",
    ]),
    "---",
    "## Bản tóm tắt đầy đủ (từ Slack)",
    "",
    summary,
  ];
  return lines.join("\n");
}

function buildSlackSummaryText(
  channels: string[],
  dateFrom: string,
  dateTo: string,
  result: SlackAnalysisResult
): string {
  const dateStr = dateFrom === dateTo ? formatDateVN(dateFrom) : `${formatDateVN(dateFrom)} – ${formatDateVN(dateTo)}`;
  const chList = channels.map((c) => `#${c}`).join(", ");
  const ucList = result.useCases.map((uc) => `• ${uc.id}: ${uc.name}`).join("\n");
  const usList = result.userStories.map((us) => `• ${us.id} [${PRIO[us.priority].label}]: Là ${us.role} – ${us.goal}`).join("\n");

  return [
    `📋 *Tóm tắt yêu cầu – ${dateStr}*`,
    `📌 Channels: ${chList}`,
    "",
    `*${result.summary}*`,
    "",
    `*Bối cảnh:* ${result.projectContext}`,
    "",
    `*Use Cases (${result.useCases.length}):*`,
    ucList,
    "",
    `*User Stories (${result.userStories.length}):*`,
    usList,
  ].join("\n");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SlackAnalysis() {
  // ── Auth state
  const [tokenInput, setTokenInput] = useState(getSlackToken());
  const [showToken, setShowToken] = useState(false);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // ── Channel & date selection
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [includeThreads, setIncludeThreads] = useState(true);

  // ── Fetch
  const [view, setView] = useState<MainView>("select");
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, name: "" });
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  // ── Analysis
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SlackAnalysisResult | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── Post back to Slack
  const [postChannelId, setPostChannelId] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── History
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<HistoryItem | null>(null);

  // ── Copy
  const [copied, setCopied] = useState(false);

  const hasApiKey = !!getApiKey();
  const isConnected = !!teamInfo;

  // Auto-verify saved token on mount
  useEffect(() => {
    const t = getSlackToken();
    if (t) {
      setVerifying(true);
      verifyToken()
        .then(setTeamInfo)
        .catch(() => setTeamInfo(null))
        .finally(() => setVerifying(false));
    }
  }, []);

  // Load channels when connected
  const loadChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const list = await listChannels();
      setChannels(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      setTokenError((e as Error).message);
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && channels.length === 0) loadChannels();
  }, [isConnected, channels.length, loadChannels]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    if (!tokenInput.trim()) return;
    setVerifying(true);
    setTokenError(null);
    saveSlackToken(tokenInput);
    try {
      const info = await verifyToken();
      setTeamInfo(info);
    } catch (e) {
      setTokenError((e as Error).message);
      clearSlackToken();
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = () => {
    clearSlackToken();
    setTeamInfo(null);
    setTokenInput("");
    setChannels([]);
    setSelectedIds(new Set());
    setView("select");
    setChannelData([]);
    setSummary("");
    setAnalysisResult(null);
  };

  const toggleChannel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFetch = async () => {
    if (selectedIds.size === 0) return;
    setFetching(true);
    setFetchError(null);
    setChannelData([]);
    const selected = channels.filter((c) => selectedIds.has(c.id));
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const results: ChannelData[] = [];

    for (let i = 0; i < selected.length; i++) {
      const ch = selected[i];
      setFetchProgress({ current: i + 1, total: selected.length, name: ch.name });
      try {
        const msgs = await fetchChannelMessages(ch.id, from, to, includeThreads);
        results.push({ channel: ch, messages: msgs });
      } catch (e) {
        setFetchError(
          `Lỗi khi lấy tin nhắn từ #${ch.name}: ${(e as Error).message}\n` +
          `Đảm bảo bot đã được invite vào channel này bằng lệnh /invite @BotName`
        );
        setFetching(false);
        return;
      }
    }

    setChannelData(results);
    setFetching(false);
    setView("preview");
    setExpandedChannels(new Set(results.map((d) => d.channel.id)));
  };

  const totalMessages = channelData.reduce(
    (s, d) => s + d.messages.length + d.messages.reduce((r, m) => r + m.replies.length, 0),
    0
  );

  const handleSummarize = async () => {
    if (channelData.length === 0) return;
    setSummaryLoading(true);
    setAnalysisError(null);

    const dateStr =
      dateFrom === dateTo
        ? formatDateVN(dateFrom)
        : `${formatDateVN(dateFrom)} – ${formatDateVN(dateTo)}`;

    const formattedText = channelData
      .map((d) => formatMessagesForAI(d.channel.name, dateStr, d.messages))
      .join("\n\n");

    try {
      const sum = await summarizeConversations(formattedText);
      setSummary(sum);
      setView("result");
    } catch (e) {
      setAnalysisError(
        (e as Error).message === "NO_API_KEY"
          ? "Chưa có Anthropic API Key. Vui lòng cài đặt trong phần Cài đặt (icon bánh răng)."
          : (e as Error).message
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!summary) return;
    setGenLoading(true);
    setAnalysisError(null);
    try {
      const result = await generateUseCasesAndStories(summary);
      setAnalysisResult(result);

      // Save to history
      const item: HistoryItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        channels: channelData.map((d) => d.channel.name),
        dateFrom,
        dateTo,
        summary,
        result,
        totalMessages,
      };
      const newHistory = [item, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (e) {
      setAnalysisError(
        (e as Error).message === "NO_API_KEY"
          ? "Chưa có Anthropic API Key. Vui lòng cài đặt trong phần Cài đặt (icon bánh răng)."
          : (e as Error).message
      );
    } finally {
      setGenLoading(false);
    }
  };

  const handleExport = () => {
    if (!analysisResult) return;
    const md = buildMarkdown(summary, analysisResult);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requirements_${dateFrom}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(buildMarkdown(summary, analysisResult));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToSlack = async () => {
    if (!postChannelId || !analysisResult) return;
    setPosting(true);
    setPostMsg(null);
    try {
      const chNames = channelData.map((d) => d.channel.name);
      const text = buildSlackSummaryText(chNames, dateFrom, dateTo, analysisResult);
      await postSummaryToSlack(postChannelId, text);
      setPostMsg({ ok: true, text: "Đã gửi tóm tắt vào Slack thành công!" });
    } catch (e) {
      setPostMsg({ ok: false, text: `Lỗi: ${(e as Error).message}` });
    } finally {
      setPosting(false);
    }
  };

  const handleNewAnalysis = () => {
    setView("select");
    setChannelData([]);
    setSummary("");
    setAnalysisResult(null);
    setAnalysisError(null);
    setPostMsg(null);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
    if (viewingHistory?.id === id) setViewingHistory(null);
  };

  // ── Render: Not connected ────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="space-y-4 max-w-2xl">
        {verifying && (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">
            <Loader2 size={15} className="animate-spin" />
            Đang xác thực token...
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4A154B] rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Kết nối Slack Workspace</h3>
              <p className="text-xs text-slate-500">Nhập Bot Token để bắt đầu lấy tin nhắn</p>
            </div>
          </div>

          {tokenError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {tokenError}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Slack Bot Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                placeholder="xoxb-..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Token được lưu trong bộ nhớ thiết bị, không gửi đi đâu ngoài api.slack.com</p>
          </div>

          <button
            onClick={handleConnect}
            disabled={!tokenInput.trim() || verifying}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {verifying ? (
              <><Loader2 size={15} className="animate-spin" />Đang kết nối...</>
            ) : (
              <><CheckCircle2 size={15} />Kết nối Slack</>
            )}
          </button>
        </div>

        <SetupGuide />

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full justify-center"
          >
            <History size={15} />Xem lịch sử phân tích ({history.length})
          </button>
        )}

        {showHistory && (
          <HistoryPanel
            history={history}
            onView={setViewingHistory}
            onDelete={handleDeleteHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
        {viewingHistory && (
          <HistoryResultModal item={viewingHistory} onClose={() => setViewingHistory(null)} />
        )}
      </div>
    );
  }

  // ── Render: Connected ────────────────────────────────────────────────────────
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Connection bar */}
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="font-medium text-emerald-700">{teamInfo.team}</span>
          <span className="text-emerald-600 text-xs">• {teamInfo.user}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowHistory((v) => !v); setViewingHistory(null); }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
          >
            <History size={12} />
            Lịch sử {history.length > 0 && `(${history.length})`}
          </button>
          <button
            onClick={handleDisconnect}
            className="text-xs text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && !viewingHistory && (
        <HistoryPanel
          history={history}
          onView={setViewingHistory}
          onDelete={handleDeleteHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
      {viewingHistory && (
        <HistoryResultModal item={viewingHistory} onClose={() => setViewingHistory(null)} />
      )}

      {!showHistory && !viewingHistory && (
        <>
          {/* ── View: Select channels ── */}
          {view === "select" && (
            <div className="space-y-4">
              {/* Date range */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={15} className="text-emerald-600" />
                  Khoảng thời gian
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={dateFrom}
                      max={dateTo}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={dateTo}
                      min={dateFrom}
                      max={todayStr()}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => { setDateFrom(todayStr()); setDateTo(todayStr()); }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 px-3 py-2 border border-emerald-200 rounded-lg bg-emerald-50"
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 7);
                        setDateFrom(d.toISOString().split("T")[0]);
                        setDateTo(todayStr());
                      }}
                      className="text-xs text-slate-600 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-lg"
                    >
                      7 ngày
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="include-threads"
                    type="checkbox"
                    checked={includeThreads}
                    onChange={(e) => setIncludeThreads(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <label htmlFor="include-threads" className="text-sm text-slate-600">
                    Bao gồm nội dung trong Thread
                  </label>
                </div>
              </div>

              {/* Channel list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Hash size={15} className="text-emerald-600" />
                    Chọn Channels
                    {selectedIds.size > 0 && (
                      <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {selectedIds.size} đã chọn
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={loadChannels}
                    disabled={channelsLoading}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                    title="Tải lại danh sách"
                  >
                    <RefreshCw size={14} className={channelsLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="Tìm kiếm channel..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {channelsLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-400 gap-2">
                    <Loader2 size={15} className="animate-spin" /> Đang tải danh sách channel...
                  </div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {filteredChannels.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">
                        {channelSearch ? "Không tìm thấy channel" : "Không có channel nào"}
                      </p>
                    ) : (
                      filteredChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => toggleChannel(ch.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedIds.has(ch.id)
                              ? "bg-emerald-50 border border-emerald-200"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selectedIds.has(ch.id)
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedIds.has(ch.id) && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {ch.isPrivate ? (
                              <Lock size={13} className="text-slate-400 flex-shrink-0" />
                            ) : (
                              <Hash size={13} className="text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-sm text-slate-700 truncate">{ch.name}</span>
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                            <Users size={11} />{ch.memberCount}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {fetchError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <div className="whitespace-pre-line">{fetchError}</div>
                </div>
              )}

              <button
                onClick={handleFetch}
                disabled={selectedIds.size === 0 || fetching}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {fetching ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Đang lấy từ #{fetchProgress.name}... ({fetchProgress.current}/{fetchProgress.total})
                  </>
                ) : (
                  <>
                    <MessageSquare size={15} />
                    Lấy tin nhắn từ {selectedIds.size} channel{selectedIds.size > 1 ? "" : ""}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── View: Preview messages ── */}
          {view === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">
                  <span className="font-medium text-emerald-700">
                    {totalMessages} tin nhắn
                  </span>
                  <span className="text-emerald-600"> từ {channelData.length} channel</span>
                  <span className="text-emerald-500 text-xs ml-2">
                    ({formatDateVN(dateFrom)}{dateFrom !== dateTo ? ` – ${formatDateVN(dateTo)}` : ""})
                  </span>
                </div>
                <button
                  onClick={handleNewAnalysis}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg"
                >
                  <Plus size={12} /> Phân tích khác
                </button>
              </div>

              {channelData.map(({ channel, messages }) => {
                const isExpanded = expandedChannels.has(channel.id);
                const msgCount = messages.length + messages.reduce((s, m) => s + m.replies.length, 0);
                return (
                  <div key={channel.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedChannels((prev) => {
                          const next = new Set(prev);
                          next.has(channel.id) ? next.delete(channel.id) : next.add(channel.id);
                          return next;
                        })
                      }
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-slate-400" />
                        <span className="font-medium text-slate-800">{channel.name}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {msgCount} tin
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-4 pb-3 max-h-80 overflow-y-auto">
                        {messages.length === 0 ? (
                          <p className="text-sm text-slate-400 py-4 text-center">
                            Không có tin nhắn trong khoảng thời gian này
                          </p>
                        ) : (
                          <div className="space-y-2 pt-3">
                            {messages.map((m) => (
                              <div key={m.ts}>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-slate-400 mt-0.5 w-12 flex-shrink-0">{m.time}</span>
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-emerald-700">{m.userName}</span>
                                    <span className="text-xs text-slate-600 ml-1.5">{m.text}</span>
                                    {m.replyCount > 0 && m.replies.length === 0 && (
                                      <span className="text-xs text-slate-400 ml-1"> ({m.replyCount} replies)</span>
                                    )}
                                  </div>
                                </div>
                                {m.replies.map((r) => (
                                  <div key={r.ts} className="flex items-start gap-2 ml-14 mt-1">
                                    <span className="text-[10px] text-slate-300 mt-0.5 w-10 flex-shrink-0">↳ {r.time}</span>
                                    <span className="text-xs font-semibold text-blue-600">{r.userName}</span>
                                    <span className="text-xs text-slate-500">{r.text}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {analysisError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {analysisError}
                </div>
              )}

              {!hasApiKey && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  Cần <strong>Anthropic API Key</strong> để phân tích. Cài đặt tại icon bánh răng góc trên phải.
                </div>
              )}

              <button
                onClick={handleSummarize}
                disabled={summaryLoading || totalMessages === 0 || !hasApiKey}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {summaryLoading ? (
                  <><Loader2 size={15} className="animate-spin" />AI đang tóm tắt...</>
                ) : (
                  <><FileText size={15} />Tóm tắt & Phân tích với AI</>
                )}
              </button>
            </div>
          )}

          {/* ── View: Result ── */}
          {view === "result" && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={15} className="text-emerald-600" />
                    Bản tóm tắt yêu cầu
                  </h3>
                  {!analysisResult && (
                    <span className="text-xs text-slate-400">Chỉnh sửa trước khi tạo UC/US nếu cần</span>
                  )}
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={10}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
                />
              </div>

              {analysisError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {analysisError}
                </div>
              )}

              {/* Generate button (if not yet generated) */}
              {!analysisResult && (
                <button
                  onClick={handleGenerate}
                  disabled={genLoading || !summary || !hasApiKey}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {genLoading ? (
                    <><Loader2 size={15} className="animate-spin" />AI đang tạo Use Cases & User Stories...</>
                  ) : (
                    <><Layers size={15} />Tạo Use Cases & User Stories</>
                  )}
                </button>
              )}

              {/* Analysis result */}
              {analysisResult && (
                <div className="space-y-5">
                  {/* Context + actions */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-0.5">Bối cảnh dự án</p>
                      <p className="text-sm text-slate-700">{analysisResult.projectContext}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? "Đã sao chép" : "Sao chép Markdown"}
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
                    >
                      <Download size={14} />Xuất .md
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={genLoading}
                      className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                    >
                      {genLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Tạo lại
                    </button>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Target size={13} className="text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800">
                        Use Cases
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({analysisResult.useCases.length})
                        </span>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.useCases.map((uc) => (
                        <UseCaseCard key={uc.id} uc={uc} />
                      ))}
                    </div>
                  </div>

                  {/* User Stories */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                        <User size={13} className="text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800">
                        User Stories
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({analysisResult.userStories.length} • {analysisResult.userStories.reduce((s, u) => s + (u.storyPoints ?? 0), 0)} SP)
                        </span>
                      </h3>
                    </div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {(["must", "should", "could"] as const).map((p) => {
                        const cnt = analysisResult.userStories.filter((s) => s.priority === p).length;
                        if (!cnt) return null;
                        return (
                          <span key={p} className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIO[p].cls}`}>
                            {PRIO[p].label}: {cnt}
                          </span>
                        );
                      })}
                    </div>
                    <div className="space-y-3">
                      {analysisResult.userStories.map((s) => (
                        <UserStoryCard key={s.id} story={s} />
                      ))}
                    </div>
                  </div>

                  {/* Post back to Slack */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Send size={15} className="text-emerald-600" />
                      Gửi tóm tắt vào Slack
                    </h3>
                    <div className="flex gap-2">
                      <select
                        value={postChannelId}
                        onChange={(e) => setPostChannelId(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        <option value="">Chọn channel để gửi...</option>
                        {channels.map((c) => (
                          <option key={c.id} value={c.id}>#{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handlePostToSlack}
                        disabled={!postChannelId || posting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#4A154B] hover:bg-[#611f69] disabled:opacity-40 text-white rounded-lg text-sm font-medium"
                      >
                        {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Gửi
                      </button>
                    </div>
                    {postMsg && (
                      <p className={`text-xs mt-2 flex items-center gap-1 ${postMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
                        {postMsg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {postMsg.text}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                >
                  <Plus size={14} /> Phân tích hội thoại mới
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── History components ───────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onView,
  onDelete,
  onClose,
}: {
  history: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <History size={15} className="text-emerald-600" />
          Lịch sử phân tích ({history.length})
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
          <X size={16} />
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">Chưa có lịch sử phân tích</p>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {history.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-700">
                    {new Date(item.createdAt).toLocaleString("vi-VN", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.totalMessages} tin •{" "}
                    {item.result.useCases.length} UC •{" "}
                    {item.result.userStories.length} US
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {item.channels.map((c) => (
                    <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{c}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{item.result.summary}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onView(item)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  title="Xem"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  title="Xoá"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryResultModal({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildMarkdown(item.summary, item.result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const md = buildMarkdown(item.summary, item.result);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requirements_${item.dateFrom}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {new Date(item.createdAt).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {item.channels.map((c) => (
                <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">#{c}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
            {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600">
            <Download size={12} />Xuất .md
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-emerald-700 mb-1">Bối cảnh dự án</p>
        <p className="text-sm text-slate-700">{item.result.projectContext}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Target size={13} className="text-white" />
          </div>
          <h3 className="font-bold text-slate-800">Use Cases ({item.result.useCases.length})</h3>
        </div>
        <div className="space-y-2">
          {item.result.useCases.map((uc) => <UseCaseCard key={uc.id} uc={uc} />)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
            <User size={13} className="text-white" />
          </div>
          <h3 className="font-bold text-slate-800">User Stories ({item.result.userStories.length})</h3>
        </div>
        <div className="space-y-3">
          {item.result.userStories.map((s) => <UserStoryCard key={s.id} story={s} />)}
        </div>
      </div>
    </div>
  );
}
