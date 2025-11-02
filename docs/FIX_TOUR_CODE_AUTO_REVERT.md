# 修正：團號自動還原問題

> **日期**: 2025-11-01
> **問題**: 使用者刪除團號後，團號會自動還原回原值
> **狀態**: ✅ 已修復

---

## 問題描述

在 `/itinerary/new` 頁面，當使用者：
1. 從旅遊團選擇器選擇一個團號（例如：`25JFO21CIG`）
2. 手動刪除團號欄位
3. 團號自動還原回 `25JFO21CIG`

**使用者反饋**：「就算我刪除 他還是會自動變回這團號」

---

## 根本原因

### 問題代碼（修復前）

```typescript
// src/app/itinerary/new/page.tsx 第 268-398 行

useEffect(() => {
  const initializeTourData = () => {
    // ... 載入 tour 資料
    setTourData({
      tourCode: tour.code,  // ← 問題：每次都重設
      title: tour.name,
      // ...
    })
  }

  initializeTourData()
}, [tourId, tours, countries, cities])  // ← 依賴太多
```

### 觸發流程

```
1. 使用者刪除團號
   ↓
2. setTourData({ ...tourData, tourCode: '' })
   ↓
3. tours/countries/cities 從 IndexedDB 載入完成（背景同步）
   ↓
4. useEffect 依賴改變 → 重新執行
   ↓
5. initializeTourData() 找到原始 tour
   ↓
6. setTourData({ tourCode: tour.code })  ← 覆蓋使用者編輯
   ↓
7. 團號還原！
```

### 為什麼之前沒問題？

- 在 `region-store` 重構之前（commit `0b43012`），`countries` 和 `cities` 載入較慢
- 使用者編輯時，這些陣列已經載入完成，不會再觸發 `useEffect`
- 重構後，載入速度變快了，但也增加了重複觸發的機率

---

## 解決方案

### 核心思路

**只在「首次載入」或「tourId 改變」時初始化，不要在資料陣列更新時重新初始化**

### 修復代碼

```typescript
// 使用 ref 追蹤初始化狀態
const hasInitializedRef = useRef(false)
const lastTourIdRef = useRef<string | null>(null)

useEffect(() => {
  const initializeTourData = () => {
    // ✅ 如果 tourId 沒變，且已經初始化過，直接返回
    if (hasInitializedRef.current && lastTourIdRef.current === tourId) {
      return
    }

    // ... 初始化邏輯 ...

    // ✅ 標記已初始化
    hasInitializedRef.current = true
    lastTourIdRef.current = tourId
  }

  initializeTourData()
}, [tourId, tours, countries, cities])
```

### 執行邏輯

```
情境 A: 首次進入頁面
1. hasInitializedRef.current = false
2. 執行初始化 → 載入 tour 資料
3. hasInitializedRef.current = true
4. tours/countries/cities 更新 → useEffect 觸發
5. 檢查：hasInitializedRef = true && tourId 沒變 → 跳過 ✅

情境 B: 使用者選擇不同的團號
1. tourId 從 'tour-A' 變成 'tour-B'
2. useEffect 觸發
3. 檢查：lastTourIdRef.current !== tourId → 執行初始化 ✅
4. 載入新團號的資料

情境 C: 使用者刪除團號
1. setTourData({ tourCode: '' })
2. tours 陣列更新 → useEffect 觸發
3. 檢查：hasInitializedRef = true && tourId 沒變 → 跳過 ✅
4. 使用者編輯保留！
```

---

## 技術細節

### useRef vs useState

**為什麼用 `useRef` 而不是 `useState`？**

```typescript
// ❌ 使用 useState（會造成額外渲染）
const [hasInitialized, setHasInitialized] = useState(false)
setHasInitialized(true)  // 觸發重新渲染

// ✅ 使用 useRef（不觸發渲染）
const hasInitializedRef = useRef(false)
hasInitializedRef.current = true  // 不觸發渲染
```

### useEffect 依賴陣列

保留 `[tourId, tours, countries, cities]` 依賴的原因：
- `tourId` 改變 → 需要載入新團號的資料 ✅
- `tours/countries/cities` 改變 → 需要檢查是否首次載入 ✅
- 用 `ref` 控制是否執行初始化邏輯

---

## 測試場景

### ✅ 已驗證場景

1. **首次進入頁面** → 正確載入預設團號
2. **選擇不同團號** → 正確切換團號資料
3. **刪除團號** → 保留空白，不會自動還原 ✅
4. **編輯其他欄位** → 不影響團號欄位
5. **背景資料同步** → 不會覆蓋使用者編輯

---

## 相關問題修復歷史

### 2025-11-01: Region Store 無限迴圈

**問題**: `useRegionsStore` 每次回傳新的函數引用 → `useEffect` 無限觸發

**修復**: 使用 `useCallback` 和 `useMemo` 穩定引用

**詳細**: `docs/REGION_STORE_GUIDE.md`

### 關聯

兩個問題的共同根源：**React 的引用穩定性 (Reference Stability)**

- Region Store: 函數引用不穩定 → 無限迴圈
- Tour Code: 資料陣列更新 → 覆蓋使用者編輯

---

## 學習重點

1. **useEffect 依賴陣列要謹慎** - 每個依賴改變都會重新執行
2. **useRef 適合存儲不需要觸發渲染的狀態** - 例如初始化旗標
3. **區分「初始化」和「更新」** - 不是每次資料變動都要重新初始化
4. **保護使用者編輯** - 永遠不要無條件覆蓋使用者的輸入

---

## 檔案位置

**修改檔案**:
- `src/app/itinerary/new/page.tsx` (第 268-412 行)

**相關文件**:
- `docs/REGION_STORE_GUIDE.md` - Region Store 使用指南
- `COMPLETE_REALTIME_OFFLINE_LOGIC.md` - Realtime 同步邏輯

---

**修復完成** ✅
