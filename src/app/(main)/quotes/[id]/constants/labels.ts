export const ID_LABELS = {
  LOADING_6912: '載入中...',
  NOT_FOUND_4550: '找不到該報價單',
  DELETE_642: '您要找的報價單可能已被刪除或不存在',
  LABEL_2257: '分類',
  LABEL_7325: '項目',
  QUANTITY: '數量',
  LABEL_9413: '單價',
  LABEL_832: '小計',
  ACTIONS: '操作',
}

// Sync operations
export const QUOTE_SYNC_LABELS = {
  MEAL_LUNCH: '午餐',
  MEAL_BREAKFAST: '早餐',
  MEAL_DINNER: '晚餐',
  MEAL_SELF: '自理',
  SYNC_MEALS_SUCCESS: '已同步餐飲資料到行程表',
  NO_LINKED_ITINERARY: '此報價單沒有連結行程表',
  ITINERARY_NOT_FOUND: '找不到連結的行程表',
  NO_ACCOMMODATION_DATA: '行程表沒有住宿資料',
  ACCOMMODATION_UP_TO_DATE: '住宿名稱已是最新',
  SYNC_ACCOMMODATION: (days: number) => `已從行程表同步 ${days} 天住宿`,
}

// Quote page
export const QUOTE_PAGE_LABELS = {
  UPDATE_STATUS_FAILED: '更新狀態失敗，請稍後再試',
  NO_SYNC_CHANGES: '沒有需要同步的變更',
  STATUS_ACTIVE: '進行中',
  TOUR_LINKED: (code: string) => `已關聯旅遊團：${code}`,
  IMPORTED_MEALS: (count: number) => `已匯入 ${count} 筆餐飲`,
  IMPORTED_ATTRACTIONS: (count: number) => `已匯入 ${count} 筆景點`,
  NO_LINKED_ITINERARY: '此報價單沒有關聯的行程表',
  LOCAL_QUOTE: 'Local 報價',
  LOCAL_APPLIED: (count: number) => `Local 報價已套用，產生 ${count} 個檻次`,
  BACK_TO_LIST: '返回報價單列表',
  THIS_QUOTE: '此報價單',
}
