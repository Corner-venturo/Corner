// ============================================
// 旅遊資料庫管理頁面
// ============================================
//
// 此頁面包含三個分頁（使用 lazy loading）：
// 1. 景點活動 (AttractionsTab) - 限制載入 100 筆
// 2. 米其林餐廳 (MichelinRestaurantsTab)
// 3. 頂級體驗 (PremiumExperiencesTab)
//
// 優化策略：
// - Lazy loading: 只有切換到該 tab 才載入組件
// - Data limiting: 景點限制載入 100 筆，避免崩潰
// - No preload: 不在主頁面預先載入 regions 資料

export { default } from '@/features/attractions/components/DatabaseManagementPage'
