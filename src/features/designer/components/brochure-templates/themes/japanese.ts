/**
 * 日系風格主題
 * 
 * 特點：留白、優雅、圓拱元素
 */
import type { Theme } from '../types'

export const japaneseTheme: Theme = {
  name: '日系風格',
  colors: {
    primary: '#181511',
    secondary: '#666666',
    accent: '#c9aa7c',      // 金色
    background: '#faf8f5',  // 米色
    surface: '#e8e4df',
    text: '#181511',
    textMuted: '#666666',
    border: '#e8e4df',
  },
  fonts: {
    heading: '"Noto Serif TC", serif',
    body: '"Noto Sans TC", sans-serif',
  },
  spacing: {
    page: '8mm',
    section: '8mm',
    element: '4mm',
  },
}
