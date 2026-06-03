import { addDays, format } from "date-fns";
import type { FoodCategory } from "../types";

export interface ParsedFood {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: FoodCategory;
  expiryDate?: string;
}

// Map spoken unit words → canonical unit
const UNIT_MAP: Record<string, string> = {
  gram: "gram", gam: "gram", g: "gram",
  kg: "kg", kilogram: "kg",
  ml: "ml",
  lít: "lít", lit: "lít",
  hộp: "hộp", hop: "hộp",
  cái: "cái", cai: "cái",
  bó: "bó", bo: "bó",
  quả: "quả", qua: "quả", trái: "quả",
  túi: "túi", tui: "túi",
  lon: "lon",
  chai: "chai",
  ổ: "ổ",
  miếng: "miếng", mieng: "miếng",
  con: "con",
  phần: "phần",
};

const CATEGORY_RULES: [FoodCategory, string[]][] = [
  ["thit_ca",   ["thịt", "cá", "tôm", "mực", "bò", "gà", "heo", "lợn", "vịt", "sườn", "chân giò", "xương"]],
  ["rau_cu",    ["rau", "củ", "cải", "bắp cải", "cà chua", "cà rốt", "dưa chuột", "bí", "khổ qua", "đậu đũa", "cần tây", "hành", "tỏi", "ớt", "gừng", "sả"]],
  ["do_nau_chin",["cơm", "canh", "xào", "kho", "chiên", "luộc", "hầm", "soup", "phở", "bún", "đồ nấu"]],
  ["sua_trung", ["sữa", "trứng", "phô mai", "bơ", "kem tươi", "yaourt", "yogurt"]],
  ["do_uong",   ["nước", "juice", "sinh tố", "trà", "cà phê", "bia", "nước ngọt", "nước ép"]],
  ["gia_vi",    ["muối", "đường", "mắm", "tương", "dầu ăn", "giấm", "tiêu", "gia vị"]],
  ["trang_miem",["bánh", "chè", "kem", "flan", "pudding", "hoa quả", "trái cây", "xoài", "chuối", "dâu", "dưa hấu"]],
];

// Vietnamese number words → digits (for speech output)
const VN_NUMBERS: Record<string, number> = {
  một: 1, hai: 2, ba: 3, bốn: 4, năm: 5,
  sáu: 6, bảy: 7, tám: 8, chín: 9, mười: 10,
  mươi: 10, "mười một": 11, "mười hai": 12,
  "hai mươi": 20, "ba mươi": 30,
};

const VN_MONTHS: Record<string, number> = {
  một: 1, hai: 2, ba: 3, tư: 4, bốn: 4, năm: 5,
  sáu: 6, bảy: 7, tám: 8, chín: 9, mười: 10,
  "mười một": 11, "mười hai": 12,
};

function toNumber(s: string): number | undefined {
  const n = parseFloat(s);
  if (!isNaN(n)) return n;
  return VN_NUMBERS[s.toLowerCase()];
}

function parseExpiryDate(text: string): string | undefined {
  const today = new Date();
  const yr = today.getFullYear();
  const mo = today.getMonth(); // 0-indexed

  // "hết hạn X ngày nữa" or "còn X ngày"
  const daysLater = text.match(/(?:hết hạn|còn)\s+(\d+)\s+ngày/);
  if (daysLater) {
    const d = parseInt(daysLater[1]);
    return format(addDays(today, d), "yyyy-MM-dd");
  }

  // "hết hạn ngày DD tháng MM" or "hết hạn DD/MM"
  const fullDate =
    text.match(/hết hạn(?:\s+ngày)?\s+(\d+|[a-záàảãạăắằẩẫặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)\s+tháng\s+(\d+|[a-záàảãạăắằẩẫặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)/i) ||
    text.match(/hết hạn\s+(\d+)\/(\d+)/);

  if (fullDate) {
    const day = toNumber(fullDate[1]);
    const month = toNumber(fullDate[2]) ?? VN_MONTHS[fullDate[2]?.toLowerCase()];
    if (day && month) {
      const d = new Date(yr, month - 1, day);
      if (d < today) d.setFullYear(yr + 1);
      return format(d, "yyyy-MM-dd");
    }
  }

  // "hết hạn ngày DD" (assume current month or next)
  const dayOnly = text.match(/hết hạn\s+ngày\s+(\d+)(?!\s+tháng)/);
  if (dayOnly) {
    const day = parseInt(dayOnly[1]);
    let d = new Date(yr, mo, day);
    if (d < today) d = new Date(yr, mo + 1, day);
    return format(d, "yyyy-MM-dd");
  }

  // "hết hạn tuần sau" → +7 days
  if (/tuần sau/.test(text)) return format(addDays(today, 7), "yyyy-MM-dd");
  // "hết hạn tháng sau" → +30 days
  if (/tháng sau/.test(text)) return format(addDays(today, 30), "yyyy-MM-dd");

  return undefined;
}

export function parseVoiceInput(raw: string): ParsedFood {
  const text = raw.toLowerCase().trim();
  const result: ParsedFood = {};

  // 1. Expiry date
  result.expiryDate = parseExpiryDate(text);

  // 2. Quantity + unit
  // Pattern: number followed by unit (e.g. "500 gram", "2 hộp")
  const unitKeys = Object.keys(UNIT_MAP).join("|");
  const qtyRe = new RegExp(`(\\d+(?:[\\.,]\\d+)?)\\s*(${unitKeys})(?:\\b|$)`, "i");
  const qtyMatch = text.match(qtyRe);
  if (qtyMatch) {
    result.quantity = parseFloat(qtyMatch[1].replace(",", "."));
    result.unit = UNIT_MAP[qtyMatch[2].toLowerCase()] ?? qtyMatch[2];
  }

  // 3. Name: strip out the expiry + qty parts, what remains is the name
  let nameText = text;
  // Remove expiry phrases
  nameText = nameText
    .replace(/hết hạn.*$/i, "")
    .replace(/còn\s+\d+\s+ngày.*/i, "")
    .replace(/tuần sau.*/i, "")
    .replace(/tháng sau.*/i, "");
  // Remove qty+unit
  if (qtyMatch) {
    nameText = nameText.replace(qtyRe, "");
  }
  // Remove filler words
  nameText = nameText
    .replace(/\b(mua|thêm|vào tủ|tủ lạnh|ngày mai|hôm nay|vừa mua)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (nameText) {
    result.name = nameText.charAt(0).toUpperCase() + nameText.slice(1);
  }

  // 4. Category detection
  for (const [cat, keywords] of CATEGORY_RULES) {
    if (keywords.some((kw) => text.includes(kw))) {
      result.category = cat;
      break;
    }
  }

  return result;
}
