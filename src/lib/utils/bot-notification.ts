/**
 * 機器人通知工具函數
 * 用於發送系統通知
 */

import { logger } from './logger'

interface SendBotNotificationParams {
  recipientId: string
  message: string
  type?: 'info' | 'warning' | 'error'
  metadata?: Record<string, unknown>
}

/**
 * 發送機器人通知
 */
export async function sendBotNotification({
  recipientId,
  message,
  type = 'info',
  metadata,
}: SendBotNotificationParams): Promise<boolean> {
  try {
    const response = await fetch('/api/bot-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        message,
        type,
        metadata,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      logger.error('機器人通知發送失敗:', data.message)
      return false
    }

    return true
  } catch (error) {
    logger.error('發送機器人通知時發生錯誤:', error)
    return false
  }
}

/**
 * 發送收款異常通知
 */
export async function sendPaymentAbnormalNotification({
  recipientId,
  receiptNumber,
  expectedAmount,
  actualAmount,
  confirmedBy,
}: {
  recipientId: string
  receiptNumber: string
  expectedAmount: number
  actualAmount: number
  confirmedBy: string
}): Promise<boolean> {
  const message = `收款金額異常通知

收款單號：${receiptNumber}
應收金額：NT$ ${expectedAmount.toLocaleString()}
實收金額：NT$ ${actualAmount.toLocaleString()}
差異金額：NT$ ${(actualAmount - expectedAmount).toLocaleString()}
確認者：${confirmedBy}

請確認此異常情況。`

  return sendBotNotification({
    recipientId,
    message,
    type: 'warning',
    metadata: {
      category: 'payment_abnormal',
      receiptNumber,
      expectedAmount,
      actualAmount,
      difference: actualAmount - expectedAmount,
    },
  })
}
