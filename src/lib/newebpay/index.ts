/**
 * 藍新金流 旅行業代收轉付電子收據
 *
 * API 文件：旅行業代收轉付電子收據串接技術手冊
 *
 * 使用方式：
 * 1. 在設定頁面填入 MerchantID、HashKey、HashIV
 * 2. 呼叫 issueInvoice() 開立收據
 * 3. 呼叫 voidInvoice() 作廢收據
 * 4. 呼叫 issueAllowance() 開立折讓
 * 5. 呼叫 queryInvoice() 查詢收據
 *
 * 測試加密：
 * import { testEncryption } from '@/lib/newebpay'
 * const result = testEncryption()
 * console.log(result.message)
 */

export * from './crypto'
export * from './client'
