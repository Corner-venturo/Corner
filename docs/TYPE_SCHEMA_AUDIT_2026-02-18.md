# TypeScript 型別定義 vs DB Schema 全面比對報告

**日期**: 2026-02-18
**比對方式**: Supabase API 查 information_schema vs src/types/*.types.ts

---

## 摘要

| 表 | TS 型別 | DB 欄位數 | TS 獨有 | DB 獨有 | 需修正 |
|---|---|---|---|---|---|
| tours | Tour | 60 | 0 | 3 | 0 |
| orders | Order | 29 | 0 | 6 | ⚠️ 4 |
| order_members | Member | 46 | 7 | 10 | ⚠️ 5 |
| quotes | Quote | 69 | ~5 | 0 | 0 |
| itineraries | Itinerary | 68 | ~5 | 3 | 0 |
| receipts | Receipt | 44 | 0 | 2 | 0 |
| payment_requests | PaymentRequest | 32 | 0 | 0 | 0 |
| customers | Customer | 46 | 0 | 8 | ⚠️ 2 |
| suppliers | Supplier | 39 | 0 | 6 | 0 |
| employees | User/Employee | 32 | ~10 | 3 | ⚠️ 1 |

---

## 詳細比對

### 1. `order_members` ↔ `Member` (src/types/tour.types.ts)

**⚠️ 最嚴重：TS 有但 DB 沒有的欄位（會造成 insert/update 失敗）**

| TS 欄位 | 狀態 | 處理 |
|---|---|---|
| `hotel_confirmation` | ❌ DB 無此欄位 | **移除** — 已知問題 |
| `name` | optional, 向下相容 | 不動 |
| `name_en` | optional, 向下相容 | 不動 |
| `assigned_room` | optional, 向下相容 | 不動 |
| `reservation_code` | optional, 向下相容 | 不動 |
| `is_child_no_bed` | optional | 不動 |
| `add_ons`, `refunds`, `custom_fields` | optional | 不動（前端專用） |
| `updated_at` | 非 optional | ❌ DB 無此欄位 — 需移除 |

**DB 有但 TS 沒有的欄位（可能遺漏功能）**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `selling_price` | numeric | **新增** — 財務計算用 |
| `total_payable` | numeric | **新增** — 財務計算用 |
| `transport_cost` | numeric | **新增** — 成本分析 |
| `ticket_number` | varchar | **新增** — 票號管理 |
| `ticketing_deadline` | date | **新增** — 開票截止日 |
| `flight_self_arranged` | boolean | 新增 |
| `contract_created_at` | timestamptz | TS order.types.ts 的 Member 有 |
| `passport_name_print` | text | **新增** — 行李吊牌 |
| `sort_order` | integer | 新增 |
| `workspace_id` | uuid | BaseEntity 有 |

### 2. `orders` ↔ `Order` (src/types/order.types.ts)

**DB 有但 TS Order 沒有的欄位**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `adult_count` | integer | **新增** — 訂單常用 |
| `child_count` | integer | **新增** — 訂單常用 |
| `infant_count` | integer | **新增** — 訂單常用 |
| `contact_email` | text | **新增** |
| `is_active` | boolean | **新增** |
| `identity_options` | jsonb | 新增（optional） |

### 3. `customers` ↔ `Customer` (src/types/customer.types.ts)

**DB 有但 TS 沒有的欄位**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `sex` | text | 新增 optional（與 gender 並存） |
| `nationality` | text | **新增** — 護照用 |
| `avatar_url` | text | 新增 optional |
| `total_points` | integer | 新增 optional |
| `linked_at` | timestamptz | 新增 optional（Online 連動） |
| `linked_method` | text | 新增 optional |
| `online_user_id` | uuid | 新增 optional |
| `emergency_contact` | jsonb | TS 沒有但 DB 有 — **新增** |

### 4. `tours` ↔ `Tour` (src/types/tour.types.ts)

**DB 有但 TS 沒有的欄位**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `confirmed_requirements` | jsonb | 新增 optional |
| `proposal_id` | uuid | 新增 optional |
| `locked_*` (6 欄位) | various | TS 註解說已移除但 DB 仍在；不動 |

### 5. `employees` ↔ `User/Employee` (src/types/user.types.ts)

**DB 有但 TS 沒有的直接欄位**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `avatar_url` | text | TS 只有 `avatar` — **新增別名** |
| `monthly_salary` | numeric | 新增 optional |
| `id_number` | text | 新增 optional |
| `birth_date` | date | 新增 optional |
| `supabase_user_id` | uuid | 新增 optional |

### 6. `receipts` ↔ `Receipt` (src/types/receipt.types.ts)

基本吻合，Receipt 型別覆蓋良好。

| DB 欄位 | 處理 |
|---|---|
| `customer_name` | TS 未定義 — 新增 optional |
| `sync_status` | TS 未定義 — 新增 optional |

### 7. `payment_requests` ↔ `PaymentRequest`

✅ 完全吻合，所有 DB 欄位都有對應 TS 定義。

### 8. `quotes` ↔ `Quote`

✅ 基本吻合。Quote 型別涵蓋所有 DB 欄位。部分向下相容欄位（`destination`, `customer_name` 等）在 DB 和 TS 都有。

### 9. `suppliers` ↔ `Supplier`

**DB 有但 TS 沒有的欄位**

| DB 欄位 | data_type | 處理 |
|---|---|---|
| `contact` | jsonb | 不動（TS 用個別欄位） |
| `country` | text | 不動（TS 用 country_id） |
| `region` | text | 新增 optional |
| `status` | text | 新增 optional |
| `category_id` | uuid | 新增 optional |
| `bank_code_legacy` | text | 不動（legacy） |
| `fax` | varchar | 不動 |

---

## 已修正項目

### Fix 1: Member — 移除 `hotel_confirmation`、`updated_at`
- `hotel_confirmation` — DB 無此欄位，寫入會 500 error
- `updated_at` — DB order_members 表無此欄位

### Fix 2: Member — 新增遺漏的 DB 欄位
- `selling_price`, `total_payable`, `transport_cost`
- `ticket_number`, `ticketing_deadline`, `flight_self_arranged`
- `passport_name_print`, `sort_order`

### Fix 3: Order — 新增遺漏欄位
- `adult_count`, `child_count`, `infant_count`, `contact_email`, `is_active`
- `identity_options`

### Fix 4: Customer — 新增遺漏欄位
- `emergency_contact`, `nationality`, `sex`, `avatar_url`, `total_points`
- `linked_at`, `linked_method`, `online_user_id`

### Fix 5: User/Employee — 新增 `avatar_url` 別名
- DB 有 `avatar_url`，TS 只有 `avatar`

---

## 未修正（低風險，不影響 runtime）

- Tour locked_* 欄位：DB 有但 TS 已移除（公司規範）
- Supplier legacy 欄位：bank_code_legacy, fax
- Member 向下相容欄位：name, name_en, assigned_room, reservation_code
- Quote/Itinerary 向下相容欄位
