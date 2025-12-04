/**
 * 作廢代轉發票 API
 * POST /api/travel-invoice/void
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { voidInvoice } from '@/lib/newebpay'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, voidReason, operatedBy } = body

    // 驗證必要欄位
    if (!invoiceId || !voidReason) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 取得發票資訊
    const { data: invoice, error: fetchError } = await supabase
      .from('travel_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json(
        { success: false, error: '找不到發票' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'issued') {
      return NextResponse.json(
        { success: false, error: '只能作廢已開立的發票' },
        { status: 400 }
      )
    }

    // 呼叫藍新 API
    const result = await voidInvoice({
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      voidReason,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    // 更新資料庫
    const { data, error: updateError } = await supabase
      .from('travel_invoices')
      .update({
        status: 'voided',
        void_date: new Date().toISOString(),
        void_reason: voidReason,
        voided_by: operatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      console.error('更新發票狀態失敗:', updateError)
      return NextResponse.json({
        success: true,
        message: '發票已作廢，但更新狀態時發生錯誤',
        warning: '請手動更新發票狀態',
      })
    }

    return NextResponse.json({
      success: true,
      message: '作廢成功',
      data,
    })
  } catch (error) {
    console.error('作廢發票錯誤:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '作廢失敗' },
      { status: 500 }
    )
  }
}
