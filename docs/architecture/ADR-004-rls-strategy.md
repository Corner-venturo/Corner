# ADR-004: RLS 策略（workspace_id + authenticated + service_role）

## 狀態：Accepted

## 背景

Venturo 是多租戶（multi-tenant）系統，每個旅行社是一個 workspace。
需要確保：
1. 不同 workspace 的資料互相隔離
2. ERP 使用者只能存取自己 workspace 的資料
3. Online 系統只能看到公開的、已發布的資料
4. 系統級操作（如 recalculate）需要跨越 RLS 限制

## 決策

採用三層 RLS 策略：

### 第一層：workspace_id 隔離
- 大多數業務表都有 `workspace_id` 欄位
- RLS Policy: `workspace_id = auth.jwt() -> 'workspace_id'`
- 向後相容：同時允許 `workspace_id IS NULL` 的舊資料

```sql
-- 典型 RLS Policy
CREATE POLICY "workspace_isolation" ON tours
  FOR ALL
  USING (
    workspace_id = (auth.jwt() ->> 'workspace_id')::uuid
    OR workspace_id IS NULL  -- 向後相容
  );
```

### 第二層：authenticated 角色
- ERP 使用者以 `authenticated` 角色存取
- JWT 包含 `workspace_id`、`roles` 等 claims
- 前端透過 Supabase Auth 取得 JWT

### 第三層：service_role 跳過 RLS
- 後端 / 核心邏輯使用 `service_role` key
- 例如：recalculate 函數需要跨訂單查詢
- 前端 client 端的 recalculate 使用 authenticated client（因為已有正確的 workspace_id）

### 特殊角色：super_admin
- `super_admin` 可跨 workspace 查詢（`shouldCrossWorkspace` 判斷）
- 在 createEntityHook 中，super_admin 開啟跨 workspace 模式時不注入 workspace_id filter

### 不需要 workspace 隔離的表
- `suppliers` — 供應商可能跨 workspace 共用
- `erp_transactions`、`erp_vouchers` — 沒有 workspace_id 欄位
- 共用設定表（如 cities、countries）

## 理由

1. **Supabase 原生支援**：RLS 是 PostgreSQL 原生功能，Supabase 有良好支援
2. **安全性**：即使前端程式碼被繞過，DB 層仍然有保護
3. **透明性**：前端 query 不需要手動加 workspace_id filter（RLS 自動處理）
4. **靈活性**：service_role 可以做跨 workspace 操作（如報表、migrate）

## 後果

### 正面
- 資料隔離在 DB 層保證，即使前端有 bug 也不會洩漏
- 前端開發者不需要記得加 workspace_id filter
- super_admin 可以方便地查看所有 workspace

### 負面
- RLS Policy 數量多，維護成本高
- Debug 困難：RLS 導致的「查不到資料」不會給明確錯誤
- 新增表格時容易忘記設定 RLS（需要 checklist）
- `workspace_id IS NULL` 的向後相容增加查詢複雜度

### 必做 Checklist（新增表格時）
1. ✅ 新增 `workspace_id` 欄位（如果是業務表）
2. ✅ 建立 RLS Policy（至少 SELECT 和 INSERT）
3. ✅ 加入 `WORKSPACE_SCOPED_TABLES` 列表（createEntityHook.ts）
4. ✅ 測試：不同 workspace 的使用者互相看不到資料
