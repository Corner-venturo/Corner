# Components → Features 遷移計畫

> **建立日期**: 2026-02-14
> **狀態**: 待討論（尚未動代碼）

## 背景

`src/components/` 下有大量包含業務邏輯的模組，應屬於 `src/features/`。
根據架構規範，`components/` 應只放 **可重用的 UI 組件**，業務邏輯應放在 `features/`。

## 遷移原則

- `components/ui/` → 保留（純 UI）
- `components/layout/` → 保留（佈局組件）
- `components/shared/` → 保留（跨模組共用）
- `components/dialog/` → 保留（通用 Dialog 工具）
- `components/table-cells/` → 保留（通用 Table Cell）
- `components/providers/` → 保留（Provider 組件）
- `components/print/` → 保留（通用列印）
- 頂層通用組件（ErrorBoundary, AppInitializer 等）→ 保留
- **其餘業務模組 → 遷移到 features/**

## 遷移清單

### 1. `components/tours/` → `features/tours/components/`

**影響最大，檔案最多。** `features/tours/` 已存在。

| 來源 | 目標 | 備註 |
|------|------|------|
| `components/tours/TourTabs.tsx` | `features/tours/components/TourTabs.tsx` | 核心 Tab 組件 |
| `components/tours/tour-overview.tsx` | `features/tours/components/tour-overview.tsx` | |
| `components/tours/tour-orders.tsx` | `features/tours/components/tour-orders.tsx` | |
| `components/tours/tour-costs.tsx` | `features/tours/components/tour-costs.tsx` | |
| `components/tours/tour-payments.tsx` | `features/tours/components/tour-payments.tsx` | |
| `components/tours/tour-itinerary-tab.tsx` | `features/tours/components/tour-itinerary-tab.tsx` | |
| `components/tours/tour-designs-tab.tsx` | `features/tours/components/tour-designs-tab.tsx` | |
| `components/tours/tour-quote-tab.tsx` | `features/tours/components/tour-quote-tab.tsx` | |
| `components/tours/tour-requirements-tab.tsx` | `features/tours/components/tour-requirements-tab.tsx` | |
| `components/tours/tour-webpage-tab.tsx` | `features/tours/components/tour-webpage-tab.tsx` | |
| `components/tours/tour-room-manager.tsx` | `features/tours/components/tour-room-manager.tsx` | |
| `components/tours/tour-vehicle-manager.tsx` | `features/tours/components/tour-vehicle-manager.tsx` | |
| `components/tours/tour-edit-dialog.tsx` | `features/tours/components/tour-edit-dialog.tsx` | |
| `components/tours/tour-close-dialog.tsx` | `features/tours/components/tour-close-dialog.tsx` | |
| `components/tours/tour-confirmation-sheet.tsx` | `features/tours/components/tour-confirmation-sheet.tsx` | |
| `components/tours/TourPrintDialog.tsx` | `features/tours/components/TourPrintDialog.tsx` | |
| `components/tours/TourAssignmentManager.tsx` | `features/tours/components/TourAssignmentManager.tsx` | |
| `components/tours/TourFilesManager.tsx` | `features/tours/components/TourFilesManager.tsx` | |
| `components/tours/TourFilesTree.tsx` | `features/tours/components/TourFilesTree.tsx` | |
| `components/tours/ItinerarySyncDialog.tsx` | `features/tours/components/ItinerarySyncDialog.tsx` | |
| `components/tours/JapanEntryCardPrint.tsx` | `features/tours/components/JapanEntryCardPrint.tsx` | |
| `components/tours/TourPnrToolDialog.tsx` | `features/tours/components/TourPnrToolDialog.tsx` | |
| `components/tours/pnr-tool/` | `features/tours/components/pnr-tool/` | 整個目錄 |
| `components/tours/tour-checkin/` | `features/tours/components/tour-checkin/` | 整個目錄 |
| `components/tours/assignment-tabs/` | `features/tours/components/assignment-tabs/` | 整個目錄 |
| `components/tours/edit-dialog/` | `features/tours/components/edit-dialog/` | 整個目錄 |
| `components/tours/print-templates/` | `features/tours/components/print-templates/` | 整個目錄 |
| `components/tours/hooks/` | `features/tours/hooks/` | 合併到現有 hooks |
| `components/tours/utils/` | `features/tours/utils/` | 新建或合併 |
| `components/tours/components/` | `features/tours/components/` | 支付相關子組件 |
| `components/tours/constants/` | `features/tours/constants/` | 合併 |

### 2. `components/orders/` → `features/orders/`

`features/orders/` 已存在但只有 hooks 和 services。

| 來源 | 目標 |
|------|------|
| `components/orders/*.tsx` | `features/orders/components/` |
| `components/orders/components/` | `features/orders/components/` |
| `components/orders/hooks/` | `features/orders/hooks/` |
| `components/orders/utils/` | `features/orders/utils/` |

### 3. `components/todos/` → 新建 `features/todos/`

目前無 `features/todos/`。

| 來源 | 目標 |
|------|------|
| `components/todos/` (全部) | `features/todos/components/` |

### 4. `components/workspace/` → 新建 `features/workspace/`

大量 workspace/channel/chat 業務邏輯。

| 來源 | 目標 |
|------|------|
| `components/workspace/` (全部) | `features/workspace/components/` |

### 5. `components/hr/` → `features/hr/components/`

`features/hr/` 已存在。

| 來源 | 目標 |
|------|------|
| `components/hr/` (全部) | `features/hr/components/` |

### 6. `components/accounting/` → `features/accounting/` 或 `features/erp-accounting/`

| 來源 | 目標 |
|------|------|
| `components/accounting/` | `features/erp-accounting/components/` |

### 7. `components/contracts/` → 新建 `features/contracts/`

| 來源 | 目標 |
|------|------|
| `components/contracts/` (全部) | `features/contracts/components/` |

### 8. `components/finance/` → `features/finance/`

`features/finance/` 已存在。

| 來源 | 目標 |
|------|------|
| `components/finance/` | `features/finance/components/` |

### 9. `components/requirements/` → `features/confirmations/` 或新建

| 來源 | 目標 |
|------|------|
| `components/requirements/` | `features/confirmations/components/` |

### 10. 其他業務模組

| 來源 | 目標 |
|------|------|
| `components/editor/` | `features/design/components/editor/` |
| `components/designer/` | `features/designer/components/` |
| `components/documents/` | 新建 `features/documents/components/` |
| `components/tour-preview/` | `features/tours/components/tour-preview/` |
| `components/transportation/` | `features/transportation-rates/components/` |
| `components/calendar/` | `features/calendar/components/` |
| `components/customers/` | 新建 `features/customers/components/` |
| `components/members/` | 新建 `features/members/components/` |
| `components/selectors/` | 保留或移入相關 feature |
| `components/files/` | `features/files/components/` |
| `components/mobile/` | 保留（跨功能佈局） |
| `components/widgets/` | 保留（通用小工具） |
| `components/manifestation/` | 新建 `features/manifestation/` |

## 遷移步驟建議

1. **每次只遷移一個模組**，避免大規模破壞
2. 遷移後立即更新所有 import 路徑（使用 IDE 重構工具）
3. `npx tsc --noEmit` 確認編譯通過
4. 更新 SITEMAP.md
5. 逐步提交，每個模組一個 commit

## 風險評估

- **高風險**：`tours/` 和 `orders/` — 檔案多、引用廣泛
- **中風險**：`workspace/` — 結構複雜
- **低風險**：`contracts/`、`calendar/`、`customers/` — 相對獨立

## 建議優先順序

1. `contracts/` （低風險，練手）
2. `calendar/` （低風險）
3. `customers/` （低風險）
4. `hr/` （features/hr 已存在，好合併）
5. `finance/` （features/finance 已存在）
6. `todos/` （獨立模組）
7. `orders/` （中高風險，但 features/orders 已存在）
8. `tours/` （最高風險，最後處理）
9. `workspace/` （最複雜，最後處理）
