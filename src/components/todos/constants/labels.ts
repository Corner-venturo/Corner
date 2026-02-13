// Todos 模組中文標籤

// 狀態相關
export const TODO_STATUS_LABELS = {
  pending: '待辦',
  in_progress: '進行中',
  completed: '完成',
  cancelled: '取消',
}

// 通用標籤
export const COMMON_LABELS = {
  shared: '共享',
  priority: '優先級',
  deadline: '截止日期',
  notes: '備註',
  relatedItems: '關聯項目',
  readOnlyMode: '唯讀模式',
  unknownEmployee: '未知員工',
  unknownUser: '未知使用者',
  notSet: '未設定',
}

// 按鈕文字
export const BUTTON_LABELS = {
  markComplete: '標記完成',
  extendWeek: '延期一週',
  save: '儲存',
  cancel: '取消',
  add: '新增',
  create: '建立收款單',
}

// Placeholder 文字
export const PLACEHOLDER_LABELS = {
  enterTaskTitle: '輸入任務標題...',
  selectDate: '選擇日期',
  addNote: '新增備註... (Enter 送出，Shift+Enter 換行)',
  enterHandlerName: '請輸入經手人姓名',
  enterPayerName: '請輸入付款人姓名',
  optional: '選填',
  optionalWithFees: '選填，如有手續費',
  enterAmount: '請輸入金額',
  enterAuthCode: '請輸入授權碼',
  enterCheckNumber: '請輸入支票號碼',
  enterBankName: '請輸入銀行名稱',
  paymentNameExample: '例如：峇里島五日遊 - 尾款',
  selectGroup: '請選擇團體...',
  selectGroupFirst: '請先選擇團體',
  noOrdersInGroup: '此團體沒有訂單',
  selectOrder: '請選擇訂單...',
  selectAccount: '請選擇匯入帳戶',
}

// 標題和對話框
export const DIALOG_LABELS = {
  todoDetails: '待辦事項詳情',
}

// 表單欄位標籤
export const FORM_LABELS = {
  assignTo: '指派給:',
  group: '團體',
  order: '訂單',
  paymentMethod: '收款方式 *',
  amount: '金額 *',
  transactionDate: '交易日期 *',
  payerName: '付款人姓名',
  remarks: '備註',
  handler: '經手人',
  depositAccount: '匯入帳戶 *',
  fees: '手續費',
  cardLastFour: '卡號後四碼',
  authCode: '授權碼',
  checkNumber: '支票號碼',
  issueBank: '開票銀行',
  email: 'Email *',
  paymentDeadline: '付款截止日 *',
  paymentNameForCustomer: '付款名稱（客戶看到的）',
}

// 提示文字
export const TOOLTIP_LABELS = {
  removeAssignment: '取消指派',
  clearDeadline: '清除期限',
  editNote: '編輯備註',
  deleteNote: '刪除備註',
}

// 聯絡人相關
export const CONTACT_LABELS = {
  noContact: '無聯絡人',
}

// 銀行選項
export const BANK_OPTIONS = {
  cathay: '國泰銀行',
  hcb: '合作金庫',
}

// 警告/成功訊息
export const MESSAGE_LABELS = {
  selectOrder: '請選擇訂單',
  amountRequired: '收款金額不能為 0',
  receiptCreateSuccess: '收款單建立成功',
  createFailed: '建立失敗，請稍後再試',
}

// 訊息生成函數
export const getPublicTodoMessages = () => ({
  title: '這是公開的待辦事項',
  subtitle: '只有建立者和共享者可以編輯',
})