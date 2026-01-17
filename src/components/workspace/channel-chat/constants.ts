export const DEFAULT_CHANNEL_NAME = '一般討論'
export const BOT_CHANNEL_NAME = '機器人助手'
export const LAST_CHANNEL_STORAGE_KEY = 'workspace_last_channel_id'

export const CHANNEL_SWITCH_DELAY = 150

export const DIALOG_TYPES = {
  SHARE_QUOTE: 'shareQuote',
  SHARE_TOUR: 'shareTour',
  NEW_PAYMENT: 'newPayment',
  NEW_RECEIPT: 'newReceipt',
  NEW_TASK: 'newTask',
  SHARE_ADVANCE: 'shareAdvance',
  SHARE_ORDERS: 'shareOrders',
  CREATE_RECEIPT: 'createReceipt',
  CREATE_PAYMENT: 'createPayment',
  SETTINGS: 'settings',
} as const

export const ALERT_MESSAGES = {
  LOGIN_REQUIRED: '請先登入才能發送訊息',
  SEND_FAILED: '發送訊息失敗，請稍後再試',
  DELETE_CHANNEL_CONFIRM: '確定要刪除頻道嗎？此操作無法復原。',
  CHANNEL_DELETED: '頻道已刪除',
  DELETE_FAILED: '刪除頻道失敗，請稍後再試',
  CHANNEL_NAME_REQUIRED: '頻道名稱不能為空',
  UPDATE_SUCCESS: '頻道設定已更新',
  UPDATE_FAILED: '更新頻道失敗，請稍後再試',
} as const

export const PLACEHOLDER_TEXT = {
  QUOTE_SEARCH: '輸入報價單編號搜尋...',
  TOUR_SEARCH: '輸入團號搜尋...',
  PAYMENT_ITEM: '輸入請款項目...',
  PAYMENT_AMOUNT: '輸入請款金額...',
  PAYMENT_REASON: '輸入請款原因...',
  RECEIPT_ITEM: '輸入收款項目...',
  RECEIPT_AMOUNT: '輸入收款金額...',
  PAYER_NAME: '輸入付款人...',
  TASK_TITLE: '輸入任務標題...',
  TASK_DESCRIPTION: '輸入任務描述...',
  ASSIGNEE_NAME: '輸入成員名稱...',
  CHANNEL_NAME: '頻道名稱',
  CHANNEL_DESCRIPTION: '頻道描述（選填）',
} as const
