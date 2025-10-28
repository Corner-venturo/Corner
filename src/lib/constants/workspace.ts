/**
 * Workspace 相關常數
 */

// 佈局尺寸
export const WORKSPACE_LAYOUT = {
  MAX_HEIGHT: 600,
  SIDEBAR_WIDTH: 280,
  SIDEBAR_WIDTH_COLLAPSED: 60,
  MESSAGE_LIST_HEIGHT: 500,
  INPUT_HEIGHT: 100,
  HEADER_HEIGHT: 64,
} as const;

// 限制
export const WORKSPACE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_MESSAGE_LENGTH: 5000,
  MAX_MEMBERS_PER_CHANNEL: 100,
  MAX_CHANNELS: 50,
  MAX_ATTACHMENTS: 5,
} as const;

// 延遲時間
export const WORKSPACE_DELAYS = {
  AUTO_SAVE: 2000, // 2s
  TYPING_INDICATOR: 3000, // 3s
  MESSAGE_FADE: 5000, // 5s
  DEBOUNCE_SEARCH: 300, // 300ms
} as const;

// 訊息類型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  QUOTE: 'quote',
  TOUR: 'tour',
  ORDER: 'order',
  ADVANCE: 'advance',
  RECEIPT: 'receipt',
  PAYMENT: 'payment',
} as const;

// Channel 類型
export const CHANNEL_TYPES = {
  TEAM: 'team',
  TOUR: 'tour',
  PROJECT: 'project',
  GENERAL: 'general',
} as const;

// 檔案類型
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// 預設值
export const WORKSPACE_DEFAULTS = {
  CHANNEL_NAME: '新頻道',
  CHANNEL_DESCRIPTION: '',
  MESSAGE_PLACEHOLDER: '輸入訊息...',
  EMPTY_STATE_TEXT: '尚無訊息',
} as const;
