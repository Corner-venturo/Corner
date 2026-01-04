/**
 * 台新銀行 LinkPay Webhook 簽名驗證工具
 *
 * 根據台新銀行 LinkPay API 手冊，Webhook 通知會包含 MAC 簽名
 * 使用 HMAC-SHA256 進行驗證，確保請求來自台新銀行
 *
 * 驗證流程：
 * 1. 從 Webhook 請求中取得 mac 欄位
 * 2. 將其他參數按照字母順序排序並串接
 * 3. 使用 TAISHIN_MAC_KEY 計算 HMAC-SHA256
 * 4. 比較計算結果與傳入的 mac 值
 */

import crypto from 'crypto'
import { logger } from '@/lib/utils/logger'

// MAC 密鑰（從環境變數讀取）
const TAISHIN_MAC_KEY = process.env.TAISHIN_MAC_KEY || ''

/**
 * Webhook 參數介面
 */
export interface TaishinWebhookParams {
  order_no: string
  ret_code: string
  tx_amt: string
  auth_code?: string
  card_no?: string
  ret_msg?: string
  mac?: string
  [key: string]: string | undefined
}

/**
 * 計算 MAC 簽名
 *
 * 依照台新銀行規範：
 * 1. 將所有參數（除了 mac 本身）按照參數名稱的字母順序排序
 * 2. 串接成 key1=value1&key2=value2 格式
 * 3. 使用 HMAC-SHA256 和 MAC_KEY 計算簽名
 * 4. 輸出為大寫的十六進制字串
 *
 * @param params - Webhook 參數（不含 mac）
 * @returns HMAC-SHA256 簽名（大寫十六進制）
 */
export function calculateMAC(params: Record<string, string | undefined>): string {
  // 過濾掉 mac 欄位和空值
  const filteredParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'mac' && value !== undefined && value !== '') {
      filteredParams[key] = value
    }
  }

  // 按照 key 的字母順序排序
  const sortedKeys = Object.keys(filteredParams).sort()

  // 串接成 key=value 格式
  const dataString = sortedKeys.map((key) => `${key}=${filteredParams[key]}`).join('&')

  // 計算 HMAC-SHA256
  const hmac = crypto.createHmac('sha256', TAISHIN_MAC_KEY)
  hmac.update(dataString)

  return hmac.digest('hex').toUpperCase()
}

/**
 * 驗證 Webhook 簽名
 *
 * @param params - 完整的 Webhook 參數（包含 mac）
 * @returns 驗證結果物件
 */
export function verifyWebhookSignature(params: TaishinWebhookParams): {
  valid: boolean
  reason?: string
} {
  // 檢查是否有設定 MAC_KEY
  if (!TAISHIN_MAC_KEY) {
    logger.warn('[LinkPay Webhook] TAISHIN_MAC_KEY 未設定，跳過簽名驗證')
    // 在開發環境或未設定密鑰時，允許通過（但記錄警告）
    return {
      valid: true,
      reason: 'MAC_KEY 未設定，跳過驗證',
    }
  }

  // 檢查是否有 mac 欄位
  const receivedMAC = params.mac
  if (!receivedMAC) {
    logger.error('[LinkPay Webhook] 請求缺少 mac 簽名欄位')
    return {
      valid: false,
      reason: '缺少 mac 簽名欄位',
    }
  }

  // 計算預期的 MAC
  const expectedMAC = calculateMAC(params)

  // 使用 timingSafeEqual 進行比較，防止計時攻擊
  const receivedBuffer = Buffer.from(receivedMAC.toUpperCase())
  const expectedBuffer = Buffer.from(expectedMAC)

  // 長度不同時無法使用 timingSafeEqual，直接返回 false
  if (receivedBuffer.length !== expectedBuffer.length) {
    logger.error('[LinkPay Webhook] MAC 簽名長度不符', {
      received: receivedMAC,
      expected: expectedMAC,
    })
    return {
      valid: false,
      reason: 'MAC 簽名長度不符',
    }
  }

  try {
    const isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer)

    if (!isValid) {
      logger.error('[LinkPay Webhook] MAC 簽名驗證失敗', {
        receivedMAC,
        expectedMAC,
        orderNo: params.order_no,
      })
      return {
        valid: false,
        reason: 'MAC 簽名不符',
      }
    }

    logger.log('[LinkPay Webhook] MAC 簽名驗證成功', {
      orderNo: params.order_no,
    })
    return { valid: true }
  } catch (error) {
    logger.error('[LinkPay Webhook] MAC 驗證過程發生錯誤', error)
    return {
      valid: false,
      reason: '驗證過程發生錯誤',
    }
  }
}

/**
 * 驗證請求來源 IP（可選的額外安全措施）
 *
 * 台新銀行的 Webhook 通知會從特定 IP 範圍發出
 * 可以在此添加 IP 白名單驗證
 *
 * @param ip - 請求來源 IP
 * @returns 是否為允許的 IP
 */
export function verifySourceIP(ip: string): boolean {
  // 台新銀行 Webhook 伺服器 IP 白名單（需向台新銀行確認實際 IP）
  const ALLOWED_IPS: string[] = [
    // 生產環境 IP（請向台新銀行索取）
    // '203.xxx.xxx.xxx',
    // '203.xxx.xxx.xxx',
  ]

  // 開發環境允許 localhost
  const DEV_IPS = ['127.0.0.1', '::1', 'localhost']

  // 如果白名單為空，跳過 IP 驗證
  if (ALLOWED_IPS.length === 0) {
    logger.log('[LinkPay Webhook] IP 白名單未設定，跳過 IP 驗證')
    return true
  }

  // 生產環境檢查
  if (ALLOWED_IPS.includes(ip)) {
    return true
  }

  // 開發環境檢查
  if (process.env.NODE_ENV === 'development' && DEV_IPS.includes(ip)) {
    return true
  }

  logger.warn('[LinkPay Webhook] 請求來源 IP 不在白名單中', { ip })
  return false
}
