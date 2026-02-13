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
  上傳圖片後會裁切成此形狀: '上傳圖片後會裁切成此形狀',
  顏色漸層: '顏色/漸層',
  圖片遮罩: '圖片遮罩',
  
  // DualPagePreview
  封底空白頁: '封底/空白頁',
  點擊編輯: '點擊編輯: ',
  第: '第 ',
  頁: ' 頁',
  編輯中: '編輯中',
  
  // FontPicker - 字體分類
  中文黑體: '中文黑體',
  中文宋體: '中文宋體',
  中文手寫: '中文手寫',
  中文圓體: '中文圓體',
  日文: '日文',
  英文無襯線: '英文無襯線',
  英文襯線: '英文襯線',
  英文手寫: '英文手寫',
  
  // FontPicker - 字體標籤
  思源黑體: '思源黑體',
  台北黑體: '台北黑體',
  俐方體: '俐方體',
  思源宋體: '思源宋體',
  芫荽明體: '芫荽明體',
  霞鶩文楷: '霞鶩文楷',
  馬善政楷書: '馬善政楷書',
  芝麻行書: '芝麻行書',
  流建毛草: '流建毛草',
  龍藏: '龍藏',
  禪丸黑體: '禪丸黑體',
  思源黑體JP: '思源黑體 JP',
  思源宋體JP: '思源宋體 JP',
  禪角黑體: '禪角黑體',
  汐風明朝: '汐風明朝',
  小杉丸: '小杉丸',
  
  // FontPicker - 字重
  正常: '正常',
  粗體: '粗體',
  極細: '極細',
  細: '細',
  中等: '中等',
  粗: '粗',
  極粗: '極粗',
  
  // FontPicker - 對齊方式
  靠左: '靠左',
  置中: '置中',
  靠右: '靠右',
  兩端: '兩端',
  
  // ElementLibrary
  元素庫: '元素庫',
  基本: '基本',
  彩色: '彩色',
  圖示: '圖示',
  新增文字: '新增文字',
  形狀: '形狀',
  新增矩形: '新增矩形',
  新增圓形: '新增圓形',
  新增線條: '新增線條',
  新增箭頭: '新增箭頭',
  時間軸: '時間軸',
  垂直時間軸: '垂直時間軸',
  水平時間軸: '水平時間軸',
  新增時間點: '新增時間點',
  實線: '實線',
  虛線: '虛線',
  點線: '點線',
  箭頭: '箭頭',
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