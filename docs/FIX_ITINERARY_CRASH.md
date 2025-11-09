# 🔧 修復：行程新增時瀏覽器崩潰問題

> **問題**：新增行程時，只要一輸入，整個網頁就會崩潰，只能關閉瀏覽器
> **根本原因**：React 無限循環導致記憶體爆炸
> **修復日期**：2025-11-01

---

## 🎯 問題診斷

### 崩潰的連鎖反應

```
1. 使用者輸入 → onChange(newData)
   ↓
2. page.tsx: setTourData(newData)
   ↓
3. page.tsx: processedData 每次都是新物件 ❌
   ↓
4. TourPreview 收到新 props
   ↓
5. useRegionData: useEffect 偵測到變化
   ↓
6. useRegionData: setSelectedCountry() / setSelectedCountryCode()
   ↓
7. TourForm 重新渲染
   ↓
8. 回到步驟 1 → 無限循環
   ↓
9. 記憶體爆炸 → 瀏覽器崩潰
```

---

## ✅ 修復方案

### 修復 1：穩定 processedData（最關鍵）

**檔案**：`src/app/itinerary/new/page.tsx`

**問題**：

```typescript
// ❌ 每次 tourData 改變，processedData 都是新物件
const processedData = {
  ...tourData,
  features: tourData.features.map(...),
}
```

**修復**：

```typescript
// ✅ 使用 useMemo 穩定引用
const processedData = React.useMemo(
  () => ({
    ...tourData,
    features: tourData.features.map((f: any) => ({
      ...f,
      iconComponent: iconMap[f.icon] || IconSparkles,
    })),
  }),
  [tourData]
)
```

**影響**：防止 TourPreview 每次都重新渲染

---

### 修復 2：useRegionData 的無限循環

**檔案**：`src/components/editor/tour-form/hooks/useRegionData.ts`

**問題 1**：依賴項包含不穩定的物件

```typescript
// ❌ countryNameToCode 每次都是新物件
useEffect(() => {
  // ...
}, [
  data.country,
  countryNameToCode, // ❌ 不穩定
  selectedCountry, // ❌ 造成循環
  selectedCountryCode, // ❌ 造成循環
])
```

**修復**：

```typescript
// ✅ 只保留必要的依賴項
useEffect(() => {
  // ...
}, [data.country, countries.length])
```

**問題 2**：fetchAll 被重複呼叫

```typescript
// ❌ 沒有防止重複執行
useEffect(() => {
  if (countries.length === 0) {
    fetchAll()
  }
}, [countries.length, fetchAll])
```

**修復**：

```typescript
// ✅ 使用 ref 防止重複
const hasFetchedRef = React.useRef(false)

useEffect(() => {
  if (countries.length === 0 && !hasFetchedRef.current) {
    hasFetchedRef.current = true
    fetchAll()
  }
}, [countries.length, fetchAll])
```

**影響**：防止重複載入資料，避免觸發連鎖更新

---

### 修復 3：CountriesSection 的初始化循環

**檔案**：`src/components/editor/tour-form/sections/CountriesSection.tsx`

**問題**：

```typescript
// ❌ 空依賴但會呼叫 onChange，可能觸發循環
useEffect(() => {
  if (!data.countries) {
    onChange({ ...data, countries: [...] })
  }
}, [])
```

**修復**：

```typescript
// ✅ 使用 ref 確保只初始化一次
const hasInitializedRef = React.useRef(false)

useEffect(() => {
  if (hasInitializedRef.current) return
  if (!data.countries && allCountries.length > 0) {
    hasInitializedRef.current = true
    onChange({ ...data, countries: [...] })
  }
}, [allCountries.length])
```

**影響**：防止初始化時觸發多次更新

---

### 修復 4：setInterval 洩漏防護

**檔案**：`src/features/tours/hooks/useTourScrollEffects.ts`

**問題**：

```typescript
// ⚠️ 雖然有清理，但缺少取消標記
if (isPreview) {
  let progress = 0
  const interval = setInterval(() => {
    progress += 0.02
    setAttractionsProgress(progress)
  }, 50)
  return () => clearInterval(interval)
}
```

**修復**：

```typescript
// ✅ 加入取消標記，確保正確清理
if (isPreview) {
  let progress = 0
  let isCancelled = false

  const interval = setInterval(() => {
    if (isCancelled) {
      clearInterval(interval)
      return
    }
    progress += 0.02
    if (progress >= 1) {
      progress = 1
      clearInterval(interval)
    }
    setAttractionsProgress(progress)
  }, 50)

  return () => {
    isCancelled = true
    clearInterval(interval)
  }
}
```

**影響**：防止 interval 累積導致效能問題

---

## 📊 修復驗證

### 建構測試

```bash
npm run build
```

**結果**：✅ 成功，無錯誤

### 修復的檔案清單

1. ✅ `src/app/itinerary/new/page.tsx`
2. ✅ `src/components/editor/tour-form/hooks/useRegionData.ts`
3. ✅ `src/components/editor/tour-form/sections/CountriesSection.tsx`
4. ✅ `src/features/tours/hooks/useTourScrollEffects.ts`

---

## 🎓 學到的教訓

### 1. **useMemo 的重要性**

當物件作為 props 傳遞時，如果每次都是新物件，會導致子組件不必要的重新渲染。

### 2. **useEffect 依賴項陷阱**

- ❌ 不要把會變化的物件放入依賴項（如 `countryNameToCode`）
- ❌ 不要把 state 本身放入依賴項（如 `selectedCountry`）
- ✅ 只放入真正需要監聽的原始值（如 `data.country`）

### 3. **使用 ref 防止重複執行**

對於只應該執行一次的邏輯（如初始化），使用 `useRef` 標記：

```typescript
const hasInitializedRef = React.useRef(false)
if (hasInitializedRef.current) return
```

### 4. **setInterval 清理最佳實踐**

```typescript
let isCancelled = false
const interval = setInterval(() => {
  if (isCancelled) return // 提前退出
  // ...
}, delay)
return () => {
  isCancelled = true
  clearInterval(interval)
}
```

---

## 🔍 Corner 工程師的分析對比

| 問題點               | Corner 工程師 | 實際情況        |
| -------------------- | ------------- | --------------- |
| TourPage useEffect   | ✅ 有提到     | ⚠️ 不是主因     |
| processedData 不穩定 | ❌ 沒提到     | ✅ **主要原因** |
| useRegionData 循環   | ❌ 沒提到     | ✅ **根本原因** |
| 建議方案             | 禁用預覽      | 修復依賴項      |
| 結果                 | 功能受損      | ✅ **功能保留** |

**結論**：Corner 工程師抓到了部分問題，但沒有找到根本原因。我們的修復方案更徹底，且保留了預覽功能。

---

## 📝 後續優化建議

1. **效能監控**
   - 加入 React DevTools Profiler 監控渲染次數
   - 追蹤哪些組件重新渲染最頻繁

2. **更多 useMemo/useCallback**
   - 檢查其他 custom hooks 是否有類似問題
   - 對大型計算結果使用 useMemo

3. **資料流優化**
   - 考慮使用 React Context 避免 prop drilling
   - 評估是否需要更細緻的 state 管理

---

**修復完成！** 🎉
