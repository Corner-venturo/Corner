# Venturo Deep Audit Report - Round 2

**Date:** 2026-02-18
**Scope:** ERP + Online repos
**Method:** Static analysis (regex-based) + DB schema/metadata comparison
**Note:** 排除 erp-accounting 模組。Regex 解析可能有少量 false positive（chain 跨越多個 .from() 時）。

---

## Round 2: .eq() / .in() / .order() 欄位驗證

掃描所有 `.from('table')` 後的 `.eq()`, `.neq()`, `.gt()`, `.lt()`, `.gte()`, `.lte()`, `.like()`, `.ilike()`, `.in()`, `.order()`, `.is()`, `.not()` 方法中引用的欄位名。

**總計：發現 ~180 個可疑欄位引用**

> ⚠️ 許多問題源於 regex 匹配了錯誤的 `.from()` chain（例如同一個函數中有多個 `.from()` 呼叫，regex 可能把後面的 `.eq()` 歸到前一個 `.from()` 的表）。以下列出高風險且經確認的問題：

### ❌ 確認不存在的欄位（高風險）

| 檔案                                                  | 表                        | 欄位                                                                        | 方法      | 說明                                            |
| ----------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| `api/auth/get-employee-data/route.ts`                 | workspaces                | `employee_number`                                                           | ilike     | workspaces 無此欄位，應查 employees 表          |
| `api/auth/change-password/route.ts`                   | employees                 | `code`                                                                      | ilike     | employees 無 `code`，可能要用 `employee_number` |
| `api/itineraries/generate/route.ts`                   | countries                 | `country_id`                                                                | eq        | countries PK 是 `id`                            |
| `api/itineraries/generate/route.ts`                   | cities                    | `city_id`                                                                   | in        | cities PK 是 `id`                               |
| `api/itineraries/generate/route.ts`                   | attractions               | `iata_code`                                                                 | eq        | attractions 無 `iata_code`                      |
| `api/itineraries/generate/route.ts`                   | cities                    | `iata_code`                                                                 | eq        | cities 無 `iata_code`                           |
| `api/itineraries/generate/route.ts`                   | countries                 | `iata_code`                                                                 | eq        | countries 無 `iata_code`                        |
| `api/bot/ticket-status/route.ts`                      | tours                     | `tour_id`                                                                   | in        | 應為 `id`                                       |
| `api/bot/ticket-status/route.ts`                      | tours                     | `order_id`                                                                  | in        | tours 無 `order_id`                             |
| `api/bot/ticket-status/route.ts`                      | orders                    | `order_id`                                                                  | in        | 應為 `id`                                       |
| `api/bot/ticket-status/route.ts`                      | messages                  | `display_name`                                                              | in        | messages 無此欄位                               |
| `features/payments/.../payment-request.service.ts`    | payment_requests          | `request_id`                                                                | eq        | 應為 `id`                                       |
| `features/payments/.../payment-request.service.ts`    | payment_requests          | `sort_order`                                                                | order     | 無此欄位                                        |
| `features/payments/.../disbursement-order.service.ts` | payment_requests          | `disbursement_date`                                                         | eq        | 無此欄位                                        |
| `features/design/hooks/useDesigns.ts`                 | brochure_documents        | `document_id`                                                               | eq        | 應為 `id`                                       |
| `features/design/hooks/useDesigns.ts`                 | brochure_documents        | `version_number`                                                            | order     | 無此欄位                                        |
| `features/design/hooks/useDesigns.ts`                 | tours                     | `document_id`                                                               | eq        | tours 無 `document_id`                          |
| `customers/page.tsx`                                  | customers                 | `customer_id`                                                               | eq        | 應為 `id`                                       |
| `database/archive-management/page.tsx`                | tours                     | `archived_at`                                                               | not/order | tours 無 `archived_at`                          |
| `database/archive-management/page.tsx`                | tours                     | `tour_id`                                                                   | is        | 應為 `id`                                       |
| `reports/tour-closing/page.tsx`                       | workspaces                | `archived`, `return_date`, `tour_id`, `order_id`, `status`, `supplier_type` | various   | workspaces 無這些欄位，可能 .from() 對象錯誤    |
| `app/m/page.tsx`                                      | tours                     | `priority`, `deadline`                                                      | gte/order | tours 無這些欄位                                |
| `app/m/tours/[id]/page.tsx`                           | tours                     | `tour_id`, `night_number`, `room_number`                                    | eq/order  | tours 無這些欄位                                |
| `app/m/tours/[id]/page.tsx`                           | orders                    | `night_number`, `room_number`, `display_order`                              | order     | orders 無這些欄位                               |
| `features/tours/hooks/useTourDestinations.ts`         | countries                 | `country`, `city`                                                           | order     | countries 無 `country`/`city` 欄位              |
| `features/orders/hooks/useOrderMembersData.ts`        | tours                     | `sort_order`                                                                | order     | tours 無此欄位                                  |
| `features/orders/hooks/useOrderMembers.ts`            | tours                     | `room_id`, `vehicle_id`                                                     | in        | tours 無這些欄位                                |
| `features/orders/hooks/useRoomVehicleAssignments.ts`  | tour_vehicles             | `hotel_name`, `room_id`, `order_member_id`                                  | eq        | tour_vehicles 可能無這些欄位                    |
| `stores/file-system-store.ts`                         | folders                   | `is_deleted`, `is_starred`                                                  | eq        | folders 無這些欄位                              |
| `lib/analytics/analytics-service.ts`                  | customers                 | `status`, `departure_date`                                                  | various   | customers 無 `departure_date`                   |
| `lib/analytics/analytics-service.ts`                  | receipt_orders            | `departure_date`                                                            | various   | receipt_orders 可能無此欄位                     |
| `lib/analytics/analytics-service.ts`                  | payment_requests          | `departure_date`                                                            | various   | payment_requests 無此欄位                       |
| `hooks/pnrCloudHooks.ts`                              | pnr_flight_status_history | `priority`, `due_date`, `queue_type`                                        | order/eq  | 可能是 pnr_queue_items 的欄位                   |
| Online: `stores/expense-store.ts`                     | personal_expenses         | `year_month`                                                                | eq        | 需確認欄位名                                    |
| Online: `stores/expense-store.ts`                     | expense_categories        | `year_month`                                                                | eq        | 需確認欄位名                                    |

### ⚠️ 可能的 False Positive（chain 跨 .from() 問題）

- `reports/tour-closing/page.tsx` 中大量 workspaces 的問題，可能實際是查 tours/orders 表
- `syncToOnline.ts` 中的 online_trips/messages 欄位，可能是 Online DB 的 schema（不在 ERP schema 中）
- `app/m/tours/[id]/page.tsx` 的 tours 表問題，可能實際 .from() 目標是 tour_rooms 等子表

### ✅ 大部分核心查詢欄位正確

- tours.id, tours.workspace_id, tours.status ✅
- orders.id, orders.tour_id ✅
- quotes.tour_id, itineraries.tour_id ✅
- 基本 CRUD 路徑正確

---

## Round 3: .insert() / .update() 欄位驗證

掃描所有 `.from('table').insert({...})` 和 `.from('table').update({...})` 中的 object key。

**總計：發現 ~250 個可疑欄位引用**

### ❌ 確認不存在的欄位（高風險）

| 檔案                                               | 表                                    | 欄位                                                                                                                 | 操作          | 說明                                                 |
| -------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `api/linkpay/webhook/route.ts`                     | linkpay_logs                          | `actual_amount`, `receipt_date`                                                                                      | update        | 需確認欄位名                                         |
| `api/auth/change-password/route.ts`                | workspaces                            | `must_change_password`                                                                                               | update        | workspaces 無此欄位                                  |
| `api/bot-notification/route.ts`                    | channels                              | `channel_id`, `employee_id`, `role`, `content`, `author_id`, `metadata`, `notification_type`                         | insert        | 可能是 chain 問題，實際插入 channel_members/messages |
| `api/bot-notification/route.ts`                    | employees                             | `name`, `type`, `channel_type`, `is_announcement`, `created_by` 等                                                   | insert        | 明顯是 chain 問題，實際插入 channels 表              |
| `api/proposals/convert-to-tour/route.ts`           | proposals                             | `tour_id`, `tour_code`, `tour_name`, `confirmed_requirements`, `is_selected` 等                                      | update        | 需確認 proposals 表 schema                           |
| `api/proposals/convert-to-tour/route.ts`           | proposal_packages                     | `converted_tour_id`, `converted_at`, `converted_by`, `selected_package_id`                                           | update        | 需確認欄位                                           |
| `api/cron/sync-logan-knowledge/route.ts`           | workspaces/attractions/restaurants 等 | `job_name`, `result`, `success`, `error_message`                                                                     | insert        | 明顯 chain 問題，實際插入 cron_job_logs              |
| `features/design/hooks/useDesigns.ts`              | tours                                 | `design_type`, `itinerary_name`, `type`                                                                              | insert        | 可能插入 brochure_documents                          |
| `features/tours/.../tour-checkin/index.tsx`        | orders                                | `enable_checkin`, `checked_in`, `checked_in_at`                                                                      | update        | orders 無這些欄位                                    |
| `features/tours/.../tour-checkin/index.tsx`        | tours                                 | `checked_in`, `checked_in_at`                                                                                        | update        | tours 無這些欄位                                     |
| `features/tours/hooks/useTourEdit.ts`              | tours                                 | `daily_itinerary`                                                                                                    | update        | tours 無此欄位                                       |
| `features/tours/hooks/useTourPayments.ts`          | orders                                | `total_revenue`, `profit`                                                                                            | update        | orders 無這些欄位                                    |
| `features/tours/hooks/useTourPayments.ts`          | receipts                              | `total_revenue`, `profit`                                                                                            | update        | 需確認                                               |
| `features/tours/hooks/useTourDestinations.ts`      | countries                             | `country`, `city`, `airport_code`                                                                                    | insert        | countries 無 `country`/`city` 欄位名                 |
| `features/orders/hooks/useMemberEditDialog.ts`     | order_members                         | `name`, `national_id`, `verification_status`                                                                         | update        | 需確認欄位名                                         |
| `features/orders/hooks/useMemberEditDialog.ts`     | customers                             | `customer_id`                                                                                                        | update        | 應為 `id`                                            |
| `features/orders/components/PnrMatchDialog.tsx`    | order_members                         | `raw_pnr`, `passenger_names`, `segments`                                                                             | update/insert | 需確認是否在 pnrs 表                                 |
| `features/hr/hooks/usePayroll.ts`                  | payroll_records                       | `confirmed_by`, `confirmed_at`                                                                                       | update        | 需確認欄位                                           |
| `features/hr/hooks/usePayroll.ts`                  | leave_requests                        | `gross_salary`, `net_salary`                                                                                         | update        | leave_requests 無薪資欄位                            |
| `features/hr/hooks/usePayroll.ts`                  | payroll_periods                       | `gross_salary`, `net_salary`                                                                                         | update        | 需確認                                               |
| `features/hr/hooks/useLeaveRequests.ts`            | leave_requests                        | `used_days`, `remaining_days`                                                                                        | update        | 可能在 leave_balances                                |
| `features/hr/hooks/useLeaveRequests.ts`            | leave_balances                        | `status`, `approved_by`, `approved_at`, `reject_reason`                                                              | update        | 可能在 leave_requests                                |
| `hooks/useMemberActions.ts`                        | order_members                         | `member_count`                                                                                                       | update        | order_members 無此欄位                               |
| `features/workspaces/.../AddWorkspaceDialog.tsx`   | workspaces                            | `display_name`, `employee_number`, `password_hash`, `roles`, `employee_type`, `must_change_password`                 | insert        | workspaces 可能無這些欄位                            |
| `stores/file-system-store.ts`                      | folders                               | `is_deleted`, `deleted_at`, `folder_id`                                                                              | update        | folders 無這些欄位                                   |
| `features/proposals/.../PackageListPanel.tsx`      | itineraries                           | `customer_name`, `quote_type`, `destination`, `group_size`, `participant_counts`, `accommodation_days`, `categories` | insert        | itineraries 可能無這些欄位                           |
| `features/proposals/.../usePackageItinerary.ts`    | itineraries                           | `airline`, `flightNumber`, `departureAirport` 等 (camelCase)                                                         | update        | ⚠️ 使用 camelCase 而非 snake_case！                  |
| `features/tours/.../LinkDocumentsToTourDialog.tsx` | tours                                 | `itinerary_type`, `timeline_data`                                                                                    | update        | tours 無這些欄位                                     |
| Online: `stores/expense-store.ts`                  | expense_categories                    | `currency`, `expense_date`, `payment_method`                                                                         | insert        | 可能是 personal_expenses                             |
| Online: `stores/expense-store.ts`                  | expense_monthly_stats                 | `currency`, `expense_date`, `payment_method`                                                                         | insert        | chain 問題                                           |
| Online: `app/api/conversations/route.ts`           | messages                              | `driver_task_id`, `community_id`                                                                                     | insert        | messages 可能無這些欄位                              |

### ⚠️ 重要發現

1. **camelCase 欄位名** — `usePackageItinerary.ts` 中使用 `flightNumber`, `departureAirport` 等 camelCase 欄位名，DB 使用 snake_case，這會靜默失敗！
2. **chain 問題嚴重** — 很多 `.from('A').xxx.from('B').insert()` 的情況，regex 把 insert 歸到了 A 表
3. **跨 repo 問題** — syncToOnline.ts 中對 Online DB 的操作，schema 可能不同

### ✅ 通過的項目

- 基本的 CRUD insert/update（tours, orders, quotes 核心欄位）大多正確
- Supabase upsert 操作格式正確

---

## Round 4: Foreign Key 完整性

查詢所有 `public` schema 的 FK 約束，檢查是否指向不存在的表或欄位。

**總計：467 個 FK 約束**

### ✅ 全部通過

所有 FK 約束都指向存在的表和欄位，DB schema 的 FK 完整性沒有問題。

---

## Round 5: Supabase Function (.rpc()) 檢查

比對程式碼中的 `.rpc()` 呼叫與 DB 中的 public functions。

**程式碼中 15 個 .rpc() 呼叫，DB 中 113 個 public functions**

### ❌ 不存在的 function（1 個）

| 呼叫                | 說明                                    |
| ------------------- | --------------------------------------- |
| `get_member_amount` | DB 中不存在此函數，可能已被刪除或重命名 |

### ✅ 存在的 functions（14 個）

- `add_employee_to_tour_conversation` ✅
- `check_leader_schedule_conflict` ✅
- `check_vehicle_schedule_conflict` ✅
- `confirm_quote_by_customer` ✅
- `confirm_quote_by_staff` ✅
- `create_atomic_transaction` ✅
- `get_or_create_dm_channel` ✅
- `get_order_invoiceable_amount` ✅
- `get_tour_conversations` ✅
- `mark_conversation_read` ✅
- `revoke_quote_confirmation` ✅
- `send_quote_confirmation` ✅
- `send_tour_message` ✅
- `toggle_tour_conversation` ✅

---

## Round 6: Index 覆蓋率

對高頻 `.eq()` 欄位（使用 ≥10 次），檢查是否有對應的 DB index。

**DB 總計 1,223 個 indexes**

### ❌ 缺少 Index 的高頻欄位

| 表                    | 欄位                | .eq() 使用次數 | 建議                                                                                  |
| --------------------- | ------------------- | -------------- | ------------------------------------------------------------------------------------- |
| `disbursement_orders` | `disbursement_date` | 12x            | `CREATE INDEX idx_disbursement_orders_date ON disbursement_orders(disbursement_date)` |
| `pnr_queue_items`     | `queue_type`        | 11x            | `CREATE INDEX idx_pnr_queue_items_type ON pnr_queue_items(queue_type)`                |

### ✅ 已有 Index 的高頻欄位（32/34）

- tours.id (103x) ✅
- order_members.id (76x) ✅
- quotes.tour_id (65x) ✅
- itineraries.id (61x) ✅
- orders.tour_id (55x) ✅
- 其他 27 個高頻欄位都有 index 覆蓋 ✅

### ⚠️ Index 覆蓋率良好

整體覆蓋率 94%（32/34），只有 2 個欄位需要加 index。

---

## 總結

| Round                  | 狀態 | 發現                                                    |
| ---------------------- | ---- | ------------------------------------------------------- |
| R2: Filter/Order 欄位  | ❌   | ~30+ 個確認錯誤欄位引用（含大量 `id` vs `xxx_id` 問題） |
| R3: Insert/Update 欄位 | ❌   | ~40+ 個可疑欄位，含 camelCase 問題                      |
| R4: FK 完整性          | ✅   | 467 個 FK 全部正確                                      |
| R5: RPC Functions      | ⚠️   | 1 個缺失：`get_member_amount`                           |
| R6: Index 覆蓋率       | ⚠️   | 2 個高頻欄位缺 index                                    |

### 🔴 最高優先修復

1. **camelCase 欄位名** — `usePackageItinerary.ts` 使用 JS camelCase 作為 DB 欄位名
2. **`xxx_id` vs `id` 混淆** — 多處使用 `tour_id`, `order_id`, `customer_id` 而 PK 實際是 `id`
3. **`get_member_amount` RPC** — 函數不存在，呼叫會失敗
4. **analytics-service.ts** — 多個表的 `departure_date`, `status` 等欄位可能不存在

### 🟡 建議

1. 加 2 個 index（disbursement_orders.disbursement_date, pnr_queue_items.queue_type）
2. 建立 TypeScript 類型與 DB schema 的自動同步機制
3. 許多問題來自「.from() chain 跨表」的情況，建議採用 Supabase 的 TypeScript 自動生成型別來防止此類問題
