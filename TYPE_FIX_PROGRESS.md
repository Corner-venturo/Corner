# 型別修復進度追蹤

**開始時間**: 2025-11-19 00:00
**目標**: 修復所有 547 個 `as any`

---

## ✅ 已完成 (79/547 = 14.4%)

### Session 1 - Realtime Hooks & Core Services & Stores
- [x] src/lib/realtime/createRealtimeHook.ts (修正型別定義)
- [x] src/hooks/use-realtime-hooks.ts (26個)
- [x] src/features/confirmations/services/confirmation.service.ts (11個)
- [x] src/stores/utils/sync-helper.ts (15個)
- [x] src/stores/manifestation-store.ts (15個)
- [x] src/stores/adapters/supabase-adapter.ts (7個)

**本 Session 成果**: 79 個 `as any` 已修正 ✅
**剩餘**: 468 個

---

## 📋 待處理 (468/547)

### Phase 1: 核心層 Services
- [ ] src/features/suppliers/services/supplier.service.ts (13個) - ⚠️ 需大規模重構
- [ ] src/lib/sync/background-sync-service.ts (10個)
- [ ] src/lib/supabase/api.ts (10個)
- [ ] src/features/tours/services/tour.service.ts (9個)
- [ ] src/services/local-auth-service.ts (8個)
- [ ] src/core/services/base.service.ts (7個)
- [ ] src/features/orders/services/order.service.ts (7個)

### Phase 3: UI 層 (~423個)
- [ ] 所有頁面和組件

---

## 📝 修復筆記

### 常見模式：
1. **Realtime Store**: `store: useTourStore as any` → 需要修正型別定義
2. **Service 泛型**: `data as any` → 使用 `Partial<T>` 或具體型別
3. **Supabase 查詢**: `supabase.from as any` → 型別斷言或擴充定義
4. **UI 組件**: 事件處理和 props 型別

---

## ⚠️ 注意事項
- 每次修復後執行 `npm run build` 確認無錯誤
- 測試關鍵功能（Tours, Orders, Quotes）
- 如有編譯錯誤，記錄在此檔案

---

_最後更新_: Session 1 開始
