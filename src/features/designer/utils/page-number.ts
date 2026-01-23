/**
 * 頁碼計算工具
 *
 * 規則：
 * - 封面不算頁碼
 * - 目錄前的空白頁不算頁碼（用於調整印刷左右位置）
 * - 從目錄開始算 p.01
 * - 目錄後的所有頁面（含空白頁）都算頁碼
 */

interface PageWithTemplateKey {
  id: string
  templateKey?: string
}

/**
 * 判斷該頁面是否應該計算頁碼
 */
export function shouldCountPageNumber(
  page: PageWithTemplateKey,
  pages: PageWithTemplateKey[]
): boolean {
  // 封面不算
  if (page.templateKey === 'cover') return false

  // 找到目錄的位置
  const tocIndex = pages.findIndex((p) => p.templateKey === 'toc')
  const pageIndex = pages.findIndex((p) => p.id === page.id)

  // 如果有目錄，且此頁在目錄前面
  if (tocIndex !== -1 && pageIndex < tocIndex) {
    // 目錄前面的空白頁不算
    if (page.templateKey === 'blank') return false
  }

  // 其他都算（包括目錄本身、目錄後的所有頁面）
  return true
}

/**
 * 計算頁面的頁碼
 * @returns 頁碼數字，或 null 表示不顯示頁碼
 */
export function calculatePageNumber(
  pageIndex: number,
  pages: PageWithTemplateKey[]
): number | null {
  const page = pages[pageIndex]
  if (!page) return null

  if (!shouldCountPageNumber(page, pages)) {
    return null // 不顯示頁碼
  }

  // 計算在「算頁碼的頁面」中是第幾個
  let count = 0
  for (let i = 0; i <= pageIndex; i++) {
    if (shouldCountPageNumber(pages[i], pages)) {
      count++
    }
  }
  return count
}

/**
 * 格式化頁碼
 */
export function formatPageNumber(num: number): string {
  return `p. ${String(num).padStart(2, '0')}`
}

/**
 * 計算頁面的頁碼（用於批量計算）
 * @returns 頁碼數字，或 0 表示不顯示頁碼
 */
export function calculatePageNumberForToc(
  pageId: string,
  pages: PageWithTemplateKey[]
): number {
  const pageIndex = pages.findIndex((p) => p.id === pageId)
  if (pageIndex === -1) return 0

  const pageNumber = calculatePageNumber(pageIndex, pages)
  return pageNumber ?? 0
}
