// designer 模組 UI 標籤常量

export const DESIGNER_LABELS = {
  // ImageAdjustmentsPanel
  曝光度: '曝光度',
  對比度: '對比度',
  高光: '高光',
  陰影: '陰影',
  飽和度: '飽和度',
  色溫: '色溫',
  色調: '色調',
  銳利度: '銳利度',
  暈影: '暈影',
  重置所有調整: '重置所有調整',
  光線: '光線',
  色彩: '色彩',
  效果: '效果',
  
  // PropertiesPanel
  屬性: '屬性',
  選取元素以編輯屬性: '選取元素以編輯屬性',
  文字內容: '文字內容',
  字級: '字級',
  字體: '字體',
  粗細: '粗細',
  對齊: '對齊',
  位置: '位置',
  大小: '大小',
  旋轉: '旋轉',
  填充: '填充',
  邊框: '邊框',
  透明度: '透明度',
  上傳圖片填充: '上傳圖片填充',
  文字: '文字',
  矩形: '矩形',
  圓形: '圓形',
  圖片: '圖片',
  線條: '線條',
  群組: '群組',
  圖案: '圖案',
  多邊形: '多邊形',
  三角形: '三角形',
  元素: '元素',
  個文字: '個文字',
  個文字元素: '個文字元素',
  已選擇: '已選擇',
  度: '度',
  寬: '寬',
  高: '高',
  X: 'X',
  Y: 'Y',
};

// PropertiesPanel 函數
export function getObjectType(type: string): string {
  switch (type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      return DESIGNER_LABELS.文字
    case 'rect':
      return DESIGNER_LABELS.矩形
    case 'ellipse':
    case 'circle':
      return DESIGNER_LABELS.圓形
    case 'image':
      return DESIGNER_LABELS.圖片
    case 'line':
      return DESIGNER_LABELS.線條
    case 'group':
      return DESIGNER_LABELS.群組
    case 'path':
      return DESIGNER_LABELS.圖案
    case 'polygon':
      return DESIGNER_LABELS.多邊形
    case 'triangle':
      return DESIGNER_LABELS.三角形
    default:
      return DESIGNER_LABELS.元素
  }
}