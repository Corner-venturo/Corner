/**
 * 編號生成工具
 *
 * 報價單格式：{辦公室代碼}-{letter}{3位數} (如: TP-A001, TC-A001)
 * 字母循環：A001-A999 → B001-B999 → C001-C999...
 *
 * 團號格式：{辦公室代碼}-{城市代號}{年後2碼}{月}{日}{流水號2位}
 * 例如：TP-CNX25012801 (台北清邁 2025/01/28 第1團)
 *
 * 員工編號格式：{辦公室代碼}-E{3位數}
 * 例如：TP-E001 (台北第1位員工)
 */

import { logger } from '@/lib/utils/logger'
import type { BaseEntity } from '@/types'
import type { CodeConfig } from '../core/types'

/**
 * 生成團號
 *
 * @param workspaceCode - 辦公室代碼（如 TP, TC）
 * @param cityCode - 城市機場代號（如 CNX, BKK）
 * @param departureDate - 出發日期 (ISO 8601 格式)
 * @param existingTours - 現有旅遊團列表（同 workspace）
 * @returns 團號（如 TP-CNX25012801）
 *
 * @example
 * generateTourCode('TP', 'CNX', '2025-01-28', existingTours)
 * // => 'TP-CNX25012801' (台北清邁 2025年1月28日 第1團)
 */
export function generateTourCode(
  workspaceCode: string,
  cityCode: string,
  departureDate: string,
  existingTours: { code?: string }[]
): string {
  const date = new Date(departureDate)
  const year = date.getFullYear().toString().slice(-2) // 後兩碼
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  // 格式：TP-CNX25012801 (辦公室-城市代碼+年月日+流水號)
  const datePrefix = `${workspaceCode}-${cityCode}${year}${month}${day}`

  // 找出同日期同城市同辦公室的最大流水號
  let maxSequence = 0
  existingTours.forEach(tour => {
    const code = tour.code
    if (code?.startsWith(datePrefix)) {
      // 提取最後兩碼流水號（例如 TP-CNX25012801 → 01）
      const sequencePart = code.slice(-2)
      const sequence = parseInt(sequencePart, 10)
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence
      }
    }
  })

  const nextSequence = (maxSequence + 1).toString().padStart(2, '0')
  return `${datePrefix}${nextSequence}`
}

/**
 * 生成報價單編號（字母循環系統）
 *
 * @param workspaceCode - 辦公室代碼（如 TP, TC）
 * @param config - 配置（可包含 quoteType: 'quick' | 'standard'）
 * @param existingItems - 現有項目列表（同 workspace）
 *
 * @example
 * generateCode('TP', { prefix: 'Q' }, existingQuotes)
 * // 標準報價單: 'TP-A001', 'TP-A002'...
 * // 快速報價單: 'TP-Q001', 'TP-Q002'...
 */
export function generateCode(
  workspaceCode: string,
  config: CodeConfig,
  existingItems: BaseEntity[]
): string {
  const prefix = `${workspaceCode}-`

  const configWithQuoteType = config as CodeConfig & { quoteType?: 'quick' | 'standard' }
  const isQuickQuote = configWithQuoteType.quoteType === 'quick'

  logger.log('🔍 [code-generator] generateCode 參數:', {
    workspaceCode,
    config,
    configQuoteType: configWithQuoteType.quoteType,
    isQuickQuote,
    existingItemsCount: existingItems.length,
  })

  // 快速報價單使用 Q 開頭
  if (isQuickQuote) {
    logger.log('✅ [code-generator] 判定為快速報價單，使用 Q 系列')
    let maxNumber = 0

    existingItems.forEach(item => {
      if ('code' in item && 'quote_type' in item) {
        const code = (item as { code?: string; quote_type?: string }).code
        const quoteType = (item as { quote_type?: string }).quote_type

        // 只計算快速報價單的編號
        if (code && quoteType === 'quick' && new RegExp(`^${workspaceCode}-Q\\d{3}$`).test(code)) {
          const numberPart = code.substring(prefix.length + 1) // 移除 "TP-Q"
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })

    const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
    const finalCode = `${workspaceCode}-Q${nextNumber}`
    logger.log('✅ [code-generator] 快速報價單編號生成:', finalCode)
    return finalCode
  }

  // 標準報價單使用字母循環系統 (A-Z)
  logger.log('📋 [code-generator] 判定為標準報價單，使用 A-Z 系列')
  let maxLetter = ''
  let maxNumber = 0

  existingItems.forEach(item => {
    if ('code' in item) {
      const code = (item as { code?: string }).code
      const quoteType = (item as { quote_type?: string })?.quote_type

      // 只計算標準報價單的編號（排除快速報價單）
      if (code && quoteType !== 'quick' && new RegExp(`^${workspaceCode}-[A-Z]\\d{3}$`).test(code)) {
        const codePart = code.substring(prefix.length) // 移除前綴
        const letter = codePart[0]
        const number = parseInt(codePart.substring(1), 10)

        // 比較字母和數字
        if (letter > maxLetter || (letter === maxLetter && number > maxNumber)) {
          maxLetter = letter
          maxNumber = number
        }
      }
    }
  })

  // 如果沒有現有編號，從 A001 開始
  if (!maxLetter) {
    return `${workspaceCode}-A001`
  }

  // 計算下一個編號
  let finalCode: string
  if (maxNumber < 999) {
    // 同字母，數字 +1
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
    finalCode = `${workspaceCode}-${maxLetter}${nextNumber}`
  } else {
    // 數字已達 999，字母進位
    const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1)
    finalCode = `${workspaceCode}-${nextLetter}001`
  }

  logger.log('✅ [code-generator] 標準報價單編號生成:', finalCode, { maxLetter, maxNumber })
  return finalCode
}

/**
 * 生成客戶編號（字母循環系統 C-A001 ~ C-Z999）
 *
 * @param existingCustomers - 現有客戶列表
 * @returns 客戶編號（如 C-A001）
 *
 * @example
 * generateCustomerCode(existingCustomers)
 * // => 'C-A001', 'C-A002'...'C-A999', 'C-B001'...
 */
export function generateCustomerCode(existingCustomers: BaseEntity[]): string {
  let maxLetter = ''
  let maxNumber = 0

  existingCustomers.forEach(customer => {
    if ('code' in customer) {
      const code = (customer as { code?: string }).code
      // 匹配格式：C-A001, C-B999 等
      if (code && /^C-[A-Z]\d{3}$/.test(code)) {
        const codePart = code.substring(2) // 移除 "C-"
        const letter = codePart[0]
        const number = parseInt(codePart.substring(1), 10)

        // 比較字母和數字
        if (letter > maxLetter || (letter === maxLetter && number > maxNumber)) {
          maxLetter = letter
          maxNumber = number
        }
      }
    }
  })

  // 如果沒有現有編號，從 C-A001 開始
  if (!maxLetter) {
    return 'C-A001'
  }

  // 計算下一個編號
  if (maxNumber < 999) {
    // 同字母，數字 +1
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
    return `C-${maxLetter}${nextNumber}`
  } else {
    // 數字已達 999，字母進位
    const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1)
    return `C-${nextLetter}001`
  }
}

/**
 * 生成員工編號
 *
 * @param workspaceCode - 辦公室代碼（如 TP, TC）
 * @param existingEmployees - 現有員工列表（同 workspace）
 * @returns 員工編號（如 TP-E001）
 *
 * @example
 * generateEmployeeNumber('TP', existingEmployees)
 * // => 'TP-E001' (台北第1位員工)
 */
export function generateEmployeeNumber(
  workspaceCode: string,
  existingEmployees: BaseEntity[]
): string {
  let maxNumber = 0
  const prefix = `${workspaceCode}-E`

  existingEmployees.forEach(employee => {
    if ('employee_number' in employee) {
      const empNumber = (employee as { employee_number?: string }).employee_number
      if (empNumber?.startsWith(prefix)) {
        const numberPart = empNumber.substring(prefix.length)
        const number = parseInt(numberPart, 10)
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number
        }
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
  return `${prefix}${nextNumber}`
}
