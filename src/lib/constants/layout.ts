/**
 * Layout Constants
 * 版面配置相關常數
 */

// Header
export const HEADER_HEIGHT = 72; // px
export const HEADER_HEIGHT_PX = '72px';

// Sidebar
export const SIDEBAR_WIDTH_EXPANDED = 190; // px
export const SIDEBAR_WIDTH_COLLAPSED = 16; // px
export const SIDEBAR_WIDTH_EXPANDED_PX = '190px';
export const SIDEBAR_WIDTH_COLLAPSED_PX = '16px';

// Transitions
export const LAYOUT_TRANSITION_DURATION = 300; // ms

// Pages without sidebar
export const NO_SIDEBAR_PAGES = [
  '/login',
  '/unauthorized',
  '/view', // 分享的行程預覽頁面（無需登入、無側邊欄）
];

// Pages with custom layout
export const CUSTOM_LAYOUT_PAGES = [
  '/editor',
];
