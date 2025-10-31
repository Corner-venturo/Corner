/**
 * 收款單號生成工具
 *
 * 格式：R{年2碼}{月2碼}{日2碼}{流水號4位}
 * 範例：R2501280001 (2025年1月28日第1筆)
 */

interface Receipt {
  receipt_number: string
}

/**
 * 生成收款單號
 *
 * @param receiptDate - 收款日期 (ISO 8601 格式或 Date 物件)
 * @param existingReceipts - 現有收款單列表
 * @returns 收款單號（例如：R2501280001）
 *
 * @example
 * generateReceiptNumber('2025-01-28', existingReceipts)
 * // => 'R2501280001' (2025年1月28日第1筆)
 *
 * @example
 * generateReceiptNumber(new Date('2025-01-28'), existingReceipts)
 * // => 'R2501280002' (如果已有1筆，則生成第2筆)
 */
export function generateReceiptNumber(
  receiptDate: string | Date,
  existingReceipts: Receipt[]
): string {
  const date = typeof receiptDate === 'string' ? new Date(receiptDate) : receiptDate

  // 格式化日期：YY MM DD
  const year = date.getFullYear().toString().slice(-2) // 後兩碼
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  const datePrefix = `R${year}${month}${day}`

  // 找出同日期的最大流水號
  let maxSequence = 0
  existingReceipts.forEach(receipt => {
    if (receipt.receipt_number?.startsWith(datePrefix)) {
      // 提取最後 4 碼流水號
      const sequencePart = receipt.receipt_number.slice(-4)
      const sequence = parseInt(sequencePart, 10)
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence
      }
    }
  })

  // 生成下一個流水號（4位數，補零）
  const nextSequence = (maxSequence + 1).toString().padStart(4, '0')
  return `${datePrefix}${nextSequence}`
}

/**
 * 驗證收款單號格式
 *
 * @param receiptNumber - 收款單號
 * @returns 是否為有效格式
 *
 * @example
 * isValidReceiptNumber('R2501280001')  // => true
 * isValidReceiptNumber('R25012800')    // => false (太短)
 * isValidReceiptNumber('ABC123')       // => false (格式錯誤)
 */
export function isValidReceiptNumber(receiptNumber: string): boolean {
  // 格式：R + 2碼年 + 2碼月 + 2碼日 + 4碼流水號 = 11碼
  const regex = /^R\d{10}$/
  return regex.test(receiptNumber)
}

/**
 * 解析收款單號，提取日期和流水號
 *
 * @param receiptNumber - 收款單號
 * @returns 解析結果，包含日期和流水號
 *
 * @example
 * parseReceiptNumber('R2501280001')
 * // => { year: 2025, month: 1, day: 28, sequence: 1 }
 */
export function parseReceiptNumber(receiptNumber: string): {
  year: number
  month: number
  day: number
  sequence: number
} | null {
  if (!isValidReceiptNumber(receiptNumber)) {
    return null
  }

  const year = parseInt(`20${receiptNumber.slice(1, 3)}`, 10)
  const month = parseInt(receiptNumber.slice(3, 5), 10)
  const day = parseInt(receiptNumber.slice(5, 7), 10)
  const sequence = parseInt(receiptNumber.slice(7, 11), 10)

  return { year, month, day, sequence }
}

/**
 * 格式化收款單號顯示
 * 可用於 UI 縮減顯示
 *
 * @param receiptNumber - 收款單號
 * @param format - 顯示格式：'full'(完整) | 'short'(縮短) | 'date'(只顯示日期)
 * @returns 格式化後的顯示文字
 *
 * @example
 * formatReceiptNumber('R2501280001', 'full')   // => 'R2501280001'
 * formatReceiptNumber('R2501280001', 'short')  // => '...0001'
 * formatReceiptNumber('R2501280001', 'date')   // => '2025/01/28'
 */
export function formatReceiptNumber(
  receiptNumber: string,
  format: 'full' | 'short' | 'date' = 'full'
): string {
  if (!isValidReceiptNumber(receiptNumber)) {
    return receiptNumber
  }

  switch (format) {
    case 'short':
      // 只顯示最後 4 碼流水號
      return `...${receiptNumber.slice(-4)}`

    case 'date': {
      // 只顯示日期
      const parsed = parseReceiptNumber(receiptNumber)
      if (!parsed) return receiptNumber
      return `${parsed.year}/${parsed.month.toString().padStart(2, '0')}/${parsed.day.toString().padStart(2, '0')}`
    }

    case 'full':
    default:
      return receiptNumber
  }
}
