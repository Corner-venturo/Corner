/**
 * 藍新金流旅行業代轉發票加密解密工具
 * 使用 AES-256-CBC 加密
 */

import crypto from 'crypto'

// 藍新 API 設定
export const NEWEBPAY_CONFIG = {
  // 測試環境
  test: {
    apiUrl: 'https://cwww.travelinvoice.com.tw',
    merchantId: process.env.NEWEBPAY_TEST_MERCHANT_ID || '',
    hashKey: process.env.NEWEBPAY_TEST_HASH_KEY || '',
    hashIv: process.env.NEWEBPAY_TEST_HASH_IV || '',
  },
  // 正式環境
  production: {
    apiUrl: 'https://www.travelinvoice.com.tw',
    merchantId: process.env.NEWEBPAY_MERCHANT_ID || '',
    hashKey: process.env.NEWEBPAY_HASH_KEY || '',
    hashIv: process.env.NEWEBPAY_HASH_IV || '',
  },
}

/**
 * 取得目前環境設定
 */
export function getNewebpayConfig() {
  const isProduction = process.env.NEWEBPAY_ENV === 'production'
  return isProduction ? NEWEBPAY_CONFIG.production : NEWEBPAY_CONFIG.test
}

/**
 * AES-256-CBC 加密
 * @param data 要加密的資料
 * @param key HashKey
 * @param iv HashIV
 * @returns 加密後的 hex 字串
 */
export function aesEncrypt(data: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

/**
 * AES-256-CBC 解密
 * @param encryptedData 加密的資料 (hex)
 * @param key HashKey
 * @param iv HashIV
 * @returns 解密後的字串
 */
export function aesDecrypt(encryptedData: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * 產生 CheckCode (SHA256)
 * @param params 參數物件
 * @param hashKey HashKey
 * @param hashIv HashIV
 * @returns SHA256 雜湊值 (大寫)
 */
export function generateCheckCode(
  params: Record<string, unknown>,
  hashKey: string,
  hashIv: string
): string {
  // 將參數轉為查詢字串格式
  const queryString = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key]
      return `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`
    })
    .join('&')

  // 組合: HashIV + 查詢字串 + HashKey
  const rawString = `${hashIv}${queryString}${hashKey}`

  // SHA256 雜湊並轉大寫
  const hash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex')
  return hash.toUpperCase()
}

/**
 * 組合完整的加密 POST 資料
 * @param postData 要傳送的原始資料
 * @returns 加密後的 POST 資料物件 { MerchantID, PostData }
 */
export function createEncryptedPostData(postData: Record<string, unknown>) {
  const config = getNewebpayConfig()

  // 將資料轉為 JSON 字串
  const jsonData = JSON.stringify(postData)

  // AES 加密
  const encryptedData = aesEncrypt(jsonData, config.hashKey, config.hashIv)

  return {
    MerchantID: config.merchantId,
    PostData: encryptedData,
  }
}

/**
 * 解密藍新回傳的資料
 * @param encryptedData 加密的回傳資料
 * @returns 解密後的物件
 */
export function decryptResponseData(encryptedData: string): any {
  const config = getNewebpayConfig()
  const decryptedString = aesDecrypt(encryptedData, config.hashKey, config.hashIv)
  return JSON.parse(decryptedString)
}

/**
 * 產生代轉交易編號
 * @returns 格式: TRI-YYYYMMDD-XXXXX
 */
export function generateTransactionNo(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  const timestamp = now.getTime().toString().slice(-5)
  return `TRI-${dateStr}-${timestamp}${randomStr}`
}

/**
 * 驗證藍新回傳的 CheckCode
 * @param responseData 回傳的資料
 * @param receivedCheckCode 收到的 CheckCode
 * @returns 是否驗證通過
 */
export function verifyCheckCode(
  responseData: Record<string, unknown>,
  receivedCheckCode: string
): boolean {
  const config = getNewebpayConfig()
  const calculatedCheckCode = generateCheckCode(responseData, config.hashKey, config.hashIv)
  return calculatedCheckCode === receivedCheckCode.toUpperCase()
}
