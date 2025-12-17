/**
 * 富文本渲染輔助函數
 */

/**
 * 判斷字串是否包含 HTML 標籤
 */
export function isHtmlString(str: string | null | undefined): boolean {
  if (!str) return false
  return /<[^>]+>/.test(str)
}

/**
 * 將 HTML 轉為純文字
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

/**
 * 安全地渲染可能包含 HTML 的文字
 * 如果是 HTML，使用 dangerouslySetInnerHTML
 * 如果是純文字，直接顯示
 */
export function renderRichText(
  text: string | null | undefined,
  defaultText?: string
): { html?: string; text?: string } {
  const content = text || defaultText || ''
  if (isHtmlString(content)) {
    return { html: content }
  }
  return { text: content }
}
