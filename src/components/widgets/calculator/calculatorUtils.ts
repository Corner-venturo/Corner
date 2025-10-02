/**
 * 計算機工具函式
 */

/**
 * 執行基本運算
 */
export const calculate = (firstValue: number, secondValue: number, operation: string): number => {
  switch (operation) {
    case '+':
      return firstValue + secondValue;
    case '-':
      return firstValue - secondValue;
    case '×':
      return firstValue * secondValue;
    case '÷':
      return firstValue / secondValue;
    default:
      return secondValue;
  }
};

/**
 * 計算算式結果
 */
export const evaluateExpression = (expr: string, fallback: number = 0): number => {
  try {
    // 將運算符號轉換為 JS 可執行的格式
    const jsExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    // eslint-disable-next-line no-eval
    return eval(jsExpr);
  } catch {
    return fallback;
  }
};

/**
 * 處理貼上的文字：移除非數字/運算符號，轉換全形為半形
 */
export const processPastedText = (text: string): string => {
  return text
    // 全形數字轉半形
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    // 全形運算符號轉半形
    .replace(/[＋－×＊÷／]/g, (char) => {
      const map: Record<string, string> = {
        '＋': '+',
        '－': '-',
        '×': '×',
        '＊': '×',
        '÷': '÷',
        '／': '÷'
      };
      return map[char] || char;
    })
    // 全形小數點和等號轉半形
    .replace(/．/g, '.')
    .replace(/＝/g, '=')
    // 移除所有非數字、運算符號、小數點的字元（包括英文字母）
    .replace(/[^0-9+\-×*÷/.=]/g, '')
    // * 轉 ×, / 轉 ÷
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
};

/**
 * 檢查是否為運算符號
 */
export const isOperator = (char: string): boolean => {
  return ['+', '-', '×', '÷'].includes(char);
};
