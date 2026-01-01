/**
 * LinkPay API Route
 *
 * 功能：生成 LinkPay 付款連結（直接呼叫台新銀行）
 *
 * 流程：
 * 1. ERP 呼叫此 API
 * 2. 此 API 直接呼叫台新銀行 API
 * 3. 建立 linkpay_logs 記錄
 * 4. 台新 Webhook 回調到 /api/linkpay/webhook
 * 5. Webhook 自動回填實收金額，但保持「待確認」讓會計最後確認
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// ============================================
// 型別定義
// ============================================

interface CreateLinkPayRequest {
  receiptNumber: string // 收款單號
  userName: string // 付款人姓名
  email: string // 客戶 Email
  paymentName?: string // 付款名稱（客戶看到的標題）
  createUser?: string // 建立人員 UUID
  amount: number // 金額
  endDate: string // 付款截止日 (YYYY-MM-DD)
  gender?: number // 性別 1:男 2:女
}

interface TaishinAuthParams {
  order_no: string
  price: number
  order_desc: string
  payment_name: string
  mer_phone_num: string
  user_name: string
  notification: number
  gender?: number | null
  email: string
  link_end_date: string
  result_url: string
}

interface TaishinAuthRequest {
  params: TaishinAuthParams
}

interface TaishinAuthResponse {
  params: {
    ret_code: string
    ret_msg?: string
    hpp_url?: string
    order_number?: string
  }
}

// ============================================
// 台新銀行 API 設定
// ============================================

const TAISHIN_API_URL = 'https://tspg.taishinbank.com.tw/tspglinkpay/restapi/auth.ashx'
const MERCHANT_PHONE = '0277516051'

// Webhook 回調 URL（從環境變數讀取）
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================
// 輔助函數
// ============================================

function removePunctuations(input: string): string {
  return input.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '')
}

function formatEndDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}2359`
}

// ============================================
// POST: 建立付款連結
// ============================================

export async function POST(req: NextRequest) {
  try {
    const body: CreateLinkPayRequest = await req.json()
    const { receiptNumber, userName, email, paymentName, createUser, amount, endDate, gender } = body

    // 驗證必填欄位
    if (!receiptNumber || !userName || !email || !amount) {
      return NextResponse.json(
        { success: false, message: '缺少必填欄位：receiptNumber, userName, email, amount' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // 取得收款單資料
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*, tours(*)')
      .eq('receipt_number', receiptNumber)
      .single()

    if (receiptError || !receipt) {
      logger.error('找不到收款單:', receiptNumber)
      return NextResponse.json(
        { success: false, message: '找不到收款單' },
        { status: 404 }
      )
    }

    // 組裝付款名稱
    const tourName = (receipt.tours as { name?: string } | null)?.name || receipt.tour_name || ''
    const finalPaymentName = paymentName || `${removePunctuations(tourName)} ${receipt.receipt_account || ''}`

    // 生成唯一訂單號
    const timestamp = Date.now()
    const orderNo = `${receiptNumber}R${timestamp.toString().slice(-6)}`

    // 組裝台新 API 請求
    const taishinRequest: TaishinAuthRequest = {
      params: {
        order_no: orderNo,
        price: amount,
        order_desc: receiptNumber,
        payment_name: finalPaymentName.slice(0, 40),
        mer_phone_num: MERCHANT_PHONE,
        user_name: userName.slice(0, 5),
        notification: 1,
        gender: gender || null,
        email: email,
        link_end_date: formatEndDate(endDate),
        result_url: `${WEBHOOK_BASE_URL}/api/linkpay/webhook`,
      },
    }

    logger.log('📝 LinkPay 請求:', taishinRequest)

    // 先建立 linkpay_logs 記錄
    const logData = {
      receipt_id: receipt.id,
      receipt_number: receiptNumber,
      workspace_id: receipt.workspace_id,
      linkpay_order_number: orderNo,
      price: amount,
      amount: amount,
      end_date: endDate,
      status: 0,
      payment_name: finalPaymentName,
      created_by: createUser || null,
      updated_by: createUser || null,
    }

    const { error: logError } = await supabase
      .from('linkpay_logs')
      .insert(logData)

    if (logError) {
      logger.error('建立 LinkPay 記錄失敗:', logError)
      return NextResponse.json(
        { success: false, message: '建立 LinkPay 記錄失敗' },
        { status: 500 }
      )
    }

    // 呼叫台新銀行 API
    try {
      const response = await fetch(TAISHIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taishinRequest),
      })

      if (!response.ok) {
        throw new Error(`台新 API 請求失敗: ${response.status}`)
      }

      const responseData: TaishinAuthResponse = await response.json()
      logger.log('📝 台新 API 回應:', responseData)

      const { ret_code, hpp_url, ret_msg } = responseData.params

      // 更新 linkpay_logs
      const linkContent = ret_code === '00' ? hpp_url : ret_msg
      const status = ret_code === '00' ? 0 : 2

      await supabase
        .from('linkpay_logs')
        .update({
          link: linkContent,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('linkpay_order_number', orderNo)

      if (ret_code === '00') {
        // 同時更新收款單的 link 欄位，方便直接複製
        await supabase
          .from('receipts')
          .update({
            link: hpp_url,
            linkpay_order_number: orderNo,
            updated_at: new Date().toISOString(),
          })
          .eq('receipt_number', receiptNumber)

        return NextResponse.json({
          success: true,
          message: '付款連結生成成功',
          data: {
            paymentLink: hpp_url,
            linkpayOrderNumber: orderNo,
            link: hpp_url,
            status: 0,
            end_date: endDate,
          },
        })
      } else {
        return NextResponse.json(
          { success: false, message: ret_msg || '產生付款連結失敗，請稍候再嘗試。' },
          { status: 400 }
        )
      }
    } catch (apiError) {
      logger.error('台新 API 呼叫失敗:', apiError)

      await supabase
        .from('linkpay_logs')
        .update({
          status: 2,
          link: apiError instanceof Error ? apiError.message : '呼叫失敗',
          updated_at: new Date().toISOString(),
        })
        .eq('linkpay_order_number', orderNo)

      return NextResponse.json(
        { success: false, message: '呼叫台新 API 失敗，請稍候再嘗試。' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('❌ LinkPay API 錯誤:', error)
    return NextResponse.json(
      { success: false, message: '處理 LinkPay 請求時發生錯誤' },
      { status: 500 }
    )
  }
}
