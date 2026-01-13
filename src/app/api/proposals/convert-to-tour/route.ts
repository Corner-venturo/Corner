import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

/**
 * 提案轉開團 API
 * 🔒 安全修復 2026-01-12：使用 getServerAuth() 驗證用戶身份
 */

// 生成團號（格式：城市代碼 + YYMMDD + A-Z）
function generateTourCode(cityCode: string, departureDate: string, existingCodes: string[]): string {
  const date = new Date(departureDate)
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const dateStr = `${yy}${mm}${dd}`
  const prefix = `${cityCode}${dateStr}`

  // 找出已使用的字母
  const usedLetters = new Set<string>()
  existingCodes.forEach(code => {
    if (code.startsWith(prefix) && code.length === prefix.length + 1) {
      usedLetters.add(code.slice(-1))
    }
  })

  // 找下一個可用字母
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i) // A-Z
    if (!usedLetters.has(letter)) {
      return `${prefix}${letter}`
    }
  }

  throw new Error('已達當日最大團數限制 (26團)')
}

// 生成訂單編號（格式：團號-O01, O02...）
function generateOrderCode(tourCode: string, existingCodes: string[]): string {
  const prefix = `${tourCode}-O`
  let maxNum = 0

  existingCodes.forEach(code => {
    if (code.startsWith(prefix)) {
      const numStr = code.slice(prefix.length)
      const num = parseInt(numStr, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })

  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`
}

interface ConvertToTourRequest {
  proposal_id: string
  package_id: string
  city_code: string
  departure_date: string
  tour_name?: string
  contact_person?: string
  contact_phone?: string
  // workspace_id 和 user_id 改由 getServerAuth() 取得，不信任前端傳入
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份並取得 workspace_id
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const { workspaceId: workspace_id, employeeId: user_id } = auth.data

    const data: ConvertToTourRequest = await request.json()
    const {
      proposal_id,
      package_id,
      city_code,
      departure_date,
      tour_name,
      contact_person,
      contact_phone,
    } = data

    const supabase = getSupabaseAdminClient()

    // 1. 取得提案
    const { data: proposalData, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposal_id)
      .single()

    if (proposalError || !proposalData) {
      return errorResponse('找不到提案', 404, ErrorCode.NOT_FOUND)
    }

    if (proposalData.status === 'converted') {
      return errorResponse('此提案已經轉為旅遊團', 400, ErrorCode.VALIDATION_ERROR)
    }

    // 2. 取得套件
    const { data: pkgData, error: pkgError } = await supabase
      .from('proposal_packages')
      .select('*')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkgData) {
      return errorResponse('找不到團體套件', 404, ErrorCode.NOT_FOUND)
    }

    // 3. 生成團號（查詢現有團號）
    const { data: existingTours } = await supabase
      .from('tours')
      .select('code')
      .like('code', `${city_code}%`)

    const existingTourCodes = (existingTours || []).map(t => t.code).filter(Boolean) as string[]
    const tourCode = generateTourCode(city_code, pkgData.start_date || departure_date, existingTourCodes)

    // 4. 建立 Tour
    const daysCount = pkgData.days || 1
    const depDate = new Date(pkgData.start_date || departure_date)
    const returnDateValue =
      pkgData.end_date ||
      new Date(depDate.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const tourData = {
      id: crypto.randomUUID(),
      code: tourCode,
      name: tour_name || proposalData.title,
      location:
        pkgData.destination ||
        proposalData.destination ||
        `${pkgData.country_id || ''} ${pkgData.main_city_id || ''}`.trim(),
      country_id: null,
      main_city_id: null,
      departure_date: pkgData.start_date || departure_date,
      return_date: returnDateValue,
      status: '進行中',
      max_participants: pkgData.group_size || proposalData.group_size,
      current_participants: 0,
      contract_status: 'pending',
      workspace_id: workspace_id,
      proposal_id: proposal_id,
      proposal_package_id: package_id,
      converted_from_proposal: true,
      profit: 0,
      total_cost: 0,
      total_revenue: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    logger.log('準備建立旅遊團:', JSON.stringify(tourData, null, 2))

    const { data: newTour, error: tourError } = await supabase
      .from('tours')
      .insert(tourData)
      .select()
      .single()

    if (tourError) {
      logger.error('建立旅遊團失敗:', JSON.stringify(tourError, null, 2))
      return errorResponse(
        `建立旅遊團失敗: ${tourError.message || JSON.stringify(tourError)}`,
        500,
        ErrorCode.DATABASE_ERROR
      )
    }

    // 5. 更新套件的報價單和行程表
    if (pkgData.quote_id) {
      await supabase.from('quotes').update({ tour_id: newTour.id }).eq('id', pkgData.quote_id)
    }

    if (pkgData.itinerary_id) {
      await supabase
        .from('itineraries')
        .update({ tour_id: newTour.id, tour_code: tourCode })
        .eq('id', pkgData.itinerary_id)
    }

    // 5.1 更新需求單
    await supabase
      .from('tour_requests')
      .update({
        tour_id: newTour.id,
        tour_code: tourCode,
        tour_name: tour_name || proposalData.title,
      })
      .eq('proposal_package_id', package_id)

    // 6. 更新提案狀態
    await supabase
      .from('proposals')
      .update({
        status: 'converted',
        selected_package_id: package_id,
        converted_tour_id: newTour.id,
        converted_at: new Date().toISOString(),
        converted_by: user_id,
        updated_by: user_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposal_id)

    // 7. 標記套件為選定
    await supabase.from('proposal_packages').update({ is_selected: true }).eq('id', package_id)

    // 8. 建立訂單（查詢所有訂單以避免衝突）
    const { data: existingOrdersRaw } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${tourCode}%`)

    const existingOrderCodes = (existingOrdersRaw || [])
      .map(o => o.order_number)
      .filter(Boolean) as string[]

    const orderCode = generateOrderCode(tourCode, existingOrderCodes)
    const orderData = {
      id: crypto.randomUUID(),
      order_number: orderCode,
      code: tourCode,
      tour_id: newTour.id,
      tour_name: tour_name || proposalData.title,
      contact_person: contact_person || proposalData.customer_name || '待填寫',
      contact_phone: contact_phone || proposalData.customer_phone || null,
      customer_id: proposalData.customer_id || null,
      sales_person: null,
      assistant: null,
      member_count: pkgData.group_size || proposalData.group_size || 0,
      payment_status: 'unpaid',
      status: 'pending',
      total_amount: 0,
      paid_amount: 0,
      remaining_amount: 0,
      notes: `從提案 ${proposalData.code} 轉開團自動建立`,
      workspace_id: workspace_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      logger.warn('自動建立訂單失敗:', JSON.stringify(orderError, null, 2))
    } else {
      logger.log('自動建立訂單成功:', { orderCode: newOrder.order_number })
    }

    logger.log('提案轉團成功:', { proposalId: proposal_id, tourCode })

    return successResponse({
      tour_id: newTour.id,
      tour_code: tourCode,
      quote_id: pkgData.quote_id || undefined,
      itinerary_id: pkgData.itinerary_id || undefined,
      order_id: newOrder?.id,
    })
  } catch (error) {
    logger.error('轉開團 API 錯誤:', error)
    return errorResponse(
      error instanceof Error ? error.message : '轉開團失敗',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}
