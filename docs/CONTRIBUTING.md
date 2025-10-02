# 🤝 貢獻指南

感謝你對 Venturo 專案的貢獻！本文檔將幫助你快速上手。

---

## 📋 目錄

1. [開發環境設置](#開發環境設置)
2. [架構規範](#架構規範)
3. [編碼規範](#編碼規範)
4. [提交規範](#提交規範)
5. [測試規範](#測試規範)
6. [Code Review Checklist](#code-review-checklist)

---

## 開發環境設置

### 1. 克隆專案

```bash
git clone https://github.com/venturo/venturo-new.git
cd venturo-new
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動開發服務器

```bash
npm run dev
```

### 4. 運行測試

```bash
npm test                 # 運行所有測試
npm run test:coverage    # 生成測試覆蓋率報告
```

---

## 架構規範

### 必須遵守的分層架構

```
UI Component (pages/*.tsx)
    ↓ 只能調用 Hook
Custom Hook (features/*/hooks/use*.ts)
    ↓ 只能調用 Service
Service Layer (features/*/services/*.service.ts)
    ↓ 只能調用 Store
Store Layer (stores/*-store.ts)
```

### ❌ 禁止的做法

```typescript
// ❌ UI 直接調用 Store
import { usePaymentStore } from '@/stores/payment-store';
const { addPaymentRequest } = usePaymentStore();

// ❌ Hook 直接操作 Store 狀態
const store = usePaymentStore.getState();
store.paymentRequests.push(newRequest);

// ❌ Service 層包含 React Hooks
class PaymentService {
  usePayments() { // ❌ Service 不能用 Hooks
    const [data, setData] = useState();
  }
}
```

### ✅ 正確的做法

```typescript
// ✅ UI 使用 Hook
import { usePayments } from '@/features';
const { createPaymentRequest } = usePayments();

// ✅ Hook 調用 Service
export const usePayments = () => {
  return {
    createPaymentRequest: async (data) => {
      return await paymentService.create(data);
    },
  };
};

// ✅ Service 調用 Store
class PaymentService extends BaseService {
  async create(data) {
    const store = usePaymentStore.getState();
    return await store.addPaymentRequest(data);
  }
}
```

---

## 編碼規範

### 1. 命名規範

| 類型 | 命名方式 | 範例 |
|-----|---------|------|
| 組件 | PascalCase | `PaymentForm`, `OrderList` |
| Hook | camelCase + use前綴 | `usePayments`, `useTours` |
| Service | PascalCase + Service後綴 | `PaymentService`, `QuoteService` |
| Store | camelCase + Store後綴 | `usePaymentStore`, `useTourStore` |
| 函數 | camelCase | `calculateTotal`, `formatDate` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| 類型/接口 | PascalCase | `PaymentRequest`, `User` |

### 2. 文件命名

```
組件:         PaymentForm.tsx
Hook:         usePayments.ts
Service:      payment.service.ts
Store:        payment-store.ts
Types:        types.ts (或 payment.types.ts)
Utils:        payment.utils.ts
Tests:        payment.service.test.ts
```

### 3. TypeScript 規範

```typescript
// ✅ 使用明確的類型
interface PaymentRequest {
  id: string;
  amount: number;
  date: string;
}

const request: PaymentRequest = {
  id: '1',
  amount: 1000,
  date: '2025-01-01',
};

// ❌ 避免 any
const data: any = fetchData();  // 不推薦

// ✅ 使用泛型
function getData<T>(id: string): T | null {
  // ...
}

// ✅ 使用類型守衛
function isPaymentRequest(obj: any): obj is PaymentRequest {
  return 'id' in obj && 'amount' in obj;
}
```

### 4. React 規範

```typescript
// ✅ 使用函數組件 + Hooks
export function PaymentForm() {
  const [data, setData] = useState();
  // ...
}

// ✅ 使用 memo 優化性能
export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  // ...
});

// ✅ 使用 useCallback 和 useMemo
const handleSubmit = useCallback(() => {
  // ...
}, [dependencies]);

const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ❌ 避免在組件內定義組件
function ParentComponent() {
  function ChildComponent() {  // ❌ 不推薦
    return <div>Child</div>;
  }
  return <ChildComponent />;
}
```

---

## 提交規範

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型

- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響功能）
- `refactor`: 重構（不是新功能也不是修復）
- `perf`: 性能優化
- `test`: 測試相關
- `chore`: 構建/工具相關

### 範例

```bash
# 好的 commit
feat(payments): 新增請款單批次創建功能

實現了批次創建請款單的功能，包括：
- 批次驗證
- 自動編號生成
- 錯誤處理

Closes #123

# 壞的 commit
fix bug  # ❌ 太簡略
Update code  # ❌ 沒有意義
```

---

## 測試規範

### 1. 測試文件位置

```
src/features/payments/
├── services/
│   └── payment.service.ts
├── __tests__/                    # 測試文件放這裡
│   └── payment.service.test.ts
└── hooks/
    └── usePayments.ts
```

### 2. 測試範例

```typescript
describe('PaymentService', () => {
  describe('generateRequestNumber', () => {
    it('應該生成正確的請款單編號', () => {
      // Arrange (準備)
      const mockData = {...};

      // Act (執行)
      const result = service.generateRequestNumber();

      // Assert (驗證)
      expect(result).toMatch(/^REQ-\d{7}$/);
    });
  });
});
```

### 3. 測試覆蓋率要求

| 指標 | 最低要求 | 目標 |
|-----|---------|------|
| Statements | 70% | 80%+ |
| Branches | 65% | 75%+ |
| Functions | 70% | 80%+ |
| Lines | 70% | 80%+ |

---

## Code Review Checklist

### 功能性

- [ ] 功能符合需求
- [ ] 無明顯 Bug
- [ ] 邊界情況處理完善
- [ ] 錯誤處理恰當

### 架構

- [ ] 遵循分層架構
- [ ] 使用 Hook 而非直接 Store
- [ ] Service 層有業務邏輯
- [ ] 無跨層調用

### 代碼質量

- [ ] 代碼清晰易讀
- [ ] 命名有意義
- [ ] 無重複代碼
- [ ] 註釋充分（但不過度）

### TypeScript

- [ ] 完整的類型定義
- [ ] 無 `any` 類型（除非必要）
- [ ] 正確使用泛型
- [ ] 類型安全

### 性能

- [ ] 使用 `memo` 優化組件
- [ ] 使用 `useCallback` 和 `useMemo`
- [ ] 無不必要的重渲染
- [ ] 合理的數據結構

### 測試

- [ ] 有單元測試
- [ ] 測試覆蓋關鍵邏輯
- [ ] 測試通過
- [ ] 無跳過的測試

### 其他

- [ ] 無 `console.log`（除非必要）
- [ ] 無註釋掉的代碼
- [ ] 符合 ESLint 規則
- [ ] 格式化正確

---

## 常見問題

### Q: 我應該在哪一層寫驗證邏輯？

**A**: Service 層。所有業務規則驗證都在 Service 層的 `validate` 方法。

### Q: Hook 層和 Service 層有什麼區別？

**A**:
- **Hook 層**: 提供 React 友善的接口，管理組件狀態訂閱
- **Service 層**: 純業務邏輯，不依賴 React，可以在任何地方使用

### Q: 什麼時候應該創建新的 Service？

**A**: 當你有一個新的業務領域（Domain）時，例如 Payment、Quote、Order 等。

### Q: 可以在 UI 組件中寫業務邏輯嗎？

**A**: 不行。所有業務邏輯應該在 Service 層。UI 組件只負責渲染和用戶交互。

---

## 獲取幫助

- 📧 Email: dev@venturo.com
- 💬 Slack: #venturo-dev
- 📖 文檔: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 🔧 重構指南: [REFACTOR_GUIDE.md](./REFACTOR_GUIDE.md)

---

**感謝你的貢獻！** 🎉
