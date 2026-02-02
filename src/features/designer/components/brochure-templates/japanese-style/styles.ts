/**
 * 日系風格手冊樣式
 */
import type { PageSize } from './types'

export const COLORS = {
  gold: '#c9aa7c',
  black: '#181511',
  gray: '#666666',
  lightGray: '#e8e4df',
  cream: '#faf8f5',
  white: '#ffffff',
} as const

export function getPageStyle(size: PageSize): React.CSSProperties {
  return {
    width: `${size.width}mm`,
    height: `${size.height}mm`,
    padding: '8mm',
    backgroundColor: COLORS.cream,
    fontFamily: '"Noto Sans TC", "Noto Serif TC", sans-serif',
    color: COLORS.black,
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
}

// 預設 A5
export const pageStyle: React.CSSProperties = {
  width: '148mm',
  height: '210mm',
  padding: '8mm',
  backgroundColor: COLORS.cream,
  fontFamily: '"Noto Sans TC", "Noto Serif TC", sans-serif',
  color: COLORS.black,
  position: 'relative',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

export const headerStyle: React.CSSProperties = {
  fontSize: '10pt',
  fontWeight: 800,
  letterSpacing: '2.4px',
  textAlign: 'center',
}

export const goldUnderline: React.CSSProperties = {
  width: '50px',
  height: '2px',
  backgroundColor: COLORS.gold,
  margin: '4mm auto',
}

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11pt',
  fontWeight: 700,
  letterSpacing: '1px',
  marginBottom: '4mm',
}

export const bodyTextStyle: React.CSSProperties = {
  fontSize: '9pt',
  fontWeight: 400,
  lineHeight: 1.8,
  color: COLORS.black,
}

export const pageNumberStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '6mm',
  fontSize: '8pt',
  color: COLORS.gray,
}
