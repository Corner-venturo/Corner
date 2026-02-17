/**
 * 編號生成工具
 *
 * === 團號格式 ===
 * {城市代碼}{出團年月日}{A-Z}
 * 例如：CNX250128A (清邁 2025/01/28 第1團)
 *
 * === 訂單編號格式 ===
 * {團號}-O{2位數}
 * 例如：CNX250128A-O01 (清邁團的第1筆訂單)
 *
 * === 請款單編號格式 ===
 * {團號}-I{2位數}
 * 例如：CNX250128A-I01 (清邁團的第1張請款單)
 *
 * === 收款單編號格式 ===
 * {團號}-R{2位數}
 * 例如：CNX250128A-R01 (清邁團的第1張收款單)
 *
 * === 出納單編號格式 ===
 * P{出帳年月日}{A-Z}
 * 例如：P250128A (2025/01/28 第1張出納單)
 *
 * === 客戶編號格式 ===
 * C{6位數}
 * 例如：C000001
 *
 * === 報價單編號格式 ===
 * Q{6位數}
 * 例如：Q000001, Q000002...
 *
 * === 員工編號格式 ===
 * E{3位數}
 * 例如：E001, E002...E999
 * 注意：台北和台中員工都使用相同的編號範圍，入口需選擇公司
 *
 * === 提案編號格式 ===
 * P{6位數}
 * 例如：P000001, P000002...
 * 注意：提案用純數字 6 位數，出納單用日期格式（P250128A），兩者可區分
 *
 * === 公司請款單編號格式 ===
 * {費用類型}-{YYYYMM}-{3位數}
 * 例如：SAL-202501-001 (2025年1月第1張薪資請款單)
 * 費用類型：SAL(薪資), ENT(公關), TRV(差旅), OFC(辦公), UTL(水電), RNT(租金), EQP(設備), MKT(行銷), ADV(廣告), TRN(培訓)
 */

import { logger } from '@/lib/utils/logger'
import type { BaseEntity } from '@/types'
import type { CodeConfig } from '../core/types'

/**
 * 生成團號
 *
 * @param workspaceCode - 辦公室代碼（已忽略，保留參數以維持 API 相容性）
 * @param cityCode - 城市機場代號（如 CNX, BKK）
 * @param departureDate - 出發日期 (ISO 8601 格式)
 * @param existingTours - 現有旅遊團列表
 * @returns 團號（如 CNX250128A）
 *
 * @example
 * generateTourCode('TP', 'CNX', '2025-01-28', existingTours)
 * // => 'CNX250128A' (清邁 2025年1月28日 第1團)
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

  // 格式：CNX250128A (城市代碼+年月日+字母)
  const datePrefix = `${cityCode}${year}${month}${day}`

  // 找出同日期同城市的最大字母
  let maxLetter = ''
  existingTours.forEach(tour => {
    const code = tour.code
    if (code?.startsWith(datePrefix)) {
      // 提取最後一碼字母（例如 CNX250128A → A）
      const lastChar = code.slice(-1)
      if (/^[A-Z]$/.test(lastChar) && lastChar > maxLetter) {
        maxLetter = lastChar
      }
    }
    // 向後相容：也檢查舊格式 TP-CNX25012801
    if (code?.includes(`-${datePrefix}`)) {
      const oldLastChar = code.slice(-2, -1) // 取倒數第二碼看是否為數字
      // 如果是舊格式數字，視為已使用過
      if (!maxLetter) maxLetter = '@' // @ 的下一個是 A
    }
  })

  // 計算下一個字母
  const nextLetter = maxLetter ? String.fromCharCode(maxLetter.charCodeAt(0) + 1) : 'A'
  return `${datePrefix}${nextLetter}`
}

/**
 * 生成報價單編號
 *
 * @param workspaceCode - 辦公室代碼（忽略，保留參數以維持 API 相容性）
 * @param config - 配置（忽略 quoteType，統一使用 Q 前綴）
 * @param existingItems - 現有項目列表
 *
 * @example
 * generateCode('TP', {}, existingQuotes)
 * // 統一格式: Q000001, Q000002...
 */
export function generateCode(
  workspaceCode: string,
  config: CodeConfig,
  existingItems: BaseEntity[]
): string {
  logger.log('🔍 [code-generator] generateCode 參數:', {
    workspaceCode,
    config,
    existingItemsCount: existingItems.length,
  })

  // 統一使用 Q 開頭
  // 格式：Q000001 ~ Q999999
  let maxNumber = 0

  existingItems.forEach(item => {
    if ('code' in item) {
      const code = (item as { code?: string }).code

      if (code) {
        // 匹配新格式 Q000001 或 X000001（向後相容）
        if (/^[QX]\d{6}$/.test(code)) {
          const numberPart = code.substring(1)
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number
          }
        }
        // 向後相容：匹配舊格式 A001, AA001, TP-A001, Q001 等
        if (/^[AQ]\d{3,}$/.test(code) || /^[AQ][A-Z]\d{3}$/.test(code) || /^[A-Z]{2}-[AQ]\d{3,}$/.test(code)) {
          let number = 0
          if (/^[AQ]\d{3,}$/.test(code)) {
            number = parseInt(code.substring(1), 10)
          } else if (/^[AQ][A-Z]\d{3}$/.test(code)) {
            const letter = code[1]
            const num = parseInt(code.substring(2), 10)
            const letterIndex = letter.charCodeAt(0) - 'A'.charCodeAt(0)
            number = 1000 + letterIndex * 999 + num
          } else if (/^[A-Z]{2}-[AQ]\d{3,}$/.test(code)) {
            const parts = code.split(/-[AQ]/)
            if (parts[1]) {
              number = parseInt(parts[1], 10)
            }
          }
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(6, '0')
  // 快速報價單使用 X 前綴，團體報價單使用 Q 前綴
  const prefix = config.quoteType === 'quick' ? 'X' : 'Q'
  const finalCode = `${prefix}${nextNumber}`
  logger.log('✅ [code-generator] 報價單編號生成:', finalCode, { maxNumber, quoteType: config.quoteType })
  return finalCode
}



/**
 * 生成訂單編號
 *
 * @param tourCode - 團號（如 CNX250128A）
 * @param existingOrders - 現有訂單列表（同團）
 * @returns 訂單編號（如 CNX250128A-O01）
 *
 * @example
 * generateOrderCode('CNX250128A', existingOrders)
 * // => 'CNX250128A-O01', 'CNX250128A-O02'...
 */
export function generateOrderCode(
  tourCode: string,
  existingOrders: { code?: string }[]
): string {
  const prefix = `${tourCode}-O`
  let maxNumber = 0

  existingOrders.forEach(order => {
    const code = order.code
    if (code?.startsWith(prefix)) {
      const numberPart = code.substring(prefix.length)
      const number = parseInt(numberPart, 10)
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(2, '0')
  return `${prefix}${nextNumber}`
}



/**
 * 生成提案編號
 *
 * @param existingProposals - 現有提案列表
 * @returns 提案編號（如 P000001）
 *
 * @example
 * generateProposalCode(existingProposals)
 * // => 'P000001', 'P000002'...
 */
export function generateProposalCode(
  existingProposals: { code?: string }[]
): string {
  let maxNumber = 0

  existingProposals.forEach(proposal => {
    const code = proposal.code
    // 匹配格式：P000001（6位數字）
    if (code && /^P\d{6}$/.test(code)) {
      const numberPart = code.substring(1) // 移除 "P"
      const number = parseInt(numberPart, 10)
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(6, '0')
  return `P${nextNumber}`
}

/**
 * 生成需求單編號
 *
 * @param tourCode - 團號（如 CNX250128A）
 * @param existingRequests - 現有需求單列表（同團）
 * @returns 需求單編號（如 CNX250128A-RQ01）
 *
 * @example
 * generateTourRequestCode('CNX250128A', existingRequests)
 * // => 'CNX250128A-RQ01', 'CNX250128A-RQ02'...
 */
export function generateTourRequestCode(
  tourCode: string,
  existingRequests: { code?: string }[]
): string {
  const prefix = `${tourCode}-RQ`
  let maxNumber = 0

  existingRequests.forEach(request => {
    const code = request.code
    if (code?.startsWith(prefix)) {
      const numberPart = code.substring(prefix.length)
      const number = parseInt(numberPart, 10)
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(2, '0')
  return `${prefix}${nextNumber}`
}

/**
 * 生成公司請款單編號
 *
 * @param expenseType - 費用類型代碼（如 SAL, ENT, TRV）
 * @param requestDate - 請款日期 (ISO 8601 格式)
 * @param existingPaymentRequests - 現有請款單列表
 * @returns 公司請款單編號（如 SAL-202501-001）
 *
 * @example
 * generateCompanyPaymentRequestCode('SAL', '2025-01-28', existingPaymentRequests)
 * // => 'SAL-202501-001', 'SAL-202501-002'...
 */
export function generateCompanyPaymentRequestCode(
  expenseType: string,
  requestDate: string,
  existingPaymentRequests: { code?: string }[]
): string {
  const date = new Date(requestDate)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')

  // 格式：SAL-202501-001 (費用類型-年月-序號)
  const prefix = `${expenseType}-${year}${month}-`

  let maxNumber = 0
  existingPaymentRequests.forEach(pr => {
    const code = pr.code
    if (code?.startsWith(prefix)) {
      const numberPart = code.substring(prefix.length)
      const number = parseInt(numberPart, 10)
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number
      }
    }
  })

  const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
  return `${prefix}${nextNumber}`
}
