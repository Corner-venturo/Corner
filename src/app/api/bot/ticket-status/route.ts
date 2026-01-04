/**
 * 開票狀態檢查 API
 * 用於機器人每日檢查未開票的旅客
 *
 * GET  - 查詢開票狀態（可用於手動查詢）
 * POST - 執行檢查並發送通知（用於排程任務）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { format, addDays, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 系統機器人 ID
const SYSTEM_BOT_ID = '00000000-0000-0000-0000-000000000001'

// 成員開票狀態
interface MemberTicketStatus {
  id: string
  chinese_name: string | null
  pnr: string | null
  ticket_number: string | null
  ticketing_deadline: string | null
  flight_self_arranged: boolean
}

// 訂單統計
interface OrderStats {
  order_id: string
  order_code: string
  contact_person: string
  sales_person: string | null
  ticketed: number
  needs_ticketing: number
  no_record: number
  self_arranged: number
  members: MemberTicketStatus[]
  earliest_deadline: string | null
}

// 旅遊團統計
interface TourStats {
  tour_id: string
  tour_code: string
  tour_name: string
  departure_date: string
  orders: OrderStats[]
  total_ticketed: number
  total_needs_ticketing: number
  total_no_record: number
  total_self_arranged: number
  earliest_deadline: string | null
}

// 統計成員狀態
function categorizeMember(member: MemberTicketStatus): 'ticketed' | 'needs_ticketing' | 'no_record' | 'self_arranged' {
  if (member.flight_self_arranged) return 'self_arranged'
  if (member.ticket_number) return 'ticketed'
  if (member.pnr) return 'needs_ticketing'
  return 'no_record'
}

// 格式化訊息
function formatNotificationMessage(tours: TourStats[]): string {
  const now = new Date()
  const header = `🎫 開票狀態 (${format(now, 'MM/dd HH:mm', { locale: zhTW })})\n`

  let body = ''
  let totalNeedsTicketing = 0
  let totalNoRecord = 0

  for (const tour of tours) {
    // 跳過全部都開票完成或全部自理的團
    if (tour.total_needs_ticketing === 0 && tour.total_no_record === 0) continue

    totalNeedsTicketing += tour.total_needs_ticketing
    totalNoRecord += tour.total_no_record

    const departureFormatted = format(parseISO(tour.departure_date), 'MM/dd', { locale: zhTW })
    const dlFormatted = tour.earliest_deadline
      ? format(parseISO(tour.earliest_deadline), 'MM/dd', { locale: zhTW })
      : null

    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    body += `📍 ${tour.tour_code} ${tour.tour_name} (${departureFormatted}出發)\n`
    if (dlFormatted) {
      body += `   最近 DL: ${dlFormatted} ⏰\n`
    }

    for (const order of tour.orders) {
      // 跳過全部完成或全部自理的訂單
      if (order.needs_ticketing === 0 && order.no_record === 0) continue

      const orderDl = order.earliest_deadline
        ? `(DL:${format(parseISO(order.earliest_deadline), 'MM/dd', { locale: zhTW })})`
        : ''

      body += `\n   ┌─ ${order.order_code} ${order.contact_person}\n`

      if (order.ticketed > 0) {
        body += `   │  ✅ ${order.ticketed}位已開票\n`
      }

      if (order.needs_ticketing > 0) {
        const needsTicketingNames = order.members
          .filter(m => categorizeMember(m) === 'needs_ticketing')
          .map(m => m.chinese_name || '未知')
          .slice(0, 3)
        const moreCount = order.needs_ticketing - needsTicketingNames.length
        const namesStr = needsTicketingNames.join('、') + (moreCount > 0 ? `...等${order.needs_ticketing}位` : '')
        body += `   │  ⚠️ ${order.needs_ticketing}位待開票${orderDl}：${namesStr}\n`
      }

      if (order.no_record > 0) {
        const noRecordNames = order.members
          .filter(m => categorizeMember(m) === 'no_record')
          .map(m => m.chinese_name || '未知')
          .slice(0, 3)
        const moreCount = order.no_record - noRecordNames.length
        const namesStr = noRecordNames.join('、') + (moreCount > 0 ? `...等${order.no_record}位` : '')
        body += `   │  ❓ ${order.no_record}位無紀錄：${namesStr}\n`
      }

      if (order.self_arranged > 0) {
        body += `   │  ✈️ ${order.self_arranged}位機票自理\n`
      }
    }
  }

  if (body === '') {
    return header + '\n✅ 所有團都已完成開票！'
  }

  const footer = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 總計: ${totalNeedsTicketing}⚠️待開票 ${totalNoRecord}❓無紀錄`

  return header + body + footer
}

// GET - 查詢開票狀態
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const searchParams = request.nextUrl.searchParams
    const daysAhead = parseInt(searchParams.get('days') || '14', 10)
    const workspaceId = searchParams.get('workspace_id')

    const today = new Date()
    const futureDate = addDays(today, daysAhead)

    // 查詢未來 N 天出發的團
    let toursQuery = supabase
      .from('tours')
      .select('id, code, name, departure_date')
      .gte('departure_date', format(today, 'yyyy-MM-dd'))
      .lte('departure_date', format(futureDate, 'yyyy-MM-dd'))
      .neq('status', '取消')
      .order('departure_date', { ascending: true })

    if (workspaceId) {
      toursQuery = toursQuery.eq('workspace_id', workspaceId)
    }

    const { data: tours, error: toursError } = await toursQuery

    if (toursError) {
      logger.error('查詢旅遊團失敗:', toursError)
      return NextResponse.json({ success: false, message: '查詢失敗' }, { status: 500 })
    }

    if (!tours || tours.length === 0) {
      return NextResponse.json({
        success: true,
        message: '無需檢查的團',
        data: { tours: [], summary: { total_needs_ticketing: 0, total_no_record: 0 } }
      })
    }

    // 查詢每個團的訂單和成員
    const tourIds = tours.map(t => t.id)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, code, tour_id, contact_person, sales_person')
      .in('tour_id', tourIds)
      .neq('status', 'cancelled')

    if (ordersError) {
      logger.error('查詢訂單失敗:', ordersError)
      return NextResponse.json({ success: false, message: '查詢訂單失敗' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: '無訂單',
        data: { tours: [], summary: { total_needs_ticketing: 0, total_no_record: 0 } }
      })
    }

    const orderIds = orders.map(o => o.id)

    const { data: members, error: membersError } = await supabase
      .from('order_members')
      .select('id, order_id, chinese_name, pnr, ticket_number, ticketing_deadline, flight_self_arranged')
      .in('order_id', orderIds)

    if (membersError) {
      logger.error('查詢成員失敗:', membersError)
      return NextResponse.json({ success: false, message: '查詢成員失敗' }, { status: 500 })
    }

    // 組織資料
    const tourStats: TourStats[] = tours.map(tour => {
      const tourOrders = orders.filter(o => o.tour_id === tour.id)

      const orderStatsArray: OrderStats[] = tourOrders.map(order => {
        const orderMembers = (members || [])
          .filter(m => m.order_id === order.id)
          .map(m => ({
            id: m.id,
            chinese_name: m.chinese_name,
            pnr: m.pnr,
            ticket_number: m.ticket_number,
            ticketing_deadline: m.ticketing_deadline,
            flight_self_arranged: m.flight_self_arranged || false,
          }))

        const stats = {
          ticketed: 0,
          needs_ticketing: 0,
          no_record: 0,
          self_arranged: 0,
        }

        let earliestDeadline: string | null = null

        for (const member of orderMembers) {
          const category = categorizeMember(member)
          stats[category]++

          if (member.ticketing_deadline && (category === 'needs_ticketing' || category === 'no_record')) {
            if (!earliestDeadline || member.ticketing_deadline < earliestDeadline) {
              earliestDeadline = member.ticketing_deadline
            }
          }
        }

        return {
          order_id: order.id,
          order_code: order.code,
          contact_person: order.contact_person,
          sales_person: order.sales_person,
          ...stats,
          members: orderMembers,
          earliest_deadline: earliestDeadline,
        }
      })

      const tourTotals = orderStatsArray.reduce(
        (acc, o) => ({
          ticketed: acc.ticketed + o.ticketed,
          needs_ticketing: acc.needs_ticketing + o.needs_ticketing,
          no_record: acc.no_record + o.no_record,
          self_arranged: acc.self_arranged + o.self_arranged,
        }),
        { ticketed: 0, needs_ticketing: 0, no_record: 0, self_arranged: 0 }
      )

      const allDeadlines = orderStatsArray
        .map(o => o.earliest_deadline)
        .filter((d): d is string => d !== null)
      const earliestTourDeadline = allDeadlines.length > 0
        ? allDeadlines.sort()[0]
        : null

      return {
        tour_id: tour.id,
        tour_code: tour.code,
        tour_name: tour.name,
        departure_date: tour.departure_date,
        orders: orderStatsArray,
        total_ticketed: tourTotals.ticketed,
        total_needs_ticketing: tourTotals.needs_ticketing,
        total_no_record: tourTotals.no_record,
        total_self_arranged: tourTotals.self_arranged,
        earliest_deadline: earliestTourDeadline,
      }
    })

    // 過濾掉全部完成的團
    const toursNeedingAttention = tourStats.filter(
      t => t.total_needs_ticketing > 0 || t.total_no_record > 0
    )

    const summary = {
      total_tours: tours.length,
      tours_needing_attention: toursNeedingAttention.length,
      total_needs_ticketing: tourStats.reduce((sum, t) => sum + t.total_needs_ticketing, 0),
      total_no_record: tourStats.reduce((sum, t) => sum + t.total_no_record, 0),
      total_self_arranged: tourStats.reduce((sum, t) => sum + t.total_self_arranged, 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        tours: toursNeedingAttention,
        summary,
        message: formatNotificationMessage(tourStats),
      }
    })

  } catch (error) {
    logger.error('開票狀態查詢錯誤:', error)
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 })
  }
}

// POST - 執行檢查並發送通知
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const body = await request.json()
    const { workspace_id, channel_id, notify_sales = true } = body

    // 先取得狀態
    const statusUrl = new URL(request.url)
    statusUrl.searchParams.set('days', '14')
    if (workspace_id) {
      statusUrl.searchParams.set('workspace_id', workspace_id)
    }

    const statusResponse = await GET(new NextRequest(statusUrl))
    const statusData = await statusResponse.json()

    if (!statusData.success) {
      return NextResponse.json(statusData, { status: 500 })
    }

    const { tours, summary, message } = statusData.data

    // 如果沒有需要關注的團，不發送通知
    if (summary.tours_needing_attention === 0) {
      return NextResponse.json({
        success: true,
        message: '無需發送通知',
        data: { sent: false, summary }
      })
    }

    // 發送到指定頻道
    if (channel_id) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          channel_id,
          content: message,
          author_id: SYSTEM_BOT_ID,
          metadata: {
            type: 'ticket_status_check',
            summary,
          },
        })

      if (msgError) {
        logger.error('發送開票狀態通知失敗:', msgError)
        return NextResponse.json({ success: false, message: '發送通知失敗' }, { status: 500 })
      }
    }

    // 發送給各訂單的業務人員
    if (notify_sales) {
      const salesPersonIds = new Set<string>()

      for (const tour of tours as TourStats[]) {
        for (const order of tour.orders) {
          if (order.sales_person && (order.needs_ticketing > 0 || order.no_record > 0)) {
            salesPersonIds.add(order.sales_person)
          }
        }
      }

      // 發送個人通知
      for (const salesId of salesPersonIds) {
        // 過濾出該業務負責的訂單
        const relevantTours = (tours as TourStats[]).map(tour => ({
          ...tour,
          orders: tour.orders.filter(o => o.sales_person === salesId)
        })).filter(t => t.orders.length > 0)

        const personalMessage = formatNotificationMessage(relevantTours)

        // 使用 bot-notification API 發送
        try {
          await fetch(`${request.nextUrl.origin}/api/bot-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient_id: salesId,
              message: personalMessage,
              type: 'info',
              metadata: { type: 'ticket_status_personal' },
            }),
          })
        } catch (notifyError) {
          logger.error(`發送給業務 ${salesId} 失敗:`, notifyError)
        }
      }
    }

    logger.info('開票狀態通知已發送', { summary })

    return NextResponse.json({
      success: true,
      message: '通知已發送',
      data: { sent: true, summary }
    })

  } catch (error) {
    logger.error('開票狀態通知錯誤:', error)
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 })
  }
}

// PATCH - 標記機票自理
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const body = await request.json()
    const { member_ids, order_id, flight_self_arranged } = body

    let query = supabase.from('order_members').update({ flight_self_arranged })

    if (member_ids && member_ids.length > 0) {
      query = query.in('id', member_ids)
    } else if (order_id) {
      query = query.eq('order_id', order_id)
    } else {
      return NextResponse.json({ success: false, message: '需要指定 member_ids 或 order_id' }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      logger.error('更新機票自理狀態失敗:', error)
      return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '已更新' })

  } catch (error) {
    logger.error('更新機票自理狀態錯誤:', error)
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 })
  }
}
