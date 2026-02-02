/**
 * Corner Travel 手冊樣式常數
 */

// A5 尺寸（mm）
export const A5_WIDTH_MM = 148
export const A5_HEIGHT_MM = 210

// 品牌色彩
export const COLORS = {
  gold: '#c9aa7c',
  black: '#181511',
  gray: '#666666',
  lightGray: '#f5f5f5',
  white: '#ffffff',
} as const

// 基礎頁面樣式
export const pageStyle: React.CSSProperties = {
  width: `${A5_WIDTH_MM}mm`,
  height: `${A5_HEIGHT_MM}mm`,
  padding: '8mm',
  backgroundColor: COLORS.white,
  fontFamily: '"Noto Sans TC", sans-serif',
  color: COLORS.black,
  position: 'relative',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

// 共用樣式
export const headerStyle: React.CSSProperties = {
  fontSize: '10pt',
  fontWeight: 600,
  letterSpacing: '1.5px',
  lineHeight: 1.4,
}

export const dividerStyle: React.CSSProperties = {
  width: '25mm',
  height: '1px',
  backgroundColor: COLORS.gold,
  margin: '4mm 0',
}

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: '9pt',
  fontWeight: 600,
  letterSpacing: '0.5px',
  marginBottom: '2mm',
}

export const bodyTextStyle: React.CSSProperties = {
  fontSize: '8pt',
  fontWeight: 400,
  lineHeight: 1.6,
  color: COLORS.gray,
}

export const pageNumberStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '8mm',
  fontSize: '8pt',
  color: COLORS.gray,
}
