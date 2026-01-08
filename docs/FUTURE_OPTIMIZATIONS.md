# 未來優化項目

> **建立日期**: 2026-01-08
> **狀態**: 待功能完成後執行
> **優先級**: 功能完成 80% 後開始

---

## 優化時機建議

```
目前階段          功能完成 80%        上線前
    │                  │                │
    ▼                  ▼                ▼
 專注功能開發    →   SWR + IndexedDB  →  RLS 優化
```

---

## 1. SWR 遷移（資料獲取層）

### 目標
- 統一資料獲取模式
- 自動快取與 revalidation
- 簡化 Store 邏輯

### 現況
| 架構 | 檔案數 | 狀態 |
|------|--------|------|
| Zustand Stores | 73 | 維護中 |
| SWR Cloud Hooks | 8 | 成長中 |

### 遷移範圍
- [ ] `useTourStore` → `useTours`
- [ ] `useOrderStore` → `useOrders`
- [ ] `useCustomerStore` → `useCustomers`
- [ ] `useQuoteStore` → `useQuotes`
- [ ] `useItineraryStore` → `useItineraries`
- [ ] `usePaymentRequestStore` → `usePaymentRequests`
- [ ] `useDisbursementOrderStore` → `useDisbursements`
- [ ] `useReceiptOrderStore` → `useReceipts`
- [ ] 其他業務 Stores...

### 預計工時
約 1-2 天

---

## 2. IndexedDB 圖片快取

### 目標
- 減少重複下載圖片資源
- 離線支援
- 提升使用者體驗

### 需要快取的資源

| 資源類型 | 場景 | 優先級 |
|----------|------|--------|
| 客戶護照圖片 | 開啟客戶資料時 | 高 |
| 飯店照片 | 編輯行程時 | 高 |
| 景點照片 | 行程規劃時 | 中 |
| 供應商 Logo | 各處顯示 | 低 |
| 員工頭像 | 各處顯示 | 低 |

### 技術方案

```typescript
// 預計使用 idb 套件
import { openDB } from 'idb'

// 三層快取架構
Layer 1: SWR (記憶體) - API JSON 資料
Layer 2: IndexedDB (持久化) - 圖片、PDF、大型資料
Layer 3: Supabase Storage (雲端) - 原始檔案來源
```

### 預計建立的檔案
- `src/lib/cache/resource-cache.ts` - 資源快取服務
- `src/hooks/useCachedImage.ts` - 圖片快取 Hook
- `src/components/ui/cached-image.tsx` - 快取圖片組件

### 預計效果

| 場景 | 首次 | 再次（同 Session） | 再次（新 Session） |
|------|------|-------------------|-------------------|
| 客戶護照 | ~2s | <50ms | <50ms |
| 飯店照片 | ~3s | <50ms | <50ms |

### 預計工時
約 1 天

---

## 3. RLS 完整優化

### 目標
- 資料庫層級安全保障
- 移除前端過濾邏輯
- 統一權限控制

### 現況

| 類型 | 表格 | RLS 狀態 |
|------|------|----------|
| 業務資料 | tours, orders, customers... | ✅ 已啟用 |
| 共享資料 | suppliers, employees... | ❌ 未啟用 |

### 優化項目
- [ ] 審查所有 RLS Policies
- [ ] 優化 Policy 效能（避免 N+1）
- [ ] 移除前端 `workspaceScoped` 過濾
- [ ] 完善 `is_super_admin()` 邏輯
- [ ] 加入 Policy 測試

### 預計工時
約 1-2 天

---

## 4. 其他優化項目（低優先級）

### 效能相關
- [ ] 圖片壓縮/WebP 轉換
- [ ] 虛擬列表（大量資料）
- [ ] 懶載入組件（Dynamic Import）
- [ ] Bundle 分析與優化

### 開發體驗
- [ ] 完善 TypeScript 類型
- [ ] 移除剩餘 `as any`（43 處）
- [ ] 統一錯誤處理
- [ ] 加入單元測試

---

## 執行順序建議

```
Phase 1: 功能開發（現在）
         │
         ▼
Phase 2: SWR 遷移
         │
         ▼
Phase 3: IndexedDB 圖片快取
         │
         ▼
Phase 4: RLS 優化
         │
         ▼
Phase 5: 上線前效能調校
```

---

## 備註

- 此文件記錄待執行的優化項目
- 優先完成功能開發，不要過早優化
- 各項目可視實際需求調整順序
- 遇到效能瓶頸時再提前執行對應優化

---

## 更新記錄

| 日期 | 更新內容 |
|------|----------|
| 2026-01-08 | 建立文件，記錄 SWR、IndexedDB、RLS 優化計畫 |
