import { useState, useEffect, useRef } from "react";
import {
  FileText, ChevronDown, ChevronRight, Copy, Check, ExternalLink,
  Loader2, AlertCircle, BookOpen, Target, Database, GitBranch,
  Monitor, Zap, Code2, Download, ArrowRight, Users, LayoutDashboard,
  ClipboardList, RefreshCw,
} from "lucide-react";
import {
  type ElicitationQuestion,
  type PRD,
  generateElicitationQuestions,
  generatePRD,
  prdToMarkdown,
  mermaidLiveUrl,
} from "../utils/prdApi";

// ── Constants ──────────────────────────────────────────────────────────────

const SAMPLE_REQUIREMENTS = [
  "Xây dựng hệ thống quản lý đơn hàng cho cửa hàng bán lẻ online, cho phép khách hàng đặt hàng, theo dõi trạng thái, và người quản lý xử lý đơn hàng, báo cáo doanh thu.",
  "Phát triển ứng dụng mobile đặt lịch khám bệnh tại phòng khám, cho phép bệnh nhân đặt lịch online, bác sĩ quản lý lịch làm việc, và lễ tân điều phối cuộc hẹn.",
  "Tạo nền tảng học trực tuyến (LMS) cho trường phổ thông, gồm quản lý khoá học, bài giảng video, bài tập, điểm số, và tương tác giữa giáo viên và học sinh.",
];

const LOADING_MESSAGES_QUESTIONS = [
  "Đang phân tích yêu cầu nghiệp vụ...",
  "Xác định các domain và stakeholder...",
  "Tạo câu hỏi elicitation...",
  "Hoàn thiện danh sách câu hỏi...",
];

const LOADING_MESSAGES_PRD = [
  "Đang phân tích yêu cầu và elicitation answers...",
  "Xây dựng Executive Summary và Use Cases...",
  "Tạo User Stories với Acceptance Criteria...",
  "Thiết kế Data Model và quan hệ...",
  "Vẽ Sequence Diagrams...",
  "Tổng hợp Screen Layouts...",
  "Hoàn thiện Non-Functional Requirements...",
  "Kiểm tra và hoàn chỉnh PRD...",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Business Context": "bg-purple-100 text-purple-700",
  "Users & Actors": "bg-blue-100 text-blue-700",
  "Functional Requirements": "bg-emerald-100 text-emerald-700",
  "Non-Functional Requirements": "bg-orange-100 text-orange-700",
  "Data & Integration": "bg-cyan-100 text-cyan-700",
  "Process Flow": "bg-pink-100 text-pink-700",
  "Constraints & Timeline": "bg-yellow-100 text-yellow-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const PRD_SECTIONS = [
  { id: "summary", label: "Tổng quan", icon: LayoutDashboard },
  { id: "usecases", label: "Use Cases", icon: Target },
  { id: "stories", label: "User Stories", icon: ClipboardList },
  { id: "data", label: "Data Model", icon: Database },
  { id: "diagrams", label: "Diagrams", icon: GitBranch },
  { id: "screens", label: "Screens", icon: Monitor },
  { id: "nfr", label: "NFR", icon: Zap },
  { id: "tech", label: "Tech Notes", icon: Code2 },
];

// ── Helper Components ───────────────────────────────────────────────────────

function StepIndicator({ step }: { step: "input" | "questions" | "prd" }) {
  const steps = [
    { id: "input", label: "Nhập yêu cầu" },
    { id: "questions", label: "Trả lời câu hỏi" },
    { id: "prd", label: "Xem PRD" },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            i < activeIdx
              ? "bg-emerald-100 text-emerald-700"
              : i === activeIdx
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-400"
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i < activeIdx ? "bg-emerald-500 text-white" : i === activeIdx ? "bg-white/30" : "bg-slate-300 text-slate-500"
            }`}>
              {i < activeIdx ? <Check size={10} /> : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={14} className={`mx-1 ${i < activeIdx ? "text-emerald-400" : "text-slate-300"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingOverlay({ messages }: { messages: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % messages.length), 2200);
    return () => clearInterval(timer);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
        <Loader2 size={24} className="text-emerald-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-600 animate-pulse text-center max-w-xs">
        {messages[idx]}
      </p>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? "Đã copy!" : label}
    </button>
  );
}

function CollapsibleCard({
  id,
  title,
  badge,
  badgeStyle = "",
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  badge?: string;
  badgeStyle?: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 font-mono ${badgeStyle || "bg-slate-100 text-slate-600"}`}>
              {badge}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-800 truncate">{title}</span>
        </div>
        {expanded ? <ChevronDown size={15} className="text-slate-400 shrink-0" /> : <ChevronRight size={15} className="text-slate-400 shrink-0" />}
      </button>
      {expanded && <div className="border-t border-slate-100 bg-white px-4 py-4">{children}</div>}
    </div>
  );
}

// ── PRD Section Renderers ────────────────────────────────────────────────────

function SummarySection({ prd }: { prd: PRD }) {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-bold text-slate-800">{prd.projectName}</h3>
          <div className="flex gap-2 shrink-0">
            <span className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
              v{prd.version}
            </span>
            <span className="text-xs bg-white border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full">
              {prd.date}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{prd.executiveSummary.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Mục tiêu</h4>
          <ul className="space-y-2">
            {prd.executiveSummary.objectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Ngoài phạm vi</h4>
          <ul className="space-y-2">
            {prd.executiveSummary.outOfScope.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phạm vi dự án</h4>
        <p className="text-sm text-slate-700 leading-relaxed">{prd.executiveSummary.scope}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Stakeholders</h4>
        <div className="space-y-2">
          {prd.stakeholders.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                <Users size={12} className="text-slate-500" />
              </span>
              <div>
                <span className="text-sm font-semibold text-slate-800">{s.role}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="text-sm text-slate-600">{s.responsibility}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseCasesSection({ prd }: { prd: PRD }) {
  const [expanded, setExpanded] = useState<string | null>(prd.useCases[0]?.id ?? null);
  const toggle = (id: string) => setExpanded((p) => (p === id ? null : id));

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-slate-500 mb-3">
        {prd.useCases.length} use cases được xác định
      </p>
      {prd.useCases.map((uc) => (
        <CollapsibleCard
          key={uc.id}
          id={uc.id}
          title={uc.name}
          badge={uc.id}
          badgeStyle="bg-purple-100 text-purple-700"
          expanded={expanded === uc.id}
          onToggle={toggle}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Actor:</span>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{uc.actor}</span>
            </div>
            <p className="text-sm text-slate-700">{uc.description}</p>

            {uc.preconditions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Preconditions</p>
                <ul className="space-y-1">
                  {uc.preconditions.map((p, i) => (
                    <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                      <span className="text-slate-400">•</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Main Flow</p>
              <ol className="space-y-1.5">
                {uc.mainFlow.map((f, i) => (
                  <li key={i} className="text-xs text-slate-700 flex gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                    <span>{f.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ol>
            </div>

            {uc.alternativeFlows?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Alternative Flows</p>
                <ul className="space-y-1">
                  {uc.alternativeFlows.map((f, i) => (
                    <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleCard>
      ))}
    </div>
  );
}

function UserStoriesSection({ prd }: { prd: PRD }) {
  const [expanded, setExpanded] = useState<string | null>(prd.userStories[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const toggle = (id: string) => setExpanded((p) => (p === id ? null : id));

  const filtered = filter === "all" ? prd.userStories : prd.userStories.filter((us) => us.priority === filter);

  const counts = {
    high: prd.userStories.filter((us) => us.priority === "high").length,
    medium: prd.userStories.filter((us) => us.priority === "medium").length,
    low: prd.userStories.filter((us) => us.priority === "low").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? `All (${prd.userStories.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((us) => (
          <CollapsibleCard
            key={us.id}
            id={us.id}
            title={us.title}
            badge={us.id}
            badgeStyle="bg-emerald-100 text-emerald-700"
            expanded={expanded === us.id}
            onToggle={toggle}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLES[us.priority]}`}>
                  {us.priority.toUpperCase()}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{us.actor}</span>
              </div>

              <p className="text-sm text-slate-700 italic bg-slate-50 rounded-lg px-3 py-2">{us.description}</p>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Acceptance Criteria</p>
                <ul className="space-y-1.5">
                  {us.acceptanceCriteria.map((ac, i) => (
                    <li key={i} className="text-xs text-slate-700 bg-emerald-50 rounded px-3 py-1.5 border border-emerald-100">
                      {ac}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">Dev Impact</p>
                  <p className="text-xs text-slate-700">{us.devImpact}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1.5">QA Impact</p>
                  <p className="text-xs text-slate-700">{us.qaImpact}</p>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

function DataModelSection({ prd }: { prd: PRD }) {
  const [expanded, setExpanded] = useState<string | null>(prd.dataModel.entities[0]?.name ?? null);
  const toggle = (name: string) => setExpanded((p) => (p === name ? null : name));

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-sm text-slate-700 leading-relaxed">{prd.dataModel.summary}</p>
      </div>

      <div className="space-y-2.5">
        {prd.dataModel.entities.map((entity) => (
          <CollapsibleCard
            key={entity.name}
            id={entity.name}
            title={entity.name}
            badge="Entity"
            badgeStyle="bg-cyan-100 text-cyan-700"
            expanded={expanded === entity.name}
            onToggle={toggle}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-600">{entity.description}</p>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attributes</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Field</th>
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Type</th>
                        <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Description</th>
                        <th className="text-center py-1.5 text-slate-500 font-semibold">Req</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entity.attributes.map((attr, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-1.5 pr-3 font-mono text-slate-800">{attr.name}</td>
                          <td className="py-1.5 pr-3 text-cyan-700 font-medium">{attr.type}</td>
                          <td className="py-1.5 pr-3 text-slate-600">{attr.description}</td>
                          <td className="py-1.5 text-center text-emerald-600">{attr.required ? "✓" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {entity.relationships?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Relationships</p>
                  <ul className="space-y-1">
                    {entity.relationships.map((r, i) => (
                      <li key={i} className="text-xs text-slate-700 flex gap-2 items-center">
                        <span className="text-cyan-500 font-mono">→</span>
                        <span className="font-medium">{r.entity}</span>
                        <span className="text-slate-400">({r.type})</span>
                        <span className="text-slate-500">: {r.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

function DiagramsSection({ prd }: { prd: PRD }) {
  return (
    <div className="space-y-4">
      {prd.sequenceDiagrams.map((sd, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">{sd.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{sd.description}</p>
            </div>
            <div className="flex gap-2">
              <CopyButton text={sd.mermaidCode} label="Copy code" />
              <a
                href={mermaidLiveUrl(sd.mermaidCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                <ExternalLink size={11} />
                Mermaid Live
              </a>
            </div>
          </div>
          <pre className="bg-slate-900 text-slate-300 text-xs p-4 overflow-x-auto font-mono leading-relaxed">
            {sd.mermaidCode}
          </pre>
        </div>
      ))}
    </div>
  );
}

function ScreensSection({ prd }: { prd: PRD }) {
  const [expanded, setExpanded] = useState<string | null>(prd.screenLayouts[0]?.screenName ?? null);
  const toggle = (name: string) => setExpanded((p) => (p === name ? null : name));

  return (
    <div className="space-y-2.5">
      {prd.screenLayouts.map((sl) => (
        <CollapsibleCard
          key={sl.screenName}
          id={sl.screenName}
          title={sl.screenName}
          badge="Screen"
          badgeStyle="bg-pink-100 text-pink-700"
          expanded={expanded === sl.screenName}
          onToggle={toggle}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">{sl.description}</p>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Layout</p>
              <pre className="bg-slate-800 text-slate-200 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed whitespace-pre">
                {sl.layout}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Components</p>
              <ul className="space-y-1">
                {sl.components.map((c, i) => (
                  <li key={i} className="text-xs text-slate-700 flex gap-2">
                    <span className="text-pink-400 shrink-0">▸</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleCard>
      ))}
    </div>
  );
}

function NFRSection({ prd }: { prd: PRD }) {
  const icons: Record<string, string> = {
    Performance: "⚡",
    Security: "🔒",
    Scalability: "📈",
    Usability: "🎯",
    Maintainability: "🔧",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {prd.nonFunctionalRequirements.map((nfr, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span>{icons[nfr.category] ?? "📋"}</span>
            {nfr.category}
          </h4>
          <ul className="space-y-1.5">
            {nfr.requirements.map((r, j) => (
              <li key={j} className="text-xs text-slate-600 flex gap-2">
                <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TechNotesSection({ prd }: { prd: PRD }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5">
      <p className="text-slate-300 text-sm leading-relaxed font-mono whitespace-pre-wrap">{prd.technicalNotes}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PrdGenerator() {
  const [step, setStep] = useState<"input" | "questions" | "prd">("input");
  const [requirement, setRequirement] = useState("");
  const [questions, setQuestions] = useState<ElicitationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [prd, setPrd] = useState<PRD | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("summary");
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Group questions by category
  const groupedQuestions = questions.reduce<Record<string, ElicitationQuestion[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  const handleGenerateQuestions = async () => {
    if (!requirement.trim()) return;
    setLoading(true);
    setLoadingMessages(LOADING_MESSAGES_QUESTIONS);
    setError(null);
    try {
      const qs = await generateElicitationQuestions(requirement.trim());
      setQuestions(qs);
      setAnswers({});
      setStep("questions");
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === "NO_API_KEY"
        ? "Chưa cài đặt API Key. Vui lòng vào Settings → Cài đặt AI để nhập Anthropic API Key."
        : `Lỗi: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePRD = async () => {
    setLoading(true);
    setLoadingMessages(LOADING_MESSAGES_PRD);
    setError(null);
    try {
      const result = await generatePRD(requirement, questions, answers);
      setPrd(result);
      setActiveSection("summary");
      setStep("prd");
    } catch (e: unknown) {
      setError(`Lỗi tạo PRD: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!prd) return;
    await navigator.clipboard.writeText(prdToMarkdown(prd));
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    if (!prd) return;
    const md = prdToMarkdown(prd);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prd.projectName.replace(/\s+/g, "_")}_PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Render: Input Step ────────────────────────────────────────────────────

  if (step === "input") {
    return (
      <div className="space-y-5">
        <StepIndicator step="input" />

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Yêu cầu nghiệp vụ</h3>
              <p className="text-xs text-slate-500">Mô tả ngắn gọn vấn đề cần giải quyết</p>
            </div>
          </div>

          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Ví dụ: Xây dựng hệ thống quản lý đơn hàng cho cửa hàng bán lẻ online, cho phép khách hàng đặt hàng, theo dõi trạng thái, và người quản lý xử lý đơn, xem báo cáo doanh thu..."
            rows={5}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed"
          />

          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">Dùng ví dụ mẫu:</p>
            <div className="space-y-2">
              {SAMPLE_REQUIREMENTS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setRequirement(sample)}
                  className="block w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg px-3 py-2 transition-colors truncate"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerateQuestions}
          disabled={loading || !requirement.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Đang phân tích...</>
          ) : (
            <><BookOpen size={16} /> Tạo câu hỏi làm rõ yêu cầu</>
          )}
        </button>

        {loading && <LoadingOverlay messages={loadingMessages} />}
      </div>
    );
  }

  // ── Render: Questions Step ────────────────────────────────────────────────

  if (step === "questions") {
    return (
      <div className="space-y-5">
        <StepIndicator step="questions" />

        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-slate-500">Đã trả lời</p>
            <p className="text-sm font-bold text-slate-800">
              {answeredCount} / {questions.length} câu hỏi
            </p>
          </div>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setStep("input")}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <RefreshCw size={12} /> Sửa yêu cầu
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Yêu cầu:</p>
          <p className="text-xs text-slate-700 line-clamp-2">{requirement}</p>
        </div>

        {error && (
          <div className="flex gap-2 items-start text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(groupedQuestions).map(([category, qs]) => (
            <div key={category} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[category] ?? "bg-slate-100 text-slate-600"}`}>
                  {category}
                </span>
                <span className="text-xs text-slate-400">{qs.filter((q) => answers[q.id]?.trim()).length}/{qs.length}</span>
              </div>
              <div className="space-y-4">
                {qs.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="text-slate-400 font-mono text-xs mr-1.5">{q.id}</span>
                      {q.question}
                      {q.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {q.hint && (
                      <p className="text-xs text-slate-400 mb-1.5 italic">💡 {q.hint}</p>
                    )}
                    <textarea
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Nhập câu trả lời... (có thể bỏ qua)"
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleGeneratePRD}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Đang tạo PRD...</>
          ) : (
            <><FileText size={16} /> Tạo PRD{answeredCount > 0 ? ` (${answeredCount} câu đã trả lời)` : " (bỏ qua tất cả)"}</>
          )}
        </button>

        {loading && <LoadingOverlay messages={loadingMessages} />}
      </div>
    );
  }

  // ── Render: PRD Viewer ────────────────────────────────────────────────────

  if (step === "prd" && prd) {
    return (
      <div className="space-y-4">
        <StepIndicator step="prd" />

        {/* PRD header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{prd.projectName}</p>
              <p className="text-xs text-slate-500">v{prd.version} · {prd.date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {markdownCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {markdownCopied ? "Đã copy!" : "Copy MD"}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              <Download size={13} />
              Tải .md
            </button>
            <button
              onClick={() => { setStep("input"); setPrd(null); setQuestions([]); setAnswers({}); setRequirement(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} />
              Mới
            </button>
          </div>
        </div>

        {/* Section tab nav */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex min-w-max border-b border-slate-100">
              {PRD_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSectionChange(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeSection === id
                      ? "text-emerald-600 border-emerald-500 bg-emerald-50"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div ref={sectionRef} className="p-4 md:p-5">
            {activeSection === "summary" && <SummarySection prd={prd} />}
            {activeSection === "usecases" && <UseCasesSection prd={prd} />}
            {activeSection === "stories" && <UserStoriesSection prd={prd} />}
            {activeSection === "data" && <DataModelSection prd={prd} />}
            {activeSection === "diagrams" && <DiagramsSection prd={prd} />}
            {activeSection === "screens" && <ScreensSection prd={prd} />}
            {activeSection === "nfr" && <NFRSection prd={prd} />}
            {activeSection === "tech" && <TechNotesSection prd={prd} />}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
