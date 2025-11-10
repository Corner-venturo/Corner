/**
 * 收款單號生成工具
 *
 * 格式：{辦公室代碼}-R{年2碼}{月2碼}{日2碼}{流水號4位}
 * 範例：TP-R2501280001 (台北 2025年1月28日第1筆)
 */

interface Receipt {
  receipt_number: string
}

/**
 * 生成收款單號
 *
 * @param workspaceCode - 辦公室代碼（如 TP, TC）
 * @param receiptDate - 收款日期 (ISO 8601 格式或 Date 物件)
 * @param existingReceipts - 現有收款單列表（同 workspace）
 * @returns 收款單號（例如：TP-R2501280001）
 *
 * @example
 * generateReceiptNumber('TP', '2025-01-28', existingReceipts)
 * // => 'TP-R2501280001' (台北 2025年1月28日第1筆)
 *
 * @example
 * generateReceiptNumber('TC', new Date('2025-01-28'), existingReceipts)
 * // => 'TC-R2501280002' (台中 如果已有1筆，則生成第2筆)
 */
export function generateReceiptNumber(
  workspaceCode: string,
  receiptDate: string | Date,
  existingReceipts: Receipt[]
): string {
  const date = typeof receiptDate === 'string' ? new Date(receiptDate) : receiptDate

  // 格式化日期：YY MM DD
  const year = date.getFullYear().toString().slice(-2) // 後兩碼
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  const datePrefix = `${workspaceCode}-R${year}${month}${day}`

  // 找出同日期同辦公室的最大流水號
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
 * isValidReceiptNumber('TP-R2501280001')  // => true
 * isValidReceiptNumber('R2501280001')     // => true (舊格式也接受)
 * isValidReceiptNumber('R25012800')       // => false (太短)
 * isValidReceiptNumber('ABC123')          // => false (格式錯誤)
 */
export function isValidReceiptNumber(receiptNumber: string): boolean {
  // 新格式：TP-R + 2碼年 + 2碼月 + 2碼日 + 4碼流水號
  const newFormatRegex = /^(TP|TC)-R\d{10}$/
  // 舊格式（向下相容）：R + 2碼年 + 2碼月 + 2碼日 + 4碼流水號
  const oldFormatRegex = /^R\d{10}$/
  return newFormatRegex.test(receiptNumber) || oldFormatRegex.test(receiptNumber)
}

/**
 * 解析收款單號，提取日期和流水號
 *
 * @param receiptNumber - 收款單號
 * @returns 解析結果，包含日期和流水號
 *
 * @example
 * parseReceiptNumber('TP-R2501280001')
 * // => { year: 2025, month: 1, day: 28, sequence: 1, workspaceCode: 'TP' }
 */
export function parseReceiptNumber(receiptNumber: string): {
  year: number
  month: number
  day: number
  sequence: number
  workspaceCode?: string
} | null {
  if (!isValidReceiptNumber(receiptNumber)) {
    return null
  }

  let workspaceCode: string | undefined
  let datePart: string

  // 檢查是新格式還是舊格式
  if (receiptNumber.startsWith('TP-') || receiptNumber.startsWith('TC-')) {
    workspaceCode = receiptNumber.substring(0, 2)
    datePart = receiptNumber.substring(4) // 跳過 "TP-R"
  } else {
    datePart = receiptNumber.substring(1) // 跳過 "R"
  }

  const year = parseInt(`20${datePart.slice(0, 2)}`, 10)
  const month = parseInt(datePart.slice(2, 4), 10)
  const day = parseInt(datePart.slice(4, 6), 10)
  const sequence = parseInt(datePart.slice(6, 10), 10)

  return { year, month, day, sequence, workspaceCode }
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
