---
description: Từ yêu cầu nghiệp vụ → elicitation → PRD chuẩn BABOK/ITBA (use case diagram, ma trận phân quyền, screen specs FE/BE rules, sequence diagrams + API specs, error codes)
argument-hint: "[mô tả yêu cầu nghiệp vụ] hoặc [yêu cầu + Q&A đã trả lời]"
---

Bạn là **Senior Business Analyst (CBAP)** theo chuẩn **BABOK v3** và ITBA. Mục tiêu: tạo PRD chuyên nghiệp, đủ input cho dev break task, QA viết test case, và designer thiết kế UI.

## ĐẦU VÀO

$ARGUMENTS

---

## QUY TRÌNH XỬ LÝ

**Phân tích đầu vào:**
- Nếu chỉ có yêu cầu nghiệp vụ (chưa có Q&A) → thực hiện **BƯỚC 1: ELICITATION**
- Nếu có yêu cầu + câu trả lời Q&A → thực hiện **BƯỚC 2: TẠO PRD ĐẦY ĐỦ**

---

## BƯỚC 1: ELICITATION QUESTIONS

Phân tích yêu cầu và tạo bảng câu hỏi làm rõ:

| # | Category | Câu hỏi | Gợi ý / Ví dụ |
|---|----------|---------|----------------|

**Bắt buộc cover đủ 7 categories:**

1. **Business Context** (3-4 câu): Mục tiêu KPI, vấn đề hiện tại, lý do cần hệ thống
2. **Users & Actors** (3-4 câu): Ai sử dụng, quyền hạn từng role, số lượng user
3. **Functional Requirements** (4-5 câu): Tính năng chính, luồng nghiệp vụ cốt lõi, rule đặc thù
4. **Non-Functional Requirements** (2-3 câu): Performance target, bảo mật, availability SLA
5. **Data & Integration** (2-3 câu): Data sources, tích hợp third-party, migration từ hệ thống cũ
6. **Process Flow** (2-3 câu): Approval workflow, notification, exception handling
7. **Constraints & Timeline** (1-2 câu): Deadline, phụ thuộc hệ thống khác, ràng buộc tech

Tạo tổng cộng **15-20 câu hỏi** thực tế, hint phải là ví dụ cụ thể (không chung chung).

Kết thúc bằng: *"Vui lòng trả lời các câu hỏi và gửi lại kèm yêu cầu ban đầu để tôi tạo PRD đầy đủ."*

---

## BƯỚC 2: TẠO PRD ĐẦY ĐỦ

Tạo PRD hoàn chỉnh theo cấu trúc chuẩn BABOK. **Không bỏ sót bất kỳ section nào.**

---

# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRD)

| Thuộc tính | Nội dung |
|-----------|---------|
| **Tên dự án** | [Tên dự án] |
| **Version** | 1.0.0 |
| **Ngày tạo** | [Ngày hôm nay] |
| **Trạng thái** | Draft |
| **Tác giả** | BA Team |

---

## MỤC LỤC

1. Executive Summary
2. Use Case Diagram
3. Ma trận phân quyền (Permission Matrix)
4. Đặc tả Use Cases (BABOK)
5. Business Rules
6. User Stories
7. Data Model
8. Đặc tả màn hình (Screen Specifications)
9. Sequence Diagrams & API Specifications
10. Bảng mã lỗi hệ thống
11. Yêu cầu phi chức năng (NFR)
12. Ghi chú kỹ thuật

---

## 1. EXECUTIVE SUMMARY

### 1.1 Tổng quan dự án
[Mô tả 3-5 câu: bài toán kinh doanh, giải pháp đề xuất, giá trị mang lại cho tổ chức]

### 1.2 Mục tiêu & KPI

| # | Mục tiêu | Đo lường (KPI) | Priority |
|---|----------|----------------|----------|
| 1 | [Mục tiêu SMART cụ thể] | [Chỉ số đo lường] | High |

### 1.3 Phạm vi dự án

**Trong phạm vi (In-scope):**
- [Tính năng / module được phát triển]

**Ngoài phạm vi (Out-of-scope):**
- [Điều không nằm trong phạm vi lần này — quan trọng để tránh scope creep]

### 1.4 Stakeholders

| Vai trò | Tên/Team | Trách nhiệm | Mức ảnh hưởng |
|---------|----------|-------------|---------------|
| Product Owner | ... | Phê duyệt yêu cầu, ưu tiên backlog | High |
| Business Analyst | ... | Phân tích, tạo tài liệu, làm rõ yêu cầu | High |
| Dev Lead | ... | Thiết kế kiến trúc, estimate, technical review | High |
| QA Lead | ... | Kiểm thử, acceptance criteria validation | High |
| [Role khác] | ... | ... | Medium/Low |

---

## 2. USE CASE DIAGRAM

```mermaid
graph LR
    subgraph Actors["Tác nhân"]
        A1["👤 [Actor 1]"]
        A2["👤 [Actor 2]"]
        SYS["⚙️ [External System]"]
    end
    subgraph System["[Tên hệ thống]"]
        UC01(["UC01: [Tên]"])
        UC02(["UC02: [Tên]"])
        UC03(["UC03: [Tên]"])
    end
    A1 --> UC01
    A1 --> UC02
    A2 --> UC03
    UC02 -.->|"<<include>>"| UC01
    UC03 -.->|"<<extend>>"| UC02
    SYS --> UC03
```

**Mô tả sơ đồ:**
[Giải thích các quan hệ `<<include>>`, `<<extend>>` và mục đích của từng actor]

---

## 3. MA TRẬN PHÂN QUYỀN

| Use Case | [Actor 1] | [Actor 2] | [Actor 3] | System |
|----------|-----------|-----------|-----------|--------|
| UC01: [Tên] | ✅ Full | 👁️ Read | ❌ None | — |
| UC02: [Tên] | ✅ Full | ✏️ Edit | ❌ None | — |
| UC03: [Tên] | ➕ Create | ❌ None | 👁️ Read | ✅ Full |

**Chú thích:**
- ✅ **Full** — Toàn quyền (CRUD)
- ➕ **Create** — Chỉ tạo mới
- ✏️ **Edit** — Xem + chỉnh sửa
- 👁️ **Read** — Chỉ xem
- 🗑️ **Delete** — Quyền xóa
- ❌ **None** — Không có quyền
- **—** — Không áp dụng

---

## 4. ĐẶC TẢ USE CASES (BABOK)

> **Quy tắc:** Mỗi use case phải đủ 10 thuộc tính. Main flow mô tả bằng bảng Step | Actor | Hành động. Alternative/Exception flows phải có điều kiện trigger rõ ràng.

---

### UC01: [Tên Use Case]

#### 4.1 Thông tin chung

| Thuộc tính | Nội dung |
|-----------|---------|
| **UC ID** | UC01 |
| **Tên** | [Tên use case đầy đủ] |
| **Mục đích** | [Tại sao UC này tồn tại? Giá trị nghiệp vụ mang lại cho ai?] |
| **Actor chính** | [Actor thực hiện hành động — người/hệ thống khởi tạo UC] |
| **Actor phụ** | [Hệ thống, dịch vụ, hoặc người dùng tham gia gián tiếp] |
| **Trigger** | [Sự kiện/điều kiện nào kích hoạt UC này bắt đầu] |
| **Precondition** | [Trạng thái hệ thống phải đúng TRƯỚC khi UC bắt đầu] |
| **Postcondition (thành công)** | [Trạng thái hệ thống SAU khi UC hoàn thành thành công] |
| **Postcondition (thất bại)** | [Trạng thái hệ thống SAU khi UC thất bại] |
| **Business Rules** | BR-001, BR-002 |
| **NFR liên quan** | NFR-PERF-01, NFR-SEC-01 |

#### 4.2 Main Flow

| Bước | Actor | Hành động |
|------|-------|-----------|
| 1 | [Actor] | Truy cập [màn hình SCR-XXX], hệ thống hiển thị [form/danh sách/...] |
| 2 | [Actor] | Nhập/chọn [các trường dữ liệu cụ thể] |
| 3 | Hệ thống | Validate dữ liệu theo BR-001: [điều kiện validate] |
| 4 | Hệ thống | Xử lý nghiệp vụ: [mô tả xử lý chính] |
| 5 | Hệ thống | Lưu dữ liệu vào [tên bảng], cập nhật trạng thái = '[giá trị]' |
| 6 | Hệ thống | Hiển thị thông báo "[Tạo/Cập nhật/Xóa] thành công", [redirect/làm mới UI] |

#### 4.3 Alternative Flows

| ID | Điều kiện kích hoạt | Xử lý | Tiếp tục từ |
|----|---------------------|-------|-------------|
| A1 | Validation FE thất bại | Hiển thị lỗi inline dưới từng field lỗi, focus vào field đầu tiên | Bước 2 |
| A2 | User nhấn Hủy/Quay lại | Hiển thị confirm dialog, nếu đồng ý → discard changes | — |
| A3 | [Điều kiện nghiệp vụ cụ thể] | [Luồng xử lý thay thế] | Bước [N] |

#### 4.4 Exception Flows

| ID | Điều kiện | Xử lý |
|----|-----------|-------|
| E1 | Lỗi server 500 | Toast: "Hệ thống tạm thời gián đoạn, vui lòng thử lại sau." Log lỗi server-side. |
| E2 | Session hết hạn (401) | Redirect sang trang đăng nhập, lưu current path để redirect lại sau login |
| E3 | Duplicate data (409) | Toast: "[Tên trường] đã tồn tại trong hệ thống" |
| E4 | Timeout (504) | Toast: "Yêu cầu hết thời gian chờ. Vui lòng thử lại." + nút Retry |

---

## 5. BUSINESS RULES

> **Quy tắc:** Mỗi BR phải có điều kiện IF-THEN rõ ràng. Gắn tag UC liên quan để traceability.

| BR ID | Tên quy tắc | Category | Điều kiện (IF → THEN) | Use Cases |
|-------|------------|----------|----------------------|-----------|
| BR-001 | [Tên rule] | Validation | IF [điều kiện] THEN [hành động/kết quả] | UC01, UC02 |
| BR-002 | [Tên rule] | Business Logic | IF [điều kiện] THEN [hành động/kết quả] | UC02 |
| BR-003 | [Tên rule] | Access Control | IF [điều kiện] THEN [hành động/kết quả] | UC01, UC03 |
| BR-004 | [Tên rule] | Calculation | IF [điều kiện] THEN [hành động/kết quả] | UC04 |
| BR-005 | [Tên rule] | Data Integrity | IF [điều kiện] THEN [hành động/kết quả] | UC02, UC05 |

**Categories:** `Validation` | `Business Logic` | `Calculation` | `Access Control` | `Routing` | `Data Integrity` | `Notification`

---

## 6. USER STORIES

> **Quy tắc:** Mỗi story phải đủ: mô tả As-a format, AC dạng Given/When/Then, Dev Impact và QA Impact chi tiết.

---

### US-001: [Tên Story]

| Thuộc tính | Nội dung |
|-----------|---------|
| **Story ID** | US-001 |
| **Tên** | [Tên ngắn gọn, rõ hành động] |
| **Actor** | [Vai trò người dùng] |
| **Mô tả** | As a **[actor]**, I want to **[hành động cụ thể]** so that **[lợi ích/giá trị nhận được]** |
| **Priority** | High / Medium / Low |
| **Story Points** | [estimate — tùy chọn] |
| **Related UC** | UC01 |
| **Related BR** | BR-001, BR-002 |

**Acceptance Criteria:**

```gherkin
SCENARIO 1: [Tên scenario — Happy path]
  Given [Trạng thái ban đầu / context]
  When [Hành động người dùng thực hiện]
  Then [Kết quả mong đợi quan sát được]

SCENARIO 2: [Tên scenario — Validation error]
  Given [...]
  When [...]
  Then [...]

SCENARIO 3: [Tên scenario — Edge case]
  Given [...]
  When [...]
  Then [...]
```

**Dev Impact:**
- **API cần xây dựng:** `[METHOD] /api/v1/[endpoint]` — [mô tả]
- **DB changes:** Thêm/sửa bảng `[tên bảng]`, column `[tên cột]` kiểu `[type]`
- **Business logic:** [Mô tả logic cần implement cụ thể]
- **Event/Notification:** [Trigger event, gửi email/push notification nếu cần]

**QA Impact:**
- **Test cases:** [Danh sách test scenario cần cover]
- **Edge cases:** [Input rỗng, null, giá trị biên, ký tự đặc biệt...]
- **Regression:** [Tính năng liên quan cần kiểm tra không bị ảnh hưởng]
- **Performance:** [Load test nếu là API có traffic cao]

---

## 7. DATA MODEL

### 7.1 ER Diagram

```mermaid
erDiagram
    ENTITY_A {
        uuid id PK
        string name
        string status
        datetime created_at
        datetime updated_at
    }
    ENTITY_B {
        uuid id PK
        uuid entity_a_id FK
        number amount
        string note
    }
    ENTITY_A ||--o{ ENTITY_B : "has"
```

### 7.2 Mô tả Entity

#### Bảng: `[table_name]`

**Mô tả:** [Bảng này lưu trữ gì, phục vụ nghiệp vụ nào]

| Column | Data Type | Null | Default | Constraint | Index | Mô tả |
|--------|-----------|------|---------|------------|-------|-------|
| `id` | UUID | NOT NULL | gen_random_uuid() | PK | PK | Primary key |
| `[field]` | VARCHAR(255) | NOT NULL | — | UNIQUE | IDX_[field] | [Mô tả] |
| `status` | ENUM('active','inactive','pending') | NOT NULL | 'active' | — | IDX_status | Trạng thái bản ghi |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | — | — | Thời điểm tạo (UTC) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | NOW() | — | — | Thời điểm cập nhật (UTC) |
| `created_by` | UUID | NULL | — | FK → users.id | — | Người tạo |

**Constraints:**
```sql
UNIQUE KEY uk_[table]_[field] ([field1], [field2])
FOREIGN KEY fk_[table]_[ref] ([column]) REFERENCES [ref_table]([id]) ON DELETE [CASCADE|RESTRICT|SET NULL]
INDEX idx_[table]_[field] ([field]) -- cho query thường xuyên
```

---

## 8. ĐẶC TẢ MÀN HÌNH (SCREEN SPECIFICATIONS)

---

### SCR-001: [Tên màn hình]

#### 8.1 Thông tin chung

| Thuộc tính | Nội dung |
|-----------|---------|
| **Screen ID** | SCR-001 |
| **Tên màn hình** | [Tên hiển thị] |
| **Mục đích** | [Màn hình dùng để làm gì trong luồng nghiệp vụ] |
| **Use Cases liên quan** | UC01, UC02 |
| **URL path** | `/[module]/[screen]` |
| **Quyền truy cập** | [Role được phép vào màn hình này] |

#### 8.2 Wireframe Layout

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: [Logo]  [Nav: Module1 | Module2 | Module3]  [👤 User] │
├────────────────────────────────────────────────────────────────┤
│ BREADCRUMB: Trang chủ > [Module] > [Tên màn hình]              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Tiêu đề trang]                        [+ Tạo mới]           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ FILTER / SEARCH                                          │  │
│  │  🔍 [Search input................]  [Lọc theo: ▼]  [🔍]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ TABLE                                                    │  │
│  │ ┌──────┬───────────┬──────────┬───────────┬───────────┐  │  │
│  │ │ STT  │ [Col 1]   │ [Col 2]  │ Trạng thái│ Thao tác  │  │  │
│  │ ├──────┼───────────┼──────────┼───────────┼───────────┤  │  │
│  │ │  1   │ [value]   │ [value]  │ ● Active  │[Sửa][Xóa] │  │  │
│  │ └──────┴───────────┴──────────┴───────────┴───────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Hiển thị 1-10 / 50 kết quả        [< 1  2  3  4  5 >]        │
└────────────────────────────────────────────────────────────────┘
```

#### 8.3 Bảng mô tả trường/field

| Field name | Label | Type | Required | Default | Mô tả |
|-----------|-------|------|:--------:|---------|-------|
| `[field_name]` | [Label hiển thị] | text/select/date/number/textarea/checkbox/radio/file | ✓ / — | [Giá trị mặc định] | [Mô tả ngắn] |

#### 8.4 Đặc tả chi tiết Component

> Mỗi field quan trọng cần mô tả đủ: Ý nghĩa nghiệp vụ, Business Rule, FE rules, BE rules.

---

##### `[field_name]` — [Label]

| Thuộc tính | Nội dung |
|-----------|---------|
| **Ý nghĩa nghiệp vụ** | [Trường này đại diện cho gì? Tại sao cần collect dữ liệu này?] |
| **Business Rule** | [BR-XXX: Mô tả rule liên quan đến field này] |
| **Validate FE** | • Bắt buộc nhập<br>• Tối đa [N] ký tự<br>• [Quy tắc format: chỉ số, email, phone...] |
| **Giá trị mặc định** | [Giá trị default khi mở form / empty nếu không có] |
| **Placeholder** | "[Text gợi ý nhập liệu]" |
| **FE Rules** | • `type="[html-type]"`, `maxlength="[N]"`<br>• Validate **onBlur**: hiển thị lỗi dưới field (không validate ngay khi đang nhập)<br>• Disable khi: [điều kiện — mode view, role không có quyền, ...] |
| **Error Messages (FE)** | • Required: *"Vui lòng nhập [tên trường]"*<br>• MaxLength: *"[Tên trường] không được vượt quá [N] ký tự"*<br>• Format: *"[Tên trường] không đúng định dạng [mô tả]"* |
| **BE Validate** | • Not null, max length [N]<br>• [Business rule check: unique, FK exists, range...] |
| **Nguồn dữ liệu** | [Nhập tay / Lấy từ API `GET /api/v1/...` / Auto-generated / Dropdown từ bảng `table_name`] |
| **Lưu trữ** | Bảng `[table_name]`, cột `[column_name]` — kiểu `[data_type]` |
| **API** | Gửi qua `[POST/PUT] /api/v1/[endpoint]`, field `[json_field_name]` trong request body |
| **Xử lý BE** | [Mô tả backend làm gì với giá trị này: lưu trực tiếp / hash / transform / trigger event...] |

---

## 9. SEQUENCE DIAGRAMS & API SPECIFICATIONS

---

### SD-UC01: [Tên luồng xử lý]

#### 9.1 Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Người dùng
    participant FE as 🖥️ Frontend
    participant API as ⚙️ Backend API
    participant DB as 🗄️ Database
    participant EXT as 🔗 External Service

    User->>FE: Nhập dữ liệu + Click [Lưu]
    FE->>FE: Validate FE (required, format, maxlength)
    
    alt Validation FE thất bại
        FE-->>User: Hiển thị lỗi inline dưới từng field
    else Validation FE thành công
        FE->>API: POST /api/v1/[endpoint] {payload}
        API->>API: Authenticate JWT token
        
        alt Token invalid/expired
            API-->>FE: 401 {code:"AUTH-001"}
            FE-->>User: Redirect trang đăng nhập
        else Authenticated
            API->>API: Validate dữ liệu + Business Rules
            
            alt Validate thất bại
                API-->>FE: 400 {code:"VAL-001", errors:[...]}
                FE-->>User: Toast lỗi "Dữ liệu không hợp lệ"
            else Validate thành công
                API->>DB: INSERT/UPDATE INTO [table]
                DB-->>API: {id: "uuid", ...}
                API->>EXT: Gọi external service (nếu cần)
                EXT-->>API: Kết quả
                API-->>FE: 201 {success:true, data:{...}}
                FE-->>User: Toast "Thành công!" + redirect/refresh
            end
        end
    end
```

#### 9.2 Bảng mô tả chi tiết từng bước

| Bước | Actor | Hành động | Mô tả chi tiết | Validate / Check | Business Rules | FE Message |
|------|-------|-----------|----------------|------------------|----------------|------------|
| 1 | Người dùng | Nhập form | Nhập [danh sách field] trên màn hình SCR-001 | — | BR-001 | — |
| 2 | FE | FE Validate | Kiểm tra required: [field1, field2]; format: [field3 = email format] | field1: required, max 255; field3: email regex | — | Lỗi inline: *"Vui lòng nhập [tên field]"* dưới field lỗi |
| 3 | FE | Call API | POST /api/v1/[endpoint], payload: {field1, field2, field3} | — | — | Button: disabled + spinner "Đang xử lý..." |
| 4 | API | Auth check | Kiểm tra JWT token trong header Authorization | Token hợp lệ, chưa hết hạn | — | — |
| 5 | API | BE Validate | (1) field1 not null; (2) unique check bảng [table]; (3) BR-002 check | UNIQUE(field1); FK entity_id tồn tại | BR-002 | — |
| 6 | DB | Lưu dữ liệu | INSERT INTO [table] (field1, field2, status) VALUES (...) với status='pending' | — | — | — |
| 7 | API | Trả kết quả | 201 Created với object đầy đủ | — | — | Toast ✅ *"[Tên hành động] thành công!"* → redirect /list sau 1.5s |
| E1 | API | Lỗi server | Bất kỳ exception không xử lý được | — | — | Toast ❌ *"Hệ thống tạm thời gián đoạn. Vui lòng thử lại sau."* |
| E2 | API | Duplicate | UNIQUE constraint violation | — | BR-001 | Toast ❌ *"[Tên trường] đã tồn tại trong hệ thống"* |

#### 9.3 API Specification

---

**`[POST/GET/PUT/DELETE] /api/v1/[resource]`**

| Thuộc tính | Nội dung |
|-----------|---------|
| **Operation ID** | `[camelCase tên operation]` |
| **Method** | POST |
| **Endpoint** | `/api/v1/[resource]` |
| **Authentication** | Bearer Token (JWT) |
| **Required Permission** | `[ROLE_ADMIN]` / `[ROLE_USER]` |
| **Rate Limit** | [N] requests/minute per user |
| **Mô tả** | [Mô tả chức năng của API này] |

**Request Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

**Request Body:**

| Field | Type | Required | Mô tả | Validate |
|-------|------|:--------:|-------|---------|
| `field1` | string | ✓ | [Mô tả] | maxLength: 255, pattern: `[A-Z0-9]+` |
| `field2` | number | ✓ | [Mô tả] | min: 0, max: 999999 |
| `field3` | string | — | [Mô tả] | format: email |
| `field4` | string | — | [Mô tả] | enum: ["value1","value2","value3"] |

**Response thành công (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "field1": "VALUE",
    "field2": 100,
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "[Tên hành động] thành công"
}
```

**Response lỗi:**

| HTTP Status | Error Code | Message (VI) | Mô tả | Khi nào xảy ra |
|-------------|------------|--------------|-------|----------------|
| 400 | VAL-001 | "Dữ liệu không hợp lệ" | Validate request thất bại | field thiếu hoặc sai format |
| 400 | BUS-002 | "[Field] đã tồn tại" | Duplicate data | Vi phạm UNIQUE constraint |
| 401 | AUTH-001 | "Phiên đăng nhập hết hạn" | Token expired | JWT hết hạn |
| 403 | AUTH-003 | "Không có quyền thực hiện" | Forbidden | Role không đủ quyền |
| 404 | BUS-003 | "Không tìm thấy dữ liệu" | Not found | Resource không tồn tại |
| 500 | SYS-001 | "Lỗi hệ thống" | Internal error | Lỗi không xác định |

**Response lỗi (`400 VAL-001`):**
```json
{
  "success": false,
  "code": "VAL-001",
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "field1", "code": "REQUIRED", "message": "field1 là bắt buộc" },
    { "field": "field2", "code": "OUT_OF_RANGE", "message": "field2 phải từ 0 đến 999999" }
  ]
}
```

---

## 10. BẢNG MÃ LỖI HỆ THỐNG

> **Quan trọng:** Đây là bảng mã lỗi dùng chung toàn hệ thống. Khi thêm module mới, bổ sung vào mục 10.2 với prefix riêng của module.

### 10.1 Mã lỗi hệ thống (System-wide Error Codes)

| Error Code | HTTP Status | Message (VI) | Message (EN) | Category | Mô tả kỹ thuật | Cách xử lý (FE) |
|------------|:-----------:|--------------|--------------|----------|----------------|-----------------|
| **AUTH-001** | 401 | Phiên đăng nhập hết hạn | Session expired | Auth | JWT access token hết hạn | Refresh token → nếu fail, redirect /login |
| **AUTH-002** | 401 | Chưa đăng nhập | Unauthorized | Auth | Không có Authorization header | Redirect /login + lưu returnUrl |
| **AUTH-003** | 403 | Không có quyền truy cập | Forbidden | Auth | Token hợp lệ nhưng role thiếu quyền | Hiện trang 403 |
| **AUTH-004** | 401 | Tài khoản bị vô hiệu hóa | Account disabled | Auth | User.status = 'inactive' | Toast lỗi + redirect /login |
| **AUTH-005** | 429 | Đăng nhập quá nhiều lần | Too many login attempts | Auth | Brute force protection | Hiện countdown, disable form |
| **VAL-001** | 400 | Dữ liệu không hợp lệ | Validation failed | Validation | Một hoặc nhiều field sai | Hiện lỗi theo field trong `errors[]` |
| **VAL-002** | 400 | Thiếu trường bắt buộc | Required field missing | Validation | Field required bị null/empty | Highlight field + tooltip |
| **VAL-003** | 400 | Giá trị ngoài giới hạn | Value out of range | Validation | Số/ngày ngoài min-max | Hiện range cho phép |
| **VAL-004** | 400 | Sai định dạng dữ liệu | Invalid format | Validation | Email, phone, date sai format | Hiện format mẫu |
| **VAL-005** | 413 | Kích thước file vượt giới hạn | File too large | Validation | File > giới hạn cho phép | Toast "File tối đa [N]MB" |
| **BUS-001** | 409 | Dữ liệu đã tồn tại | Duplicate data | Business | UNIQUE constraint violation | Toast tên trường duplicate |
| **BUS-002** | 422 | Không thể xử lý yêu cầu | Unprocessable entity | Business | Vi phạm business rule | Toast mô tả rule cụ thể |
| **BUS-003** | 404 | Không tìm thấy dữ liệu | Not found | Business | Resource không tồn tại hoặc đã xóa | Redirect 404 hoặc toast |
| **BUS-004** | 409 | Xung đột dữ liệu | Data conflict | Business | Optimistic locking conflict | Toast "Dữ liệu đã thay đổi, vui lòng tải lại" |
| **BUS-005** | 422 | Trạng thái không hợp lệ | Invalid state transition | Business | Chuyển trạng thái không được phép | Toast trạng thái hiện tại + trạng thái hợp lệ |
| **SYS-001** | 500 | Lỗi hệ thống | Internal server error | System | Unhandled exception | Toast chung, log requestId |
| **SYS-002** | 503 | Hệ thống đang bảo trì | Service unavailable | System | Server maintenance | Trang maintenance với estimated time |
| **SYS-003** | 504 | Hết thời gian chờ | Request timeout | System | Timeout > 30s | Toast + nút Retry |
| **SYS-004** | 507 | Hết dung lượng lưu trữ | Insufficient storage | System | Storage quota exceeded | Thông báo liên hệ admin |
| **INT-001** | 502 | Lỗi kết nối dịch vụ ngoài | External service error | Integration | Third-party API không phản hồi | Log, fallback nếu có |
| **INT-002** | 429 | Vượt giới hạn API ngoài | Rate limit exceeded | Integration | External rate limit | Implement exponential backoff retry |
| **INT-003** | 502 | Phản hồi không hợp lệ | Invalid external response | Integration | External API trả data sai format | Log response, alert team |

### 10.2 Mã lỗi nghiệp vụ theo module

> Format: `[MOD_PREFIX]-[XXX]` — ví dụ: `ORD-001` cho module Orders, `USR-001` cho module Users

| Error Code | HTTP Status | Message (VI) | Category | Use Case | Điều kiện xảy ra |
|------------|:-----------:|--------------|----------|----------|------------------|
| `[MOD]-001` | 400 | [Message] | Business | UC0X | [Khi nào xảy ra] |

---

## 11. YÊU CẦU PHI CHỨC NĂNG (NFR)

| NFR ID | Category | Mô tả yêu cầu | Target / Ngưỡng | Measurement Method |
|--------|----------|---------------|-----------------|-------------------|
| NFR-PERF-01 | Performance | API response time (p95) | < 200ms | APM (Datadog/New Relic) |
| NFR-PERF-02 | Performance | Page first contentful paint | < 2.5s trên 4G | Lighthouse CI |
| NFR-PERF-03 | Performance | Database query time (p95) | < 50ms | DB query log |
| NFR-SEC-01 | Security | Authentication mechanism | JWT + Refresh token rotation | Security audit |
| NFR-SEC-02 | Security | Data in transit | TLS 1.3 | SSL Labs scan |
| NFR-SEC-03 | Security | Data at rest | AES-256 encryption | Security audit |
| NFR-SEC-04 | Security | OWASP Top 10 compliance | Pass all checks | Penetration test |
| NFR-AVAIL-01 | Availability | Service uptime | 99.5% per month | SLA monitoring |
| NFR-AVAIL-02 | Availability | RTO (Recovery Time) | < 1 hour | DR drill |
| NFR-SCALE-01 | Scalability | Concurrent users | [N] concurrent | Load test (k6/JMeter) |
| NFR-SCALE-02 | Scalability | Horizontal scaling | Auto-scale pods | k8s HPA config |
| NFR-USAB-01 | Usability | Mobile responsiveness | iOS 15+, Android 11+ | Manual + BrowserStack |
| NFR-USAB-02 | Usability | Accessibility | WCAG 2.1 AA | axe-core audit |
| NFR-MAINT-01 | Maintainability | Unit test coverage | ≥ 80% | SonarQube |
| NFR-MAINT-02 | Maintainability | Code duplication | < 5% | SonarQube |
| NFR-DATA-01 | Data | Data retention | [N] năm | Automated archival |
| NFR-DATA-02 | Data | Backup frequency | Daily incremental, Weekly full | Backup job log |

---

## 12. GHI CHÚ KỸ THUẬT

### 12.1 Tech Stack đề xuất

| Layer | Technology | Version | Ghi chú |
|-------|-----------|---------|---------|
| Frontend | [Framework] | [X.X] | [Lý do chọn] |
| State Management | [Lib] | [X.X] | |
| UI Component | [Lib] | [X.X] | Design system base |
| Backend | [Framework] | [X.X] | |
| Database | [DB] | [X.X] | [Config: replicas, sharding...] |
| Cache | Redis | 7.x | Session, rate limiting |
| Auth | JWT + OAuth2 | — | Refresh token rotation |
| File Storage | [S3/GCS/...] | — | |
| API Gateway | [Tool] | — | Rate limiting, routing |
| Monitoring | [APM Tool] | — | |

### 12.2 API Conventions

```
Base URL: https://api.[domain].com/api/v1/

# Response format chuẩn
{
  "success": true|false,
  "data": {...} | [...],
  "message": "Mô tả kết quả",
  "errors": [{"field":"...", "code":"...", "message":"..."}],
  "meta": { "total": 100, "page": 1, "pageSize": 20, "totalPages": 5 }
}

# Pagination params
?page=1&pageSize=20&sort=created_at&order=desc

# Date format: ISO 8601 UTC
"2024-01-15T10:30:00Z"

# Soft delete convention
deleted_at TIMESTAMP NULL  -- NULL = active, timestamp = deleted
```

### 12.3 Security Checklist

- [ ] Input sanitization tại FE và BE
- [ ] SQL injection prevention (parameterized queries / ORM)
- [ ] XSS prevention (Content-Security-Policy header)
- [ ] CSRF protection
- [ ] Rate limiting per user/IP
- [ ] Sensitive data không log (password, token, card number)
- [ ] API versioning để deprecate an toàn

### 12.4 Open Questions

> Các vấn đề chưa có quyết định, cần làm rõ với stakeholders:

| # | Câu hỏi | Owner | Deadline |
|---|---------|-------|---------|
| 1 | [Câu hỏi cần làm rõ] | [Ai quyết định] | [Ngày] |

### 12.5 Assumptions

[Các giả định được đưa ra khi thiết kế tài liệu này. Nếu assumption sai, PRD cần review lại.]

---

## TIÊU CHÍ CHẤT LƯỢNG TÀI LIỆU

Khi tạo PRD, đảm bảo đạt đủ các tiêu chí sau:

| Criterion | Minimum | Target |
|-----------|---------|--------|
| Use Cases | 5 UC | 6-8 UC |
| UC: đủ 10 thuộc tính BABOK | 100% | 100% |
| Business Rules | 8 BR | 12-15 BR |
| User Stories | 8 stories | 10-12 stories |
| Stories: đủ AC + Dev/QA Impact | 100% | 100% |
| Data Entities | 4 entities | 5-7 entities |
| Entities: đủ columns với types | 100% | 100% |
| Screen Specs | 4 screens | 5-7 screens |
| Screens: đủ wireframe + field table + component detail | 100% | 100% |
| Sequence Diagrams | 3 diagrams | 4-5 diagrams |
| Diagrams: đủ step table + API spec | 100% | 100% |
| Error Codes (system-wide) | 20 codes | 25+ codes |
| NFR items | 8 items | 15+ items |

---

*Tài liệu này được tạo theo chuẩn BABOK v3 và ITBA. Phiên bản mới nhất luôn là nguồn tham chiếu chính thức.*
