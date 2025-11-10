# 前端 Workspace 更新計劃

## ❌ 發現的問題

### 1. 編號生成函數參數不匹配
所有編號生成函數都已更新為需要 `workspaceCode` 參數，但以下檔案仍使用舊格式：

#### 需要修改的檔案：

1. **`src/stores/operations/create.ts:48`**
   ```typescript
   // ❌ 舊的
   const code = generateCode({ prefix: codePrefix }, existingItems)
   
   // ✅ 新的
   const workspaceCode = await getWorkspaceCode()
   const code = generateCode(workspaceCode, { prefix: codePrefix }, existingItems)
   ```

2. **`src/features/tours/services/tour.service.ts`**
   - 需要傳入 `workspaceCode` 參數

3. **`src/features/quotes/hooks/useQuoteActions.ts:224`**
   - 使用舊的 `generateTourCode()`

4. **`src/app/finance/payments/hooks/usePaymentData.ts:75`**
   - `generateReceiptNumber()` 需要 `workspaceCode`

5. **`src/lib/utils.ts` 和 `src/constants/destinations.ts`**
   - 有重複的 `generateTourCode()` 函數定義

### 2. Workspace Code 取得方式

需要建立一個全域函數來取得當前使用者的 workspace code：

```typescript
// src/lib/workspace/get-workspace-code.ts
export async function getCurrentWorkspaceCode(): Promise<string> {
  // 從 auth store 或 employees 表取得當前使用者的 workspace
  // 然後查詢 workspaces 表取得 code (TP/TC)
}
```

### 3. 自動填入 workspace_id

所有資料建立時需要自動填入 `workspace_id`：

- Orders
- Itineraries
- Customers
- Payments
- Quotes
- Tours
- Calendar Events
- Channels
- Messages
- Todos

## ✅ 修改優先順序

### Priority 1: 建立 Workspace Helper
1. 建立 `get-workspace-code.ts`
2. 建立 `get-workspace-id.ts`

### Priority 2: 修改 Core Stores
1. `src/stores/operations/create.ts` - 所有 store 共用
2. `src/stores/operations/update.ts` - 檢查是否需要 workspace_id

### Priority 3: 修改 Service Layer
1. `tour.service.ts`
2. Payment related services

### Priority 4: 修改 Hooks
1. `useQuoteActions.ts`
2. `useTourOperations.ts`
3. `usePaymentData.ts`

### Priority 5: 清理重複定義
1. 刪除 `src/lib/utils.ts` 的 `generateTourCode()`
2. 刪除 `src/constants/destinations.ts` 的 `generateTourCode()`
3. 統一使用 `src/stores/utils/code-generator.ts`

## 📋 檢查清單

- [ ] 建立 workspace helper functions
- [ ] 修改 create.ts
- [ ] 修改 tour.service.ts
- [ ] 修改 useQuoteActions.ts
- [ ] 修改 usePaymentData.ts
- [ ] 清理重複的函數定義
- [ ] 測試編號生成
- [ ] 測試 workspace_id 自動填入
- [ ] 部署前檢查

