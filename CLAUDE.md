# CLAUDE.md - Venturo ERP 開發規範

## 🔧 Build 規則

**Push 前必須 Build 通過**

```bash
npx next build
```

- 不要 push 有 build error 的程式碼
- CI 會擋，但本地先確認更省時間

## ✅ 修復後三步驟

每次修復 bug 或完成功能後：

1. **確認生效** — 實際測試修復有作用
2. **檢查遺漏** — 看有沒有漏改的地方
3. **因果關係檢查** — 這個改動會不會影響其他功能？

## 📊 核心表：tour_itinerary_items

**改團務功能時，資料要寫核心表**

核心表 `tour_itinerary_items` 是行程資料的單一真相來源。

### 使用方式

```typescript
// ✅ 正確：用專用 hook
const { items, updateItem } = useTourItineraryItemsByTour(tourId)

// ❌ 錯誤：直接 query 或用其他方式
```

### 相關文件

- `docs/CROSS_SYSTEM_MAP.md` — ERP ↔ Online 欄位對應

## 🗺️ 開工前必讀

每次開始開發前，先讀：

- `docs/CROSS_SYSTEM_MAP.md` — 系統間欄位對應
- `docs/VENTURO_BLUEPRINT.md` — 架構藍圖

## 🃏 CARD 檢查法

提交前用 CARD 檢查：

- **C**lean — 程式碼乾淨嗎？
- **A**uth — 權限檢查完整嗎？
- **R**edundant — 有重複程式碼嗎？
- **D**ependencies — 依賴關係正確嗎？

---

_統一規範，不管誰開發都走同一套。_
