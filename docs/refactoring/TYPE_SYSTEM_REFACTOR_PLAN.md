# 型別系統重構計劃

## 📊 現狀分析

### 型別定義位置
1. `/src/types/` - 中央型別定義（16 個檔案）
   - `index.ts` - 中央匯出
   - `models.ts` - 主要資料模型
   - `*.types.ts` - 各模組的型別

2. `/src/stores/types.ts` - **17KB**，619 行
   - 包含 User, Employee, Todo, Tour, Order 等

3. `/src/features/*/types.ts` - Feature 級別型別

4. `/src/stores/workspace/types.ts` - Workspace 專用型別

## ⚠️ 發現的問題

### 1. 重複定義
- `User` 型別：
  - `/src/stores/types.ts` (詳細版，91 行)
  - `/src/types/models.ts` (可能有另一個版本)

- `Employee` 型別：
  - `/src/stores/types.ts` 中定義為 `type Employee = User`
  - `/src/types/employee.types.ts` 可能有另一個定義

### 2. 不一致的結構
- `/src/types/` 使用 `*.types.ts` 命名
- `/src/stores/` 使用 `types.ts` 命名
- Feature 層級混用兩種方式

## 🎯 重構策略（分階段）

### Phase 1: 今晚執行（保守方案）

#### 1.1 文件化現狀
- ✅ 創建此文件記錄問題
- ⏸️ **不立即合併**（風險太高）

#### 1.2 建立型別導入規範
```typescript
// ✅ 統一從 @/types 導入
import { User, Employee } from '@/types';

// ❌ 避免直接從 stores 導入型別
import { User } from '@/stores/types';
```

#### 1.3 添加 TSDoc 註解
- 在關鍵型別上添加文檔
- 標記哪個是「正確」版本

### Phase 2: 明天執行（測試後）

#### 2.1 確定單一真相來源
```
/src/types/
├── index.ts          - 中央匯出
├── models.ts         - 所有資料模型（User, Employee, etc.）
├── api.ts            - API 相關型別
├── ui.ts             - UI 狀態型別
└── utils.ts          - 工具型別
```

#### 2.2 遷移 `/src/stores/types.ts`
- 將資料模型移到 `/src/types/models.ts`
- 保留 Store 特定的型別（如 StoreState）
- 更新所有 imports

### Phase 3: 本週執行（完整遷移）

#### 3.1 清理 Feature 型別
- 評估每個 `/src/features/*/types.ts`
- 共用型別移到 `/src/types/`
- Feature 專用型別保留

#### 3.2 自動化檢查
```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## 📋 今晚的實際行動

### ✅ 已完成
1. 分析型別系統現狀
2. 創建此重構計劃

### ⏸️ 暫緩執行（風險評估）
**原因：**
- `/src/stores/types.ts` 被 **大量** Store 檔案引用
- 合併型別可能破壞數百個 imports
- 需要完整的測試才能安全執行

**決定：**
- 今晚**不執行**型別系統合併
- 專注在**頁面分解**（更安全、更有立即效果）
- 型別系統留待明天，在有充分測試的情況下執行

---

## 🚀 調整後的今晚計劃

### 優先級調整
1. ✅ **快速清理** - 已完成
2. ⏸️ **統一型別系統** - 暫緩（風險太高）
3. ⭐ **分解 visas/page.tsx** - 立即執行
4. ⭐ **分解 tours/page.tsx** - 次要執行
5. ✅ **啟用 TypeScript 檢查** - 配置調整

---

**更新時間：** 2025-10-26 23:30
**狀態：** 計劃調整
**原因：** 安全第一，避免破壞性變更
