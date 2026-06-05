import { getApiKey } from "./visionParser";

// ── Elicitation ────────────────────────────────────────────────────────────

export interface ElicitationQuestion {
  id: string;
  category: string;
  question: string;
  hint?: string;
  required?: boolean;
}

// ── Use Case (BABOK) ────────────────────────────────────────────────────────

export interface MainFlowStep {
  step: number;
  actor: string;
  action: string;
}

export interface AlternativeFlow {
  id: string;
  triggerCondition: string;
  steps: string[];
  resumeAt: string;
}

export interface ExceptionFlow {
  id: string;
  triggerCondition: string;
  steps: string[];
}

export interface UseCase {
  id: string;
  name: string;
  purpose: string;
  primaryActor: string;
  secondaryActors: string;
  trigger: string;
  preconditions: string[];
  postconditionsSuccess: string[];
  postconditionsFailure: string[];
  mainFlow: MainFlowStep[];
  alternativeFlows: AlternativeFlow[];
  exceptionFlows: ExceptionFlow[];
  businessRules: string[];
  nfrRefs: string[];
}

// ── Permission Matrix ───────────────────────────────────────────────────────

export interface PermissionMatrix {
  actors: string[];
  rows: { usecaseId: string; usecaseName: string; access: Record<string, string> }[];
}

// ── Business Rule ──────────────────────────────────────────────────────────

export interface BusinessRule {
  id: string;
  name: string;
  category: string;
  condition: string;
  references: string[];
}

// ── User Story ─────────────────────────────────────────────────────────────

export interface UserStory {
  id: string;
  title: string;
  actor: string;
  description: string;
  acceptanceCriteria: string[];
  devImpact: string;
  qaImpact: string;
  priority: "high" | "medium" | "low";
  relatedUC?: string;
}

// ── Data Model ─────────────────────────────────────────────────────────────

export interface DataColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: string;
  constraint: string;
  description: string;
}

export interface DataEntity {
  name: string;
  tableName: string;
  description: string;
  columns: DataColumn[];
  indexes: string[];
}

// ── Screen Specs ───────────────────────────────────────────────────────────

export interface FieldFERule {
  validate: string[];
  maxLength?: number;
  dataType: string;
  placeholder: string;
  displayValues?: string;
  disabled?: string;
  errorMessages: Record<string, string>;
}

export interface FieldBERule {
  apiEndpoint: string;
  table: string;
  column: string;
  processing: string;
  validation: string[];
  dataSource: string;
}

export interface FieldSpec {
  name: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue: string;
  description: string;
  businessRuleRef: string;
  feRules: FieldFERule;
  beRules: FieldBERule;
}

export interface ScreenSpec {
  screenId: string;
  screenName: string;
  description: string;
  purpose: string;
  relatedUseCases: string[];
  layout: string;
  fields: FieldSpec[];
}

// ── Sequence Diagram ────────────────────────────────────────────────────────

export interface SequenceStep {
  step: number;
  actor: string;
  action: string;
  description: string;
  validation: string;
  businessRules: string;
  feMessage: string;
  apiCall: string;
}

export interface ApiRequestField {
  field: string;
  type: string;
  required: boolean;
  description: string;
  validation: string;
}

export interface ApiResponseError {
  code: string;
  httpStatus: number;
  message: string;
  description: string;
}

export interface ApiSpec {
  method: string;
  endpoint: string;
  description: string;
  authentication: string;
  requestFields: ApiRequestField[];
  responseSuccessStatus: number;
  responseSuccessExample: string;
  responseErrors: ApiResponseError[];
}

export interface SequenceDiagram {
  title: string;
  description: string;
  relatedUseCase: string;
  mermaidCode: string;
  steps: SequenceStep[];
  apiSpecs: ApiSpec[];
}

// ── Error Code ─────────────────────────────────────────────────────────────

export interface ErrorCode {
  code: string;
  httpStatus: number;
  messageVI: string;
  messageEN: string;
  category: string;
  description: string;
  resolution: string;
}

// ── NFR ────────────────────────────────────────────────────────────────────

export interface NFRItem {
  id: string;
  category: string;
  description: string;
  target: string;
  measurement: string;
}

// ── PRD (Full) ─────────────────────────────────────────────────────────────

export interface PRD {
  projectName: string;
  version: string;
  date: string;
  executiveSummary: {
    overview: string;
    objectives: { goal: string; kpi: string; priority: string }[];
    scope: string;
    outOfScope: string[];
  };
  stakeholders: { role: string; responsibility: string; influence: string }[];
  usecaseDiagram: { description: string; mermaidCode: string };
  permissionMatrix: PermissionMatrix;
  useCases: UseCase[];
  businessRules: BusinessRule[];
  userStories: UserStory[];
  dataModel: { summary: string; erDiagramCode: string; entities: DataEntity[] };
  screenSpecs: ScreenSpec[];
  sequenceDiagrams: SequenceDiagram[];
  errorCodes: ErrorCode[];
  nfr: NFRItem[];
  technicalNotes: string;
}

export type GenerationPhase =
  | "questions"
  | "foundation"
  | "stories_data"
  | "screens"
  | "sequences"
  | "errors_nfr"
  | "done";

// ── Claude API helper ──────────────────────────────────────────────────────

async function callClaude(prompt: string, systemPrompt: string, maxTokens = 6000): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

function parseJSON<T>(raw: string): T {
  const text = raw.replace(/```(?:json)?/g, "").trim();
  return JSON.parse(text) as T;
}

const SYS = `Bạn là Senior Business Analyst theo chuẩn BABOK v3 và ITBA. Chỉ trả về JSON thuần túy, không markdown, không giải thích.`;

// ── Elicitation ────────────────────────────────────────────────────────────

export async function generateElicitationQuestions(requirement: string): Promise<ElicitationQuestion[]> {
  const prompt = `Phân tích yêu cầu nghiệp vụ và tạo câu hỏi elicitation:

"${requirement}"

Trả về JSON array:
[{"id":"Q1","category":"Business Context","question":"...","hint":"ví dụ cụ thể","required":true}]

Categories bắt buộc: Business Context, Users & Actors, Functional Requirements, Non-Functional Requirements, Data & Integration, Process Flow, Constraints & Timeline.
Tạo 15-18 câu hỏi, hint phải là ví dụ cụ thể không chung chung.`;

  return parseJSON<ElicitationQuestion[]>(await callClaude(prompt, SYS, 2048));
}

// ── Phase 1: Foundation + Use Cases + Permission Matrix + Business Rules ────

async function generatePhase1(requirement: string, qaContext: string, today: string) {
  const prompt = `Tạo phần Foundation của PRD cho yêu cầu:

=== YÊU CẦU ===
${requirement}

=== Q&A ===
${qaContext}

Trả về JSON (không markdown):
{
  "projectName": "Tên dự án",
  "executiveSummary": {
    "overview": "3-5 câu tổng quan",
    "objectives": [{"goal":"Mục tiêu SMART","kpi":"Đo lường","priority":"High"}],
    "scope": "Phạm vi dự án",
    "outOfScope": ["Điều ngoài phạm vi"]
  },
  "stakeholders": [{"role":"Product Owner","responsibility":"...","influence":"High"}],
  "usecaseDiagram": {
    "description": "Mô tả sơ đồ",
    "mermaidCode": "graph LR\\n  subgraph Actors\\n    A1[\\"👤 Actor1\\"]\\n  end\\n  subgraph System[\\"Tên hệ thống\\"]\\n    UC01([\\"UC01: Tên\\"])\\n  end\\n  A1 --> UC01"
  },
  "permissionMatrix": {
    "actors": ["Actor1","Actor2"],
    "rows": [
      {"usecaseId":"UC01","usecaseName":"Tên UC","access":{"Actor1":"full","Actor2":"read"}}
    ]
  },
  "useCases": [
    {
      "id": "UC01",
      "name": "Tên use case",
      "purpose": "Tại sao UC này tồn tại? Giá trị nghiệp vụ?",
      "primaryActor": "Actor chính",
      "secondaryActors": "Actor phụ hoặc empty string",
      "trigger": "Sự kiện kích hoạt UC",
      "preconditions": ["Điều kiện TRƯỚC khi UC bắt đầu"],
      "postconditionsSuccess": ["Trạng thái SAU khi thành công"],
      "postconditionsFailure": ["Trạng thái SAU khi thất bại"],
      "mainFlow": [{"step":1,"actor":"Actor","action":"Hành động cụ thể"}],
      "alternativeFlows": [{"id":"A1","triggerCondition":"Khi nào","steps":["Bước xử lý"],"resumeAt":"Tiếp tục từ bước N"}],
      "exceptionFlows": [{"id":"E1","triggerCondition":"Khi nào","steps":["Xử lý lỗi"]}],
      "businessRules": ["BR-001"],
      "nfrRefs": ["NFR-PERF-01"]
    }
  ],
  "businessRules": [
    {
      "id": "BR-001",
      "name": "Tên business rule",
      "category": "Validation",
      "condition": "IF [điều kiện] THEN [hành động]",
      "references": ["UC01","UC02"]
    }
  ]
}

Chất lượng bắt buộc:
- useCases: 5-7 UCs đầy đủ 10 thuộc tính BABOK, mainFlow tối thiểu 5-6 bước
- businessRules: 10-14 rules, category trong: Validation|Business Logic|Calculation|Access Control|Routing|Data Integrity|Notification
- permissionMatrix: cover tất cả actor × UC
- mermaidCode: valid Mermaid graph syntax với subgraph`;

  return parseJSON<{
    projectName: string;
    executiveSummary: PRD["executiveSummary"];
    stakeholders: PRD["stakeholders"];
    usecaseDiagram: PRD["usecaseDiagram"];
    permissionMatrix: PermissionMatrix;
    useCases: UseCase[];
    businessRules: BusinessRule[];
  }>(await callClaude(prompt, SYS, 7000));

  void today;
}

// ── Phase 2: User Stories + Data Model ─────────────────────────────────────

async function generatePhase2(
  requirement: string,
  qaContext: string,
  ucIds: string[],
  brIds: string[]
) {
  const prompt = `Tạo User Stories và Data Model cho PRD:

=== YÊU CẦU ===
${requirement}

=== Q&A ===
${qaContext}

Use Case IDs đã có: ${ucIds.join(", ")}
Business Rule IDs đã có: ${brIds.join(", ")}

Trả về JSON:
{
  "userStories": [
    {
      "id": "US-001",
      "title": "Tên story ngắn gọn",
      "actor": "Vai trò",
      "description": "As a [actor], I want to [action] so that [benefit]",
      "acceptanceCriteria": ["SCENARIO 1: Happy path\\n  Given ...\\n  When ...\\n  Then ..."],
      "devImpact": "API cần xây: ..., DB changes: ..., Logic: ...",
      "qaImpact": "Test cases: ..., Edge cases: ..., Regression: ...",
      "priority": "high",
      "relatedUC": "UC01"
    }
  ],
  "dataModel": {
    "summary": "Mô tả tổng quan data model",
    "erDiagramCode": "erDiagram\\n  TABLE_A {\\n    uuid id PK\\n    string name\\n  }\\n  TABLE_B {\\n    uuid id PK\\n    uuid table_a_id FK\\n  }\\n  TABLE_A ||--o{ TABLE_B : \\"has\\"",
    "entities": [
      {
        "name": "EntityName",
        "tableName": "table_name",
        "description": "Bảng này lưu gì",
        "columns": [
          {"name":"id","type":"UUID","nullable":false,"default":"gen_random_uuid()","constraint":"PK","description":"Primary key"},
          {"name":"status","type":"ENUM('active','inactive')","nullable":false,"default":"'active'","constraint":"","description":"Trạng thái"}
        ],
        "indexes": ["idx_table_status (status)", "unique_table_field (field_name)"]
      }
    ]
  }
}

Chất lượng:
- userStories: 8-12 stories, mỗi story đủ 2+ AC scenarios (Given/When/Then), devImpact và qaImpact chi tiết
- entities: 4-6 entities, mỗi entity 5-10 columns với types SQL chuẩn
- erDiagramCode: valid Mermaid erDiagram với relationships rõ ràng`;

  return parseJSON<{
    userStories: UserStory[];
    dataModel: PRD["dataModel"];
  }>(await callClaude(prompt, SYS, 6000));
}

// ── Phase 3: Screen Specifications ─────────────────────────────────────────

async function generatePhase3(
  requirement: string,
  qaContext: string,
  ucIds: string[],
  brIds: string[]
) {
  const prompt = `Tạo Screen Specifications đầy đủ cho PRD:

=== YÊU CẦU ===
${requirement}

=== Q&A ===
${qaContext}

Use Case IDs: ${ucIds.join(", ")}
Business Rule IDs: ${brIds.join(", ")}

Trả về JSON:
{
  "screenSpecs": [
    {
      "screenId": "SCR-001",
      "screenName": "Tên màn hình",
      "description": "Mô tả ngắn",
      "purpose": "Mục đích màn hình trong luồng nghiệp vụ",
      "relatedUseCases": ["UC01"],
      "layout": "┌─────────────────────────────────┐\\n│ HEADER: Logo + Nav + User        │\\n├─────────────────────────────────┤\\n│ [Tiêu đề]           [+ Tạo mới] │\\n├─────────────────────────────────┤\\n│ 🔍 [Search]  [Lọc▼]  [Tìm]      │\\n├─────────────────────────────────┤\\n│ STT │ Tên │ Trạng thái │ Action │\\n│  1  │ ... │ ● Active   │[✏️][🗑️]│\\n└─────────────────────────────────┘",
      "fields": [
        {
          "name": "field_name",
          "label": "Label hiển thị",
          "type": "text",
          "required": true,
          "defaultValue": "",
          "description": "Trường này đại diện cho gì trong nghiệp vụ",
          "businessRuleRef": "BR-001",
          "feRules": {
            "validate": ["required", "maxLength:255", "pattern: chỉ alphanumeric"],
            "maxLength": 255,
            "dataType": "string",
            "placeholder": "Nhập...",
            "displayValues": "",
            "disabled": "khi mode = view",
            "errorMessages": {
              "required": "Vui lòng nhập [tên trường]",
              "maxLength": "[Tên trường] không được vượt quá 255 ký tự",
              "pattern": "[Tên trường] chỉ được chứa chữ cái và số"
            }
          },
          "beRules": {
            "apiEndpoint": "POST /api/v1/resource",
            "table": "table_name",
            "column": "column_name",
            "processing": "Lưu trực tiếp sau khi validate",
            "validation": ["not null", "maxLength 255", "unique"],
            "dataSource": "Nhập tay"
          }
        }
      ]
    }
  ]
}

Chất lượng:
- Tạo 4-6 màn hình chính trong hệ thống (list, form tạo, form sửa, detail, dashboard...)
- Mỗi màn hình: ASCII wireframe rõ ràng, 4-8 fields quan trọng
- Mỗi field: đủ feRules (validate, errorMessages) và beRules (table, column, processing)
- Select/dropdown field: displayValues phải ghi rõ "value: Label" pairs
- layout: sử dụng ký tự ASCII box-drawing rõ ràng`;

  return parseJSON<{ screenSpecs: ScreenSpec[] }>(await callClaude(prompt, SYS, 7000));
}

// ── Phase 4: Sequence Diagrams + API Specs ─────────────────────────────────

async function generatePhase4(
  requirement: string,
  qaContext: string,
  ucIds: string[],
  screenIds: string[]
) {
  const prompt = `Tạo Sequence Diagrams và API Specifications cho PRD:

=== YÊU CẦU ===
${requirement}

=== Q&A ===
${qaContext}

Use Case IDs: ${ucIds.join(", ")}
Screen IDs: ${screenIds.join(", ")}

Trả về JSON:
{
  "sequenceDiagrams": [
    {
      "title": "Tên luồng xử lý",
      "description": "Mô tả luồng này làm gì",
      "relatedUseCase": "UC01",
      "mermaidCode": "sequenceDiagram\\n    autonumber\\n    actor User as 👤 Người dùng\\n    participant FE as 🖥️ Frontend\\n    participant API as ⚙️ Backend API\\n    participant DB as 🗄️ Database\\n    User->>FE: Nhập form + Submit\\n    FE->>FE: Validate FE\\n    alt Validation FE thất bại\\n        FE-->>User: Hiển thị lỗi inline\\n    else Thành công\\n        FE->>API: POST /api/v1/resource\\n        API->>DB: INSERT INTO table\\n        DB-->>API: OK\\n        API-->>FE: 201 Created\\n        FE-->>User: Toast thành công + redirect\\n    end",
      "steps": [
        {
          "step": 1,
          "actor": "Người dùng",
          "action": "Nhập form",
          "description": "Nhập các trường [field1, field2] trên màn hình SCR-001",
          "validation": "",
          "businessRules": "BR-001",
          "feMessage": "",
          "apiCall": ""
        },
        {
          "step": 2,
          "actor": "Frontend",
          "action": "FE Validate",
          "description": "Kiểm tra required: field1, field2; format: field3 = email",
          "validation": "field1: required, max 255; field2: required; field3: email regex",
          "businessRules": "",
          "feMessage": "Lỗi inline dưới field: 'Vui lòng nhập [tên trường]'",
          "apiCall": ""
        },
        {
          "step": 3,
          "actor": "Frontend",
          "action": "Gọi API",
          "description": "Gửi request với payload {field1, field2, field3}",
          "validation": "",
          "businessRules": "",
          "feMessage": "Button disabled + spinner 'Đang xử lý...'",
          "apiCall": "POST /api/v1/resource"
        }
      ],
      "apiSpecs": [
        {
          "method": "POST",
          "endpoint": "/api/v1/resource",
          "description": "Tạo mới resource",
          "authentication": "Bearer JWT",
          "requestFields": [
            {"field":"field1","type":"string","required":true,"description":"Mô tả","validation":"maxLength:255, not null"}
          ],
          "responseSuccessStatus": 201,
          "responseSuccessExample": "{\\"success\\":true,\\"data\\":{\\"id\\":\\"uuid\\",\\"field1\\":\\"value\\"},\\"message\\":\\"Tạo thành công\\"}",
          "responseErrors": [
            {"code":"VAL-001","httpStatus":400,"message":"Dữ liệu không hợp lệ","description":"Field required bị thiếu"},
            {"code":"BUS-001","httpStatus":409,"message":"Dữ liệu đã tồn tại","description":"Vi phạm unique constraint"},
            {"code":"AUTH-001","httpStatus":401,"message":"Phiên đăng nhập hết hạn","description":"JWT expired"},
            {"code":"SYS-001","httpStatus":500,"message":"Lỗi hệ thống","description":"Unhandled exception"}
          ]
        }
      ]
    }
  ]
}

Chất lượng:
- 3-5 sequence diagrams cho các luồng CRUD chính và luồng nghiệp vụ quan trọng
- Mỗi diagram: mermaidCode valid Mermaid sequenceDiagram syntax, có alt block cho success/error
- steps: 6-10 bước, bao gồm FE validate, API call, DB operation, response + message
- apiSpecs: đủ requestFields với validation, responseSuccessExample JSON string, 4+ responseErrors`;

  return parseJSON<{ sequenceDiagrams: SequenceDiagram[] }>(await callClaude(prompt, SYS, 7000));
}

// ── Phase 5: Error Codes + NFR + Technical Notes ────────────────────────────

async function generatePhase5(requirement: string, qaContext: string) {
  const prompt = `Tạo Error Codes, NFR và Technical Notes cho PRD:

=== YÊU CẦU ===
${requirement}

=== Q&A ===
${qaContext}

Trả về JSON:
{
  "errorCodes": [
    {
      "code": "AUTH-001",
      "httpStatus": 401,
      "messageVI": "Phiên đăng nhập hết hạn",
      "messageEN": "Session expired",
      "category": "Auth",
      "description": "JWT access token hết hạn",
      "resolution": "Refresh token, nếu fail thì redirect /login"
    }
  ],
  "nfr": [
    {
      "id": "NFR-PERF-01",
      "category": "Performance",
      "description": "API response time (p95)",
      "target": "< 200ms",
      "measurement": "APM monitoring (Datadog)"
    }
  ],
  "technicalNotes": "Ghi chú kỹ thuật quan trọng cho dev team"
}

Chất lượng:
- errorCodes: Tối thiểu 20 mã lỗi, cover các category: Auth|Validation|Business|System|Integration
  Bao gồm đủ các mã: AUTH-001..005, VAL-001..005, BUS-001..005, SYS-001..004, INT-001..003
  Bổ sung thêm các mã lỗi nghiệp vụ cụ thể cho hệ thống này (prefix [MOD]-XXX)
- nfr: 15+ items, cover: Performance, Security, Availability, Scalability, Usability, Maintainability, Data
- technicalNotes: tech stack suggestions, API conventions, security checklist, open questions`;

  return parseJSON<{
    errorCodes: ErrorCode[];
    nfr: NFRItem[];
    technicalNotes: string;
  }>(await callClaude(prompt, SYS, 5000));
}

// ── Master orchestration ────────────────────────────────────────────────────

export async function generateFullPRD(
  requirement: string,
  questions: ElicitationQuestion[],
  answers: Record<string, string>,
  onPhase: (phase: GenerationPhase, label: string) => void
): Promise<PRD> {
  const qaContext = questions
    .filter((q) => answers[q.id]?.trim())
    .map((q) => `[${q.category}] ${q.question}\n→ ${answers[q.id].trim()}`)
    .join("\n\n") || "Không có thông tin bổ sung.";

  const today = new Date().toISOString().split("T")[0];

  onPhase("foundation", "Tạo Executive Summary, Use Cases, Business Rules...");
  const p1 = await generatePhase1(requirement, qaContext, today);

  const ucIds = p1.useCases.map((uc) => uc.id);
  const brIds = p1.businessRules.map((br) => br.id);

  onPhase("stories_data", "Tạo User Stories và Data Model...");
  const p2 = await generatePhase2(requirement, qaContext, ucIds, brIds);

  onPhase("screens", "Tạo Screen Specifications (field tables + FE/BE rules)...");
  const p3 = await generatePhase3(requirement, qaContext, ucIds, brIds);

  const screenIds = p3.screenSpecs.map((s) => s.screenId);

  onPhase("sequences", "Tạo Sequence Diagrams và API Specifications...");
  const p4 = await generatePhase4(requirement, qaContext, ucIds, screenIds);

  onPhase("errors_nfr", "Tạo bảng mã lỗi, NFR và ghi chú kỹ thuật...");
  const p5 = await generatePhase5(requirement, qaContext);

  onPhase("done", "Hoàn thành!");

  return {
    projectName: p1.projectName,
    version: "1.0.0",
    date: today,
    executiveSummary: p1.executiveSummary,
    stakeholders: p1.stakeholders,
    usecaseDiagram: p1.usecaseDiagram,
    permissionMatrix: p1.permissionMatrix,
    useCases: p1.useCases,
    businessRules: p1.businessRules,
    userStories: p2.userStories,
    dataModel: p2.dataModel,
    screenSpecs: p3.screenSpecs,
    sequenceDiagrams: p4.sequenceDiagrams,
    errorCodes: p5.errorCodes,
    nfr: p5.nfr,
    technicalNotes: p5.technicalNotes,
  };
}

// ── Mermaid Live helper ────────────────────────────────────────────────────

export function mermaidLiveUrl(code: string): string {
  const state = JSON.stringify({ code, mermaid: { theme: "default" }, updateEditor: true });
  return `https://mermaid.live/edit#base64:${btoa(unescape(encodeURIComponent(state)))}`;
}

// ── Markdown export ────────────────────────────────────────────────────────

export function prdToMarkdown(prd: PRD): string {
  const lines: string[] = [
    `# ${prd.projectName}`,
    "",
    `| Thuộc tính | Nội dung |`,
    `|-----------|---------|`,
    `| **Version** | ${prd.version} |`,
    `| **Ngày tạo** | ${prd.date} |`,
    `| **Trạng thái** | Draft |`,
    "",
    "---",
    "",
    "## 1. Executive Summary",
    "",
    prd.executiveSummary.overview,
    "",
    "### Mục tiêu",
    "| # | Mục tiêu | KPI | Priority |",
    "|---|----------|-----|----------|",
    ...prd.executiveSummary.objectives.map((o, i) => `| ${i + 1} | ${o.goal} | ${o.kpi} | ${o.priority} |`),
    "",
    "### Phạm vi",
    prd.executiveSummary.scope,
    "",
    "### Ngoài phạm vi",
    ...prd.executiveSummary.outOfScope.map((o) => `- ${o}`),
    "",
    "### Stakeholders",
    "| Vai trò | Trách nhiệm | Mức ảnh hưởng |",
    "|---------|-------------|---------------|",
    ...prd.stakeholders.map((s) => `| ${s.role} | ${s.responsibility} | ${s.influence} |`),
    "",
    "---",
    "",
    "## 2. Use Case Diagram",
    "",
    prd.usecaseDiagram.description,
    "",
    "```mermaid",
    prd.usecaseDiagram.mermaidCode,
    "```",
    "",
    "---",
    "",
    "## 3. Ma trận phân quyền",
    "",
    `| Use Case | ${prd.permissionMatrix.actors.join(" | ")} |`,
    `|----------|${prd.permissionMatrix.actors.map(() => "---").join("|")}|`,
    ...prd.permissionMatrix.rows.map(
      (r) => `| ${r.usecaseId}: ${r.usecaseName} | ${prd.permissionMatrix.actors.map((a) => r.access[a] ?? "—").join(" | ")} |`
    ),
    "",
    "---",
    "",
    "## 4. Đặc tả Use Cases (BABOK)",
    "",
    ...prd.useCases.flatMap((uc) => [
      `### ${uc.id}: ${uc.name}`,
      "",
      "| Thuộc tính | Nội dung |",
      "|-----------|---------|",
      `| **Mục đích** | ${uc.purpose} |`,
      `| **Actor chính** | ${uc.primaryActor} |`,
      `| **Actor phụ** | ${uc.secondaryActors || "—"} |`,
      `| **Trigger** | ${uc.trigger} |`,
      `| **Precondition** | ${uc.preconditions.join("; ")} |`,
      `| **Postcondition (thành công)** | ${uc.postconditionsSuccess.join("; ")} |`,
      `| **Postcondition (thất bại)** | ${uc.postconditionsFailure.join("; ")} |`,
      `| **Business Rules** | ${uc.businessRules.join(", ")} |`,
      `| **NFR** | ${uc.nfrRefs.join(", ")} |`,
      "",
      "**Main Flow:**",
      "| Bước | Actor | Hành động |",
      "|------|-------|-----------|",
      ...uc.mainFlow.map((s) => `| ${s.step} | ${s.actor} | ${s.action} |`),
      "",
      ...(uc.alternativeFlows.length
        ? [
          "**Alternative Flows:**",
          "| ID | Điều kiện | Xử lý | Tiếp tục từ |",
          "|----|-----------|-------|-------------|",
          ...uc.alternativeFlows.map((f) => `| ${f.id} | ${f.triggerCondition} | ${f.steps.join("; ")} | ${f.resumeAt} |`),
          "",
        ]
        : []),
      ...(uc.exceptionFlows.length
        ? [
          "**Exception Flows:**",
          "| ID | Điều kiện | Xử lý |",
          "|----|-----------|-------|",
          ...uc.exceptionFlows.map((f) => `| ${f.id} | ${f.triggerCondition} | ${f.steps.join("; ")} |`),
          "",
        ]
        : []),
    ]),
    "---",
    "",
    "## 5. Business Rules",
    "",
    "| BR ID | Tên | Category | Điều kiện IF-THEN | Use Cases |",
    "|-------|-----|----------|-------------------|-----------|",
    ...prd.businessRules.map((br) => `| **${br.id}** | ${br.name} | ${br.category} | ${br.condition} | ${br.references.join(", ")} |`),
    "",
    "---",
    "",
    "## 6. User Stories",
    "",
    ...prd.userStories.flatMap((us) => [
      `### ${us.id}: ${us.title}`,
      "",
      `| Thuộc tính | Nội dung |`,
      `|-----------|---------|`,
      `| **Actor** | ${us.actor} |`,
      `| **Priority** | \`${us.priority.toUpperCase()}\` |`,
      `| **Related UC** | ${us.relatedUC ?? "—"} |`,
      "",
      `> ${us.description}`,
      "",
      "**Acceptance Criteria:**",
      "```gherkin",
      ...us.acceptanceCriteria,
      "```",
      "",
      `**Dev Impact:** ${us.devImpact}`,
      "",
      `**QA Impact:** ${us.qaImpact}`,
      "",
    ]),
    "---",
    "",
    "## 7. Data Model",
    "",
    prd.dataModel.summary,
    "",
    "```mermaid",
    prd.dataModel.erDiagramCode,
    "```",
    "",
    ...prd.dataModel.entities.flatMap((e) => [
      `### Bảng: \`${e.tableName}\``,
      "",
      e.description,
      "",
      "| Column | Type | Null | Default | Constraint | Mô tả |",
      "|--------|------|:----:|---------|------------|-------|",
      ...e.columns.map((c) => `| \`${c.name}\` | \`${c.type}\` | ${c.nullable ? "NULL" : "NOT NULL"} | ${c.default || "—"} | ${c.constraint || "—"} | ${c.description} |`),
      ...(e.indexes.length ? ["", "**Indexes:**", ...e.indexes.map((idx) => `- \`${idx}\``)] : []),
      "",
    ]),
    "---",
    "",
    "## 8. Đặc tả màn hình",
    "",
    ...prd.screenSpecs.flatMap((scr) => [
      `### ${scr.screenId}: ${scr.screenName}`,
      "",
      `**Mục đích:** ${scr.purpose}`,
      `**Use Cases:** ${scr.relatedUseCases.join(", ")}`,
      "",
      "**Wireframe:**",
      "```",
      scr.layout,
      "```",
      "",
      "**Bảng trường/field:**",
      "| Field name | Label | Type | Required | Default | Mô tả |",
      "|-----------|-------|------|:--------:|---------|-------|",
      ...scr.fields.map((f) => `| \`${f.name}\` | ${f.label} | ${f.type} | ${f.required ? "✓" : "—"} | ${f.defaultValue || "—"} | ${f.description} |`),
      "",
      ...scr.fields.flatMap((f) => [
        `#### \`${f.name}\` — ${f.label}`,
        "",
        "| Thuộc tính | Nội dung |",
        "|-----------|---------|",
        `| **Ý nghĩa nghiệp vụ** | ${f.description} |`,
        `| **Business Rule** | ${f.businessRuleRef || "—"} |`,
        `| **Validate FE** | ${f.feRules.validate.join("<br>• ")} |`,
        `| **Placeholder** | ${f.feRules.placeholder || "—"} |`,
        `| **FE Rules** | type: ${f.feRules.dataType}${f.feRules.maxLength ? `, maxLength: ${f.feRules.maxLength}` : ""}${f.feRules.displayValues ? `<br>Values: ${f.feRules.displayValues}` : ""}${f.feRules.disabled ? `<br>Disabled khi: ${f.feRules.disabled}` : ""} |`,
        `| **Error Messages FE** | ${Object.entries(f.feRules.errorMessages).map(([k, v]) => `${k}: "${v}"`).join("<br>") || "—"} |`,
        `| **BE Validate** | ${f.beRules.validation.join(", ") || "—"} |`,
        `| **Nguồn dữ liệu** | ${f.beRules.dataSource} |`,
        `| **Lưu trữ** | Bảng \`${f.beRules.table}\`, cột \`${f.beRules.column}\` |`,
        `| **API** | ${f.beRules.apiEndpoint} |`,
        `| **Xử lý BE** | ${f.beRules.processing} |`,
        "",
      ]),
    ]),
    "---",
    "",
    "## 9. Sequence Diagrams & API Specifications",
    "",
    ...prd.sequenceDiagrams.flatMap((sd) => [
      `### ${sd.title}`,
      "",
      `**Use Case:** ${sd.relatedUseCase}  |  ${sd.description}`,
      "",
      "```mermaid",
      sd.mermaidCode,
      "```",
      "",
      "**Bảng mô tả chi tiết:**",
      "| Bước | Actor | Hành động | Mô tả | Validate/Check | Business Rules | FE Message |",
      "|------|-------|-----------|-------|----------------|----------------|------------|",
      ...sd.steps.map((s) =>
        `| ${s.step} | ${s.actor} | ${s.action} | ${s.description} | ${s.validation || "—"} | ${s.businessRules || "—"} | ${s.feMessage || "—"} |`
      ),
      "",
      ...sd.apiSpecs.flatMap((api) => [
        `**API: \`${api.method} ${api.endpoint}\`**`,
        "",
        `${api.description}  |  Auth: ${api.authentication}`,
        "",
        "Request Body:",
        "| Field | Type | Required | Mô tả | Validate |",
        "|-------|------|:--------:|-------|---------|",
        ...api.requestFields.map((f) => `| \`${f.field}\` | ${f.type} | ${f.required ? "✓" : "—"} | ${f.description} | ${f.validation || "—"} |`),
        "",
        `Response thành công (\`${api.responseSuccessStatus}\`):`,
        "```json",
        api.responseSuccessExample,
        "```",
        "",
        "Response lỗi:",
        "| HTTP Status | Error Code | Message | Mô tả |",
        "|:-----------:|------------|---------|-------|",
        ...api.responseErrors.map((e) => `| ${e.httpStatus} | \`${e.code}\` | ${e.message} | ${e.description} |`),
        "",
      ]),
    ]),
    "---",
    "",
    "## 10. Bảng mã lỗi hệ thống",
    "",
    "| Error Code | HTTP | Message (VI) | Message (EN) | Category | Mô tả | Xử lý |",
    "|------------|:----:|--------------|--------------|----------|-------|-------|",
    ...prd.errorCodes.map(
      (e) => `| \`${e.code}\` | ${e.httpStatus} | ${e.messageVI} | ${e.messageEN} | ${e.category} | ${e.description} | ${e.resolution} |`
    ),
    "",
    "---",
    "",
    "## 11. Yêu cầu phi chức năng (NFR)",
    "",
    "| NFR ID | Category | Mô tả | Target | Measurement |",
    "|--------|----------|-------|--------|-------------|",
    ...prd.nfr.map((n) => `| **${n.id}** | ${n.category} | ${n.description} | ${n.target} | ${n.measurement} |`),
    "",
    "---",
    "",
    "## 12. Ghi chú kỹ thuật",
    "",
    prd.technicalNotes,
  ];

  return lines.join("\n");
}
