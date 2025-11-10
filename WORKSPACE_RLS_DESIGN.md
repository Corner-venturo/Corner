# Workspace RLS 設計文件

## 資料隔離策略

### 🔒 完全隔離（各看各的）
這些資料台北/台中**完全分開**，不需要互相看到：
- ✅ `orders` - 訂單
- ✅ `itineraries` - 行程
- ✅ `customers` - 客戶
- ✅ `todos` - 待辦事項（個人）
- ✅ `payments` - 收款記錄
- ✅ `payment_requests` - 請款單
- ✅ `disbursement_orders` - 出納單
- ✅ `employees` - 員工資料

### 🔓 條件共享（需要邀請/權限）
這些資料**預設隔離**，但可以透過權限系統共享：

#### 1. Channels（頻道）
```
實作方式：
- channels 表格有 workspace_id（屬於哪個公司建立）
- channel_members 控制誰能加入
- 管理者可以邀請其他 workspace 的員工

RLS 策略：
SELECT: 我是 channel_members 之一
INSERT: 我的 workspace 或我有權限
```

#### 2. Quotes（報價單）
```
實作方式：
- 預設只有自己公司能看
- 透過 workspace_permissions 授予跨公司查看權限
- 或建立 shared_quotes 表格記錄共享的報價單

選項 A - 用權限系統：
  台中主管設定「可查看台北的報價單」權限

選項 B - 個別共享：
  在 quotes 加 shared_with_workspaces (uuid[]) 欄位
```

#### 3. Calendar Events（行事曆）
```
實作方式：
選項 A - 加 visibility 欄位：
  - 'private': 只有自己
  - 'workspace': 整個公司
  - 'shared': 跨公司共享（需指定對象）

選項 B - 用 event_attendees 表格：
  記錄誰被邀請參加（可以是其他公司的人）

RLS 策略：
SELECT: 
  - 我建立的
  - 我的 workspace 且 visibility = 'workspace'
  - event_attendees 包含我
```

### 🌐 全公司共享（不分台北台中）
這些資料**所有人都能看到**：
- ✅ `suppliers` - 供應商
- ✅ `destinations` - 目的地
- ✅ `supplier_categories` - 供應商分類
- ✅ `bulletins` - 公告
- ✅ `tours` - 旅遊產品（？需確認）

---

## 📱 前端調整需求

### 1. 員工管理（HR）
**檔案**: `src/app/hr/employees/page.tsx` 或類似

**需要加入**:
```tsx
// 新增/編輯員工表單
<FormField name="workspace_id" label="所屬辦公室">
  <Select>
    <option value="台北ID">台北辦公室</option>
    <option value="台中ID">台中辦公室</option>
  </Select>
</FormField>
```

### 2. 所有業務資料建立
**需要自動填入 workspace_id**:
```tsx
// 在 store 的 create 方法中
async create(data) {
  const currentUser = useAuthStore.getState().user;
  const employee = await getEmployee(currentUser.id);
  
  return supabase.from('orders').insert({
    ...data,
    workspace_id: employee.workspace_id  // 自動帶入
  });
}
```

### 3. 權限與選單分離
**新增 user_preferences 系統**:
```typescript
// employees 表格加入
interface Employee {
  // ... 現有欄位
  hidden_menu_items?: string[];  // ['tours', 'suppliers', ...]
}

// 或建立新表格
interface UserPreference {
  user_id: uuid;
  hidden_menu_items: string[];
  dashboard_layout: json;
}
```

### 4. LinkPay 設定
**在 workspaces 表格加入**:
```typescript
interface Workspace {
  // ... 現有欄位
  payment_config?: {
    linkpay: {
      api_key: string;
      merchant_id: string;
      environment: 'production' | 'sandbox';
    };
    // 其他支付方式...
  };
}
```

---

## 🔧 實作優先順序

### Phase 1: 基礎隔離（立即執行）
1. ✅ 建立台北/台中 workspace
2. ✅ 填充 workspace_id 到所有表格
3. ⏳ 啟用基本 RLS 策略（完全隔離的表格）
4. ⏳ 前端：員工管理加入 workspace 選擇
5. ⏳ 前端：自動填入 workspace_id

### Phase 2: 條件共享（接下來）
1. Channels 邀請系統（已有 channel_members）
2. Quotes 共享策略（待確認用哪種方式）
3. Calendar 共享機制（待確認用哪種方式）

### Phase 3: 設定系統（最後）
1. 權限與選單分離
2. Workspace 付款設定
3. 跨公司權限管理介面

---

## ❓ 需要確認的問題

1. **報價單共享**: 用權限系統 vs 個別共享？
2. **行事曆共享**: visibility 欄位 vs attendees 表格？
3. **Tours（旅遊產品）**: 要隔離還是共享？
4. **選單隱藏**: 存在 employees 表格 vs 新建 user_preferences？

