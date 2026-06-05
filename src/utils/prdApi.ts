import { getApiKey } from "./visionParser";

export interface ElicitationQuestion {
  id: string;
  category: string;
  question: string;
  hint?: string;
  required?: boolean;
}

export interface UseCase {
  id: string;
  name: string;
  actor: string;
  description: string;
  preconditions: string[];
  mainFlow: string[];
  alternativeFlows: string[];
}

export interface UserStory {
  id: string;
  title: string;
  actor: string;
  description: string;
  acceptanceCriteria: string[];
  devImpact: string;
  qaImpact: string;
  priority: "high" | "medium" | "low";
}

export interface DataAttribute {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface DataRelationship {
  entity: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  description: string;
}

export interface DataEntity {
  name: string;
  description: string;
  attributes: DataAttribute[];
  relationships: DataRelationship[];
}

export interface SequenceDiagram {
  title: string;
  description: string;
  mermaidCode: string;
}

export interface ScreenLayout {
  screenName: string;
  description: string;
  layout: string;
  components: string[];
}

export interface NFRCategory {
  category: string;
  requirements: string[];
}

export interface PRD {
  projectName: string;
  version: string;
  date: string;
  executiveSummary: {
    overview: string;
    objectives: string[];
    scope: string;
    outOfScope: string[];
  };
  stakeholders: { role: string; responsibility: string }[];
  useCases: UseCase[];
  userStories: UserStory[];
  dataModel: {
    summary: string;
    entities: DataEntity[];
  };
  sequenceDiagrams: SequenceDiagram[];
  screenLayouts: ScreenLayout[];
  nonFunctionalRequirements: NFRCategory[];
  technicalNotes: string;
}

async function callClaude(prompt: string, systemPrompt: string, maxTokens = 4096): Promise<string> {
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

export async function generateElicitationQuestions(requirement: string): Promise<ElicitationQuestion[]> {
  const systemPrompt = `Bạn là Business Analyst senior theo chuẩn ITBA. Chỉ trả về JSON array thuần túy, không có bất kỳ text, comment hay markdown nào khác.`;

  const prompt = `Phân tích yêu cầu nghiệp vụ và tạo câu hỏi elicitation để làm rõ yêu cầu:

"${requirement}"

Trả về JSON array:
[{"id":"Q1","category":"Business Context","question":"...","hint":"ví dụ cụ thể...","required":true}]

Categories cần cover: Business Context, Users & Actors, Functional Requirements, Non-Functional Requirements, Data & Integration, Process Flow, Constraints & Timeline.
Tạo 14-18 câu hỏi thực tế, phù hợp với yêu cầu trên. Hint phải là ví dụ cụ thể, không chung chung.`;

  const raw = await callClaude(prompt, systemPrompt, 2048);
  const jsonText = raw.replace(/```(?:json)?/g, "").trim();
  return JSON.parse(jsonText);
}

export async function generatePRD(
  requirement: string,
  questions: ElicitationQuestion[],
  answers: Record<string, string>
): Promise<PRD> {
  const systemPrompt = `Bạn là Senior Business Analyst/Product Manager theo chuẩn ITBA. Tạo PRD chuyên nghiệp, đầy đủ. Chỉ trả về JSON thuần túy, không markdown, không giải thích.`;

  const qaContext = questions
    .filter((q) => answers[q.id]?.trim())
    .map((q) => `[${q.category}] ${q.question}\n→ ${answers[q.id].trim()}`)
    .join("\n\n");

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Tạo PRD đầy đủ từ thông tin sau:

=== YÊU CẦU NGHIỆP VỤ ===
${requirement}

=== THÔNG TIN BỔ SUNG TỪ ELICITATION ===
${qaContext || "Không có thông tin bổ sung."}

Trả về JSON với cấu trúc chính xác sau (không markdown):
{
  "projectName": "Tên dự án rõ ràng",
  "version": "1.0.0",
  "date": "${today}",
  "executiveSummary": {
    "overview": "Mô tả tổng quan dự án (3-5 câu, rõ ràng)",
    "objectives": ["Mục tiêu SMART 1", "Mục tiêu SMART 2"],
    "scope": "Phạm vi dự án chi tiết",
    "outOfScope": ["Điều không nằm trong phạm vi 1"]
  },
  "stakeholders": [
    {"role": "Product Owner", "responsibility": "Trách nhiệm cụ thể"}
  ],
  "useCases": [
    {
      "id": "UC01",
      "name": "Tên use case",
      "actor": "Actor chính",
      "description": "Mô tả ngắn",
      "preconditions": ["Điều kiện tiên quyết"],
      "mainFlow": ["1. Người dùng...", "2. Hệ thống..."],
      "alternativeFlows": ["Alt 1a: Nếu... thì..."]
    }
  ],
  "userStories": [
    {
      "id": "US01",
      "title": "Tên story ngắn gọn",
      "actor": "Vai trò người dùng",
      "description": "As a [actor], I want to [action] so that [benefit]",
      "acceptanceCriteria": [
        "Given [context] When [action] Then [expected result]"
      ],
      "devImpact": "Cần xây dựng: API endpoints, DB schema, business logic cụ thể",
      "qaImpact": "Test cases cần cover: happy path, edge cases, validation rules cụ thể",
      "priority": "high"
    }
  ],
  "dataModel": {
    "summary": "Mô tả tổng quan data model và các quan hệ chính",
    "entities": [
      {
        "name": "EntityName",
        "description": "Mô tả entity",
        "attributes": [
          {"name": "id", "type": "uuid", "description": "Primary key", "required": true},
          {"name": "created_at", "type": "datetime", "description": "Thời điểm tạo", "required": true}
        ],
        "relationships": [
          {"entity": "OtherEntity", "type": "one-to-many", "description": "Mô tả quan hệ"}
        ]
      }
    ]
  },
  "sequenceDiagrams": [
    {
      "title": "Tên flow",
      "description": "Mô tả flow này làm gì",
      "mermaidCode": "sequenceDiagram\\n    participant User as Người dùng\\n    participant API as Backend API\\n    User->>API: POST /resource\\n    API-->>User: 201 Created"
    }
  ],
  "screenLayouts": [
    {
      "screenName": "Tên màn hình",
      "description": "Mô tả màn hình và mục đích sử dụng",
      "layout": "┌─────────────────────────────┐\\n│ HEADER: Logo + Nav          │\\n├─────────────────────────────┤\\n│ SEARCH BAR                  │\\n├─────────────────────────────┤\\n│ LIST ITEM 1 [Title][Action] │\\n│ LIST ITEM 2 [Title][Action] │\\n└─────────────────────────────┘",
      "components": ["Header: logo + navigation + user avatar", "SearchBar: full-text search với filter"]
    }
  ],
  "nonFunctionalRequirements": [
    {"category": "Performance", "requirements": ["API response < 200ms p95", "Support 1000 concurrent users"]},
    {"category": "Security", "requirements": ["JWT authentication", "HTTPS only"]},
    {"category": "Scalability", "requirements": ["Horizontal scaling support"]},
    {"category": "Usability", "requirements": ["Mobile-first responsive design"]},
    {"category": "Maintainability", "requirements": ["Unit test coverage > 80%"]}
  ],
  "technicalNotes": "Ghi chú kỹ thuật quan trọng cho dev team: stack suggestions, integration notes, gotchas"
}

Chất lượng bắt buộc:
- useCases: 5-7 use cases đầy đủ
- userStories: 8-12 stories, mỗi story PHẢI có devImpact và qaImpact chi tiết
- dataModel.entities: 4-6 entities với đủ attributes thực tế
- sequenceDiagrams: 3-4 diagrams (mermaidCode phải valid Mermaid sequenceDiagram syntax)
- screenLayouts: 5-6 màn hình chính với ASCII layout rõ ràng
- NFR: đủ 5 categories trên`;

  const raw = await callClaude(prompt, systemPrompt, 8192);
  const jsonText = raw.replace(/```(?:json)?/g, "").trim();
  return JSON.parse(jsonText);
}

export function mermaidLiveUrl(code: string): string {
  const state = JSON.stringify({ code, mermaid: { theme: "default" }, updateEditor: true });
  const encoded = btoa(unescape(encodeURIComponent(state)));
  return `https://mermaid.live/edit#base64:${encoded}`;
}

export function prdToMarkdown(prd: PRD): string {
  const lines: string[] = [
    `# ${prd.projectName}`,
    "",
    `**Version:** ${prd.version}  |  **Date:** ${prd.date}`,
    "",
    "---",
    "",
    "## 1. Executive Summary",
    "",
    prd.executiveSummary.overview,
    "",
    "### Objectives",
    ...prd.executiveSummary.objectives.map((o) => `- ${o}`),
    "",
    "### Scope",
    prd.executiveSummary.scope,
    "",
    "### Out of Scope",
    ...prd.executiveSummary.outOfScope.map((o) => `- ${o}`),
    "",
    "---",
    "",
    "## 2. Stakeholders",
    "",
    "| Role | Responsibility |",
    "|------|----------------|",
    ...prd.stakeholders.map((s) => `| ${s.role} | ${s.responsibility} |`),
    "",
    "---",
    "",
    "## 3. Use Cases",
    "",
    ...prd.useCases.flatMap((uc) => [
      `### ${uc.id}: ${uc.name}`,
      "",
      `**Actor:** ${uc.actor}`,
      "",
      uc.description,
      "",
      "**Preconditions:**",
      ...uc.preconditions.map((p) => `- ${p}`),
      "",
      "**Main Flow:**",
      ...uc.mainFlow.map((f) => `- ${f}`),
      ...(uc.alternativeFlows?.length
        ? ["", "**Alternative Flows:**", ...uc.alternativeFlows.map((f) => `- ${f}`)]
        : []),
      "",
    ]),
    "---",
    "",
    "## 4. User Stories",
    "",
    ...prd.userStories.flatMap((us) => [
      `### ${us.id}: ${us.title}`,
      "",
      `**Actor:** ${us.actor}  |  **Priority:** \`${us.priority.toUpperCase()}\``,
      "",
      `> ${us.description}`,
      "",
      "**Acceptance Criteria:**",
      ...us.acceptanceCriteria.map((ac) => `- ${ac}`),
      "",
      `**Dev Impact:** ${us.devImpact}`,
      "",
      `**QA Impact:** ${us.qaImpact}`,
      "",
    ]),
    "---",
    "",
    "## 5. Data Model",
    "",
    prd.dataModel.summary,
    "",
    ...prd.dataModel.entities.flatMap((e) => [
      `### Entity: ${e.name}`,
      "",
      e.description,
      "",
      "| Field | Type | Description | Required |",
      "|-------|------|-------------|:--------:|",
      ...e.attributes.map((a) => `| \`${a.name}\` | \`${a.type}\` | ${a.description} | ${a.required ? "✓" : ""} |`),
      ...(e.relationships?.length
        ? ["", "**Relationships:**", ...e.relationships.map((r) => `- → \`${r.entity}\` (${r.type}): ${r.description}`)]
        : []),
      "",
    ]),
    "---",
    "",
    "## 6. Sequence Diagrams",
    "",
    ...prd.sequenceDiagrams.flatMap((sd) => [
      `### ${sd.title}`,
      "",
      sd.description,
      "",
      "```mermaid",
      sd.mermaidCode,
      "```",
      "",
    ]),
    "---",
    "",
    "## 7. Screen Layouts",
    "",
    ...prd.screenLayouts.flatMap((sl) => [
      `### ${sl.screenName}`,
      "",
      sl.description,
      "",
      "```",
      sl.layout,
      "```",
      "",
      "**Components:**",
      ...sl.components.map((c) => `- ${c}`),
      "",
    ]),
    "---",
    "",
    "## 8. Non-Functional Requirements",
    "",
    ...prd.nonFunctionalRequirements.flatMap((nfr) => [
      `### ${nfr.category}`,
      "",
      ...nfr.requirements.map((r) => `- ${r}`),
      "",
    ]),
    "---",
    "",
    "## 9. Technical Notes",
    "",
    prd.technicalNotes,
  ];

  return lines.join("\n");
}
