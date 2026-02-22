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
  tab_proposal: '開團',
  tab_active: '待出發',
  tab_closed: '已結團',
  tab_special: '特殊團',
  tab_archived: '封存',
  add_button: '新增',
  add_proposal: '新增提案',
  add_tour_direct: '直接開團',
} as const

// ============================================================
// Status badge color mapping
// ============================================================
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  '開團': 'bg-yellow-100 text-yellow-800',
  '待出發': 'bg-blue-100 text-blue-800',
  '已出發': 'bg-green-100 text-green-800',
  '待結團': 'bg-orange-100 text-orange-800',
  '已結團': 'bg-gray-100 text-gray-600',
  '取消': 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-600',
} as const

// ============================================================
// TourTableColumns
// ============================================================
export const TOUR_TABLE = {
  col_code: '團號',
  col_name: '旅遊團名稱',
  col_departure: '出發日期',
  col_return: '回程日期',
  col_salesperson: '業務員',
  col_assistant: 'OP',
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

// ============================================================
// TourOverviewTab
// ============================================================
export const TOUR_OVERVIEW = {
  section_basic: '基本資訊',
  label_code: '團號:',
  label_destination: '目的地:',
  label_departure: '出發日期:',
  label_return: '返回日期:',
  label_created: '建立時間:',
  section_revenue: '報價與收入',
  label_quote_price: '報價單價格:',
  label_receivable: '應收帳款:',
  label_received: '實收帳款:',
  label_collection_rate: '收款率:',
  label_outstanding: '待收餘額:',
  section_cost: '成本與利潤',
  label_total_cost: '總成本:',
  label_gross_profit: '毛利潤:',
  label_net_profit: '淨利潤:',
  label_profit_rate: '利潤率:',
  financial_status: '財務狀況',
  status_profit: '盈利中',
  status_loss: '虧損中',
  budget_title: '預算 vs 實際支出明細',
  budget_basis: (n: number) => `基準：${n}人團體`,
  col_category: '類別',
  col_budget_pp: '單人預算',
  col_budget_total: '預算總額',
  col_actual: '實際支出',
  col_variance: '差額',
  col_variance_rate: '差額率',
  badge_over: '超支',
  badge_save: '節省',
  total: '總計',
  note_title: '說明：',
  note_green: '綠色數字表示節省預算',
  note_red: '紅色數字表示超出預算',
  note_threshold: '差額率超過20%會特別標示',
  // Quick actions
  action_contract: '📄 產出合約',
  action_create_channel: '📢 建立頻道',
  action_enter_channel: '📢 進入頻道',
  action_archive: '🗄️ 封存',
} as const

// ============================================================
// TourUnlockDialog
// ============================================================
export const TOUR_UNLOCK = {
  title: '解鎖確認',
  subtitle: '請輸入您的登入密碼以解鎖此團進行修改',
  warning: '解鎖後可修改報價單和行程，完成後請記得重新鎖定。',
  label_password: '登入密碼',
  password_placeholder: '請輸入您的登入密碼',
  label_reason: '修改原因（選填）',
  reason_placeholder: '例如：客戶要求變更行程日期',
  cancel: '取消',
  confirm: '確認解鎖',
} as const

// ============================================================
// TourOperationsAddButton
// ============================================================
export const TOUR_OPS_ADD = {
  room_assigned: (n: number) => `已分房: ${n}人`,
  add_item_title: '新增項目',
  add_field: '新增欄位',
  custom_field_prompt: '請輸入欄位名稱',
  custom_field_title: '新增自訂欄位',
  custom_field_placeholder: '輸入名稱...',
  blank_field: '空白欄位',
  blank_field_desc: '新增自定義空白項目',
  addon_field: '加購項目',
  addon_field_desc: '新增額外購買項目',
  refund_field: '退費項目',
  refund_field_desc: '新增退款相關項目',
  dialog_title: '新增項目',
  dialog_desc: (name: string) => `為旅遊團「${name}」選擇要新增的項目類型：`,
  cancel: '取消',
} as const

// ============================================================
// TourConfirmationDialog
// ============================================================
export const TOUR_CONFIRMATION = {
  title: (code: string, name: string) => `團確單管理 - ${code} ${name}`,
} as const

// ============================================================
// TourConfirmationWizard
// ============================================================
export const TOUR_WIZARD = {
  step_quote: '選擇報價單',
  step_itinerary: '選擇行程',
  step_confirm: '確認鎖定',
  title: (name: string) => `確認精靈 - ${name}`,
  subtitle: '選擇要鎖定的報價單和行程版本，確認後將無法自由修改',
  select_quote: '選擇報價單版本',
  no_quote: '此團尚無報價單',
  skip_step: '可跳過此步驟繼續',
  unnamed_quote: '未命名報價單',
  select_itinerary: '選擇行程版本',
  no_itinerary: '此團尚無行程',
  unnamed_itinerary: '未命名行程',
  last_updated: '最後更新:',
  confirm_lock_title: '確認鎖定版本',
  confirm_lock_desc: '鎖定後，報價單和行程將無法自由修改。如需修改，須先輸入密碼解鎖。',
  selected_quote: '選定報價單',
  unnamed: '未命名',
  not_selected: '未選擇',
  selected_itinerary: '選定行程',
  prev_step: '上一步',
  cancel: '取消',
  next_step: '下一步',
  confirm_lock: '確認鎖定',
} as const

// ============================================================
// LinkItineraryToTourDialog
// ============================================================
export const TOUR_LINK_ITINERARY = {
  button_label: '設計',
  days_suffix: (n: number) => `(${n} 天)`,
  select_type: '選擇設計類型',
  brochure: '手冊',
  brochure_desc: '製作精美的行程手冊，可列印或分享 PDF',
  web_itinerary: '網頁行程表',
  web_itinerary_desc: '互動式網頁行程，可產生連結分享給客戶',
} as const

// ============================================================
// TourItineraryDialog
// ============================================================
export const TOUR_ITINERARY_DIALOG = {
  loading: '載入行程表...',
} as const

// ============================================================
// TourActionButtons
// ============================================================
export const TOUR_ACTIONS = {
  view_versions: '查看版本',
  versions: '版本',
  edit: '編輯',
  archive: '封存',
  unarchive: '解除封存',
  unarchive_short: '解封',
  delete: '刪除',
  channel: '頻道',
  create_channel: '建立工作空間頻道',
  quote_itinerary: '報價/行程',
  quote_management: '報價與行程管理',
  design: '設計',
  design_title: '設計手冊或網頁行程',
  contract: '合約',
  contract_title: '合約管理',
  requirements: '需求',
  requirements_title: '需求總覽',
  close_tour: '已結團',
} as const

// ============================================================
// TourClosingDialog
// ============================================================
export const TOUR_CLOSING = {
  title: (code: string) => `結案 - ${code}`,
  label_name: '團名',
  label_orders: '訂單數',
  orders_unit: '筆',
  label_revenue: '總收入',
  label_cost: '總成本',
  label_gross: '毛利',
  section_bonus: '獎金設定',
  label_sales_bonus: '業務獎金',
  label_op_bonus: 'OP 獎金',
  label_bonus_total: '獎金總計',
  closing_note: '結案後將自動產生獎金請款單，狀態變更為「結案」。',
  printing: '生成中...',
  print_report: '列印報表',
  cancel: '取消',
  submitting: '處理中...',
  confirm: '確認結案',
} as const
