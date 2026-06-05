import { useState } from "react";
import {
  FileText, ChevronDown, ChevronRight, Copy, Check, ExternalLink,
  Loader2, AlertCircle, BookOpen, Target, Database, GitBranch,
  Monitor, Zap, Code2, Download, ArrowRight, LayoutDashboard,
  ClipboardList, RefreshCw, Shield, Network, TriangleAlert,
} from "lucide-react";
import {
  type ElicitationQuestion, type PRD, type ScreenSpec, type FieldSpec,
  type SequenceDiagram, type UseCase, type GenerationPhase,
  generateElicitationQuestions, generateFullPRD,
  prdToMarkdown, mermaidLiveUrl,
} from "../utils/prdApi";

// ── Constants ──────────────────────────────────────────────────────────────

const SAMPLES = [
  "Xây dựng hệ thống quản lý đơn hàng cho cửa hàng bán lẻ online: khách đặt hàng, theo dõi trạng thái, người quản lý xử lý đơn và xem báo cáo doanh thu.",
  "Phát triển ứng dụng mobile đặt lịch khám bệnh tại phòng khám: bệnh nhân đặt lịch online, bác sĩ quản lý lịch làm việc, lễ tân điều phối cuộc hẹn.",
  "Tạo nền tảng học trực tuyến (LMS) cho trường phổ thông: quản lý khoá học, bài giảng video, bài tập, điểm số và tương tác giữa giáo viên và học sinh.",
];

const GENERATION_PHASES: { id: GenerationPhase; label: string }[] = [
  { id: "foundation", label: "Executive Summary, Use Cases, Business Rules" },
  { id: "stories_data", label: "User Stories & Data Model" },
  { id: "screens", label: "Screen Specs (FE/BE rules)" },
  { id: "sequences", label: "Sequence Diagrams & API Specs" },
  { id: "errors_nfr", label: "Error Codes, NFR & Technical Notes" },
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

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

const PERM_STYLE: Record<string, string> = {
  full: "text-emerald-600 font-bold",
  read: "text-blue-500",
  create: "text-purple-500",
  edit: "text-yellow-600",
  delete: "text-red-500",
  none: "text-slate-300",
};

const PERM_ICON: Record<string, string> = {
  full: "✅",
  read: "👁️",
  create: "➕",
  edit: "✏️",
  delete: "🗑️",
  none: "❌",
};

const ERROR_CATEGORY_COLORS: Record<string, string> = {
  Auth: "bg-red-100 text-red-700",
  Validation: "bg-yellow-100 text-yellow-700",
  Business: "bg-purple-100 text-purple-700",
  System: "bg-slate-100 text-slate-700",
  Integration: "bg-cyan-100 text-cyan-700",
};

const PRD_TABS = [
  { id: "summary", label: "Tổng quan", icon: LayoutDashboard },
  { id: "ucdiagram", label: "UC Diagram", icon: Network },
  { id: "permission", label: "Phân quyền", icon: Shield },
  { id: "usecases", label: "Use Cases", icon: Target },
  { id: "bizrules", label: "Business Rules", icon: ClipboardList },
  { id: "stories", label: "User Stories", icon: BookOpen },
  { id: "data", label: "Data Model", icon: Database },
  { id: "screens", label: "Screens", icon: Monitor },
  { id: "sequences", label: "Sequences", icon: GitBranch },
  { id: "errors", label: "Error Codes", icon: TriangleAlert },
  { id: "nfr", label: "NFR", icon: Zap },
  { id: "tech", label: "Tech Notes", icon: Code2 },
] as const;

// ── Shared UI ──────────────────────────────────────────────────────────────

function StepBadge({ step }: { step: "input" | "questions" | "prd" }) {
  const steps = [
    { id: "input", label: "Yêu cầu" },
    { id: "questions", label: "Elicitation" },
    { id: "prd", label: "PRD" },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            i < idx ? "bg-emerald-100 text-emerald-700" : i === idx ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
          }`}>
            {i < idx ? <><Check size={10} className="inline mr-1" /></> : `${i + 1}. `}{s.label}
          </span>
          {i < steps.length - 1 && <ArrowRight size={12} className={`mx-1 ${i < idx ? "text-emerald-400" : "text-slate-300"}`} />}
        </div>
      ))}
    </div>
  );
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
      {ok ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {ok ? "Copied!" : label}
    </button>
  );
}

function Pill({ text, style }: { text: string; style: string }) {
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style}`}>{text}</span>;
}

function Expandable({ id, title, badge, badgeStyle = "", open, toggle, children }: {
  id: string; title: string; badge?: string; badgeStyle?: string;
  open: boolean; toggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 font-mono ${badgeStyle || "bg-slate-100 text-slate-600"}`}>{badge}</span>}
          <span className="text-sm font-semibold text-slate-800 truncate">{title}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && <div className="border-t border-slate-100 bg-white px-4 py-4">{children}</div>}
    </div>
  );
}

function MermaidBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-600">{title}</span>
          <div className="flex gap-2">
            <CopyBtn text={code} label="Copy code" />
            <a href={mermaidLiveUrl(code)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
              <ExternalLink size={11} /> Mermaid Live
            </a>
          </div>
        </div>
      )}
      {!title && (
        <div className="flex justify-end gap-2 p-2 bg-slate-50 border-b border-slate-200">
          <CopyBtn text={code} label="Copy code" />
          <a href={mermaidLiveUrl(code)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
            <ExternalLink size={11} /> Mermaid Live
          </a>
        </div>
      )}
      <pre className="bg-slate-900 text-slate-300 text-xs p-4 overflow-x-auto font-mono leading-relaxed">{code}</pre>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 w-44 shrink-0">{label}</span>
      <span className="text-xs text-slate-700">{value}</span>
    </div>
  );
}

// ── Phase Loading Indicator ────────────────────────────────────────────────

function PhaseLoader({ currentPhase, completedPhases }: { currentPhase: GenerationPhase; completedPhases: GenerationPhase[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 size={20} className="text-emerald-500 animate-spin shrink-0" />
        <p className="text-sm font-semibold text-slate-700">Đang tạo PRD (5 giai đoạn)...</p>
      </div>
      <div className="space-y-3">
        {GENERATION_PHASES.map((phase, i) => {
          const done = completedPhases.includes(phase.id);
          const active = currentPhase === phase.id;
          return (
            <div key={phase.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${active ? "bg-emerald-50 border border-emerald-200" : done ? "bg-slate-50" : "opacity-40"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                {done ? <Check size={12} /> : active ? <Loader2 size={12} className="animate-spin" /> : i + 1}
              </div>
              <div>
                <p className={`text-xs font-medium ${active ? "text-emerald-700" : done ? "text-slate-600" : "text-slate-400"}`}>
                  Giai đoạn {i + 1}
                </p>
                <p className="text-[11px] text-slate-500">{phase.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 text-center">Mỗi giai đoạn ~30-60 giây · Tổng ~3-5 phút</p>
    </div>
  );
}

// ── PRD Section: Summary ───────────────────────────────────────────────────

function SummarySection({ prd }: { prd: PRD }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-slate-800">{prd.projectName}</h3>
          <div className="flex gap-2 shrink-0">
            <Pill text={`v${prd.version}`} style="bg-white border border-emerald-200 text-emerald-700" />
            <Pill text={prd.date} style="bg-white border border-slate-200 text-slate-500" />
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{prd.executiveSummary.overview}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Mục tiêu & KPI</p>
          <div className="space-y-2">
            {prd.executiveSummary.objectives.map((o, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Pill text={o.priority} style={o.priority === "High" ? "bg-red-100 text-red-700 shrink-0" : "bg-yellow-100 text-yellow-700 shrink-0"} />
                <div>
                  <p className="text-xs font-medium text-slate-800">{o.goal}</p>
                  <p className="text-[11px] text-slate-500">{o.kpi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Ngoài phạm vi</p>
          <ul className="space-y-1.5">
            {prd.executiveSummary.outOfScope.map((o, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600"><span className="text-red-400 shrink-0">✕</span>{o}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phạm vi dự án</p>
        <p className="text-sm text-slate-700">{prd.executiveSummary.scope}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Stakeholders</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 text-slate-500 font-semibold">Vai trò</th>
              <th className="text-left py-2 pr-4 text-slate-500 font-semibold">Trách nhiệm</th>
              <th className="text-left py-2 text-slate-500 font-semibold">Ảnh hưởng</th>
            </tr></thead>
            <tbody>
              {prd.stakeholders.map((s, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-semibold text-slate-800">{s.role}</td>
                  <td className="py-2 pr-4 text-slate-600">{s.responsibility}</td>
                  <td className="py-2"><Pill text={s.influence} style={s.influence === "High" ? "bg-red-100 text-red-700" : s.influence === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-600"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── PRD Section: UC Diagram ────────────────────────────────────────────────

function UCDiagramSection({ prd }: { prd: PRD }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm text-slate-700">{prd.usecaseDiagram.description}</p>
      </div>
      <MermaidBlock code={prd.usecaseDiagram.mermaidCode} title="Use Case Diagram" />
    </div>
  );
}

// ── PRD Section: Permission Matrix ─────────────────────────────────────────

function PermissionSection({ prd }: { prd: PRD }) {
  const { actors, rows } = prd.permissionMatrix;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(PERM_ICON).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
            {v} <span className="font-medium capitalize">{k}</span>
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-2.5 text-slate-600 font-semibold border-b border-slate-200 min-w-40">Use Case</th>
              {actors.map((a) => <th key={a} className="px-4 py-2.5 text-slate-600 font-semibold border-b border-slate-200 text-center whitespace-nowrap">{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <span className="font-mono text-[10px] text-purple-600 mr-1.5">{row.usecaseId}</span>
                  {row.usecaseName}
                </td>
                {actors.map((a) => {
                  const val = (row.access[a] ?? "none").toLowerCase();
                  return (
                    <td key={a} className={`px-4 py-2.5 text-center ${PERM_STYLE[val] ?? ""}`}>
                      {PERM_ICON[val] ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PRD Section: Use Cases (BABOK) ─────────────────────────────────────────

function UseCasesSection({ prd }: { prd: PRD }) {
  const [open, setOpen] = useState<string | null>(prd.useCases[0]?.id ?? null);
  const toggle = (id: string) => setOpen((p) => (p === id ? null : id));

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-slate-500 mb-1">{prd.useCases.length} use cases · Chuẩn BABOK v3</p>
      {prd.useCases.map((uc: UseCase) => (
        <Expandable key={uc.id} id={uc.id} title={uc.name} badge={uc.id} badgeStyle="bg-purple-100 text-purple-700" open={open === uc.id} toggle={toggle}>
          <div className="space-y-4">
            {/* Info table */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-100">
              <InfoRow label="Mục đích" value={uc.purpose} />
              <InfoRow label="Actor chính" value={uc.primaryActor} />
              <InfoRow label="Actor phụ" value={uc.secondaryActors || "—"} />
              <InfoRow label="Trigger" value={uc.trigger} />
              <InfoRow label="Preconditions" value={uc.preconditions.join(" · ")} />
              <InfoRow label="Postcondition (✓)" value={uc.postconditionsSuccess.join(" · ")} />
              <InfoRow label="Postcondition (✗)" value={uc.postconditionsFailure.join(" · ")} />
              <InfoRow label="Business Rules" value={uc.businessRules.join(", ")} />
              <InfoRow label="NFR" value={uc.nfrRefs.join(", ")} />
            </div>

            {/* Main Flow */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Main Flow</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200">
                  <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold w-10">Bước</th>
                  <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold w-28">Actor</th>
                  <th className="text-left py-1.5 text-slate-500 font-semibold">Hành động</th>
                </tr></thead>
                <tbody>
                  {uc.mainFlow.map((s) => (
                    <tr key={s.step} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-emerald-600 font-bold">{s.step}</td>
                      <td className="py-2 pr-3 text-blue-600 font-medium">{s.actor}</td>
                      <td className="py-2 text-slate-700">{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alt Flows */}
            {uc.alternativeFlows.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Alternative Flows</p>
                <div className="space-y-2">
                  {uc.alternativeFlows.map((af) => (
                    <div key={af.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-bold text-amber-700 mb-1">{af.id}: {af.triggerCondition}</p>
                      <ul className="space-y-0.5">{af.steps.map((s, i) => <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-amber-400 shrink-0">→</span>{s}</li>)}</ul>
                      {af.resumeAt && <p className="text-[11px] text-amber-600 mt-1">↩ {af.resumeAt}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exception Flows */}
            {uc.exceptionFlows.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Exception Flows</p>
                <div className="space-y-2">
                  {uc.exceptionFlows.map((ef) => (
                    <div key={ef.id} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-bold text-red-700 mb-1">{ef.id}: {ef.triggerCondition}</p>
                      <ul className="space-y-0.5">{ef.steps.map((s, i) => <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-red-400 shrink-0">⚠</span>{s}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Expandable>
      ))}
    </div>
  );
}

// ── PRD Section: Business Rules ─────────────────────────────────────────────

function BizRulesSection({ prd }: { prd: PRD }) {
  const [catFilter, setCatFilter] = useState("all");
  const cats = ["all", ...Array.from(new Set(prd.businessRules.map((br) => br.category)))];
  const filtered = catFilter === "all" ? prd.businessRules : prd.businessRules.filter((br) => br.category === catFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${catFilter === c ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {c === "all" ? `All (${prd.businessRules.length})` : c}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold w-20">BR ID</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold w-36">Tên</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold w-24">Category</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold">Điều kiện IF → THEN</th>
            <th className="text-left py-2 text-slate-500 font-semibold w-24">UC liên quan</th>
          </tr></thead>
          <tbody>
            {filtered.map((br) => (
              <tr key={br.id} className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-3 font-mono font-bold text-purple-700">{br.id}</td>
                <td className="py-2.5 pr-3 font-medium text-slate-800">{br.name}</td>
                <td className="py-2.5 pr-3"><Pill text={br.category} style="bg-slate-100 text-slate-600" /></td>
                <td className="py-2.5 pr-3 text-slate-700 italic">{br.condition}</td>
                <td className="py-2.5 text-slate-500 text-[10px]">{br.references.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PRD Section: User Stories ──────────────────────────────────────────────

function UserStoriesSection({ prd }: { prd: PRD }) {
  const [open, setOpen] = useState<string | null>(prd.userStories[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const toggle = (id: string) => setOpen((p) => (p === id ? null : id));
  const counts = { high: 0, medium: 0, low: 0 };
  prd.userStories.forEach((us) => counts[us.priority]++);
  const filtered = filter === "all" ? prd.userStories : prd.userStories.filter((us) => us.priority === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {f === "all" ? `All (${prd.userStories.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {filtered.map((us) => (
          <Expandable key={us.id} id={us.id} title={us.title} badge={us.id} badgeStyle="bg-emerald-100 text-emerald-700" open={open === us.id} toggle={toggle}>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Pill text={us.priority.toUpperCase()} style={`border ${PRIORITY_STYLE[us.priority]}`} />
                <Pill text={us.actor} style="bg-blue-100 text-blue-700" />
                {us.relatedUC && <Pill text={us.relatedUC} style="bg-purple-100 text-purple-700" />}
              </div>
              <p className="text-sm text-slate-700 italic bg-slate-50 rounded-lg px-3 py-2">{us.description}</p>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Acceptance Criteria</p>
                <div className="space-y-2">
                  {us.acceptanceCriteria.map((ac, i) => (
                    <pre key={i} className="text-xs text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 whitespace-pre-wrap font-sans">{ac}</pre>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">Dev Impact</p>
                  <p className="text-xs text-slate-700 whitespace-pre-line">{us.devImpact}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1.5">QA Impact</p>
                  <p className="text-xs text-slate-700 whitespace-pre-line">{us.qaImpact}</p>
                </div>
              </div>
            </div>
          </Expandable>
        ))}
      </div>
    </div>
  );
}

// ── PRD Section: Data Model ────────────────────────────────────────────────

function DataModelSection({ prd }: { prd: PRD }) {
  const [open, setOpen] = useState<string | null>(prd.dataModel.entities[0]?.name ?? null);
  const toggle = (id: string) => setOpen((p) => (p === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm text-slate-700">{prd.dataModel.summary}</p>
      </div>
      <MermaidBlock code={prd.dataModel.erDiagramCode} title="ER Diagram" />
      <div className="space-y-2.5">
        {prd.dataModel.entities.map((e) => (
          <Expandable key={e.name} id={e.name} title={`${e.name} (${e.tableName})`} badge="Entity" badgeStyle="bg-cyan-100 text-cyan-700" open={open === e.name} toggle={toggle}>
            <div className="space-y-3">
              <p className="text-xs text-slate-600 italic">{e.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Column</th>
                    <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Type</th>
                    <th className="text-center py-1.5 pr-3 text-slate-500 font-semibold">Null</th>
                    <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Default</th>
                    <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Constraint</th>
                    <th className="text-left py-1.5 text-slate-500 font-semibold">Mô tả</th>
                  </tr></thead>
                  <tbody>
                    {e.columns.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1.5 pr-3 font-mono text-slate-800">{c.name}</td>
                        <td className="py-1.5 pr-3 text-cyan-700 font-medium text-[11px]">{c.type}</td>
                        <td className="py-1.5 pr-3 text-center text-[11px]">{c.nullable ? <span className="text-slate-400">NULL</span> : <span className="text-red-500 font-bold">✗</span>}</td>
                        <td className="py-1.5 pr-3 text-slate-500 font-mono text-[11px]">{c.default || "—"}</td>
                        <td className="py-1.5 pr-3"><Pill text={c.constraint || "—"} style={c.constraint === "PK" ? "bg-red-100 text-red-700" : c.constraint === "FK" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"} /></td>
                        <td className="py-1.5 text-slate-600 text-[11px]">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {e.indexes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Indexes</p>
                  <div className="flex flex-wrap gap-1.5">{e.indexes.map((idx, i) => <code key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{idx}</code>)}</div>
                </div>
              )}
            </div>
          </Expandable>
        ))}
      </div>
    </div>
  );
}

// ── PRD Section: Screen Specs ──────────────────────────────────────────────

function FieldDetail({ f }: { f: FieldSpec }) {
  const [tab, setTab] = useState<"info" | "fe" | "be">("info");
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-[11px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shrink-0">{f.name}</code>
          <span className="text-xs font-medium text-slate-700 truncate">{f.label}</span>
          <Pill text={f.type} style="bg-blue-100 text-blue-700 shrink-0" />
          {f.required && <Pill text="Required" style="bg-red-100 text-red-700 shrink-0" />}
        </div>
        {open ? <ChevronDown size={13} className="text-slate-400 shrink-0" /> : <ChevronRight size={13} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-200">
          <div className="flex border-b border-slate-200">
            {(["info", "fe", "be"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2 text-[11px] font-semibold border-b-2 transition-colors ${tab === t ? "text-emerald-600 border-emerald-500 bg-emerald-50" : "text-slate-500 border-transparent hover:text-slate-700"}`}>
                {t === "info" ? "📋 Thông tin" : t === "fe" ? "🖥️ FE Rules" : "⚙️ BE Rules"}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-2 text-xs">
            {tab === "info" && (
              <>
                <InfoRow label="Ý nghĩa nghiệp vụ" value={f.description} />
                <InfoRow label="Business Rule" value={f.businessRuleRef || "—"} />
                <InfoRow label="Giá trị mặc định" value={f.defaultValue || "—"} />
                <InfoRow label="Placeholder" value={f.feRules.placeholder || "—"} />
                {f.feRules.displayValues && <InfoRow label="Giá trị select" value={f.feRules.displayValues} />}
              </>
            )}
            {tab === "fe" && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Validate Rules</p>
                  <ul className="space-y-1">{f.feRules.validate.map((v, i) => <li key={i} className="flex gap-1.5 text-slate-700"><span className="text-blue-400 shrink-0">•</span>{v}</li>)}</ul>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[10px] font-bold text-slate-400 mb-1">Data Type</p><code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{f.feRules.dataType}</code></div>
                  {f.feRules.maxLength && <div><p className="text-[10px] font-bold text-slate-400 mb-1">Max Length</p><code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{f.feRules.maxLength}</code></div>}
                </div>
                {f.feRules.disabled && <InfoRow label="Disabled khi" value={f.feRules.disabled} />}
                {Object.keys(f.feRules.errorMessages).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Error Messages</p>
                    <div className="space-y-1">
                      {Object.entries(f.feRules.errorMessages).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <Pill text={k} style="bg-red-100 text-red-600 shrink-0" />
                          <span className="text-slate-600 italic">"{v}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {tab === "be" && (
              <>
                <InfoRow label="API Endpoint" value={f.beRules.apiEndpoint} />
                <InfoRow label="Bảng (Table)" value={f.beRules.table} />
                <InfoRow label="Cột (Column)" value={f.beRules.column} />
                <InfoRow label="Nguồn dữ liệu" value={f.beRules.dataSource} />
                <InfoRow label="Xử lý BE" value={f.beRules.processing} />
                {f.beRules.validation.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">BE Validation</p>
                    <ul className="space-y-1">{f.beRules.validation.map((v, i) => <li key={i} className="flex gap-1.5 text-slate-700"><span className="text-orange-400">•</span>{v}</li>)}</ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenSpecsSection({ prd }: { prd: PRD }) {
  const [open, setOpen] = useState<string | null>(prd.screenSpecs[0]?.screenId ?? null);
  const toggle = (id: string) => setOpen((p) => (p === id ? null : id));

  return (
    <div className="space-y-2.5">
      {prd.screenSpecs.map((scr: ScreenSpec) => (
        <Expandable key={scr.screenId} id={scr.screenId} title={scr.screenName} badge={scr.screenId} badgeStyle="bg-pink-100 text-pink-700" open={open === scr.screenId} toggle={toggle}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {scr.relatedUseCases.map((uc) => <Pill key={uc} text={uc} style="bg-purple-100 text-purple-700" />)}
            </div>
            <p className="text-xs text-slate-600">{scr.purpose}</p>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Wireframe</p>
              <pre className="bg-slate-800 text-slate-200 text-[11px] p-3 rounded-lg overflow-x-auto font-mono leading-relaxed whitespace-pre">{scr.layout}</pre>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Field Table</p>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold">Field</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold">Label</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold">Type</th>
                    <th className="text-center px-2 py-2 text-slate-500 font-semibold">Req</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold">Default</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold">Mô tả</th>
                  </tr></thead>
                  <tbody>
                    {scr.fields.map((f) => (
                      <tr key={f.name} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-mono text-[11px] text-slate-700">{f.name}</td>
                        <td className="px-2 py-2 font-medium text-slate-800">{f.label}</td>
                        <td className="px-2 py-2"><Pill text={f.type} style="bg-blue-100 text-blue-700" /></td>
                        <td className="px-2 py-2 text-center text-emerald-600 font-bold">{f.required ? "✓" : ""}</td>
                        <td className="px-2 py-2 text-slate-500 text-[11px]">{f.defaultValue || "—"}</td>
                        <td className="px-2 py-2 text-slate-600 text-[11px]">{f.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Chi tiết Component (FE/BE Rules)</p>
              <div className="space-y-2">
                {scr.fields.map((f) => <FieldDetail key={f.name} f={f} />)}
              </div>
            </div>
          </div>
        </Expandable>
      ))}
    </div>
  );
}

// ── PRD Section: Sequence Diagrams ─────────────────────────────────────────

function SequenceSection({ prd }: { prd: PRD }) {
  const [open, setOpen] = useState<string | null>(prd.sequenceDiagrams[0]?.title ?? null);
  const toggle = (id: string) => setOpen((p) => (p === id ? null : id));

  return (
    <div className="space-y-4">
      {prd.sequenceDiagrams.map((sd: SequenceDiagram) => (
        <Expandable key={sd.title} id={sd.title} title={sd.title} badge={sd.relatedUseCase} badgeStyle="bg-purple-100 text-purple-700" open={open === sd.title} toggle={toggle}>
          <div className="space-y-5">
            <p className="text-xs text-slate-600">{sd.description}</p>

            <MermaidBlock code={sd.mermaidCode} />

            {/* Step table */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Bảng mô tả chi tiết từng bước</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["Bước", "Actor", "Hành động", "Mô tả chi tiết", "Validate/Check", "Business Rules", "FE Message"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sd.steps.map((s) => (
                      <tr key={s.step} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-2.5 text-emerald-600 font-bold">{s.step}</td>
                        <td className="px-3 py-2.5 text-blue-600 font-medium whitespace-nowrap">{s.actor}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{s.action}</td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-48">{s.description}</td>
                        <td className="px-3 py-2.5 text-slate-600 italic max-w-36">{s.validation || "—"}</td>
                        <td className="px-3 py-2.5">{s.businessRules ? <Pill text={s.businessRules} style="bg-purple-100 text-purple-700" /> : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-48">{s.feMessage || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* API Specs */}
            {sd.apiSpecs.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">API Specifications</p>
                {sd.apiSpecs.map((api, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <Pill text={api.method} style={METHOD_STYLE[api.method] ?? "bg-slate-100 text-slate-700"} />
                      <code className="text-xs font-mono text-slate-800 flex-1">{api.endpoint}</code>
                      <span className="text-[11px] text-slate-500">{api.authentication}</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className="text-xs text-slate-700">{api.description}</p>

                      {/* Request */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Request Body</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-slate-200">
                              <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Field</th>
                              <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Type</th>
                              <th className="text-center py-1.5 pr-3 text-slate-500 font-semibold">Req</th>
                              <th className="text-left py-1.5 pr-3 text-slate-500 font-semibold">Mô tả</th>
                              <th className="text-left py-1.5 text-slate-500 font-semibold">Validate</th>
                            </tr></thead>
                            <tbody>
                              {api.requestFields.map((f, j) => (
                                <tr key={j} className="border-b border-slate-100">
                                  <td className="py-1.5 pr-3 font-mono text-slate-800">{f.field}</td>
                                  <td className="py-1.5 pr-3 text-cyan-700">{f.type}</td>
                                  <td className="py-1.5 pr-3 text-center text-emerald-600">{f.required ? "✓" : ""}</td>
                                  <td className="py-1.5 pr-3 text-slate-600">{f.description}</td>
                                  <td className="py-1.5 text-slate-500 italic">{f.validation || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Response success */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Response</p>
                          <Pill text={`${api.responseSuccessStatus}`} style="bg-green-100 text-green-700" />
                        </div>
                        <div className="flex justify-end mb-1"><CopyBtn text={api.responseSuccessExample} label="Copy" /></div>
                        <pre className="bg-slate-900 text-slate-300 text-[11px] p-3 rounded-lg overflow-x-auto font-mono">{api.responseSuccessExample}</pre>
                      </div>

                      {/* Response errors */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Error Responses</p>
                        <div className="space-y-1">
                          {api.responseErrors.map((e, j) => (
                            <div key={j} className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
                              <Pill text={`${e.httpStatus}`} style={e.httpStatus >= 500 ? "bg-red-100 text-red-700 shrink-0" : "bg-yellow-100 text-yellow-700 shrink-0"} />
                              <code className="text-[11px] text-purple-700 shrink-0">{e.code}</code>
                              <span className="text-xs text-slate-700">{e.message}</span>
                              <span className="text-[11px] text-slate-400 ml-auto shrink-0">{e.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Expandable>
      ))}
    </div>
  );
}

// ── PRD Section: Error Codes ───────────────────────────────────────────────

function ErrorCodesSection({ prd }: { prd: PRD }) {
  const [catFilter, setCatFilter] = useState("all");
  const cats = ["all", ...Array.from(new Set(prd.errorCodes.map((e) => e.category)))];
  const filtered = catFilter === "all" ? prd.errorCodes : prd.errorCodes.filter((e) => e.category === catFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${catFilter === c ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {c === "all" ? `All (${prd.errorCodes.length})` : c}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold">Code</th>
            <th className="text-center py-2 pr-3 text-slate-500 font-semibold">HTTP</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold">Message (VI)</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold">Category</th>
            <th className="text-left py-2 pr-3 text-slate-500 font-semibold">Mô tả</th>
            <th className="text-left py-2 text-slate-500 font-semibold">Xử lý</th>
          </tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.code} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-3 font-mono font-bold text-purple-700">{e.code}</td>
                <td className="py-2 pr-3 text-center">
                  <Pill text={`${e.httpStatus}`} style={e.httpStatus >= 500 ? "bg-red-100 text-red-700" : e.httpStatus >= 400 ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"} />
                </td>
                <td className="py-2 pr-3 text-slate-800 font-medium">{e.messageVI}</td>
                <td className="py-2 pr-3">
                  <Pill text={e.category} style={ERROR_CATEGORY_COLORS[e.category] ?? "bg-slate-100 text-slate-600"} />
                </td>
                <td className="py-2 pr-3 text-slate-600 max-w-44">{e.description}</td>
                <td className="py-2 text-slate-500 max-w-36">{e.resolution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PRD Section: NFR ──────────────────────────────────────────────────────

function NFRSection({ prd }: { prd: PRD }) {
  const cats = Array.from(new Set(prd.nfr.map((n) => n.category)));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-slate-200 bg-slate-50">
          <th className="text-left px-3 py-2.5 text-slate-500 font-semibold">NFR ID</th>
          <th className="text-left px-3 py-2.5 text-slate-500 font-semibold">Category</th>
          <th className="text-left px-3 py-2.5 text-slate-500 font-semibold">Mô tả</th>
          <th className="text-left px-3 py-2.5 text-slate-500 font-semibold">Target</th>
          <th className="text-left px-3 py-2.5 text-slate-500 font-semibold">Measurement</th>
        </tr></thead>
        <tbody>
          {cats.map((cat) =>
            prd.nfr.filter((n) => n.category === cat).map((n, i) => (
              <tr key={n.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{n.id}</td>
                <td className="px-3 py-2">{i === 0 && <Pill text={cat} style="bg-slate-100 text-slate-700" />}</td>
                <td className="px-3 py-2 text-slate-700">{n.description}</td>
                <td className="px-3 py-2 font-semibold text-emerald-700">{n.target}</td>
                <td className="px-3 py-2 text-slate-500 text-[11px]">{n.measurement}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── PRD Section: Tech Notes ───────────────────────────────────────────────

function TechNotesSection({ prd }: { prd: PRD }) {
  return (
    <div className="bg-slate-900 rounded-xl p-5">
      <div className="flex justify-end mb-3"><CopyBtn text={prd.technicalNotes} /></div>
      <pre className="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">{prd.technicalNotes}</pre>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function PrdGenerator() {
  const [step, setStep] = useState<"input" | "questions" | "prd">("input");
  const [requirement, setRequirement] = useState("");
  const [questions, setQuestions] = useState<ElicitationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [prd, setPrd] = useState<PRD | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [currentPhase, setCurrentPhase] = useState<GenerationPhase>("foundation");
  const [completedPhases, setCompletedPhases] = useState<GenerationPhase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [markdownCopied, setMarkdownCopied] = useState(false);

  const grouped = questions.reduce<Record<string, ElicitationQuestion[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;

  const handleGenerateQuestions = async () => {
    if (!requirement.trim()) return;
    setLoading(true); setError(null);
    setLoadingMsg("Phân tích yêu cầu nghiệp vụ và tạo câu hỏi elicitation...");
    try {
      const qs = await generateElicitationQuestions(requirement.trim());
      setQuestions(qs); setAnswers({});
      setStep("questions");
    } catch (e) {
      setError(e instanceof Error && e.message === "NO_API_KEY"
        ? "Chưa cài đặt API Key. Vào Settings → Cài đặt AI để nhập Anthropic API Key."
        : `Lỗi: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setLoading(false); }
  };

  const handleGeneratePRD = async () => {
    setLoading(true); setError(null);
    setCompletedPhases([]); setCurrentPhase("foundation");
    try {
      const result = await generateFullPRD(
        requirement, questions, answers,
        (phase, label) => {
          setCurrentPhase(phase);
          setLoadingMsg(label);
          if (phase !== "done") {
            const idx = GENERATION_PHASES.findIndex((p) => p.id === phase);
            setCompletedPhases(GENERATION_PHASES.slice(0, idx).map((p) => p.id));
          }
        }
      );
      setPrd(result); setActiveTab("summary"); setStep("prd");
    } catch (e) {
      setError(`Lỗi tạo PRD: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setLoading(false); }
  };

  const handleCopyMD = async () => {
    if (!prd) return;
    await navigator.clipboard.writeText(prdToMarkdown(prd));
    setMarkdownCopied(true); setTimeout(() => setMarkdownCopied(false), 2500);
  };

  const handleDownloadMD = () => {
    if (!prd) return;
    const blob = new Blob([prdToMarkdown(prd)], { type: "text/markdown" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${prd.projectName.replace(/\s+/g, "_")}_PRD.md` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const reset = () => { setStep("input"); setPrd(null); setQuestions([]); setAnswers({}); setRequirement(""); setError(null); };

  // ── Step: Input ──────────────────────────────────────────────────────────

  if (step === "input") return (
    <div className="space-y-5">
      <StepBadge step="input" />
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText size={16} className="text-emerald-600" /></div>
          <div>
            <p className="text-sm font-bold text-slate-800">Yêu cầu nghiệp vụ</p>
            <p className="text-xs text-slate-500">Mô tả bài toán cần giải quyết</p>
          </div>
        </div>
        <textarea value={requirement} onChange={(e) => setRequirement(e.target.value)}
          placeholder="Ví dụ: Xây dựng hệ thống quản lý đơn hàng cho cửa hàng bán lẻ online..."
          rows={5}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none leading-relaxed" />
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2">Ví dụ mẫu:</p>
          <div className="space-y-1.5">
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => setRequirement(s)}
                className="block w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg px-3 py-2 transition-colors line-clamp-1">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4"><AlertCircle size={16} className="shrink-0 mt-0.5" /><p>{error}</p></div>}
      <button onClick={handleGenerateQuestions} disabled={loading || !requirement.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
        {loading ? <><Loader2 size={16} className="animate-spin" />{loadingMsg}</> : <><BookOpen size={16} />Tạo câu hỏi Elicitation</>}
      </button>
    </div>
  );

  // ── Step: Questions ──────────────────────────────────────────────────────

  if (step === "questions") return (
    <div className="space-y-5">
      <StepBadge step="questions" />
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-xs text-slate-500">Đã trả lời</p>
          <p className="text-sm font-bold text-slate-800">{answeredCount} / {questions.length}</p>
        </div>
        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
        <button onClick={() => setStep("input")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <RefreshCw size={12} /> Sửa yêu cầu
        </button>
      </div>

      {loading && <PhaseLoader currentPhase={currentPhase} completedPhases={completedPhases} />}

      {error && <div className="flex gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4"><AlertCircle size={16} className="shrink-0 mt-0.5" /><p>{error}</p></div>}

      {!loading && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, qs]) => (
            <div key={cat} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Pill text={cat} style={CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-600"} />
                <span className="text-xs text-slate-400">{qs.filter((q) => answers[q.id]?.trim()).length}/{qs.length}</span>
              </div>
              <div className="space-y-4">
                {qs.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="text-slate-400 font-mono text-xs mr-1.5">{q.id}</span>{q.question}
                      {q.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {q.hint && <p className="text-xs text-slate-400 mb-1.5 italic">💡 {q.hint}</p>}
                    <textarea value={answers[q.id] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Nhập câu trả lời... (có thể bỏ qua)" rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleGeneratePRD} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
        {loading ? <><Loader2 size={16} className="animate-spin" />{loadingMsg || "Đang tạo PRD..."}</> : <><FileText size={16} />Tạo PRD chuẩn BABOK ({answeredCount}/{questions.length} câu trả lời)</>}
      </button>
    </div>
  );

  // ── Step: PRD Viewer ─────────────────────────────────────────────────────

  if (step === "prd" && prd) return (
    <div className="space-y-4">
      <StepBadge step="prd" />

      <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center"><FileText size={14} className="text-emerald-600" /></div>
          <div>
            <p className="text-sm font-bold text-slate-800">{prd.projectName}</p>
            <p className="text-xs text-slate-500">v{prd.version} · {prd.date} · {prd.useCases.length} UCs · {prd.userStories.length} Stories · {prd.screenSpecs.length} Screens</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyMD} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            {markdownCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}{markdownCopied ? "Copied!" : "Copy MD"}
          </button>
          <button onClick={handleDownloadMD} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
            <Download size={13} />Download .md
          </button>
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <RefreshCw size={13} />Mới
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto border-b border-slate-100">
          <div className="flex min-w-max">
            {PRD_TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id ? "text-emerald-600 border-emerald-500 bg-emerald-50" : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                }`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 md:p-5">
          {activeTab === "summary" && <SummarySection prd={prd} />}
          {activeTab === "ucdiagram" && <UCDiagramSection prd={prd} />}
          {activeTab === "permission" && <PermissionSection prd={prd} />}
          {activeTab === "usecases" && <UseCasesSection prd={prd} />}
          {activeTab === "bizrules" && <BizRulesSection prd={prd} />}
          {activeTab === "stories" && <UserStoriesSection prd={prd} />}
          {activeTab === "data" && <DataModelSection prd={prd} />}
          {activeTab === "screens" && <ScreenSpecsSection prd={prd} />}
          {activeTab === "sequences" && <SequenceSection prd={prd} />}
          {activeTab === "errors" && <ErrorCodesSection prd={prd} />}
          {activeTab === "nfr" && <NFRSection prd={prd} />}
          {activeTab === "tech" && <TechNotesSection prd={prd} />}
        </div>
      </div>
    </div>
  );

  return null;
}
