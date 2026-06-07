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

export async function summarizeSlackConversation(conversation: string): Promise<string> {
  const system = `Bạn là chuyên gia phân tích yêu cầu phần mềm. Tóm tắt hội thoại Slack thành nội dung có cấu trúc rõ ràng, tập trung vào yêu cầu kỹ thuật và nghiệp vụ. Trả lời bằng tiếng Việt.`;

  const prompt = `Tóm tắt đoạn hội thoại Slack sau thành nội dung có cấu trúc:

## Đoạn hội thoại:
${conversation}

## Yêu cầu đầu ra (dùng định dạng Markdown):
1. **Bối cảnh dự án** - Mô tả ngắn gọn về dự án/hệ thống đang thảo luận
2. **Vấn đề / Nhu cầu** - Liệt kê các vấn đề và nhu cầu được đề cập
3. **Tính năng được yêu cầu** - Các tính năng, chức năng cụ thể
4. **Quyết định quan trọng** - Các quyết định kỹ thuật/nghiệp vụ đã thống nhất
5. **Điểm cần làm rõ** - Những gì còn mơ hồ hoặc cần thảo luận thêm`;

  return callClaude(prompt, system, 2048);
}

export async function generateUseCasesAndStories(summary: string): Promise<SlackAnalysisResult> {
  const system = `Bạn là chuyên gia phân tích và thiết kế hệ thống phần mềm theo chuẩn Agile/UML. Chỉ trả về JSON thuần túy, không có markdown code fence, không có giải thích thêm.`;

  const prompt = `Dựa trên nội dung tóm tắt dưới đây, tạo Use Cases và User Stories đầy đủ cho dự án.

## Nội dung tóm tắt:
${summary}

Trả về JSON với cấu trúc chính xác sau (chỉ JSON, không \`\`\`json):
{
  "summary": "tóm tắt 1-2 câu về dự án",
  "projectContext": "bối cảnh và mục tiêu chính của dự án",
  "useCases": [
    {
      "id": "UC-001",
      "name": "Tên use case ngắn gọn",
      "actor": "Người dùng hoặc hệ thống thực hiện",
      "precondition": "Điều kiện cần có trước khi thực hiện",
      "mainFlow": [
        "1. Bước đầu tiên",
        "2. Bước tiếp theo",
        "3. Hệ thống phản hồi"
      ],
      "alternativeFlow": [
        "1a. Trường hợp ngoại lệ: ..."
      ],
      "postcondition": "Kết quả đạt được sau khi hoàn thành"
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "role": "tên vai trò người dùng",
      "goal": "mục tiêu cụ thể muốn đạt được",
      "benefit": "lợi ích mang lại cho người dùng hoặc doanh nghiệp",
      "acceptanceCriteria": [
        "GIVEN ... WHEN ... THEN ...",
        "Tiêu chí xác nhận cụ thể 2",
        "Tiêu chí xác nhận cụ thể 3"
      ],
      "priority": "must",
      "storyPoints": 3
    }
  ]
}

Quy tắc:
- Tạo ít nhất 3 use cases và 5 user stories
- priority: "must" (bắt buộc), "should" (nên có), "could" (có thể có)
- storyPoints: 1, 2, 3, 5, 8, 13 theo Fibonacci
- Mọi nội dung bằng tiếng Việt`;

  const text = await callClaude(prompt, system, 4096);
  const jsonText = text.replace(/```(?:json)?[\s\S]*?```/g, (m) => m.replace(/```(?:json)?/g, "").trim()).trim();

  try {
    return JSON.parse(jsonText) as SlackAnalysisResult;
  } catch {
    // Try to extract JSON object from response
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as SlackAnalysisResult;
    }
    throw new Error("Không thể phân tích kết quả từ AI. Vui lòng thử lại.");
  }
}
