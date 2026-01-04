/**
 * 機器人通知工具函數
 * 用於發送系統通知
 */

import { logger } from './logger'

interface SendBotNotificationParams {
  recipient_id: string
  message: string
  type?: 'info' | 'warning' | 'error'
  metadata?: Record<string, unknown>
}

/**
 * 發送機器人通知
 */
export async function sendBotNotification({
  recipient_id,
  message,
  type = 'info',
  metadata,
}: SendBotNotificationParams): Promise<boolean> {
  try {
    const response = await fetch('/api/bot-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id,
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
  recipient_id,
  receipt_number,
  expected_amount,
  actual_amount,
  confirmed_by,
}: {
  recipient_id: string
  receipt_number: string
  expected_amount: number
  actual_amount: number
  confirmed_by: string
}): Promise<boolean> {
  const message = `收款金額異常通知

收款單號：${receipt_number}
應收金額：NT$ ${expected_amount.toLocaleString()}
實收金額：NT$ ${actual_amount.toLocaleString()}
差異金額：NT$ ${(actual_amount - expected_amount).toLocaleString()}
確認者：${confirmed_by}

請確認此異常情況。`

  return sendBotNotification({
    recipient_id,
    message,
    type: 'warning',
    metadata: {
      category: 'payment_abnormal',
      receipt_number,
      expected_amount,
      actual_amount,
      difference: actual_amount - expected_amount,
    },
  })
}
