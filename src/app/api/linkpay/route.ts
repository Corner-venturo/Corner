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
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ApiError, ErrorCode } from '@/lib/api/response'

// ============================================
// 型別定義
// ============================================

interface CreateLinkPayRequest {
  receipt_number: string // 收款單號
  user_name: string // 付款人姓名
  email: string // 客戶 Email
  payment_name?: string // 付款名稱（客戶看到的標題）
  create_user?: string // 建立人員 UUID
  amount: number // 金額
  end_date: string // 付款截止日 (YYYY-MM-DD)
  gender?: number // 性別 1:男 2:女
}

interface TaishinAuthParams {
  order_no: string
  amt: string // 金額，不含小數，如 "100" 代表 100 元
  cur: string // 幣別，固定 "NTD"
  order_desc: string
  notification: number // 1=Email, 2=簡訊
  payment_name: string
  mer_phone_num: string
  user_name: string
  gender?: number | null
  email: string
  link_end_date: string
  trans_gen: string // 一般交易，固定 "1"
  capt_flag: string // 授權同步請款標記，0=不同步請款, 1=同步請款
  post_back_url: string // 前台通知網址（交易完成後導向）
  result_flag: string // 回傳訊息標記，0=不查詢, 1=查詢
  result_url: string // 後台通知網址（必須 https）
}

// 完整的台新 API 請求格式（依據手冊 3.2 章節）
interface TaishinAuthRequest {
  sender: string // 固定 "rest"
  ver: string // 固定 "1.0.0"
  mid: string // 特店代號 (15碼)
  tid: string // 端末代號 (8碼)
  pay_type: number // 付款類別，固定 1 (信用卡)
  tx_type: number // 交易類型，1=授權
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

// 台新銀行特店資訊（從環境變數讀取）
const TAISHIN_MID = process.env.TAISHIN_MID || '' // 特店代號 (15碼)
const TAISHIN_TID = process.env.TAISHIN_TID || '' // 端末代號 (8碼)

// Webhook 回調 URL（從環境變數讀取，正式環境必須是 https）
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================
// 輔助函數
// ============================================

function removePunctuations(input: string): string {
  return input.replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '')
}

/**
 * 清理訂單號碼，移除 - 和 _ 字元
 * 銀聯卡 UnionPay 交易要求：訂單號碼需由英、數字組成，不得包含 "_" 及 "-" 字元
 * @see 手冊 v1.8 第15頁
 */
function sanitizeOrderNo(input: string): string {
  return input.replace(/[-_]/g, '')
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
    // 驗證登入狀態
    const auth = await getServerAuth()
    if (!auth.success) {
      return ApiError.unauthorized(auth.error.error)
    }

    const body: CreateLinkPayRequest = await req.json()
    const { receipt_number, user_name, email, payment_name, create_user, amount, end_date, gender } = body

    // 驗證必填欄位
    if (!receipt_number || !user_name || !email || !amount) {
      return ApiError.validation('缺少必填欄位：receipt_number, user_name, email, amount')
    }

    const supabase = getSupabaseAdminClient()

    // 取得收款單資料
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*, tours(*)')
      .eq('receipt_number', receipt_number)
      .single()

    if (receiptError || !receipt) {
      logger.error('找不到收款單:', receipt_number)
      return ApiError.notFound('收款單')
    }

    // 組裝付款名稱
    const tourName = (receipt.tours as { name?: string } | null)?.name || receipt.tour_name || ''
    const finalPaymentName = payment_name || `${removePunctuations(tourName)} ${receipt.receipt_account || ''}`

    // 生成唯一訂單號（移除 - 和 _ 以符合銀聯卡規範）
    const timestamp = Date.now()
    const rawOrderNo = `${receipt_number}R${timestamp.toString().slice(-6)}`
    const orderNo = sanitizeOrderNo(rawOrderNo)

    // 組裝台新 API 請求（依據手冊 v1.8 格式）
    const taishinRequest: TaishinAuthRequest = {
      sender: 'rest',
      ver: '1.0.0',
      mid: TAISHIN_MID,
      tid: TAISHIN_TID,
      pay_type: 1, // 信用卡
      tx_type: 1, // 授權交易
      params: {
        order_no: orderNo,
        amt: String(amount), // 金額不含小數，轉為字串
        cur: 'NTD',
        order_desc: sanitizeOrderNo(receipt_number),
        notification: 1, // Email 通知
        payment_name: finalPaymentName.slice(0, 40),
        mer_phone_num: MERCHANT_PHONE,
        user_name: user_name.slice(0, 5),
        gender: gender || null,
        email: email,
        link_end_date: formatEndDate(end_date),
        trans_gen: '1', // 一般交易
        capt_flag: '1', // 授權同步請款
        post_back_url: `${WEBHOOK_BASE_URL}/payment/complete`, // 前台通知（交易完成導向）
        result_flag: '1', // 查詢回傳訊息
        result_url: `${WEBHOOK_BASE_URL}/api/linkpay/webhook`, // 後台通知（Webhook）
      },
    }

    logger.log('📝 LinkPay 請求:', taishinRequest)

    // 先建立 linkpay_logs 記錄
    const logData = {
      receipt_number: receipt_number,
      workspace_id: receipt.workspace_id,
      linkpay_order_number: orderNo,
      price: amount,
      end_date: end_date,
      status: 0, // linkpay_logs.status 是 number: 0=待付款
      payment_name: finalPaymentName,
      created_by: create_user || null,
      updated_by: create_user || null,
    }

    const { error: logError } = await supabase
      .from('linkpay_logs')
      .insert(logData)

    if (logError) {
      logger.error('建立 LinkPay 記錄失敗:', logError)
      return ApiError.database('建立 LinkPay 記錄失敗')
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
      const linkpayStatus = ret_code === '00' ? 0 : 2 // linkpay_logs.status 是 number: 0=待付款 2=失敗

      await supabase
        .from('linkpay_logs')
        .update({
          link: linkContent,
          status: linkpayStatus,
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
          .eq('receipt_number', receipt_number)

        return successResponse({
          payment_link: hpp_url,
          linkpay_order_number: orderNo,
          link: hpp_url,
          status: 0, // linkpay_logs.status 是 number: 0=待付款
          end_date: end_date,
        })
      } else {
        return errorResponse(ret_msg || '產生付款連結失敗，請稍候再嘗試。', 400, ErrorCode.EXTERNAL_API_ERROR)
      }
    } catch (apiError) {
      logger.error('台新 API 呼叫失敗:', apiError)

      await supabase
        .from('linkpay_logs')
        .update({
          status: 2, // linkpay_logs.status 是 number: 2=失敗
          link: apiError instanceof Error ? apiError.message : '呼叫失敗',
          updated_at: new Date().toISOString(),
        })
        .eq('linkpay_order_number', orderNo)

      return ApiError.externalApi('呼叫台新 API 失敗，請稍候再嘗試。')
    }
  } catch (error) {
    logger.error('❌ LinkPay API 錯誤:', error)
    return ApiError.internal('處理 LinkPay 請求時發生錯誤')
  }
}
