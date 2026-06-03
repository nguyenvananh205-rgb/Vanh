import type { ParsedFood } from "./voiceParser";

const API_KEY_STORAGE = "anthropic_api_key";

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? "";
}

export function saveApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

// Convert File/Blob to base64 string
function toBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/...;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const VISION_PROMPT = `Bạn là trợ lý phân tích thực phẩm. Nhìn vào ảnh này và trích xuất thông tin thực phẩm.

Trả về JSON với cấu trúc sau (chỉ JSON thuần, không markdown, không giải thích):
{
  "name": "tên thực phẩm bằng tiếng Việt",
  "quantity": số (chỉ số, ví dụ 500),
  "unit": "đơn vị (gram/kg/ml/lít/hộp/cái/bó/quả/túi/lon/chai/miếng)",
  "category": "thit_ca|rau_cu|do_nau_chin|sua_trung|do_uong|gia_vi|trang_miem|khac",
  "expiryDate": "YYYY-MM-DD hoặc null nếu không thấy hạn sử dụng",
  "notes": "ghi chú ngắn nếu có (ví dụ: đã mở gói) hoặc null"
}

Quy tắc:
- Nếu ảnh chụp nhãn sản phẩm: đọc tên, trọng lượng, hạn dùng từ nhãn
- Nếu ảnh chụp thực phẩm tươi sống: ước lượng tên và số lượng
- Hạn dùng thực phẩm tươi nếu không ghi: rau củ 3-5 ngày, thịt cá 2-3 ngày, đồ nấu chín 2-3 ngày
- Chỉ trả về JSON, không có text thêm`;

export async function analyzeImage(file: File | Blob): Promise<ParsedFood> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const base64 = await toBase64(file);
  const mediaType = (file as File).type || "image/jpeg";

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
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? "";

  // Strip markdown code fences if present
  const jsonText = content.replace(/```(?:json)?/g, "").trim();

  const parsed = JSON.parse(jsonText);
  const result: ParsedFood = {};

  if (parsed.name) result.name = parsed.name;
  if (typeof parsed.quantity === "number") result.quantity = parsed.quantity;
  if (parsed.unit) result.unit = parsed.unit;
  if (parsed.category) result.category = parsed.category;
  if (parsed.expiryDate && parsed.expiryDate !== "null") result.expiryDate = parsed.expiryDate;

  return result;
}
