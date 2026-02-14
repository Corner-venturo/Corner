// Finance module labels
export const FinanceLabels = {
  // Travel Invoice Create Page
  invoiceCreateTitle: '開立新發票',
  basicInfo: '基本資訊',
  issueDate: '開立日期',
  selectDate: '選擇日期',
  taxType: '課稅別',
  selectTaxType: '選擇課稅別',
  dutiable: '應稅',
  zeroRate: '零稅率',
  taxFree: '免稅',
  reportStatus: '申報註記',
  unreported: '未申報',
  reported: '已申報',
  buyerInfo: '買受人資訊',
  buyerName: '買受人名稱',
  buyerNameRequired: '買受人名稱 *',
  enterBuyerName: '請輸入買受人名稱',
  unifiedBusinessNumber: '統一編號',
  ubnPlaceholder: '8 碼數字',
  email: 'Email',
  emailForReceipt: '用於寄送電子收據',
  mobileNumber: '手機號碼',
  mobilePlaceholder: '09xxxxxxxx',
  productDetails: '商品明細',
  summary: '摘要',
  quantity: '數量',
  unitPrice: '單價',
  unit: '單位',
  amount: '金額',
  handle: '處理',
  productName: '商品名稱',
  addRow: '新增一列',
  remarks: '備註',
  remarksPlaceholder: '請輸入備註（限 50 字）',
  remarksNote: '可輸入大小寫英文、中文（限 50 字，不可輸入符號，例如：/ , - = 等）',
  total: '總計',
  cancel: '取消',
  issuing: '開立中...',
  issueInvoice: '開立發票',
  enterBuyerNameError: '請輸入買受人名稱',
  completeProductInfoError: '請完整填寫商品資訊',
  unknownError: '發生未知錯誤',

  // Payments Page
  paymentManagement: '收款管理',
  searchReceiptPlaceholder: '搜尋收款單號、訂單編號、團名...',
  exportExcel: '匯出 Excel',
  batchConfirm: '批量確認',
  batchPayment: '批量收款',
  addPayment: '新增收款',
  receiptNumber: '收款單號',
  receiptDate: '收款日期',
  orderNumber: '訂單編號',
  tourName: '團名',
  receiptAmount: '應收金額',
  actualAmount: '實收金額',
  status: '狀態',
  actions: '操作',
  edit: '編輯',
  createReceiptFailedPrefix: '建立收款單失敗',
  createReceiptFailedTitle: '建立收款單失敗'
}
export const FINANCE_PAGE_LABELS = {
  LOADING_DATA: '正在載入財務資料...',
  TOTAL_INCOME: '總收入',
  TOTAL_EXPENSE: '總支出',
  NET_PROFIT: '淨利潤',
  PENDING_ITEMS: '待確認款項',
  TRANSACTION_RECORDS: '交易紀錄',
}

export const BATCH_CONFIRM_LABELS = {
  NO_PENDING_ITEMS: '沒有待確認的收款品項',
  ALL_CONFIRMED: '所有收款品項都已確認完成',
}

export const CREATE_RECEIPT_LABELS = {
  TITLE: '新增收款單',
  BASIC_INFO: '基本資訊',
  PAYMENT_ITEMS: '收款項目',
  TOTAL_AMOUNT: '總收款金額',
}

export const PAYMENT_ITEM_LABELS = {
  ITEM_TITLE: '收款項目',
  PAYMENT_METHOD: '收款方式 *',
  AMOUNT: '金額 *',
  TRANSACTION_DATE: '交易日期 *',
  PAYER_NAME: '付款人姓名',
  REMARKS: '備註',
  HANDLER: '經手人',
  HANDLING_FEE: '手續費',
  AUTH_CODE: '授權碼',
}

export const TOUR_PNL_LABELS = {
  INCOME: '收入',
  COST: '成本',
  GROSS_PROFIT: '毛利',
  ALL_STATUS: '全部狀態',
  CONFIRMED: '已確認',
  OPERATING: '出團中',
  COMPLETED: '已完成',
  CLOSED: '已結案',
}

export const UNCLOSED_TOURS_LABELS = {
  DESCRIPTION: '此報表顯示<strong>回程日 + 7 天已過</strong>但尚未執行結案的團體。',
}

export const UNPAID_ORDERS_LABELS = {
  TODAY: '今天',
  NOT_DEPARTED: '尚未出發',
  ALL: '全部',
  OVERDUE: '已出發未收',
  UNPAID: '完全未付',
  PARTIAL: '部分付款',
  PENDING_DEPOSIT: '待收訂金',
}

export const REQUESTS_PAGE_LABELS = {
  LOADING: '載入中',
}

export const TRAVEL_INVOICE_LABELS = {
  LOADING: '載入中...',
  BASIC_INFO: '基本資訊',
  INVOICE_NUMBER: '發票號碼',
  ISSUE_DATE: '開立日期',
  TAX_TYPE: '課稅別',
  TOTAL_AMOUNT: '總金額',
  BUYER_INFO: '買受人資訊',
  NAME: '名稱',
  TAX_ID: '統一編號',
  MOBILE: '手機',
}

// Additional TRAVEL_INVOICE_LABELS - append to existing
export const TRAVEL_INVOICE_DETAIL_LABELS = {
  PRODUCT_DETAILS: '商品明細',
  INVOICE_INFO: '發票資訊',
  RANDOM_CODE: '隨機碼',
  BARCODE: '條碼',
  VOID_INFO: '作廢資訊',
  VOID_TIME: '作廢時間',
  VOID_REASON: '作廢原因',
  VOID_INVOICE: '作廢發票',
  VOID_REASON_REQUIRED: '作廢原因 *',
}
