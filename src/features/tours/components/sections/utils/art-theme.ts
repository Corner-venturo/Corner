// Art/Magazine 配色 - Brutalist 風格
// 正確的 Art 風格色彩：高對比、藝術雜誌感
export const ART = {
  ink: '#1C1C1C',      // 主要深色（文字、邊框）
  paper: '#F2F0E9',    // 背景紙色
  clay: '#BF5B3D',     // 強調色（terracotta 陶土色）
  accent: '#C6A87C',   // 次要強調色（金褐色）
  timeline: '#4a6fa5', // 時間軸藍色（保留給 Itinerary）
} as const

export type ArtTheme = typeof ART
