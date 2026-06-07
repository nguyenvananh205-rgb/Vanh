import { useState } from "react";
import {
  MessageSquare,
  FileText,
  Layers,
  Loader2,
  Copy,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Download,
  User,
  Target,
  CheckSquare,
  ArrowRight,
  Tag,
} from "lucide-react";
import {
  summarizeSlackConversation,
  generateUseCasesAndStories,
} from "../utils/slackAnalyzer";
import type { SlackAnalysisResult, UseCase, UserStory } from "../utils/slackAnalyzer";
import { getApiKey } from "../utils/visionParser";

type Step = "input" | "summary" | "analysis";

const PRIORITY_LABELS: Record<UserStory["priority"], { label: string; color: string }> = {
  must: { label: "Must Have", color: "bg-red-100 text-red-700" },
  should: { label: "Should Have", color: "bg-amber-100 text-amber-700" },
  could: { label: "Could Have", color: "bg-blue-100 text-blue-700" },
};

const EXAMPLE_CONVERSATION = `[9:00 AM] Minh: Mình cần làm một tính năng cho phép khách hàng đặt hàng online. Hiện tại họ phải gọi điện hoặc đến trực tiếp.
[9:02 AM] Lan: Khách hàng có thể chọn sản phẩm, số lượng và địa chỉ giao hàng không?
[9:03 AM] Minh: Đúng rồi. Và cần tích hợp thanh toán online nữa - VNPAY hoặc Momo.
[9:05 AM] Lan: Cần gửi email/SMS xác nhận sau khi đặt hàng không?
[9:06 AM] Minh: Có, cần thông báo cho cả khách hàng lẫn admin khi có đơn mới.
[9:08 AM] Tuấn: Admin cần màn hình quản lý đơn hàng để cập nhật trạng thái nhé.
[9:10 AM] Minh: Đúng. Trạng thái: Chờ xác nhận → Đang xử lý → Đang giao → Đã giao.
[9:12 AM] Lan: Khách hàng có thể hủy đơn không? Và hoàn tiền ra sao?
[9:13 AM] Minh: Hủy được trong vòng 30 phút. Hoàn tiền thì mình chưa có quy trình rõ.`;

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string; icon: React.FC<{ size: number }> }[] = [
    { id: "input", label: "Nhập hội thoại", icon: MessageSquare },
    { id: "summary", label: "Tóm tắt", icon: FileText },
    { id: "analysis", label: "Use Cases & Stories", icon: Layers },
  ];
  const idx = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? "bg-emerald-500 text-white"
                  : done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function UseCaseCard({ uc }: { uc: UseCase }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            {uc.id}
          </span>
          <span className="font-medium text-slate-800 text-sm">{uc.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <User size={11} />
            <span className="hidden sm:inline">{uc.actor}</span>
          </div>
          <ChevronRight
            size={15}
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Actor</p>
              <p className="text-sm text-slate-700">{uc.actor}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Điều kiện tiên quyết</p>
              <p className="text-sm text-slate-700">{uc.precondition}</p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Luồng chính</p>
            <ol className="space-y-1">
              {uc.mainFlow.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <ArrowRight size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {uc.alternativeFlow && uc.alternativeFlow.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Luồng thay thế</p>
              <ul className="space-y-1">
                {uc.alternativeFlow.map((alt, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-amber-500 flex-shrink-0">↳</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Kết quả</p>
            <p className="text-sm text-slate-700">{uc.postcondition}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserStoryCard({ story }: { story: UserStory }) {
  const priority = PRIORITY_LABELS[story.priority];
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {story.id}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
            {priority.label}
          </span>
          {story.storyPoints !== undefined && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag size={10} />
              {story.storyPoints} SP
            </span>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-sm text-slate-700">
        <span className="text-slate-500">Là một </span>
        <span className="font-semibold text-blue-700">{story.role}</span>
        <span className="text-slate-500">, tôi muốn </span>
        <span className="font-medium text-slate-800">{story.goal}</span>
        <span className="text-slate-500">, để </span>
        <span className="font-medium text-indigo-700">{story.benefit}</span>
        <span className="text-slate-500">.</span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CheckSquare size={13} className="text-emerald-600" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Tiêu chí chấp nhận
          </p>
        </div>
        <ul className="space-y-1.5">
          {story.acceptanceCriteria.map((criterion, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SlackAnalysis() {
  const [step, setStep] = useState<Step>("input");
  const [conversation, setConversation] = useState("");
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState<SlackAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasApiKey = !!getApiKey();

  const handleSummarize = async () => {
    if (!conversation.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const sum = await summarizeSlackConversation(conversation);
      setSummary(sum);
      setStep("summary");
    } catch (e) {
      setError((e as Error).message === "NO_API_KEY"
        ? "Chưa có API Key. Vui lòng cài đặt Anthropic API Key trong phần Cài đặt."
        : (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!summary.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateUseCasesAndStories(summary);
      setResult(res);
      setStep("analysis");
    } catch (e) {
      setError((e as Error).message === "NO_API_KEY"
        ? "Chưa có API Key. Vui lòng cài đặt Anthropic API Key trong phần Cài đặt."
        : (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const lines: string[] = [
      `# Phân tích yêu cầu dự án`,
      ``,
      `## Tóm tắt`,
      result.summary,
      ``,
      `## Bối cảnh`,
      result.projectContext,
      ``,
      `---`,
      `# USE CASES`,
      ``,
      ...result.useCases.flatMap((uc) => [
        `## ${uc.id}: ${uc.name}`,
        `- **Actor:** ${uc.actor}`,
        `- **Điều kiện tiên quyết:** ${uc.precondition}`,
        `- **Luồng chính:**`,
        ...uc.mainFlow.map((s) => `  - ${s}`),
        ...(uc.alternativeFlow?.length
          ? [`- **Luồng thay thế:**`, ...uc.alternativeFlow.map((s) => `  - ${s}`)]
          : []),
        `- **Kết quả:** ${uc.postcondition}`,
        ``,
      ]),
      `---`,
      `# USER STORIES`,
      ``,
      ...result.userStories.flatMap((us) => [
        `## ${us.id} [${PRIORITY_LABELS[us.priority].label}] ${us.storyPoints ? `(${us.storyPoints} SP)` : ""}`,
        `**Là một** ${us.role}, **tôi muốn** ${us.goal}, **để** ${us.benefit}.`,
        ``,
        `**Tiêu chí chấp nhận:**`,
        ...us.acceptanceCriteria.map((c) => `- ${c}`),
        ``,
      ]),
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!result) return;
    const lines: string[] = [
      `# Phân tích yêu cầu dự án`,
      ``,
      `## Tóm tắt`,
      result.summary,
      ``,
      `## Bối cảnh`,
      result.projectContext,
      ``,
      `---`,
      `# USE CASES`,
      ``,
      ...result.useCases.flatMap((uc) => [
        `## ${uc.id}: ${uc.name}`,
        `- **Actor:** ${uc.actor}`,
        `- **Điều kiện tiên quyết:** ${uc.precondition}`,
        `- **Luồng chính:**`,
        ...uc.mainFlow.map((s) => `  - ${s}`),
        ...(uc.alternativeFlow?.length
          ? [`- **Luồng thay thế:**`, ...uc.alternativeFlow.map((s) => `  - ${s}`)]
          : []),
        `- **Kết quả:** ${uc.postcondition}`,
        ``,
      ]),
      `---`,
      `# USER STORIES`,
      ``,
      ...result.userStories.flatMap((us) => [
        `## ${us.id} [${PRIORITY_LABELS[us.priority].label}] ${us.storyPoints ? `(${us.storyPoints} SP)` : ""}`,
        `**Là một** ${us.role}, **tôi muốn** ${us.goal}, **để** ${us.benefit}.`,
        ``,
        `**Tiêu chí chấp nhận:**`,
        ...us.acceptanceCriteria.map((c) => `- ${c}`),
        ``,
      ]),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "requirements.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStep("input");
    setConversation("");
    setSummary("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <StepIndicator current={step} />

      {!hasApiKey && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            Tính năng này cần <strong>Anthropic API Key</strong>. Vui lòng cài đặt trong{" "}
            <strong>Cài đặt</strong> (icon bánh răng góc trên phải).
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Lỗi</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Input */}
      {step === "input" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-emerald-600" />
              <h3 className="font-semibold text-slate-800">Nhập hội thoại Slack</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Dán nội dung hội thoại Slack vào đây. AI sẽ tóm tắt và trích xuất yêu cầu dự án.
            </p>
            <textarea
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
              rows={12}
              placeholder={EXAMPLE_CONVERSATION}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">
                {conversation.length > 0 ? `${conversation.length} ký tự` : "Ví dụ sẽ được dùng làm mẫu khi ô trống"}
              </span>
              <button
                onClick={handleSummarize}
                disabled={loading || !hasApiKey}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Đang tóm tắt...</>
                ) : (
                  <><FileText size={15} /> Tóm tắt hội thoại</>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Hướng dẫn sử dụng:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Dán nội dung hội thoại Slack (có thể từ nhiều cuộc trò chuyện khác nhau)</li>
              <li>AI sẽ tóm tắt thành các điểm chính về yêu cầu dự án</li>
              <li>Xem lại và chỉnh sửa tóm tắt nếu cần</li>
              <li>AI tạo Use Cases và User Stories chuẩn Agile từ tóm tắt đó</li>
              <li>Xuất file Markdown để dùng trong tài liệu dự án</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === "summary" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <h3 className="font-semibold text-slate-800">Tóm tắt hội thoại</h3>
              </div>
              <button
                onClick={() => setStep("input")}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <RefreshCw size={12} /> Nhập lại
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Xem lại và chỉnh sửa tóm tắt trước khi tạo Use Cases & User Stories.
            </p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={14}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !summary.trim() || !hasApiKey}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Đang tạo...</>
                ) : (
                  <><Layers size={15} /> Tạo Use Cases & User Stories</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Analysis result */}
      {step === "analysis" && result && (
        <div className="space-y-6">
          {/* Header actions */}
          <div className="flex items-center justify-between">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex-1 mr-3">
              <p className="text-xs font-semibold text-emerald-700 mb-0.5">Bối cảnh dự án</p>
              <p className="text-sm text-slate-700">{result.projectContext}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Download size={13} /> Xuất .md
              </button>
            </div>
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
                  ({result.useCases.length} use case)
                </span>
              </h3>
            </div>
            <div className="space-y-2">
              {result.useCases.map((uc) => (
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
                  ({result.userStories.length} stories •{" "}
                  {result.userStories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0)} SP)
                </span>
              </h3>
            </div>

            {/* Priority filter summary */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(["must", "should", "could"] as const).map((p) => {
                const count = result.userStories.filter((s) => s.priority === p).length;
                if (!count) return null;
                const { label, color } = PRIORITY_LABELS[p];
                return (
                  <span key={p} className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>
                    {label}: {count}
                  </span>
                );
              })}
            </div>

            <div className="space-y-3">
              {result.userStories.map((story) => (
                <UserStoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw size={14} /> Phân tích hội thoại mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
