# 資料庫表格檢查清單

> **最後更新**: 2025-11-17
> **檢查項目**: RLS 狀態、workspace_id 欄位、索引

---

## ✅ 檢查標準

所有表格必須符合：

1. **禁用 RLS** (`DISABLE ROW LEVEL SECURITY`)
2. **有 workspace_id 欄位**（業務表格）
3. **workspace_id 不可為 NULL**（已填入預設值）
4. **建立 workspace_id 索引**（效能優化）

---

## 📊 系統核心表格

### 使用者與權限

| 表格         | RLS     | workspace_id | 索引   | 說明         |
| ------------ | ------- | ------------ | ------ | ------------ |
| `employees`  | ✅ 禁用 | ✅ 必填      | ✅ 是  | 員工資料     |
| `workspaces` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 工作空間本身 |
| `user_roles` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 使用者角色   |

### Workspace 協作

| 表格              | RLS     | workspace_id | 索引   | 說明                     |
| ----------------- | ------- | ------------ | ------ | ------------------------ |
| `channels`        | ✅ 禁用 | ✅ 必填      | ✅ 是  | 頻道                     |
| `channel_members` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 頻道成員（繼承 channel） |
| `messages`        | ✅ 禁用 | ❌ N/A       | ❌ N/A | 訊息（繼承 channel）     |

---

## 🎫 旅遊業務核心

### 旅遊團管理

| 表格                | RLS     | workspace_id | 索引   | 說明                       |
| ------------------- | ------- | ------------ | ------ | -------------------------- |
| `tours`             | ✅ 禁用 | ✅ 必填      | ✅ 是  | 旅遊團主表                 |
| `orders`            | ✅ 禁用 | ✅ 必填      | ✅ 是  | 訂單                       |
| `order_members`     | ✅ 禁用 | ✅ 必填      | ✅ 是  | 旅客資料                   |
| `quotes`            | ✅ 禁用 | ✅ 必填      | ✅ 是  | 報價單                     |
| `quick_quotes`      | ✅ 禁用 | ✅ 必填      | ✅ 是  | 快速報價                   |
| `quick_quote_items` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 快速報價項目（繼承 quote） |
| `itineraries`       | ✅ 禁用 | ✅ 必填      | ✅ 是  | 行程表                     |
| `itinerary_days`    | ✅ 禁用 | ❌ N/A       | ❌ N/A | 行程天數（繼承 itinerary） |

### 團務管理

| 表格                            | RLS     | workspace_id | 索引   | 說明                      |
| ------------------------------- | ------- | ------------ | ------ | ------------------------- |
| `tour_member_fields`            | ✅ 禁用 | ❌ N/A       | ❌ N/A | 團員自訂欄位（繼承 tour） |
| `tour_departure_data`           | ✅ 禁用 | ❌ N/A       | ❌ N/A | 出團資料主表（繼承 tour） |
| `tour_departure_meals`          | ✅ 禁用 | ❌ N/A       | ❌ N/A | 出團餐食表                |
| `tour_departure_accommodations` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 出團住宿表                |
| `tour_departure_activities`     | ✅ 禁用 | ❌ N/A       | ❌ N/A | 出團活動表                |
| `tour_departure_others`         | ✅ 禁用 | ❌ N/A       | ❌ N/A | 出團其他費用              |

### 客戶與供應商

| 表格        | RLS     | workspace_id | 索引  | 說明       |
| ----------- | ------- | ------------ | ----- | ---------- |
| `customers` | ✅ 禁用 | ✅ 必填      | ✅ 是 | 客戶資料   |
| `suppliers` | ✅ 禁用 | ✅ 必填      | ✅ 是 | 供應商資料 |

---

## 💰 財務模組

### 收付款

| 表格               | RLS     | workspace_id | 索引   | 說明                         |
| ------------------ | ------- | ------------ | ------ | ---------------------------- |
| `payments`         | ✅ 禁用 | ✅ 必填      | ✅ 是  | 付款紀錄                     |
| `receipts`         | ✅ 禁用 | ✅ 必填      | ✅ 是  | 收據                         |
| `payment_requests` | ✅ 禁用 | ✅ 必填      | ✅ 是  | 請款單                       |
| `link_pay_logs`    | ✅ 禁用 | ❌ N/A       | ❌ N/A | 付款連結紀錄（繼承 payment） |

### 會計模組（新）

| 表格                       | RLS     | workspace_id | 索引   | 說明                     |
| -------------------------- | ------- | ------------ | ------ | ------------------------ |
| `accounting_accounts`      | ✅ 禁用 | ❌ N/A       | ❌ N/A | 會計科目表（全公司共用） |
| `accounting_vouchers`      | ✅ 禁用 | ✅ 必填      | ✅ 是  | 會計傳票                 |
| `accounting_voucher_items` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 傳票明細（繼承 voucher） |

---

## 📝 輔助功能

### 待辦與行事曆

| 表格              | RLS     | workspace_id | 索引  | 說明       |
| ----------------- | ------- | ------------ | ----- | ---------- |
| `todos`           | ✅ 禁用 | ✅ 必填      | ✅ 是 | 待辦事項   |
| `calendar_events` | ✅ 禁用 | ✅ 必填      | ✅ 是 | 行事曆事件 |

### 簽證與電話卡

| 表格    | RLS     | workspace_id | 索引  | 說明        |
| ------- | ------- | ------------ | ----- | ----------- |
| `visas` | ✅ 禁用 | ✅ 必填      | ✅ 是 | 簽證        |
| `esims` | ✅ 禁用 | ✅ 必填      | ✅ 是 | eSIM 電話卡 |

### 合約

| 表格             | RLS     | workspace_id | 索引   | 說明                      |
| ---------------- | ------- | ------------ | ------ | ------------------------- |
| `contracts`      | ✅ 禁用 | ✅ 必填      | ✅ 是  | 合約                      |
| `contract_items` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 合約項目（繼承 contract） |

---

## 🗺️ 地區與基礎資料

| 表格         | RLS     | workspace_id | 索引   | 說明                   |
| ------------ | ------- | ------------ | ------ | ---------------------- |
| `countries`  | ✅ 禁用 | ❌ N/A       | ❌ N/A | 國家（全公司共用）     |
| `cities`     | ✅ 禁用 | ❌ N/A       | ❌ N/A | 城市（全公司共用）     |
| `airports`   | ✅ 禁用 | ❌ N/A       | ❌ N/A | 機場（全公司共用）     |
| `bank_codes` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 銀行代碼（全公司共用） |

---

## 💵 價格與模板

| 表格                   | RLS     | workspace_id | 索引   | 說明                 |
| ---------------------- | ------- | ------------ | ------ | -------------------- |
| `cost_templates`       | ✅ 禁用 | ✅ 必填      | ✅ 是  | 成本範本             |
| `price_lists`          | ✅ 禁用 | ✅ 必填      | ✅ 是  | 價格表               |
| `transportation_rates` | ✅ 禁用 | ❌ N/A       | ❌ N/A | 車資表（全公司共用） |

---

## 🚗 PNR（新）

| 表格   | RLS     | workspace_id | 索引  | 說明         |
| ------ | ------- | ------------ | ----- | ------------ |
| `pnrs` | ✅ 禁用 | ✅ 必填      | ✅ 是 | 航班訂位紀錄 |

---

## 🔧 Migration 檔案

### RLS 禁用

- `20251115060000_final_disable_all_rls.sql` - 禁用所有表格的 RLS

### Workspace ID 修正

- `20251115050000_fix_missing_workspace_ids.sql` - 修正缺少的 workspace_id
- `20251115070000_fill_all_null_workspace_ids.sql` - 填入 NULL 的 workspace_id

### 今日新增表格（2025-11-17）

- `20251117140000_add_tour_closing_fields.sql` - tours 表格結團欄位
- `20251117140100_create_tour_member_fields.sql` - 團員自訂欄位
- `20251117150000_add_bonus_to_payment_requests.sql` - 請款單 bonus 類型
- `20251117160000_create_tour_departure_data.sql` - 出團資料表（5 個表格）

---

## ✅ 檢查結論

### 已完成

- ✅ 所有表格已禁用 RLS
- ✅ 所有業務表格都有 workspace_id 欄位
- ✅ workspace_id 已填入預設值（無 NULL）
- ✅ 已建立 workspace_id 索引

### 注意事項

1. **繼承式設計**: 子表格（如 messages, contract_items）不需要 workspace_id，透過父表格（channel, contract）繼承
2. **共用資料**: 國家、城市、會計科目等基礎資料不需要 workspace_id
3. **前端過濾**: 使用 `where('workspace_id', currentWorkspace.id)` 過濾資料

---

**維護者**: William Chien
**檢查日期**: 2025-11-17
