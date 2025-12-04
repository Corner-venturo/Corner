/**
 * 藍新金流 旅行業代收轉付電子收據 加密工具
 *
 * 使用 AES-256-CBC 加密
 * 參考文件：旅行業代收轉付電子收據串接技術手冊
 *
 * 重要規格：
 * - 加密演算法: AES-256-CBC
 * - 填充方式: PKCS#7
 * - 輸出格式: Hex（十六進制字串）
 */

import crypto from 'crypto'

/**
 * AES-256-CBC 加密
 * @param data - 要加密的資料（URL encoded 字串）
 * @param hashKey - 32 字元的 HashKey
 * @param hashIV - 16 字元的 HashIV
 * @returns 加密後的 Hex 字串
 */
export function aesEncrypt(data: string, hashKey: string, hashIV: string): string {
  const key = Buffer.from(hashKey, 'utf8')
  const iv = Buffer.from(hashIV, 'utf8')

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  cipher.setAutoPadding(true) // PKCS#7 padding

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

/**
 * AES-256-CBC 解密
 * @param encryptedHex - 加密的 Hex 字串
 * @param hashKey - 32 字元的 HashKey
 * @param hashIV - 16 字元的 HashIV
 * @returns 解密後的 URL encoded 字串
 */
export function aesDecrypt(encryptedHex: string, hashKey: string, hashIV: string): string {
  const key = Buffer.from(hashKey, 'utf8')
  const iv = Buffer.from(hashIV, 'utf8')

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  decipher.setAutoPadding(true)

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * 產生交易編號
 * 格式：TI + 日期(YYYYMMDD) + 時間(HHmmss) + 4位亂碼
 */
export function generateTransactionNo(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TI${date}${time}${random}`
}

/**
 * 課稅類別轉換（系統格式 → API 格式）
 */
export function convertTaxType(taxType: string): string {
  switch (taxType) {
    case 'dutiable':
      return '1' // 應稅
    case 'zero':
      return '2' // 零稅率
    case 'free':
      return '3' // 免稅
    default:
      return '1'
  }
}

/**
 * 格式化發票日期
 * @param date - YYYY-MM-DD 格式
 * @returns YYYYMMDD 格式
 */
export function formatInvoiceDate(date: string): string {
  return date.replace(/-/g, '')
}

/**
 * 測試加密函數是否正確
 * 使用文件提供的測試資料驗證
 *
 * 測試資料：
 * - Key: abcdefghijklmnopqrstuvwxyzabcdef (32字元)
 * - IV: 1234567890123456 (16字元)
 * - 明文: ABCDEFGHIJ0123456789
 * - 密文: f329a61f014cdad8acae2b497b32514fcb57dffb44dafd2b5531e8ac4d206093
 */
export function testEncryption(): { success: boolean; message: string } {
  const testKey = 'abcdefghijklmnopqrstuvwxyzabcdef'
  const testIV = '1234567890123456'
  const testPlaintext = 'ABCDEFGHIJ0123456789'
  const expectedCiphertext = 'f329a61f014cdad8acae2b497b32514fcb57dffb44dafd2b5531e8ac4d206093'

  try {
    const encrypted = aesEncrypt(testPlaintext, testKey, testIV)

    if (encrypted === expectedCiphertext) {
      return {
        success: true,
        message: '加密測試通過！',
      }
    } else {
      return {
        success: false,
        message: `加密結果不符。\n預期: ${expectedCiphertext}\n實際: ${encrypted}`,
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `加密測試失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    }
  }
}
