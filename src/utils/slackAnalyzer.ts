import { getApiKey } from "./visionParser";

export interface UseCase {
  id: string;
  name: string;
  actor: string;
  precondition: string;
  mainFlow: string[];
  alternativeFlow?: string[];
  postcondition: string;
}

export interface UserStory {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  acceptanceCriteria: string[];
  priority: "must" | "should" | "could";
  storyPoints?: number;
}

export interface SlackAnalysisResult {
  summary: string;
  projectContext: string;
  useCases: UseCase[];
  userStories: UserStory[];
}

async function callClaude(
  prompt: string,
  systemPrompt: string,
  maxTokens = 4096
): Promise<string> {
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
      model: "claude-haiku-4-5-20251001",
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

export async function summarizeConversations(formattedText: string): Promise<string> {
  const system = `Bạn là chuyên gia phân tích yêu cầu phần mềm. Nhiệm vụ: tóm tắt hội thoại Slack thành tài liệu yêu cầu có cấu trúc. Trả lời bằng tiếng Việt, dùng định dạng Markdown.`;

  const prompt = `Tóm tắt các hội thoại Slack sau thành nội dung phân tích yêu cầu có cấu trúc:

## Hội thoại:
${formattedText}

## Yêu cầu đầu ra (Markdown):
### 1. Bối cảnh dự án
Mô tả ngắn gọn dự án/hệ thống đang thảo luận.

### 2. Vấn đề & Nhu cầu
Liệt kê các vấn đề cụ thể được đề cập.

### 3. Tính năng được yêu cầu
Danh sách các tính năng, chức năng cần xây dựng.

### 4. Quyết định đã thống nhất
Các quyết định kỹ thuật hoặc nghiệp vụ đã được đồng ý.

### 5. Điểm cần làm rõ
Những vấn đề còn mơ hồ, chưa có quyết định rõ ràng.`;

  return callClaude(prompt, system, 2048);
}

export async function generateUseCasesAndStories(
  summary: string
): Promise<SlackAnalysisResult> {
  const system = `Bạn là chuyên gia phân tích hệ thống theo chuẩn Agile/UML. Chỉ trả về JSON thuần túy, không có markdown code fence, không giải thích.`;

  const prompt = `Dựa trên nội dung phân tích dưới đây, tạo Use Cases và User Stories chuẩn Agile.

## Nội dung phân tích:
${summary}

Trả về JSON với cấu trúc chính xác (chỉ JSON, không có \`\`\`):
{
  "summary": "tóm tắt 1-2 câu về dự án",
  "projectContext": "bối cảnh và mục tiêu chính",
  "useCases": [
    {
      "id": "UC-001",
      "name": "Tên use case",
      "actor": "Người dùng hoặc hệ thống",
      "precondition": "Điều kiện tiên quyết",
      "mainFlow": ["1. Bước 1", "2. Bước 2", "3. Bước 3"],
      "alternativeFlow": ["1a. Trường hợp ngoại lệ"],
      "postcondition": "Kết quả đạt được"
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "role": "tên vai trò",
      "goal": "mục tiêu cụ thể",
      "benefit": "lợi ích mang lại",
      "acceptanceCriteria": [
        "GIVEN [bối cảnh] WHEN [hành động] THEN [kết quả]",
        "Tiêu chí 2",
        "Tiêu chí 3"
      ],
      "priority": "must",
      "storyPoints": 3
    }
  ]
}

Quy tắc:
- Ít nhất 3 use cases và 5 user stories
- priority: "must" | "should" | "could"
- storyPoints: 1, 2, 3, 5, 8, 13
- Tất cả nội dung bằng tiếng Việt`;

  const text = await callClaude(prompt, system, 4096);

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

  try {
    return JSON.parse(cleaned) as SlackAnalysisResult;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as SlackAnalysisResult;
    throw new Error("Không thể phân tích kết quả từ AI. Vui lòng thử lại.");
  }
}
