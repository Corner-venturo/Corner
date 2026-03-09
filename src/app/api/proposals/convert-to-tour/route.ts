import { captureException } from '@/lib/error-tracking'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { generateTourCode, generateOrderCode } from '@/stores/utils/code-generator'
import { validateBody } from '@/lib/api/validation'
import { convertToTourFullSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份並取得 workspace_id
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const { workspaceId: workspace_id, employeeId: user_id } = auth.data

    const validation = await validateBody(request, convertToTourFullSchema)
    if (!validation.success) return validation.error
    const {
      proposal_id,
      package_id,
      city_code,
      departure_date,
      tour_name,
      contact_person,
      contact_phone,
    } = validation.data

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

    // 使用共用的編號生成器（workspaceCode 參數已棄用，傳空字串）
    const tourCode = generateTourCode(
      '',
      city_code,
      pkgData.start_date || departure_date,
      existingTours || []
    )

    // 4. 建立 Tour
    const daysCount = pkgData.days || 1
    const depDate = new Date(pkgData.start_date || departure_date)
    const returnDateValue =
      pkgData.end_date ||
      new Date(depDate.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

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
      status: '待出發',
      max_participants: pkgData.group_size || proposalData.group_size,
      current_participants: 0,
      contract_status: 'pending',
      workspace_id: workspace_id,
      proposal_id: proposal_id,
      proposal_package_id: package_id,
      converted_from_proposal: true,
      // 報價單和行程表 ID
      quote_id: pkgData.quote_id || null,
      itinerary_id: pkgData.itinerary_id || null,
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
    const updateWarnings: string[] = []

    if (pkgData.quote_id) {
      const { error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ tour_id: newTour.id })
        .eq('id', pkgData.quote_id)
      if (quoteUpdateError) {
        logger.warn('更新報價單失敗:', quoteUpdateError)
        updateWarnings.push('報價單關聯更新失敗')
      }
    }

    if (pkgData.itinerary_id) {
      const { error: itineraryUpdateError } = await supabase
        .from('itineraries')
        .update({ tour_id: newTour.id, tour_code: tourCode })
        .eq('id', pkgData.itinerary_id)
      if (itineraryUpdateError) {
        logger.warn('更新行程表失敗:', itineraryUpdateError)
        updateWarnings.push('行程表關聯更新失敗')
      }
    }

    // 5.1 更新需求單（將 proposal_package_id 對應的需求單補上 tour_id）
    const { error: requestUpdateError } = await supabase
      .from('tour_requests')
      .update({
        tour_id: newTour.id,
        tour_code: tourCode,
        tour_name: tour_name || proposalData.title,
      })
      .eq('proposal_package_id', package_id)
    if (requestUpdateError) {
      logger.warn('更新需求單失敗:', requestUpdateError)
      updateWarnings.push('需求單關聯更新失敗')
    }

    // 5.2 複製需求確認快照（從套件複製到旅遊團）
    if (pkgData.confirmed_requirements) {
      const { error: snapshotUpdateError } = await supabase
        .from('tours')
        .update({
          confirmed_requirements: pkgData.confirmed_requirements,
        })
        .eq('id', newTour.id)
      if (snapshotUpdateError) {
        logger.warn('複製需求確認快照失敗:', snapshotUpdateError)
        updateWarnings.push('需求確認快照複製失敗')
      } else {
        logger.log('已複製需求確認快照到旅遊團')
      }
    }

    // 6. 更新提案狀態
    const { error: proposalUpdateError } = await supabase
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
    if (proposalUpdateError) {
      logger.warn('更新提案狀態失敗:', proposalUpdateError)
      updateWarnings.push('提案狀態更新失敗')
    }

    // 7. 標記套件為選定
    const { error: packageUpdateError } = await supabase
      .from('proposal_packages')
      .update({ is_selected: true })
      .eq('id', package_id)
    if (packageUpdateError) {
      logger.warn('標記套件選定失敗:', packageUpdateError)
      updateWarnings.push('套件標記更新失敗')
    }

    // 8. 建立訂單（查詢所有訂單以避免衝突）
    const { data: existingOrdersRaw } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${tourCode}%`)

    // 轉換成共用編號生成器需要的格式
    const existingOrders = (existingOrdersRaw || [])
      .filter(o => o.order_number)
      .map(o => ({ code: o.order_number as string }))

    const orderCode = generateOrderCode(tourCode, existingOrders)
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

    logger.log('提案轉團成功:', { proposalId: proposal_id, tourCode, warnings: updateWarnings })

    return successResponse({
      tour_id: newTour.id,
      tour_code: tourCode,
      quote_id: pkgData.quote_id || undefined,
      itinerary_id: pkgData.itinerary_id || undefined,
      order_id: newOrder?.id,
      warnings: updateWarnings.length > 0 ? updateWarnings : undefined,
    })
  } catch (error) {
    logger.error('轉開團 API 錯誤:', error)
    captureException(error, { module: 'proposals.convert-to-tour' })
    return errorResponse(
      error instanceof Error ? error.message : '轉開團失敗',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}
