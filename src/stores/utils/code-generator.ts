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
 * 生成報價單編號（字母循環系統，不含 workspace 前綴）
 *
 * @param workspaceCode - 辦公室代碼（忽略，保留參數以維持 API 相容性）
 * @param config - 配置（可包含 quoteType: 'quick' | 'standard'）
 * @param existingItems - 現有項目列表
 *
 * @example
 * generateCode('TP', { prefix: 'Q' }, existingQuotes)
 * // 標準報價單: 'A001', 'A002'... → 'AA001'... → 'AB001'...
 * // 快速報價單: 'Q001', 'Q002'... → 'QA001'... → 'QB001'...
 */
export function generateCode(
  workspaceCode: string,
  config: CodeConfig,
  existingItems: BaseEntity[]
): string {
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
  // 格式：Q001~Q999 → QA001~QA999 → QB001~QB999...
  if (isQuickQuote) {
    logger.log('✅ [code-generator] 判定為快速報價單，使用 Q 系列')
    let maxLetter = '' // 空字串表示 Q001~Q999 階段
    let maxNumber = 0

    existingItems.forEach(item => {
      if ('code' in item && 'quote_type' in item) {
        const code = (item as { code?: string; quote_type?: string }).code
        const quoteType = (item as { quote_type?: string }).quote_type

        if (code && quoteType === 'quick') {
          // 匹配新格式 Q001~Q999（無前綴）
          if (/^Q\d{3}$/.test(code)) {
            const numberPart = code.substring(1) // 移除 "Q"
            const number = parseInt(numberPart, 10)
            if (!isNaN(number) && maxLetter === '' && number > maxNumber) {
              maxNumber = number
            }
          }
          // 匹配新格式 QA001~QZ999（無前綴）
          if (/^Q[A-Z]\d{3}$/.test(code)) {
            const letter = code[1]
            const number = parseInt(code.substring(2), 10)
            if (letter > maxLetter || (letter === maxLetter && number > maxNumber)) {
              maxLetter = letter
              maxNumber = number
            }
          }
          // 向後相容：匹配舊格式 TP-Q001, TC-Q001 等
          if (/^[A-Z]{2}-Q\d{3,}$/.test(code)) {
            const numberPart = code.split('-Q')[1]
            const number = parseInt(numberPart, 10)
            if (!isNaN(number) && maxLetter === '' && number > maxNumber) {
              maxNumber = number
            }
          }
          // 向後相容：匹配舊格式 Q0001, Q000008 等（4位以上數字）
          if (/^Q\d{4,}$/.test(code)) {
            const numberPart = code.substring(1)
            const number = parseInt(numberPart, 10)
            if (!isNaN(number) && maxLetter === '' && number > maxNumber) {
              maxNumber = number
            }
          }
        }
      }
    })

    let finalCode: string
    if (maxLetter === '') {
      // 還在 Q001~Q999 階段
      if (maxNumber < 999) {
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        finalCode = `Q${nextNumber}`
      } else {
        // 超過 999，進入 QA001
        finalCode = 'QA001'
      }
    } else {
      // 已在 QA~QZ 階段
      if (maxNumber < 999) {
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        finalCode = `Q${maxLetter}${nextNumber}`
      } else {
        // 字母進位
        const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1)
        finalCode = `Q${nextLetter}001`
      }
    }
    logger.log('✅ [code-generator] 快速報價單編號生成:', finalCode)
    return finalCode
  }

  // 標準報價單使用 A 開頭
  // 格式：A001~A999 → AA001~AA999 → AB001~AB999...
  logger.log('📋 [code-generator] 判定為標準報價單，使用 A 系列')
  let maxLetter = '' // 空字串表示 A001~A999 階段
  let maxNumber = 0

  existingItems.forEach(item => {
    if ('code' in item) {
      const code = (item as { code?: string }).code
      const quoteType = (item as { quote_type?: string })?.quote_type

      if (code && quoteType !== 'quick') {
        // 匹配新格式 A001~A999（無前綴）
        if (/^A\d{3}$/.test(code)) {
          const numberPart = code.substring(1) // 移除 "A"
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && maxLetter === '' && number > maxNumber) {
            maxNumber = number
          }
        }
        // 匹配新格式 AA001~AZ999（無前綴）
        if (/^A[A-Z]\d{3}$/.test(code)) {
          const letter = code[1]
          const number = parseInt(code.substring(2), 10)
          if (letter > maxLetter || (letter === maxLetter && number > maxNumber)) {
            maxLetter = letter
            maxNumber = number
          }
        }
        // 向後相容：匹配舊格式 TP-A001, TC-A001 等
        if (/^[A-Z]{2}-A\d{3,}$/.test(code)) {
          const numberPart = code.split('-A')[1]
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && maxLetter === '' && number > maxNumber) {
            maxNumber = number
          }
        }
      }
    }
  })

  let finalCode: string
  if (maxLetter === '') {
    // 還在 A001~A999 階段
    if (maxNumber < 999) {
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
      finalCode = `A${nextNumber}`
    } else {
      // 超過 999，進入 AA001
      finalCode = 'AA001'
    }
  } else {
    // 已在 AA~AZ 階段
    if (maxNumber < 999) {
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
      finalCode = `A${maxLetter}${nextNumber}`
    } else {
      // 字母進位
      const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1)
      finalCode = `A${nextLetter}001`
    }
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
