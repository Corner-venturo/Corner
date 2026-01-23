# Venturo 欄位命名語意規範

> **最後更新**: 2026-01-23
> **適用範圍**: 資料庫欄位、TypeScript 介面、表單欄位
> **相關文件**: `docs/NAMING_CONVENTION_STANDARD.md`（snake_case 格式規範）

---

## 🎯 核心原則

**同一概念 = 同一欄位名稱**

當相同的業務概念出現在不同表格或介面時，必須使用相同的欄位名稱。

```typescript
// ❌ 錯誤：同一概念不同命名
employees.birthday
customers.date_of_birth
order_members.birth_date

// ✅ 正確：統一使用 birth_date
employees.birth_date
customers.birth_date
order_members.birth_date
```

---

## 📋 標準欄位對照表

### 個人基本資料

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 出生日期 | `birth_date` | `birthday`, `date_of_birth`, `dob` | 格式：YYYY-MM-DD |
| 中文姓名 | `chinese_name` | `name`, `full_name`, `ch_name` | 全名（姓+名） |
| 英文姓名 | `english_name` | `name_en`, `en_name`, `eng_name` | 全名 |
| 護照姓名 | `passport_name` | `passport_romanization` | 護照拼音（姓/名） |
| 身分證號 | `id_number` | `national_id`, `identity_number` | 台灣身分證字號 |
| 護照號碼 | `passport_number` | `passport_no`, `passport` | |
| 護照效期 | `passport_expiry` | `passport_expiry_date` | 格式：YYYY-MM-DD |
| 性別 | `gender` | `sex` | 值：male/female/other |
| 電話 | `phone` | `phone_number`, `tel`, `mobile` | 主要聯絡電話 |
| 備用電話 | `alternative_phone` | `phone2`, `secondary_phone` | |
| Email | `email` | `e_mail`, `mail` | |
| 地址 | `address` | `addr`, `full_address` | 完整地址 |
| 國籍 | `nationality` | `nation`, `country_of_birth` | |

### 護照相關

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 護照號碼 | `passport_number` | `passport_no` | |
| 護照效期 | `passport_expiry` | `passport_expiry_date`, `passport_exp` | |
| 護照姓名 | `passport_name` | `passport_romanization` | 護照上的拼音 |
| 護照圖片 | `passport_image_url` | `passport_photo`, `passport_img` | URL 格式 |

### 日期時間相關

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 出發日期 | `departure_date` | `start_date`, `depart_date` | Tour 出發日 |
| 返回日期 | `return_date` | `end_date`, `back_date` | Tour 返回日 |
| 建立時間 | `created_at` | `create_time`, `created_date` | ISO 8601 |
| 更新時間 | `updated_at` | `update_time`, `modified_at` | ISO 8601 |
| 刪除時間 | `deleted_at` | `delete_time` | 軟刪除 |

### 人員統計

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 成人數 | `adult_count` | `adults`, `adult_num` | |
| 兒童數 | `child_count` | `children`, `child_num` | |
| 嬰兒數 | `infant_count` | `infants`, `infant_num` | |
| 團員總數 | `member_count` | `total_people`, `participants` | |
| 最大參與人數 | `max_participants` | `max_people`, `capacity` | |
| 當前參與人數 | `current_participants` | `current_people` | |

### 金額相關

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 總金額 | `total_amount` | `total`, `amount` | |
| 已付金額 | `paid_amount` | `paid`, `payment` | |
| 待付金額 | `remaining_amount` | `balance`, `unpaid` | |
| 售價 | `selling_price` | `price`, `sale_price` | |
| 成本 | `cost_price` | `cost`, `purchase_price` | |
| 利潤 | `profit` | `margin`, `earnings` | |

### 關聯 ID

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 旅遊團 ID | `tour_id` | `tour`, `trip_id` | UUID |
| 訂單 ID | `order_id` | `order`, `booking_id` | UUID |
| 客戶 ID | `customer_id` | `customer`, `client_id` | UUID |
| 員工 ID | `employee_id` | `employee`, `staff_id` | UUID |
| 建立者 ID | `created_by` | `creator_id`, `author_id` | UUID |
| 更新者 ID | `updated_by` | `modifier_id`, `editor_id` | UUID |

### 狀態欄位

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 狀態 | `status` | `state`, `condition` | 通用狀態 |
| 付款狀態 | `payment_status` | `pay_status` | |
| 合約狀態 | `contract_status` | `contract_state` | |
| 是否啟用 | `is_active` | `active`, `enabled` | boolean |
| 是否刪除 | `_deleted` | `is_deleted`, `deleted` | 軟刪除標記 |

### 備註相關

| 概念 | 標準欄位名 | ❌ 禁止使用 | 說明 |
|------|-----------|------------|------|
| 備註 | `notes` | `note`, `remark`, `remarks` | 可多行 |
| 說明 | `description` | `desc`, `detail` | 詳細說明 |
| 特殊需求 | `special_requests` | `requests`, `requirements` | |

---

## ⚠️ 現有不一致記錄（歷史遺留）

以下是資料庫與 TypeScript 中已存在的不一致欄位，暫時凍結不修改。新開發必須使用標準名稱。

---

### 1. 出生日期不一致 ⭐

| 來源 | 現有欄位 | 應統一為 | 狀態 |
|------|---------|---------|------|
| `employees` 表 | `birthday` | `birth_date` | 🔴 待修正 |
| `customers` 表 | `date_of_birth` | `birth_date` | 🔴 待修正 |
| `order_members` 表 | `birth_date` | `birth_date` | ✅ 正確 |
| `order.types.ts` Member | `birthday` | `birth_date` | 🔴 待修正 |
| `order.types.ts` CreateMemberData | `date_of_birth` | `birth_date` | 🔴 待修正 |

---

### 2. 英文姓名不一致

| 來源 | 現有欄位 | 應統一為 | 狀態 |
|------|---------|---------|------|
| `employees` 表 | `english_name` | `english_name` | ✅ 正確 |
| `customers` 表 | `english_name` | `english_name` | ✅ 正確 |
| `suppliers` 表 | `name_en` | `english_name` | 🔴 待修正 |
| `order.types.ts` Member | `name_en` | `english_name` | 🔴 待修正 |

---

### 3. 護照效期不一致

| 來源 | 現有欄位 | 應統一為 | 狀態 |
|------|---------|---------|------|
| `customers` 表 | `passport_expiry_date` | `passport_expiry` | 🔴 待修正 |
| `order_members` 表 | `passport_expiry` | `passport_expiry` | ✅ 正確 |
| `customer.types.ts` | `passport_expiry_date` | `passport_expiry` | 🔴 待修正 |

---

### 4. 護照姓名不一致

| 來源 | 現有欄位 | 應統一為 | 狀態 |
|------|---------|---------|------|
| `customers` 表 | `passport_romanization` | `passport_name` | 🔴 待修正 |
| `order_members` 表 | `passport_name` | `passport_name` | ✅ 正確 |
| `customer.types.ts` | `passport_romanization` | `passport_name` | 🔴 待修正 |

---

### 5. 備註欄位重複/不一致

| 來源 | 現有欄位 | 應統一為 | 狀態 |
|------|---------|---------|------|
| `suppliers` 表 | `note` + `notes` | `notes`（刪除 `note`） | 🔴 重複欄位 |
| 其他表格 | `remarks` | `notes` | 🔴 待修正 |

---

### 6. 聯絡人欄位模式不一致

應統一使用以下模式：
- 聯絡人姓名：`contact_person`
- 聯絡電話：`contact_phone`
- 聯絡 Email：`contact_email`

| 來源 | 現有欄位 | 問題 |
|------|---------|------|
| 部分表格 | `contact` (Json) | 🟡 結構化資料，可接受 |
| 部分表格 | `contact_info` (Json) | 🔴 應改為 `contact` |

---

### 7. 日期欄位命名不一致

| 概念 | 正確命名 | 發現的錯誤命名 |
|------|---------|--------------|
| 旅遊團出發 | `departure_date` | `start_date` |
| 旅遊團返回 | `return_date` | `end_date` |
| 入住日期 | `check_in_date` | `checkin`, `check_in` |
| 退房日期 | `check_out_date` | `checkout`, `check_out` |

---

### 8. TypeScript 與資料庫欄位不同步

| 檔案 | TypeScript 欄位 | 資料庫欄位 | 問題 |
|------|---------------|-----------|------|
| `order.types.ts` | `Member.birthday` | `order_members.birth_date` | 🔴 不同步 |
| `order.types.ts` | `Member.name_en` | `order_members.chinese_name` | 🔴 不同步 |
| `order.types.ts` | `CreateMemberData.date_of_birth` | N/A | 🔴 使用錯誤名稱 |

---

### 凍結說明

以上不一致為歷史遺留問題，修正需要：
1. 資料庫 Migration
2. 修改所有相關程式碼
3. 資料遷移

**暫時凍結這些不一致**，但：
- ⚠️ 新開發**必須**使用標準欄位名稱
- ⚠️ 修改現有功能時，**不要**擴散錯誤命名
- ⚠️ TypeScript 介面應逐步與資料庫同步

---

## 📊 實體標準欄位組合

### 人員實體（Customer/Employee/Member）標準欄位

```typescript
// 基本資料
chinese_name: string       // 中文姓名
english_name: string       // 英文姓名
gender: string            // 性別 (male/female/other)
birth_date: string        // 出生日期

// 聯絡資訊
phone: string             // 主要電話
alternative_phone: string // 備用電話
email: string             // Email
address: string           // 地址

// 證件資料
id_number: string         // 身分證字號
passport_number: string   // 護照號碼
passport_name: string     // 護照姓名（拼音）
passport_expiry: string   // 護照效期
passport_image_url: string // 護照圖片

// 通用欄位
notes: string             // 備註
is_active: boolean        // 是否啟用
created_at: string        // 建立時間
updated_at: string        // 更新時間
created_by: string        // 建立者 ID
updated_by: string        // 更新者 ID
```

### 訂單/交易實體標準欄位

```typescript
code: string              // 編號
status: string            // 狀態
total_amount: number      // 總金額
paid_amount: number       // 已付金額
remaining_amount: number  // 待付金額
payment_status: string    // 付款狀態

// 聯絡人（訂單用）
contact_person: string    // 聯絡人姓名
contact_phone: string     // 聯絡電話
contact_email: string     // 聯絡 Email

// 關聯
tour_id: string           // 旅遊團 ID
customer_id: string       // 客戶 ID
```

### 旅遊團實體標準欄位

```typescript
code: string              // 團號
name: string              // 團名
location: string          // 目的地
departure_date: string    // 出發日期
return_date: string       // 返回日期
status: string            // 狀態
max_participants: number  // 最大人數
current_participants: number // 當前人數
price: number             // 價格
total_revenue: number     // 總收入
total_cost: number        // 總成本
profit: number            // 利潤
```

### 供應商實體標準欄位

```typescript
code: string              // 供應商編號
name: string              // 中文名稱
english_name: string      // 英文名稱（不是 name_en）
phone: string             // 電話
email: string             // Email
address: string           // 地址
contact_person: string    // 聯絡人
tax_id: string            // 統編
bank_name: string         // 銀行名稱
bank_account: string      // 銀行帳號
notes: string             // 備註（不是 note）
```

---

## 🔧 開發指南

### 新增欄位時

1. **先查閱本文件**，確認標準欄位名稱
2. **檢查現有表格**，是否已有相同概念的欄位
3. **使用標準名稱**，不要自創新命名

```typescript
// ❌ 錯誤：未查閱規範，自創命名
interface NewFeature {
  member_birthday: string  // ❌ 應該用 birth_date
  member_name: string      // ❌ 應該用 chinese_name
}

// ✅ 正確：使用標準欄位名
interface NewFeature {
  birth_date: string       // ✅ 標準名稱
  chinese_name: string     // ✅ 標準名稱
}
```

### 需要前綴的情況

當同一表格需要儲存**多個同類資料**時，使用前綴區分：

```typescript
// ✅ 正確：使用前綴區分
order_members: {
  hotel_1_name: string     // 第一間飯店名稱
  hotel_1_checkin: string  // 第一間飯店入住日
  hotel_2_name: string     // 第二間飯店名稱
  hotel_2_checkin: string  // 第二間飯店入住日
}
```

### TypeScript 介面同步

TypeScript 介面必須與資料庫欄位**完全一致**：

```typescript
// ✅ 正確：TypeScript 與資料庫一致
interface OrderMember {
  chinese_name: string | null  // 對應 order_members.chinese_name
  birth_date: string | null    // 對應 order_members.birth_date
  passport_expiry: string | null // 對應 order_members.passport_expiry
}

// ❌ 錯誤：TypeScript 使用不同名稱
interface OrderMember {
  name: string           // ❌ 資料庫是 chinese_name
  birthday: string       // ❌ 資料庫是 birth_date
}
```

---

## ✅ 檢查清單

### 新增欄位前

- [ ] 是否已查閱本文件的標準欄位名稱？
- [ ] 是否已確認沒有現有欄位可重用？
- [ ] 欄位名稱是否符合 snake_case 格式？
- [ ] TypeScript 介面是否與資料庫同步？

### Code Review 時

- [ ] 新增欄位是否使用標準命名？
- [ ] 是否有自創的非標準欄位名？
- [ ] TypeScript 欄位名是否與資料庫一致？

---

## 📚 相關文件

| 文件 | 內容 |
|------|------|
| `docs/NAMING_CONVENTION_STANDARD.md` | snake_case 格式規範 |
| `docs/DATABASE_DESIGN_STANDARDS.md` | 資料庫設計標準 |
| `src/lib/supabase/types.ts` | Supabase 自動生成的類型（單一真相來源） |
| `src/types/*.ts` | 業務類型定義 |

---

## 🚀 Claude 快速參考

開發新功能時，直接複製以下標準欄位：

```typescript
// === 人員基本資料 ===
chinese_name: string | null     // 中文姓名
english_name: string | null     // 英文姓名
birth_date: string | null       // 出生日期 (YYYY-MM-DD)
gender: string | null           // 性別
phone: string | null            // 電話
email: string | null            // Email
address: string | null          // 地址

// === 證件資料 ===
id_number: string | null        // 身分證
passport_number: string | null  // 護照號碼
passport_name: string | null    // 護照姓名
passport_expiry: string | null  // 護照效期

// === 訂單/金額 ===
total_amount: number            // 總金額
paid_amount: number             // 已付金額
remaining_amount: number        // 待付金額
selling_price: number           // 售價
cost_price: number              // 成本

// === 統計數量 ===
adult_count: number             // 成人數
child_count: number             // 兒童數
infant_count: number            // 嬰兒數
member_count: number            // 團員數

// === 日期 ===
departure_date: string          // 出發日期
return_date: string             // 返回日期
check_in_date: string           // 入住日期
check_out_date: string          // 退房日期

// === 關聯 ID ===
tour_id: string                 // 旅遊團 ID
order_id: string                // 訂單 ID
customer_id: string             // 客戶 ID
employee_id: string             // 員工 ID

// === 通用欄位 ===
code: string                    // 編號
name: string                    // 名稱
status: string                  // 狀態
notes: string | null            // 備註
is_active: boolean              // 是否啟用
created_at: string              // 建立時間
updated_at: string              // 更新時間
created_by: string              // 建立者
updated_by: string              // 更新者
```

### ⚠️ 常見錯誤提醒

| 錯誤寫法 | 正確寫法 |
|---------|---------|
| `birthday` | `birth_date` |
| `date_of_birth` | `birth_date` |
| `name_en` | `english_name` |
| `passport_expiry_date` | `passport_expiry` |
| `passport_romanization` | `passport_name` |
| `note` | `notes` |
| `start_date` | `departure_date` |
| `end_date` | `return_date` |
| `max_people` | `max_participants` |
| `total` | `total_amount` |

---

**注意**: `src/lib/supabase/types.ts` 是資料庫欄位的**單一真相來源**。當對欄位名稱有疑問時，以該檔案為準。
