/**
 * Brochure Feature
 * 電子手冊設計器模組
 *
 * [Refactoring] 此模組正在重構中
 * 目前主要邏輯在 src/app/(main)/brochure/page.tsx (4481行)
 * 計畫拆分為：
 * - components/BrochureCanvas.tsx - 畫布渲染
 * - components/BrochureToolbar.tsx - 工具列
 * - components/BrochureSidebar.tsx - 側邊欄
 * - components/BrochurePageDrawer.tsx - 頁面導航抽屜
 * - components/BrochurePrintPreview.tsx - 列印預覽
 * - components/panels/ - 各種編輯面板
 * - hooks/useBrochureState.ts - 狀態管理
 * - hooks/useBrochureDraft.ts - 草稿功能
 * - hooks/useBrochureHistory.ts - 歷史 (Undo)
 */

// Types
export * from './types'
