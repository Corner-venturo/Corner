/**
 * LinkPay Webhook - 接收台新銀行付款成功通知
 *
 * 當客戶完成 LinkPay 付款後，台新銀行會呼叫此 Webhook
 * 更新收款單和 LinkPay 記錄的狀態
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// ============================================
// 型別定義
// ============================================

interface TaishinWebhookParams {
  order_no: string // 訂單編號（含我們的收款單號）
  ret_code: string // '00' 表示成功（依手冊 v1.8 為 ret_code）
  tx_amt: string // 交易授權金額（含小數 2 位，如 "10000" 代表 100.00 元）
  auth_code?: string // 授權碼
  card_no?: string // 卡號（遮蔽）
  ret_msg?: string // 回傳訊息
}

interface TaishinWebhookRequest {
  params: TaishinWebhookParams
}

// ============================================
// POST: 接收付款通知
// ============================================

export async function POST(req: NextRequest) {
  try {
    const body: TaishinWebhookRequest = await req.json()
    logger.log('📝 LinkPay Webhook 收到通知:', body)

    const { order_no, ret_code, tx_amt } = body.params

    if (!order_no) {
      logger.error('Webhook 缺少 order_no')
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // 解析收款單號（order_no 格式：{receiptNumber}R{timestamp}，已移除 - 和 _）
    const receiptNumber = order_no.split('R')[0]
    const isSuccess = ret_code === '00'
    const status = isSuccess ? 1 : 2 // 1: 已付款, 2: 失敗

    const supabase = getSupabaseAdminClient()
    const currentTime = new Date().toISOString()

    // 更新 LinkPay 記錄
    const { error: logError } = await supabase
      .from('linkpay_logs')
      .update({
        status: status,
        updated_at: currentTime,
      })
      .eq('linkpay_order_number', order_no)

    if (logError) {
      logger.error('更新 LinkPay 記錄失敗:', logError)
    }

    // 如果付款成功，自動回填資訊（但保持待確認狀態，讓會計最後確認）
    if (isSuccess) {
      // 計算實際金額
      // tx_amt 格式：含小數 2 位，如 "10000" 代表 100.00 元
      // 扣除信用卡手續費 2%
      let actualAmount = 0
      if (tx_amt) {
        const originalAmount = parseInt(tx_amt, 10) / 100 // 轉換為元
        // 扣除 2% 手續費
        actualAmount = Math.round(originalAmount * 0.98)
      }

      // 自動回填實收金額和收款日期，但 status 保持 0（待確認）
      // 讓會計最後手動確認，避免自動核銷造成的問題
      const { error: receiptError } = await supabase
        .from('receipts')
        .update({
          // status: '0', // 保持待確認，不自動改成已確認
          actual_amount: actualAmount,
          receipt_date: currentTime,
          updated_at: currentTime,
        })
        .eq('receipt_number', receiptNumber)

      if (receiptError) {
        logger.error('更新收款單失敗:', receiptError)
      } else {
        logger.log(`✅ 收款單 ${receiptNumber} 付款成功，已回填實收金額: ${actualAmount}（待會計確認）`)
      }
    } else {
      // 付款失敗，只更新收款單日期
      await supabase
        .from('receipts')
        .update({
          receipt_date: currentTime,
          updated_at: currentTime,
        })
        .eq('receipt_number', receiptNumber)

      logger.log(`❌ 收款單 ${receiptNumber} 付款失敗，ret_code: ${ret_code}`)
    }

    // 回應台新銀行（必須回應成功，否則會重複通知）
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('❌ LinkPay Webhook 錯誤:', error)
    // 即使有錯誤也回應成功，避免重複通知
    return NextResponse.json({ success: true })
  }
}

// ============================================
// GET: 健康檢查（可選）
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LinkPay Webhook endpoint is ready',
  })
}
