/**
 * LinkPay API Route
 *
 * 功能：生成 LinkPay 付款連結
 * 串接：Corner Travel 既有的 LinkPay API
 *
 * 🚧 狀態：測試模式（返回假資料）
 *
 * ✅ 待實作：
 * 1. 填入正確的 API endpoint
 * 2. 填入認證方式（如果需要）
 * 3. 填入正確的請求參數格式
 * 4. 處理錯誤情況
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

// ============================================
// 型別定義
// ============================================

interface CreateLinkPayRequest {
  receiptNumber: string // 收款單號：R2501280001
  userName: string // 付款人姓名
  email: string // 客戶 Email
  paymentName: string // 付款名稱（客戶看到的標題）
  createUser: string // 建立人員 UUID
  amount: number // 金額
  endDate: string // 付款截止日 (YYYY-MM-DD)
}

interface LinkPayApiResponse {
  success: boolean
  message?: string
  paymentLink?: string
  linkpayOrderNumber?: string
}

// ============================================
// API Handler
// ============================================

export async function POST(req: NextRequest) {
  try {
    const body: CreateLinkPayRequest = await req.json()
    const { receiptNumber, userName, email, paymentName, createUser, amount, endDate } = body

    // 驗證必填欄位
    if (!receiptNumber || !userName || !email || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: '缺少必填欄位：receiptNumber, userName, email, amount',
        },
        { status: 400 }
      )
    }

    // ==========================================
    // 🚧 待實作：真實 API 呼叫邏輯
    // ==========================================

    // 參考舊專案的實作：
    // /Users/william/Projects/cornerERP-master/src/app/api/supabase/linkpay/route.ts

    // 範例程式碼（需要修改為實際 API）：
    /*
    const response = await fetch('https://api.cornertravel.com.tw/AuthBySupabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 🔧 TODO: 如果需要認證，在這裡加上
        // 'Authorization': `Bearer ${process.env.CORNER_API_KEY}`
      },
      body: JSON.stringify({
        receiptNo: receiptNumber,
        userName,
        email,
        gender: 0,
        createUser,
        paymentName: paymentName || '',
        amount,
        endDate
      })
    })

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`)
    }

    const responseData = await response.json()
    const { ret_code, hpp_url, order_number } = responseData.params

    if (ret_code === '00') {
      return NextResponse.json({
        success: true,
        message: '付款連結生成成功',
        paymentLink: hpp_url,
        linkpayOrderNumber: order_number
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '產生付款連結失敗，請稍候再嘗試。'
        },
        { status: 400 }
      )
    }
    */

    // ==========================================
    // 🧪 暫時回傳測試資料（開發/測試用）
    // ==========================================

    logger.log('📝 LinkPay 測試模式 - 收到請求：', {
      receiptNumber,
      userName,
      email,
      paymentName,
      amount,
      endDate,
    })

    // 模擬生成付款連結
    const mockLinkpayOrderNumber = `LP${Date.now().toString().slice(-10)}`
    const mockPaymentLink = `https://pay.cornertravel.com.tw/payment/${mockLinkpayOrderNumber}`

    return NextResponse.json({
      success: true,
      message: '✅ 測試模式：付款連結生成成功（這是假資料）',
      paymentLink: mockPaymentLink,
      linkpayOrderNumber: mockLinkpayOrderNumber,
    })

    // ==========================================
    // 🚧 實作完成後：刪除上面的測試代碼，取消註解真實 API 代碼
    // ==========================================
  } catch (error) {
    logger.error('❌ LinkPay API 錯誤:', error)
    return NextResponse.json(
      {
        success: false,
        message: '處理 LinkPay 請求時發生錯誤',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 🚧 待實作：Webhook 接收付款成功通知
// ============================================

/*
export async function PUT(req: NextRequest) {
  // 用於接收 LinkPay 付款成功的 Webhook 通知
  try {
    const body = await req.json()
    const { linkpayOrderNumber, status } = body

    // 🔧 TODO: 驗證 Webhook 簽名（如果有）

    // 🔧 TODO: 更新 linkpay_logs 的狀態
    // await supabase
    //   .from('linkpay_logs')
    //   .update({ status: 1 }) // 1 = 已付款
    //   .eq('linkpay_order_number', linkpayOrderNumber)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Webhook 錯誤:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
*/
