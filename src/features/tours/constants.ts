/**
 * Tours feature - UI string constants
 * Extracted from JSX to comply with no-hardcoded-Chinese rule
 */

// ============================================================
// TourFilters
// ============================================================
export const TOUR_FILTERS = {
  page_title: '旅遊團管理',
  breadcrumb_home: '首頁',
  breadcrumb_tours: '旅遊團管理',
  search_placeholder: '搜尋旅遊團...',
  tab_all: '全部',
  tab_proposal: '提案',
  tab_active: '進行中',
  tab_closed: '結案',
  tab_special: '特殊團',
  tab_archived: '封存',
  add_button: '新增',
  add_proposal: '新增提案',
  add_tour_direct: '直接開團',
} as const

// ============================================================
// TourTableColumns
// ============================================================
export const TOUR_TABLE = {
  col_code: '團號',
  col_name: '旅遊團名稱',
  col_departure: '出發日期',
  col_status: '狀態',
  empty_title: '沒有找到旅遊團',
  empty_subtitle: '請調整篩選條件或新增旅遊團',
} as const

// ============================================================
// TourMobileCard
// ============================================================
export const TOUR_MOBILE_CARD = {
  unnamed_tour: '未命名旅遊團',
  no_name: '無團名',
  person_unit: '人',
  per_person: '/ 人',
  leader_label: '領隊',
} as const

// ============================================================
// DeleteConfirmDialog
// ============================================================
export const TOUR_DELETE = {
  title: '確認刪除旅遊團',
  confirm_text: (name?: string) => `確定要刪除旅遊團「${name}」嗎？`,
  impact_title: '此操作會影響：',
  impact_orders: '• 相關訂單和團員資料',
  impact_payments: '• 收付款記錄',
  impact_quotes: '• 報價單',
  warning: '⚠️ 此操作無法復原！',
  cancel: '取消',
  confirm: '確認刪除',
} as const

// ============================================================
// ArchiveReasonDialog
// ============================================================
export const TOUR_ARCHIVE = {
  title: '封存旅遊團',
  confirm_text: (name?: string) => `確定要封存旅遊團「${name}」嗎？`,
  select_reason: '請選擇封存原因：',
  reason_no_deal: '沒成交',
  reason_no_deal_desc: '客戶最終未成交',
  reason_cancelled: '取消',
  reason_cancelled_desc: '客戶或公司取消此團',
  reason_test_error: '測試錯誤',
  reason_test_error_desc: '測試用資料或操作錯誤',
  after_archive_title: '封存後，此旅遊團將：',
  after_archive_hidden: '• 從列表中隱藏（可在「封存」分頁查看）',
  after_archive_unlink: '• 自動斷開關聯的報價單和行程表',
  cancel: '取消',
  confirm: '確認封存',
} as const

// ============================================================
// TourForm
// ============================================================
export const TOUR_FORM = {
  title_edit: '編輯旅遊團',
  title_convert: '提案轉開團',
  title_create: '新增旅遊團 & 訂單',
  section_info: '旅遊團資訊',
  cancel: '取消',
  submit_saving: '儲存中...',
  submit_save: '儲存變更',
  submit_converting: '轉開團中...',
  submit_convert_with_order: '確認轉開團並建立訂單',
  submit_convert: '確認轉開團',
  submit_creating: '建立中...',
  submit_create_with_order: '新增旅遊團 & 訂單',
  submit_create: '新增旅遊團',
} as const

// ============================================================
// TourBasicInfo
// ============================================================
export const TOUR_BASIC_INFO = {
  label_name: '旅遊團名稱',
  label_departure: '出發日期',
  label_return: '返回日期',
  label_description: '描述',
} as const

// ============================================================
// TourFlightInfo
// ============================================================
export const TOUR_FLIGHT_INFO = {
  section_title: '航班資訊（選填）',
  outbound_label: '去程航班',
  return_label: '回程航班',
  flight_number_placeholder: '航班號碼',
  search_button: '查詢',
  flight_text_placeholder: '查詢後自動帶入，或手動輸入',
} as const

// ============================================================
// TourOrderSection
// ============================================================
export const TOUR_ORDER_SECTION = {
  title: '同時新增訂單（選填）',
  hint: '提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。',
} as const

// ============================================================
// TourSettings
// ============================================================
export const TOUR_SETTINGS = {
  controller_label: '團控人員',
  controller_optional: '(選填)',
  controller_placeholder: '選擇團控人員...',
  controller_empty: '找不到團控人員',
  special_tour: '特殊團',
} as const
