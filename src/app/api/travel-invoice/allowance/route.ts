/**
 * 開立折讓 API
 * POST /api/travel-invoice/allowance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { issueAllowance } from '@/lib/newebpay'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, allowanceAmount, allowanceItems, operatedBy } = body

    // 驗證必要欄位
    if (!invoiceId || !allowanceAmount || !allowanceItems?.length) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

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
        { success: false, error: '只能對已開立的發票開立折讓' },
        { status: 400 }
      )
    }

    // 確保必要欄位存在
    if (!invoice.invoice_number || !invoice.invoice_date) {
      return NextResponse.json(
        { success: false, error: '發票資料不完整' },
        { status: 400 }
      )
    }

    // 呼叫藍新 API
    const result = await issueAllowance({
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      allowanceAmount,
      items: allowanceItems,
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
        status: 'allowance',
        allowance_date: new Date().toISOString(),
        allowance_amount: allowanceAmount,
        allowance_items: allowanceItems,
        allowance_no: result.data?.allowanceNo,
        allowanced_by: operatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      logger.error('更新發票狀態失敗:', updateError)
      return NextResponse.json({
        success: true,
        message: '折讓已開立，但更新狀態時發生錯誤',
        data: result.data,
        warning: '請手動更新發票狀態',
      })
    }

    return NextResponse.json({
      success: true,
      message: '折讓開立成功',
      data,
    })
  } catch (error) {
    logger.error('開立折讓錯誤:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '開立折讓失敗' },
      { status: 500 }
    )
  }
}
