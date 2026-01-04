import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkTicketStatus() {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 30)

  // 查詢未來 30 天的團
  const { data: tours, error: toursError } = await supabase
    .from('tours')
    .select('id, code, name, departure_date')
    .gte('departure_date', today.toISOString().split('T')[0])
    .lte('departure_date', futureDate.toISOString().split('T')[0])
    .neq('status', '取消')
    .order('departure_date', { ascending: true })

  if (toursError) {
    console.error('查詢團錯誤:', toursError)
    return
  }

  if (!tours || tours.length === 0) {
    console.log('沒有找到未來 30 天的團')
    return
  }

  console.log('找到 ' + tours.length + ' 個團\n')

  // 查詢訂單
  const tourIds = tours.map(t => t.id)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, code, tour_id, contact_person, sales_person, assistant')
    .in('tour_id', tourIds)
    .neq('status', 'cancelled')

  if (!orders || orders.length === 0) {
    console.log('沒有訂單')
    return
  }

  // 查詢成員
  const orderIds = orders.map(o => o.id)
  const { data: members } = await supabase
    .from('order_members')
    .select('id, order_id, chinese_name, pnr, ticket_number, ticketing_deadline, flight_self_arranged')
    .in('order_id', orderIds)

  // 組織資料
  for (const tour of tours) {
    const tourOrders = orders.filter(o => o.tour_id === tour.id)
    if (tourOrders.length === 0) continue

    let hasPendingTickets = false
    const orderDetails: string[] = []

    for (const order of tourOrders) {
      const orderMembers = (members || []).filter(m => m.order_id === order.id)

      const needsTicketing = orderMembers.filter(m => !m.flight_self_arranged && m.pnr && !m.ticket_number)
      const noRecord = orderMembers.filter(m => !m.flight_self_arranged && !m.pnr && !m.ticket_number)
      const ticketed = orderMembers.filter(m => m.ticket_number)
      const selfArranged = orderMembers.filter(m => m.flight_self_arranged)

      if (needsTicketing.length > 0 || noRecord.length > 0) {
        hasPendingTickets = true
        orderDetails.push('  訂單 ' + order.code + ' (' + order.contact_person + '):')
        orderDetails.push('    業務: ' + (order.sales_person || '無') + ' | 助理: ' + (order.assistant || '無'))
        if (ticketed.length > 0) {
          orderDetails.push('    ✅ 已開票: ' + ticketed.length + '位')
        }
        if (needsTicketing.length > 0) {
          const names = needsTicketing.map(m => m.chinese_name + '(PNR:' + m.pnr + ')').join(', ')
          orderDetails.push('    ⚠️ 待開票: ' + needsTicketing.length + '位 - ' + names)
        }
        if (noRecord.length > 0) {
          const names = noRecord.map(m => m.chinese_name).join(', ')
          orderDetails.push('    ❓ 無紀錄: ' + noRecord.length + '位 - ' + names)
        }
        if (selfArranged.length > 0) {
          orderDetails.push('    ✈️ 機票自理: ' + selfArranged.length + '位')
        }
      }
    }

    if (hasPendingTickets) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📍 ' + tour.code + ' ' + tour.name + ' (' + tour.departure_date + ')')
      orderDetails.forEach(d => console.log(d))
      console.log('')
    }
  }

  console.log('\n如果上面沒有輸出任何團，表示所有團的成員都已開票完成或無訂單。')
}

checkTicketStatus()
