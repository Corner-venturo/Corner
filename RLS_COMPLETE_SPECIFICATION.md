# Venturo RLS 完整規範

> **建立日期**: 2025-12-11
> **目的**: 實作完整的 Row Level Security 資料隔離與權限控制
> **狀態**: 規劃中

---

## 📋 目錄

1. [核心概念](#核心概念)
2. [表格分類與 RLS 策略](#表格分類與-rls-策略)
3. [行事曆系統](#行事曆系統)
4. [超級管理員權限](#超級管理員權限)
5. [員工管理](#員工管理)
6. [前端調整需求](#前端調整需求)
7. [Migration SQL](#migration-sql)

---

## 核心概念

### 分公司架構

```
Venturo 公司
├── 台北分公司 (workspace_id: 'taipei')
│   ├── 員工 A, B, C
│   ├── 訂單 #001, #002
│   └── 客戶資料
│
└── 台中分公司 (workspace_id: 'taichung')
    ├── 員工 D, E, F
    ├── 訂單 #003, #004
    └── 客戶資料
```

### 權限層級

```typescript
1. 一般員工
   - 只能看自己分公司的資料
   - workspace_id = 'taipei' → 只看台北的資料

2. 超級管理員 (super_admin)
   - 可以看所有分公司的資料
   - 需要有分公司篩選器
   - 預設顯示自己分公司，可切換

3. 行事曆特殊規則
   - 個人行事曆：只有自己看得到
   - 分公司行事曆：同分公司都看得到
   - 公司行事曆：全公司都看得到（管理員建立）
```

---

## 表格分類與 RLS 策略

### 分類 1：完全隔離（Workspace Isolation）

**原則**: 台北看不到台中，台中看不到台北（除非是超級管理員）

| 表格 | 說明 | workspace_id 欄位 | RLS Policy |
|------|------|------------------|------------|
| **orders** | 訂單 | ✅ 有 | 完全隔離 |
| **tours** | 旅遊團 | ✅ 有 | 完全隔離 |
| **customers** | 客戶 | ✅ 有 | 完全隔離 |
| **payments** | 付款記錄 | ✅ 有 | 完全隔離 |
| **payment_requests** | 付款申請 | ✅ 有 | 完全隔離 |
| **disbursement_orders** | 請款單 | ✅ 有 | 完全隔離 |
| **receipts** | 收據 | ✅ 有 | 完全隔離 |
| **quotes** | 報價單 | ✅ 有 | 完全隔離 |
| **contracts** | 合約 | ✅ 有 | 完全隔離 |
| **itineraries** | 行程表 | ✅ 有 | 完全隔離 |
| **visas** | 簽證 | ✅ 有 | 完全隔離 |
| **vendor_costs** | 供應商成本 | ✅ 有 | 完全隔離 |

**RLS Policy 範例**:
```sql
-- SELECT: 看自己分公司 OR 超級管理員
CREATE POLICY "orders_select" ON orders FOR SELECT
USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
);

-- INSERT: 只能新增到自己分公司
CREATE POLICY "orders_insert" ON orders FOR INSERT
WITH CHECK (workspace_id = get_current_user_workspace());

-- UPDATE/DELETE: 只能改自己分公司 OR 超級管理員
CREATE POLICY "orders_update" ON orders FOR UPDATE
USING (
  workspace_id = get_current_user_workspace()
  OR is_super_admin()
);
```

---

### 分類 2：行事曆（特殊可見性）

| 表格 | 新增欄位 | 可見性規則 |
|------|---------|-----------|
| **calendar_events** | `visibility` | private / workspace / company_wide |

**可見性規則**:
```sql
CREATE TYPE calendar_visibility AS ENUM ('private', 'workspace', 'company_wide');

ALTER TABLE calendar_events
ADD COLUMN visibility calendar_visibility DEFAULT 'workspace';

COMMENT ON COLUMN calendar_events.visibility IS '
  private: 只有建立者本人看得到
  workspace: 同分公司的人都看得到
  company_wide: 全公司都看得到（只有管理員能建立）
';
```

**RLS Policy**:
```sql
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
USING (
  CASE visibility
    WHEN 'private' THEN created_by = auth.uid()
    WHEN 'workspace' THEN workspace_id = get_current_user_workspace()
    WHEN 'company_wide' THEN true
  END
);

CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT
WITH CHECK (
  -- 一般員工只能建立 private 或 workspace
  (visibility IN ('private', 'workspace') AND workspace_id = get_current_user_workspace())
  OR
  -- 管理員可以建立 company_wide
  (visibility = 'company_wide' AND is_super_admin())
);
```

---

### 分類 3：通訊系統（Channel Members 控制）

| 表格 | 說明 | RLS 規則 |
|------|------|---------|
| **channels** | 頻道 | 基於 channel_members |
| **messages** | 訊息 | 基於 channel_members |
| **channel_threads** | 討論串 | 基於 channel_members |

**RLS Policy**:
```sql
-- Channels: 只能看自己是成員的頻道
CREATE POLICY "channels_select" ON channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = channels.id
    AND employee_id = get_current_employee_id()
  )
);

-- Messages: 只能看自己有權限的頻道的訊息
CREATE POLICY "messages_select" ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN channels c ON c.id = cm.channel_id
    WHERE c.id = messages.channel_id
    AND cm.employee_id = get_current_employee_id()
  )
);
```

---

### 分類 4：個人資料（User-based）

| 表格 | 說明 | RLS 規則 |
|------|------|---------|
| **user_preferences** | 用戶偏好設定 | 只能存取自己的 |
| **personal_canvases** | 個人畫布 | 只能存取自己的 |

**RLS Policy**:
```sql
CREATE POLICY "user_preferences_all" ON user_preferences FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

### 分類 5：全公司共用（無 RLS）

| 表格 | 說明 | 為什麼不需要 RLS |
|------|------|----------------|
| **workspaces** | 工作空間 | 全公司共用的基礎資料 |
| **employees** | 員工 | 全公司共用（但有 workspace_id 標記所屬） |
| **user_roles** | 用戶角色 | 權限系統基礎資料 |
| **destinations** | 目的地 | 旅遊基礎資料 |
| **airlines** | 航空公司 | 旅遊基礎資料 |
| **hotels** | 飯店 | 旅遊基礎資料 |
| **suppliers** | 供應商 | 共用資料 |
| **cities** | 城市 | 基礎資料 |
| **countries** | 國家 | 基礎資料 |
| **attractions** | 景點 | 旅遊基礎資料 |

**處理方式**:
```sql
-- 明確禁用 RLS
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
-- ... 其他表格
```

---

## 行事曆系統

### 使用情境

#### 情境 1：個人行事曆
```typescript
// 員工 A 建立個人提醒
createCalendarEvent({
  title: '記得打電話給客戶',
  visibility: 'private',
  workspace_id: 'taipei',
  created_by: 'user_a_id'
})

// 結果：只有員工 A 看得到
```

#### 情境 2：分公司行事曆
```typescript
// 台北分公司員工建立
createCalendarEvent({
  title: '台北辦公室例會',
  visibility: 'workspace',
  workspace_id: 'taipei',
  created_by: 'user_a_id'
})

// 結果：
// ✅ 台北員工 A, B, C 都看得到
// ❌ 台中員工 D, E, F 看不到
```

#### 情境 3：公司行事曆
```typescript
// 超級管理員建立
createCalendarEvent({
  title: '公司尾牙',
  visibility: 'company_wide',
  workspace_id: null, // 可以是 null 或任何值
  created_by: 'admin_id'
})

// 結果：
// ✅ 所有員工都看得到
```

### 前端 UI 設計

```typescript
// src/app/calendar/create-event.tsx
<Select name="visibility">
  <Option value="private">個人行事曆 👤</Option>
  <Option value="workspace">
    分公司行事曆 🏢 (只有{user.workspace.name}看得到)
  </Option>
  {user.isSuperAdmin && (
    <Option value="company_wide">公司行事曆 🌍 (全公司)</Option>
  )}
</Select>
```

---

## 超級管理員權限

### 識別超級管理員

```sql
-- Helper Function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;
```

### 資料存取規則

```typescript
// 一般員工
const orders = await supabase
  .from('orders')
  .select('*')
// RLS 自動過濾 → 只回傳 workspace_id = 'taipei'

// 超級管理員
const orders = await supabase
  .from('orders')
  .select('*')
// RLS 允許 → 回傳所有分公司的資料
```

### 前端篩選器（超級管理員專用）

```typescript
// src/components/workspace-filter.tsx
export function WorkspaceFilter() {
  const { user } = useAuthStore();
  const [selectedWorkspace, setSelectedWorkspace] = useState(user.workspace_id);

  if (!user.isSuperAdmin) {
    return null; // 一般員工不顯示
  }

  return (
    <Select
      value={selectedWorkspace}
      onChange={setSelectedWorkspace}
    >
      <Option value="all">全部分公司</Option>
      <Option value="taipei">台北分公司</Option>
      <Option value="taichung">台中分公司</Option>
    </Select>
  );
}
```

**使用範例**:
```typescript
// src/app/orders/page.tsx
export default function OrdersPage() {
  const { user } = useAuthStore();
  const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(null);

  const fetchOrders = async () => {
    let query = supabase.from('orders').select('*');

    // 超級管理員可以選擇要看哪個分公司
    if (user.isSuperAdmin && workspaceFilter && workspaceFilter !== 'all') {
      query = query.eq('workspace_id', workspaceFilter);
    }

    // RLS 會自動處理：
    // - 一般員工：只看自己分公司
    // - 超級管理員：看全部（或根據 filter）

    return await query;
  };

  return (
    <div>
      {user.isSuperAdmin && (
        <WorkspaceFilter onChange={setWorkspaceFilter} />
      )}
      <OrderList />
    </div>
  );
}
```

---

## 員工管理

### 建立員工時分辨台北/台中

```typescript
// src/app/employees/create/page.tsx
<Form onSubmit={createEmployee}>
  <Input name="name" label="姓名" />
  <Input name="email" label="Email" />

  {/* 分公司選擇 */}
  <Select name="workspace_id" label="所屬分公司" required>
    <Option value="taipei">台北分公司</Option>
    <Option value="taichung">台中分公司</Option>
  </Select>

  {/* 角色選擇 */}
  <Select name="role" label="角色">
    <Option value="employee">一般員工</Option>
    <Option value="admin">管理員</Option>
    <Option value="super_admin">超級管理員</Option>
  </Select>
</Form>
```

### 員工資料結構

```sql
-- employees 表格（不啟用 RLS，但有 workspace_id 標記）
employees:
  id: uuid
  user_id: uuid (references auth.users)
  name: text
  email: text
  workspace_id: text (references workspaces.id) -- 所屬分公司
  permissions: jsonb
  created_at: timestamptz
```

### 驗證規則

```typescript
// 新增員工時自動驗證
const createEmployee = async (data) => {
  // 驗證 1: workspace_id 必須存在
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', data.workspace_id)
    .single();

  if (!workspace) {
    throw new Error('無效的分公司');
  }

  // 驗證 2: 一般管理員只能建立自己分公司的員工
  if (!user.isSuperAdmin && data.workspace_id !== user.workspace_id) {
    throw new Error('您只能建立自己分公司的員工');
  }

  // 建立員工
  await supabase.from('employees').insert({
    ...data,
    workspace_id: data.workspace_id
  });
};
```

---

## 前端調整需求

### 1. 登入後設定 workspace_id（關鍵！）

```typescript
// src/stores/auth-store.ts
const login = async (email, password) => {
  // 1. Supabase 登入
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // 2. 取得員工資料（包含 workspace_id）
  const { data: employee } = await supabase
    .from('employees')
    .select('*, workspaces(*)')
    .eq('user_id', user.id)
    .single();

  // 3. 設定當前 workspace_id 到 Supabase session
  await supabase.rpc('set_current_workspace', {
    workspace_id: employee.workspace_id
  });

  // 4. 儲存到 store
  set({
    user: {
      ...user,
      employee: employee,
      workspace_id: employee.workspace_id,
      isSuperAdmin: employee.roles?.includes('super_admin')
    }
  });
};
```

### 2. 所有資料建立時自動帶入 workspace_id

```typescript
// src/stores/order-store.ts
const create = async (orderData) => {
  const { user } = useAuthStore.getState();

  return await supabase.from('orders').insert({
    ...orderData,
    workspace_id: user.workspace_id, // 自動帶入
    created_by: user.id
  });
};
```

### 3. 超級管理員的篩選器

需要在以下頁面加入分公司篩選：
- ✅ 訂單列表 (`/orders`)
- ✅ 旅遊團列表 (`/tours`)
- ✅ 客戶列表 (`/customers`)
- ✅ 付款記錄 (`/payments`)
- ✅ 報價單列表 (`/quotes`)
- ✅ 行程表列表 (`/itineraries`)

### 4. 行事曆 UI 調整

```typescript
// src/app/calendar/page.tsx
export default function CalendarPage() {
  const { user } = useAuthStore();

  return (
    <div>
      {/* 行事曆篩選器 */}
      <CalendarFilters>
        <Checkbox checked={showPersonal}>個人行事曆</Checkbox>
        <Checkbox checked={showWorkspace}>
          {user.workspace.name} 行事曆
        </Checkbox>
        {user.isSuperAdmin && (
          <Checkbox checked={showCompany}>公司行事曆</Checkbox>
        )}
      </CalendarFilters>

      {/* 新增事件按鈕 */}
      <Button onClick={openCreateDialog}>
        新增行事曆
      </Button>
    </div>
  );
}
```

---

## Helper Functions

```sql
-- 1. 取得當前用戶的 workspace_id
CREATE OR REPLACE FUNCTION get_current_user_workspace()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  workspace_id text;
BEGIN
  -- 優先從 session 取得
  workspace_id := current_setting('app.current_workspace_id', true);

  -- 如果沒有，從 employees 表格取得
  IF workspace_id IS NULL THEN
    SELECT e.workspace_id INTO workspace_id
    FROM employees e
    WHERE e.user_id = auth.uid();
  END IF;

  RETURN workspace_id;
END;
$$;

-- 2. 檢查是否為超級管理員
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- 3. 取得當前員工 ID
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  emp_id uuid;
BEGIN
  SELECT e.id INTO emp_id
  FROM employees e
  WHERE e.user_id = auth.uid();

  RETURN emp_id;
END;
$$;

-- 4. 設定當前 workspace（前端登入時呼叫）
CREATE OR REPLACE FUNCTION set_current_workspace(p_workspace_id text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', p_workspace_id, false);
END;
$$;
```

---

## 檢查清單

### 資料庫 Migration

- [ ] 建立 Helper Functions
- [ ] calendar_events 加上 `visibility` 欄位
- [ ] 啟用所有業務表格的 RLS
- [ ] 建立所有 RLS Policies
- [ ] 驗證 RLS 運作正常

### 前端調整

- [ ] 登入時設定 `current_workspace_id`
- [ ] 所有資料建立自動帶入 `workspace_id`
- [ ] 超級管理員的分公司篩選器
- [ ] 行事曆 visibility 選擇器
- [ ] 員工建立時的分公司選擇

### 測試項目

- [ ] 台北員工看不到台中資料
- [ ] 台中員工看不到台北資料
- [ ] 超級管理員可以看所有資料
- [ ] 個人行事曆只有自己看得到
- [ ] 分公司行事曆同分公司看得到
- [ ] 公司行事曆全公司看得到
- [ ] Channel members 控制正確

---

## 下一步

1. **審查此規範** - 確認是否符合業務需求
2. **執行 Migration SQL** - 啟用 RLS
3. **前端調整** - 實作分公司篩選器
4. **測試驗證** - 確保資料隔離正確

---

**問題回報**: 如有任何問題或需求變更，請更新此文檔
