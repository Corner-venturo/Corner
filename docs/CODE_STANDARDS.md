# 📋 Venturo 代碼規範 - 嚴格執行版

**版本**: 2.0.0
**日期**: 2025-12-10
**強制執行**: ✅ 必須

---

## ⚠️ 零容忍規則

以下規則**絕對禁止違反**，違反者必須立即修正：

### 🚫 規則 #1: 禁止使用 `any` 類型

```typescript
// ❌ 絕對禁止
function handleData(data: any) { }
const items: any[] = []
const result: any = await fetch()

// ✅ 必須使用明確類型
function handleData(data: CustomerData) { }
const items: Customer[] = []
const result: ApiResponse = await fetch()

// ✅ 如果真的不知道類型，使用 unknown 並做類型檢查
function handleData(data: unknown) {
  if (isCustomerData(data)) {
    // 現在可以安全使用
  }
}
```

**例外情況**（需要團隊審查）：
- 第三方套件沒有類型定義
- 動態 JSON 解析（但仍需立即驗證）

---

### 🚫 規則 #2: 單一文件行數限制

| 文件類型 | 最大行數 | 超過時的處理 |
|---------|---------|-------------|
| 組件 (.tsx) | 300 行 | 🔴 必須拆分 |
| Hook | 200 行 | 🔴 必須拆分 |
| 工具函數 | 150 行 | 🔴 必須拆分 |
| 類型定義 | 500 行 | 🔴 必須拆分 |
| API 路由 | 200 行 | 🔴 必須拆分 |

**檢查命令**：
```bash
# 找出所有超過 300 行的組件
find src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 300 {print}'

# 自動化檢查（CI/CD 中執行）
npm run lint:file-size
```

---

### 🚫 規則 #3: 組件職責單一

```typescript
// ❌ 錯誤：一個組件做太多事
function CustomerPage() {
  // 資料獲取
  const [customers, setCustomers] = useState([])
  useEffect(() => { /* 複雜的 fetch 邏輯 */ }, [])

  // 表單處理
  const handleSubmit = () => { /* 100 行表單邏輯 */ }

  // 過濾排序
  const filtered = customers.filter(/* 複雜邏輯 */)

  // UI 渲染
  return (
    <div>{/* 500 行 JSX */}</div>
  )
}

// ✅ 正確：拆分成多個組件和 Hook
function CustomerPage() {
  const { customers, loading } = useCustomers() // Hook 負責資料
  const { filteredCustomers } = useCustomerFilter(customers) // Hook 負責過濾

  return (
    <div>
      <CustomerFilters /> {/* 獨立組件 */}
      <CustomerTable customers={filteredCustomers} /> {/* 獨立組件 */}
      <CustomerForm /> {/* 獨立組件 */}
    </div>
  )
}
```

---

### 🚫 規則 #4: 禁止超過 3 層嵌套

```typescript
// ❌ 錯誤：嵌套太深
if (user) {
  if (user.role === 'admin') {
    if (user.workspace) {
      if (user.workspace.active) {
        // 做某事
      }
    }
  }
}

// ✅ 正確：提前返回（Early Return）
if (!user) return
if (user.role !== 'admin') return
if (!user.workspace) return
if (!user.workspace.active) return

// 做某事
```

---

### 🚫 規則 #5: 函數參數不超過 3 個

```typescript
// ❌ 錯誤：參數太多
function createUser(
  name: string,
  email: string,
  role: string,
  workspace: string,
  department: string,
  active: boolean
) { }

// ✅ 正確：使用物件參數
interface CreateUserParams {
  name: string
  email: string
  role: string
  workspace: string
  department: string
  active: boolean
}

function createUser(params: CreateUserParams) { }

// 使用時更清晰
createUser({
  name: 'John',
  email: 'john@example.com',
  role: 'admin',
  workspace: 'abc',
  department: 'IT',
  active: true,
})
```

---

## 📁 文件結構規範

### 組件文件結構

```
src/components/
├── feature-name/
│   ├── FeatureComponent.tsx       # 主組件 (< 300 行)
│   ├── index.ts                   # 導出
│   ├── components/                # 子組件
│   │   ├── SubComponent1.tsx     # (< 200 行)
│   │   └── SubComponent2.tsx
│   ├── hooks/                     # 自定義 Hook
│   │   ├── useFeatureData.ts     # (< 200 行)
│   │   └── useFeatureActions.ts
│   ├── types.ts                   # 類型定義 (< 200 行)
│   ├── constants.ts               # 常數
│   └── utils.ts                   # 工具函數 (< 150 行)
```

### 禁止的結構

```
❌ src/components/
   └── MegaComponent.tsx  (2000 行！)

❌ src/types.ts  (7000 行！)

❌ src/utils/
   └── everything.ts  (1000 行！)
```

---

## 🔍 類型安全規範

### 強制啟用 TypeScript 嚴格模式

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 類型定義規範

```typescript
// ✅ 正確：完整的類型定義
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'  // 使用聯合類型，不是 string
  workspace: Workspace  // 使用接口，不是 any
  createdAt: string  // 或 Date
  updatedAt: string
}

// ✅ 正確：泛型使用
interface ApiResponse<T> {
  data: T
  error: string | null
  loading: boolean
}

// ✅ 正確：條件類型
type UserRole = User['role']  // 從接口提取
type RequiredKeys<T> = {
  [K in keyof T]-?: T[K]
}
```

---

## 🎯 組件拆分策略

### 何時拆分組件？

觸發以下**任一條件**就必須拆分：

1. ✅ 組件超過 300 行
2. ✅ 有超過 5 個 useState
3. ✅ 有超過 3 個 useEffect
4. ✅ JSX 嵌套超過 5 層
5. ✅ 函數內有超過 50 行邏輯

### 拆分範例

#### 拆分前（2110 行！）
```typescript
// ❌ src/app/(main)/customers/page.tsx (2110 行)
function CustomersPage() {
  // 100 行狀態定義
  // 200 行資料獲取邏輯
  // 300 行表單處理
  // 400 行過濾排序
  // 500 行 UI 渲染
  // 600 行其他功能
}
```

#### 拆分後
```typescript
// ✅ src/app/(main)/customers/page.tsx (100 行)
function CustomersPage() {
  return (
    <CustomerPageLayout>
      <CustomerFilters />
      <CustomerTable />
      <CustomerActions />
    </CustomerPageLayout>
  )
}

// ✅ src/features/customers/hooks/useCustomers.ts (80 行)
export function useCustomers() {
  // 資料獲取邏輯
}

// ✅ src/features/customers/hooks/useCustomerForm.ts (120 行)
export function useCustomerForm() {
  // 表單邏輯
}

// ✅ src/features/customers/components/CustomerTable.tsx (200 行)
export function CustomerTable() {
  // 表格渲染
}

// ✅ src/features/customers/components/CustomerFilters.tsx (150 行)
export function CustomerFilters() {
  // 過濾 UI
}
```

---

## 🛠️ 自動化檢查

### ESLint 規則

創建 `.eslintrc.strict.json`:
```json
{
  "extends": ["./.eslintrc.json"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "max-lines": ["error", { "max": 300, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true }],
    "max-depth": ["error", 3],
    "max-params": ["error", 3],
    "complexity": ["warn", 10]
  }
}
```

### Pre-commit Hook

`.husky/pre-commit`:
```bash
#!/bin/sh

# 檢查文件大小
echo "🔍 檢查文件大小..."
./scripts/check-file-size.sh || exit 1

# 檢查 any 類型
echo "🔍 檢查 any 類型使用..."
./scripts/check-any-usage.sh || exit 1

# TypeScript 檢查
echo "🔍 TypeScript 類型檢查..."
npm run type-check || exit 1

# Lint 檢查
echo "🔍 ESLint 檢查..."
npm run lint || exit 1

echo "✅ 所有檢查通過！"
```

### 檢查腳本

`scripts/check-file-size.sh`:
```bash
#!/bin/bash

MAX_LINES=300
violations=0

# 檢查所有 .tsx 和 .ts 文件
for file in $(find src -name "*.tsx" -o -name "*.ts"); do
  lines=$(wc -l < "$file")

  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "❌ $file 超過 $MAX_LINES 行 (實際: $lines 行)"
    violations=$((violations + 1))
  fi
done

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "🚫 發現 $violations 個文件超過行數限制！"
  echo "請拆分這些文件後再提交。"
  exit 1
fi

echo "✅ 所有文件符合大小限制"
exit 0
```

`scripts/check-any-usage.sh`:
```bash
#!/bin/bash

# 檢查是否有使用 any 類型
any_count=$(grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l)

if [ "$any_count" -gt 0 ]; then
  echo "❌ 發現 $any_count 處使用 any 類型："
  grep -rn ": any" src --include="*.ts" --include="*.tsx" | head -20
  echo ""
  echo "🚫 請替換為明確的類型定義！"
  exit 1
fi

echo "✅ 沒有使用 any 類型"
exit 0
```

---

## 📊 代碼品質指標

### 必須達成的目標

| 指標 | 目標值 | 當前值 | 狀態 |
|------|--------|--------|------|
| TypeScript 嚴格模式 | 100% | ？ | ⚠️ |
| any 類型使用 | 0 處 | 26+ 處 | ❌ |
| 超過 300 行的文件 | 0 個 | 8 個 | ❌ |
| 超過 500 行的文件 | 0 個 | 6 個 | ❌ |
| 測試覆蓋率 | >80% | ？ | ⚠️ |
| ESLint 錯誤 | 0 個 | ？ | ⚠️ |

### 每週檢查清單

- [ ] 週一：執行 `npm run audit:code-quality`
- [ ] 週三：檢查新增的 any 類型
- [ ] 週五：檢查文件大小變化
- [ ] 每月：代碼審查，清理技術債

---

## 🚀 立即行動計劃

### Phase 1: 緊急修復（本週）

1. **修正所有 any 類型** (26+ 處)
   - [ ] `src/types/pnr.types.ts` - 定義明確類型
   - [ ] API routes - 使用 zod 驗證
   - [ ] Hooks - 添加泛型類型

2. **拆分超大文件** (8 個)
   - [ ] `src/lib/supabase/types.ts` (7280 行) → 按模組拆分
   - [ ] `src/app/(main)/customers/page.tsx` (2110 行) → 拆成 5 個文件
   - [ ] `src/components/orders/OrderMembersExpandable.tsx` (1799 行) → 拆成 8 個組件

### Phase 2: 建立防護（下週）

3. **設置自動化檢查**
   - [ ] 創建 ESLint 嚴格規則
   - [ ] 設置 pre-commit hook
   - [ ] CI/CD 整合檢查

4. **團隊培訓**
   - [ ] 分享本規範文檔
   - [ ] Code Review 檢查清單
   - [ ] 最佳實踐工作坊

---

## ❌ 違規處理

### 違規等級

| 等級 | 違規內容 | 處理方式 |
|------|---------|---------|
| 🔴 嚴重 | 使用 any 類型 | PR 立即退回 |
| 🔴 嚴重 | 單文件超過 500 行 | PR 立即退回 |
| 🟠 高 | 單文件超過 300 行 | 要求說明或拆分 |
| 🟡 中 | 函數超過 50 行 | 建議重構 |

### Code Review 檢查清單

審查者必須確認：

- [ ] ✅ 無 any 類型使用
- [ ] ✅ 所有文件 < 300 行
- [ ] ✅ 函數職責單一
- [ ] ✅ 嵌套不超過 3 層
- [ ] ✅ 有適當的類型定義
- [ ] ✅ 有單元測試
- [ ] ✅ 有 TSDoc 註解

---

## 📚 參考資源

- [Clean Code TypeScript](https://github.com/labs42io/clean-code-typescript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Effective TypeScript](https://effectivetypescript.com/)

---

**最後更新**: 2025-12-10
**強制執行日期**: 2025-12-11 起
**審查者**: 全體開發團隊

---

*⚠️ 本規範為強制執行，不符合規範的 PR 將被退回。*
