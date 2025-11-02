# Region Store 使用指南

> **最後更新**: 2025-11-01
> **狀態**: ✅ 已完整修復

---

## ⚠️ 重要提醒

`useRegionsStore` 是一個**組合型 Store**，整合了 `countries`、`regions`、`cities` 三個子 store。

### ✅ 正確使用方式

```typescript
import { useRegionsStore } from '@/stores'

function MyComponent() {
  const { countries, cities, fetchAll } = useRegionsStore()

  // ✅ 可以安全地把 fetchAll 放進依賴陣列
  useEffect(() => {
    if (countries.length === 0) {
      fetchAll()
    }
  }, [countries.length, fetchAll]) // fetchAll 是穩定的

  // ✅ 可以安全地使用所有方法
  const handleCreate = async () => {
    await createCountry({ name: '日本', code: 'JP' })
  }

  return <div>...</div>
}
```

### ❌ 錯誤使用方式

```typescript
// ❌ 不要解構後再傳遞（會失去穩定性）
const store = useRegionsStore()
const { fetchAll } = store
someFunction(fetchAll) // 可能會有問題

// ❌ 不要在 useEffect 外部呼叫（可能造成重渲染）
const { fetchAll } = useRegionsStore()
fetchAll() // 應該在 useEffect 裡面呼叫
```

---

## 🔧 內部實作

`useRegionsStore` 使用 `useMemo` 和 `useCallback` 確保所有方法引用穩定：

```typescript
export const useRegionsStore = () => {
  // 使用 useCallback 穩定所有方法
  const fetchAll = useCallback(async () => {...}, [deps])
  const createCountry = useCallback((data) => {...}, [deps])

  // 使用 useMemo 穩定回傳物件
  return useMemo(() => ({
    countries,
    cities,
    fetchAll,
    createCountry,
    // ...
  }), [deps])
}
```

---

## 📋 可用方法

### 資料
- `countries: Country[]` - 所有國家
- `regions: Region[]` - 所有地區
- `cities: City[]` - 所有城市
- `stats: Record<string, RegionStats>` - 統計資料

### 狀態
- `loading: boolean` - 任一 store 在載入中
- `error: string | null` - 錯誤訊息

### 載入方法
- `fetchAll(): Promise<void>` - 載入所有資料
- `fetchStats(): Promise<void>` - 載入統計資料

### CRUD 方法
- `createCountry(data)` / `updateCountry(id, data)` / `deleteCountry(id)`
- `createRegion(data)` / `updateRegion(id, data)` / `deleteRegion(id)`
- `createCity(data)` / `updateCity(id, data)` / `deleteCity(id)`

### 查詢方法
- `getCountry(id)` - 根據 ID 取得國家
- `getRegionsByCountry(countryId)` - 取得國家的所有地區
- `getCitiesByCountry(countryId)` - 取得國家的所有城市
- `getCitiesByRegion(regionId)` - 取得地區的所有城市
- `getCityStats(cityId)` - 取得城市統計資料

---

## 🐛 已知問題與修復歷史

### 2025-11-01: 無限迴圈問題
**問題**: `fetchAll` 每次呼叫都是新的函數引用，導致 `useEffect` 無限觸發

**修復**: 使用 `useCallback` 和 `useMemo` 穩定所有方法引用

**影響檔案**:
- `src/stores/region-store.ts` - 重構 hook
- `src/components/editor/tour-form/hooks/useRegionData.ts` - 恢復依賴
- `src/app/itinerary/new/page.tsx` - 修正 import 名稱

---

## 📚 相關文件

- `src/stores/region-store.ts` - Store 實作
- `src/lib/db/seed-regions.ts` - 預設資料
- `supabase/migrations/*countries*.sql` - 資料庫 schema

---

## 💡 開發建議

1. **懶載入**: 只在需要時呼叫 `fetchAll()`
2. **快取**: Store 會自動快取到 IndexedDB
3. **Realtime**: 未來可加入 Realtime 訂閱
4. **測試**: 修改後務必測試所有相關頁面

---

## ✅ 測試檢查清單

修改 `useRegionsStore` 後，請測試以下頁面：

- [ ] `/itinerary/new` - 行程新增
- [ ] `/tours` - 旅遊團列表
- [ ] `/quotes` - 報價單列表
- [ ] `/database/regions` - 地區管理
- [ ] `/database/attractions` - 景點管理
- [ ] `/database/suppliers` - 供應商管理
