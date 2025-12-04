/**
 * 開立代轉發票 API
 * POST /api/travel-invoice/issue
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { issueInvoice } from '@/lib/newebpay'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoice_date, total_amount, tax_type, buyerInfo, items, order_id, tour_id, created_by } = body

    // 驗證必要欄位
    if (!invoice_date || !total_amount || !buyerInfo?.buyerName || !items?.length) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    // 呼叫藍新 API
    const result = await issueInvoice({
      invoiceDate: invoice_date,
      totalAmount: total_amount,
      taxType: tax_type || 'dutiable',
      buyerInfo,
      items,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    // 儲存到資料庫
    const supabase = createClient(supabaseUrl, supabaseKey)

    const invoiceData = {
      transaction_no: result.data!.transactionNo,
      invoice_number: result.data!.invoiceNumber,
      invoice_date,
      total_amount,
      tax_type: tax_type || 'dutiable',
      buyer_name: buyerInfo.buyerName,
      buyer_ubn: buyerInfo.buyerUBN || null,
      buyer_email: buyerInfo.buyerEmail || null,
      buyer_mobile: buyerInfo.buyerMobile || null,
      buyer_info: buyerInfo,
      items,
      status: 'issued',
      random_num: result.data!.randomNum,
      barcode: result.data!.barcode || null,
      qrcode_l: result.data!.qrcodeL || null,
      qrcode_r: result.data!.qrcodeR || null,
      order_id: order_id || null,
      tour_id: tour_id || null,
      created_by,
    }

    const { data, error } = await supabase
      .from('travel_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      console.error('儲存發票失敗:', error)
      // 發票已開立但儲存失敗，仍返回成功但記錄警告
      return NextResponse.json({
        success: true,
        message: '發票已開立，但儲存時發生錯誤',
        data: {
          ...result.data,
          warning: '請手動記錄此發票資訊',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: '開立成功',
      data: {
        id: data.id,
        transactionNo: result.data!.transactionNo,
        invoiceNumber: result.data!.invoiceNumber,
        randomNum: result.data!.randomNum,
      },
    })
  } catch (error) {
    console.error('開立發票錯誤:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '開立失敗' },
      { status: 500 }
    )
  }
}
