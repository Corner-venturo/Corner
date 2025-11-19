# Venturo 專案改進計劃

**生成日期**: 2025-11-19
**專案狀態**: 功能完整，程式碼品質需改進

---

## 📊 現況分析總結

### ✅ 優點
1. **功能完整**: 核心業務功能已實作完成
2. **Realtime 系統**: 完整的即時同步機制
3. **良好的 Logger 使用**: 584 處使用 logger vs 只有 1 處 console.log
4. **絕對路徑優先**: 1963 處使用 @/ vs 220 處使用相對路徑
5. **權限系統**: RLS 已禁用，採用前端權限控制

### ❌ 問題分析

#### 🔴 嚴重問題 (P0 - 必須修復)

##### 1. 型別安全問題
```
總計: 468 個 `as any` 型別繞過
最嚴重的檔案:
- supplier.service.ts (13個)
- QuotesPage.tsx (12個)
- tour-members-advanced.tsx (11個)
- background-sync-service.ts (10個)
- api.ts (10個)

風險: 執行時期錯誤、難以維護、重構困難
```

##### 2. 巨型檔案問題
```
Top 5 超大檔案:
1. types.ts (4993 行) ← 自動生成，可接受
2. PrintableQuotation.tsx (973 行) ← 需拆分
3. PrintableQuickQuote.tsx (922 行) ← 需拆分
4. schemas.ts (772 行) ← 可接受
5. OrderMembersExpandable.tsx (770 行) ← 需拆分

問題: 難以理解、測試困難、合併衝突頻繁
```

##### 3. 測試覆蓋率為零
```
測試檔案數: 0
風險: 無法保證重構安全性、容易引入 regression bugs
```

#### 🟡 重要問題 (P1 - 應該修復)

##### 4. 重複的 Store Factory
```
發現: src/stores/core/create-store.ts
狀態: 應該刪除，統一使用 create-store-new.ts
```

##### 5. 程式碼品質問題
```
TODO 註解: 27 個
eslint-disable: 69 個
FIXME: 0 個

部分 eslint-disable 可能隱藏真正的問題
```

##### 6. Supabase 查詢仍有型別問題
```
(supabase as any): 8 處 (已減少，原本更多)
需要繼續清理
```

#### 🟢 次要問題 (P2 - 可以改進)

##### 7. 架構設計
```
- Service Layer 太薄 (5 個，建議 12-15 個)
- API Layer 不完整 (4 個 routes)
- Workspace Store Facade 耦合 5 個 stores
```

##### 8. 相對路徑混用
```
220 處使用 ../ (應該全部改為 @/)
```

---

## 🎯 改進計劃

### Phase 1: 型別安全修復 (2-3 週)

**目標**: 清除所有 468 個 `as any`

#### Week 1: Service Layer (64 個)
- [ ] supplier.service.ts (13個) - 需重構整個服務
- [ ] background-sync-service.ts (10個)
- [ ] api.ts (10個)
- [ ] tour.service.ts (9個)
- [ ] local-auth-service.ts (8個)
- [ ] base.service.ts (7個)
- [ ] order.service.ts (7個)

**策略**:
```typescript
// 錯誤模式
const result: any = await supabase.from('tours').select()
return result.data as any

// 修正模式
const { data, error } = await supabase.from('tours').select()
if (error) throw error
return data as Tour[]
```

#### Week 2: UI Components (200+ 個)
- [ ] QuotesPage.tsx (12個)
- [ ] tour-members-advanced.tsx (11個)
- [ ] CategorySection.tsx (10個)
- [ ] widget-config.tsx (10個)
- [ ] itinerary/[slug]/page.tsx (10個)
- [ ] 其他 UI 組件

**策略**:
1. 定義正確的 Props 介面
2. 使用 React.FC<Props> 或函數簽名
3. 避免 event handler 的 any

#### Week 3: Store & Hooks (50+ 個)
- [ ] workspace-permission-store.ts (6個)
- [ ] auth-store.ts (6個)
- [ ] use-realtime-hooks.ts (8個 - 部分已修正)
- [ ] operations/create.ts (4個)

**預期成果**:
- `as any` 從 468 → 0
- TypeScript strict mode 可啟用

---

### Phase 2: 檔案拆分 (1-2 週)

#### 優先拆分檔案

##### 1. PrintableQuotation.tsx (973 行)
```
拆分為:
├── PrintableQuotation.tsx (主組件 ~200 行)
├── components/
│   ├── QuotationHeader.tsx
│   ├── QuotationFlightSection.tsx
│   ├── QuotationHotelSection.tsx
│   ├── QuotationPriceSection.tsx
│   └── QuotationFooter.tsx
└── utils/
    └── quotation-formatters.ts
```

##### 2. PrintableQuickQuote.tsx (922 行)
```
拆分為:
├── PrintableQuickQuote.tsx (~200 行)
├── components/
│   ├── QuickQuoteHeader.tsx
│   ├── QuickQuoteItemList.tsx
│   └── QuickQuoteSummary.tsx
└── utils/
    └── quick-quote-formatters.ts
```

##### 3. OrderMembersExpandable.tsx (770 行)
```
拆分為:
├── OrderMembersExpandable.tsx (~150 行)
├── components/
│   ├── MemberTable.tsx
│   ├── MemberRow.tsx
│   ├── MemberEditDialog.tsx
│   └── MemberActions.tsx
└── hooks/
    └── useOrderMembers.ts
```

##### 4. sidebar.tsx (746 行)
```
拆分為:
├── sidebar.tsx (~100 行)
├── components/
│   ├── SidebarNavigation.tsx
│   ├── SidebarMenuItem.tsx
│   ├── SidebarFooter.tsx
│   └── SidebarWorkspaceSelector.tsx
└── hooks/
    └── useSidebarNavigation.ts
```

**原則**: 每個檔案 < 300 行，單一職責

---

### Phase 3: 測試建立 (2-3 週)

#### 測試策略

##### 1. 單元測試 (優先)
```typescript
// 目標覆蓋率: 60%
src/
├── lib/
│   ├── utils/*.test.ts (工具函數)
│   ├── formatters/*.test.ts (格式化函數)
│   └── validators/*.test.ts (驗證函數)
├── stores/
│   └── *-store.test.ts (狀態管理)
└── features/
    └── */services/*.test.ts (業務邏輯)
```

**範例**:
```typescript
// src/lib/utils/format-date.test.ts
import { formatDate } from './format-date'

describe('formatDate', () => {
  it('should format date correctly', () => {
    expect(formatDate('2025-01-01')).toBe('2025-01-01')
  })

  it('should handle invalid date', () => {
    expect(formatDate('invalid')).toBe('')
  })
})
```

##### 2. 整合測試 (次要)
```typescript
// 目標覆蓋率: 30%
- Store + Service 整合測試
- Realtime 同步測試
- IndexedDB + Supabase 同步測試
```

##### 3. E2E 測試 (可選)
```typescript
// 目標: 關鍵流程
- 登入流程
- 建立訂單流程
- 報價單生成流程
```

**工具選擇**:
- Vitest (快速、與 Vite 整合)
- React Testing Library (組件測試)
- Playwright (E2E，可選)

---

### Phase 4: 架構優化 (2-3 週)

#### 1. 清理重複的 Store Factory
```bash
# 刪除舊版
rm src/stores/core/create-store.ts

# 確認所有 store 使用新版
grep -r "from './core/create-store'" src/stores
# 應該沒有結果

# 統一使用
grep -r "from './core/create-store-new'" src/stores
```

#### 2. 擴充 Service Layer
```
當前: 5 個 services
目標: 15 個 services

新增:
├── features/
│   ├── quotes/services/
│   │   ├── quote.service.ts (已存在)
│   │   ├── quote-item.service.ts (新增)
│   │   └── quote-pdf.service.ts (新增)
│   ├── tours/services/
│   │   ├── tour.service.ts (已存在)
│   │   ├── tour-member.service.ts (新增)
│   │   └── tour-addon.service.ts (新增)
│   ├── payments/services/
│   │   ├── payment-request.service.ts (新增)
│   │   ├── disbursement-order.service.ts (已存在)
│   │   └── receipt-order.service.ts (新增)
│   └── customers/services/
│       ├── customer.service.ts (已存在)
│       └── customer-history.service.ts (新增)
```

#### 3. 統一 Import 路徑
```bash
# 將所有相對路徑改為絕對路徑
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from "\.\./\.\./|from "@/|g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from "\.\./|from "@/|g'

# 驗證
grep -r "from '\.\." src --include="*.ts" --include="*.tsx" | wc -l
# 應該是 0
```

#### 4. 解耦 Workspace Store
```typescript
// 當前問題: workspace-store.ts 耦合太多
import { useWorkspaceItemsStore } from './workspace-items-store'
import { useChannelStore } from './channel-store'
import { useMessageStore } from './message-store'
import { useChannelMemberStore } from './channel-member-store'
import { useChannelGroupStore } from './channel-group-store'

// 解決方案: 使用事件匯流排或 Context
// 1. 建立 WorkspaceContext
// 2. 各 Store 獨立訂閱
// 3. 移除直接依賴
```

---

### Phase 5: 程式碼品質提升 (持續)

#### 1. 清理 TODO 註解 (27 個)
```bash
# 列出所有 TODO
grep -rn "// TODO" src --include="*.ts" --include="*.tsx"

# 對每個 TODO:
# - 轉成 GitHub Issue
# - 或者立即修復
# - 或者刪除過時的 TODO
```

#### 2. 檢視 eslint-disable (69 個)
```bash
# 列出所有 eslint-disable
grep -rn "eslint-disable" src --include="*.ts" --include="*.tsx"

# 分類:
# - 合理的 disable (保留但加註解說明)
# - 可修復的問題 (修復後移除 disable)
# - 過時的 disable (直接移除)
```

#### 3. 啟用更嚴格的 TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,              // ✅ 已啟用
    "noUncheckedIndexedAccess": true,  // 新增
    "noImplicitOverride": true,        // 新增
    "exactOptionalPropertyTypes": true // 新增 (可選)
  }
}
```

#### 4. 加強 ESLint 規則
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",  // 禁止 any
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "error",
    "import/no-cycle": "error"  // 禁止循環依賴
  }
}
```

---

## 📈 成功指標 (KPI)

### 程式碼品質指標
| 指標 | 當前 | 目標 | 時程 |
|------|------|------|------|
| `as any` 數量 | 468 | 0 | 3 週 |
| 測試覆蓋率 | 0% | 60% | 6 週 |
| 超大檔案 (>500 行) | 20 個 | 5 個 | 4 週 |
| TODO 註解 | 27 | 0 | 2 週 |
| TypeScript strict | ✅ | ✅ | - |
| 平均檔案行數 | ~250 | <200 | 4 週 |

### 架構指標
| 指標 | 當前 | 目標 |
|------|------|------|
| Service 數量 | 5 | 15 |
| Store Factory | 2 個 (重複) | 1 個 |
| 相對路徑 import | 220 | 0 |
| eslint-disable | 69 | <30 |

---

## 🚀 執行計劃

### Week 1-3: 型別安全
- 每天修復 20-30 個 `as any`
- 優先處理 Service Layer
- 建置必須通過

### Week 4-5: 檔案拆分
- 拆分 4 個最大的檔案
- 確保拆分後功能不變
- 更新所有 imports

### Week 6-8: 測試建立
- 建立測試基礎設施
- 優先測試工具函數和 stores
- 目標 60% 覆蓋率

### Week 9-11: 架構優化
- 清理重複程式碼
- 擴充 Service Layer
- 解耦複雜依賴

### Week 12+: 持續改進
- 程式碼審查流程
- 自動化品質檢查
- 文件完善

---

## 💡 實作建議

### 1. 漸進式改進
- **不要**一次大重構
- **要**每次改一小塊
- 每次改動都要能通過建置
- 使用 feature branch

### 2. 自動化工具
```bash
# 安裝
npm install -D prettier husky lint-staged

# pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# lint-staged 配置
{
  "*.{ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "git add"
  ]
}
```

### 3. 程式碼審查檢查清單
- [ ] 沒有新增 `as any`
- [ ] TypeScript 建置通過
- [ ] 相關測試通過
- [ ] 檔案 < 300 行
- [ ] 使用絕對路徑 `@/`

---

## 📚 參考資源

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Effective TypeScript](https://effectivetypescript.com/)

### 測試
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

### 架構
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

**最後更新**: 2025-11-19
**下次檢視**: 每週一

