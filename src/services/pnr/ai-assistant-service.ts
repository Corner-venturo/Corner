/**
 * PNR AI 助手服務
 *
 * 規則式查詢處理（不需外部 AI）
 * 支援自然語言查詢 PNR 資訊
 */

import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { formatDateChinese } from '@/lib/utils/format-date'
import type { Database } from '@/lib/supabase/types'
import type {
  PNR,
  PNRSegment,
  QueryIntent
} from '@/types/pnr.types'
import type { EnhancedSSR, EnhancedOSI } from '@/lib/pnr-parser'

type PnrAiQuery = Database['public']['Tables']['pnr_ai_queries']['Row']
type PnrAiQueryInsert = Database['public']['Tables']['pnr_ai_queries']['Insert']

// =====================================================
// Query Intent Classification
// =====================================================

interface IntentPattern {
  intent: QueryIntent
  patterns: RegExp[]
  priority: number
}

/**
 * 查詢意圖模式定義
 */
const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'meal',
    patterns: [
      /餐|meal|food|用餐|特殊餐|vgml|avml|素食|清真|兒童餐/i,
      /有.*餐/i,
      /什麼.*餐/i
    ],
    priority: 10
  },
  {
    intent: 'wheelchair',
    patterns: [
      /輪椅|wheelchair|wchr|wchs|wchc|行動不便|殘障/i,
      /有.*輪椅/i,
      /需要.*輪椅/i
    ],
    priority: 10
  },
  {
    intent: 'deadline',
    patterns: [
      /期限|deadline|出票|開票|tlk|tl|到期/i,
      /什麼時候.*開票/i,
      /幾號.*出票/i
    ],
    priority: 9
  },
  {
    intent: 'times',
    patterns: [
      /時間|time|幾點|起飛|降落|出發|抵達|航班時間/i,
      /什麼時候.*飛/i,
      /幾點.*起飛/i
    ],
    priority: 8
  },
  {
    intent: 'passengers',
    patterns: [
      /誰|旅客|乘客|姓名|名字|passenger|name|pax/i,
      /有誰|幾位|幾個人/i
    ],
    priority: 7
  },
  {
    intent: 'baggage',
    patterns: [
      /行李|baggage|luggage|bag|托運|公斤|kg/i,
      /有.*行李/i,
      /多少.*行李/i
    ],
    priority: 6
  },
  {
    intent: 'status',
    patterns: [
      /狀態|status|確認|訂位|hk|tk|uc|是否.*確認/i,
      /訂位.*狀態/i
    ],
    priority: 5
  },
  {
    intent: 'segments',
    patterns: [
      /航段|航班|segment|flight|飛機|路線|行程/i,
      /哪.*航班/i,
      /幾個.*航段/i
    ],
    priority: 4
  }
]

/**
 * 解析查詢意圖
 */
export function parseQueryIntent(queryText: string): QueryIntent {
  const normalizedQuery = queryText.toLowerCase().trim()

  // 按優先級排序
  const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => b.priority - a.priority)

  for (const { intent, patterns } of sortedPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return intent
      }
    }
  }

  return 'unknown'
}

// =====================================================
// Query Handlers
// =====================================================

interface QueryResponse {
  intent: QueryIntent
  answer: string
  data?: unknown
  suggestions?: string[]
}

/**
 * 處理餐食查詢
 */
function handleMealQuery(pnr: PNR): QueryResponse {
  const ssrs = pnr.special_requests || []
  const mealSSRs = ssrs.filter(
    (ssr: EnhancedSSR) => ssr.category === 'MEAL' || MEAL_CODES.includes(ssr.code)
  )

  if (mealSSRs.length === 0) {
    return {
      intent: 'meal',
      answer: '此 PNR 沒有特殊餐食請求。',
      suggestions: ['要加訂特殊餐嗎？常見的有 VGML（素食）、AVML（印度素食）、CHML（兒童餐）']
    }
  }

  const mealDescriptions = mealSSRs.map((ssr: EnhancedSSR) => {
    const description = MEAL_CODE_LABELS[ssr.code] || ssr.code
    const passengerInfo = ssr.passenger ? `旅客 ${ssr.passenger}` : '全部旅客'
    return `- ${passengerInfo}: ${description} (${ssr.code})`
  })

  return {
    intent: 'meal',
    answer: `共有 ${mealSSRs.length} 個特殊餐請求：\n${mealDescriptions.join('\n')}`,
    data: mealSSRs
  }
}

/**
 * 處理輪椅查詢
 */
function handleWheelchairQuery(pnr: PNR): QueryResponse {
  const ssrs = pnr.special_requests || []
  const wheelchairSSRs = ssrs.filter(
    (ssr: EnhancedSSR) => WHEELCHAIR_CODES.includes(ssr.code)
  )

  if (wheelchairSSRs.length === 0) {
    return {
      intent: 'wheelchair',
      answer: '此 PNR 沒有輪椅服務請求。'
    }
  }

  const wcDescriptions = wheelchairSSRs.map((ssr: EnhancedSSR) => {
    const description = WHEELCHAIR_CODE_LABELS[ssr.code] || ssr.code
    const passengerInfo = ssr.passenger ? `旅客 ${ssr.passenger}` : '全部旅客'
    return `- ${passengerInfo}: ${description}`
  })

  return {
    intent: 'wheelchair',
    answer: `有 ${wheelchairSSRs.length} 個輪椅服務請求：\n${wcDescriptions.join('\n')}`,
    data: wheelchairSSRs
  }
}

/**
 * 處理期限查詢
 */
function handleDeadlineQuery(pnr: PNR): QueryResponse {
  const deadline = pnr.ticketing_deadline

  if (!deadline) {
    return {
      intent: 'deadline',
      answer: '此 PNR 沒有記錄出票期限。',
      suggestions: ['建議確認電報中是否有 TL 或 OPW 資訊']
    }
  }

  const deadlineDate = new Date(deadline)
  const now = new Date()
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let urgencyMessage = ''
  if (daysLeft < 0) {
    urgencyMessage = '⚠️ 已逾期！請立即處理！'
  } else if (daysLeft === 0) {
    urgencyMessage = '⚠️ 今天到期！請盡快開票！'
  } else if (daysLeft <= 3) {
    urgencyMessage = `⚠️ 剩餘 ${daysLeft} 天，請儘早開票！`
  } else {
    urgencyMessage = `還有 ${daysLeft} 天`
  }

  return {
    intent: 'deadline',
    answer: `出票期限：${formatDateFull(deadline)}\n${urgencyMessage}`,
    data: { deadline, daysLeft }
  }
}

/**
 * 處理時間查詢
 */
function handleTimesQuery(pnr: PNR): QueryResponse {
  const segments = pnr.segments || []

  if (segments.length === 0) {
    return {
      intent: 'times',
      answer: '此 PNR 沒有航班資訊。'
    }
  }

  const flightTimes = segments.map((seg: PNRSegment, index: number) => {
    const depTime = seg.departureTime ? formatTime(seg.departureTime) : '未知'
    const arrTime = seg.arrivalTime ? formatTime(seg.arrivalTime) : '未知'
    return `${index + 1}. ${seg.airline}${seg.flightNumber} ${seg.origin}→${seg.destination}\n   📅 ${seg.departureDate} 出發 ${depTime} / 抵達 ${arrTime}`
  })

  return {
    intent: 'times',
    answer: `航班時間：\n${flightTimes.join('\n')}`,
    data: segments
  }
}

/**
 * 處理旅客查詢
 */
function handlePassengersQuery(pnr: PNR): QueryResponse {
  const passengers = pnr.passenger_names || []

  if (passengers.length === 0) {
    return {
      intent: 'passengers',
      answer: '此 PNR 沒有旅客資訊。'
    }
  }

  const passengerList = passengers.map(
    (name: string, index: number) => `${index + 1}. ${name}`
  )

  return {
    intent: 'passengers',
    answer: `共 ${passengers.length} 位旅客：\n${passengerList.join('\n')}`,
    data: passengers
  }
}

/**
 * 處理行李查詢
 */
function handleBaggageQuery(pnr: PNR): QueryResponse {
  const ssrs = pnr.special_requests || []
  const baggageSSRs = ssrs.filter(
    (ssr: EnhancedSSR) => ssr.category === 'BAGGAGE' || BAGGAGE_CODES.includes(ssr.code)
  )

  if (baggageSSRs.length === 0) {
    return {
      intent: 'baggage',
      answer: '此 PNR 沒有特殊行李請求。行李額度請查看機票或航空公司規定。',
      suggestions: ['常見行李 SSR 有 CBBG（攜帶寵物）、BIKE（腳踏車）、GOLF（高爾夫球具）']
    }
  }

  const baggageDescriptions = baggageSSRs.map((ssr: EnhancedSSR) => {
    const description = ssr.description || ssr.code
    return `- ${description}`
  })

  return {
    intent: 'baggage',
    answer: `有 ${baggageSSRs.length} 個特殊行李請求：\n${baggageDescriptions.join('\n')}`,
    data: baggageSSRs
  }
}

/**
 * 處理狀態查詢
 */
function handleStatusQuery(pnr: PNR): QueryResponse {
  const segments = pnr.segments || []

  if (segments.length === 0) {
    return {
      intent: 'status',
      answer: `PNR 狀態：${pnr.status || '未知'}\n無航班資訊。`
    }
  }

  const statusSummary = segments.map((seg: PNRSegment, index: number) => {
    const statusLabel = BOOKING_STATUS_LABELS[seg.status] || seg.status
    const statusIcon = getStatusIcon(seg.status)
    return `${index + 1}. ${seg.airline}${seg.flightNumber} ${seg.origin}→${seg.destination}: ${statusIcon} ${statusLabel}`
  })

  // 檢查是否有未確認的航段
  const hasUnconfirmed = segments.some(
    (seg: PNRSegment) => seg.status === 'UC' || seg.status === 'UN'
  )
  const warningMessage = hasUnconfirmed ? '\n⚠️ 有航段尚未確認，請追蹤！' : ''

  return {
    intent: 'status',
    answer: `PNR 狀態：${pnr.status || '未知'}\n航段狀態：\n${statusSummary.join('\n')}${warningMessage}`,
    data: segments
  }
}

/**
 * 處理航段查詢
 */
function handleSegmentsQuery(pnr: PNR): QueryResponse {
  const segments = pnr.segments || []

  if (segments.length === 0) {
    return {
      intent: 'segments',
      answer: '此 PNR 沒有航班資訊。'
    }
  }

  const segmentDetails = segments.map((seg: PNRSegment, index: number) => {
    return `${index + 1}. ${seg.airline}${seg.flightNumber} ${seg.class}艙\n   ${seg.origin} → ${seg.destination}\n   📅 ${seg.departureDate} ${seg.departureTime ? formatTime(seg.departureTime) : ''}`
  })

  return {
    intent: 'segments',
    answer: `共 ${segments.length} 個航段：\n${segmentDetails.join('\n')}`,
    data: segments
  }
}

/**
 * 處理未知查詢
 */
function handleUnknownQuery(pnr: PNR, queryText: string): QueryResponse {
  return {
    intent: 'unknown',
    answer: `抱歉，我無法理解您的問題「${queryText}」。\n\n您可以問我：\n- 有什麼特殊餐？\n- 出票期限是什麼時候？\n- 航班時間？\n- 有幾位旅客？\n- 訂位狀態？\n- 有輪椅需求嗎？`,
    suggestions: ['餐食', '出票期限', '航班時間', '旅客名單', '訂位狀態']
  }
}

// =====================================================
// Main Query Processing
// =====================================================

/**
 * 處理 PNR 查詢
 */
export function processQuery(pnr: PNR, queryText: string): QueryResponse {
  const intent = parseQueryIntent(queryText)

  switch (intent) {
    case 'meal':
      return handleMealQuery(pnr)
    case 'wheelchair':
      return handleWheelchairQuery(pnr)
    case 'deadline':
      return handleDeadlineQuery(pnr)
    case 'times':
      return handleTimesQuery(pnr)
    case 'passengers':
      return handlePassengersQuery(pnr)
    case 'baggage':
      return handleBaggageQuery(pnr)
    case 'status':
      return handleStatusQuery(pnr)
    case 'segments':
      return handleSegmentsQuery(pnr)
    default:
      return handleUnknownQuery(pnr, queryText)
  }
}

/**
 * 記錄查詢歷史
 */
export async function recordQuery(
  pnrId: string | null,
  workspaceId: string,
  queryText: string,
  response: QueryResponse,
  userId?: string
): Promise<PnrAiQuery | null> {
  try {
    const queryRecord: PnrAiQueryInsert = {
      pnr_id: pnrId,
      workspace_id: workspaceId,
      query_text: queryText,
      query_context: pnrId ? { pnr_id: pnrId } : null,
      response_text: response.answer,
      response_metadata: JSON.parse(JSON.stringify({
        intent: response.intent,
        suggestions: response.suggestions,
        hasData: !!response.data
      })),
      queried_by: userId || null
    }

    const { data, error } = await supabase
      .from('pnr_ai_queries')
      .insert(queryRecord)
      .select()
      .single()

    if (error) {
      logger.error('[AIAssistant] Failed to record query:', error)
      return null
    }

    return data
  } catch (err) {
    logger.error('[AIAssistant] Error recording query:', err)
    return null
  }
}

/**
 * 取得查詢歷史
 */
export async function getQueryHistory(
  pnrId: string,
  limit: number = 20
): Promise<PnrAiQuery[]> {
  try {
    const { data, error } = await supabase
      .from('pnr_ai_queries')
      .select('*')
      .eq('pnr_id', pnrId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('[AIAssistant] Failed to get query history:', error)
      return []
    }

    return data || []
  } catch (err) {
    logger.error('[AIAssistant] Error getting query history:', err)
    return []
  }
}

// =====================================================
// Constants
// =====================================================

const MEAL_CODES = ['VGML', 'AVML', 'HNML', 'KOSV', 'MOML', 'SPML', 'BBML', 'CHML', 'GFML', 'DBML', 'LFML', 'NLML', 'SFML']

const MEAL_CODE_LABELS: Record<string, string> = {
  'VGML': '西式素食',
  'AVML': '印度素食',
  'HNML': '印度非素食',
  'KOSV': '猶太餐',
  'MOML': '伊斯蘭餐',
  'SPML': '特殊餐',
  'BBML': '嬰兒餐',
  'CHML': '兒童餐',
  'GFML': '無麩質餐',
  'DBML': '糖尿病餐',
  'LFML': '低脂餐',
  'NLML': '低鹽餐',
  'SFML': '海鮮餐'
}

const WHEELCHAIR_CODES = ['WCHR', 'WCHS', 'WCHC']

const WHEELCHAIR_CODE_LABELS: Record<string, string> = {
  'WCHR': '輪椅（可上下樓梯）',
  'WCHS': '輪椅（無法上下樓梯）',
  'WCHC': '輪椅（完全無法行動）'
}

const BAGGAGE_CODES = ['CBBG', 'BIKE', 'GOLF', 'SURF', 'SKIS', 'PETC', 'AVIH']

const BOOKING_STATUS_LABELS: Record<string, string> = {
  'HK': '已確認',
  'TK': '已開票',
  'UC': '待確認',
  'UN': '待確認',
  'XX': '已取消',
  'HL': '候補優先',
  'HN': '候補',
  'RR': '已開票確認',
  'SC': '航班取消'
}

// =====================================================
// Helper Functions
// =====================================================

function formatTime(time: string): string {
  if (time.length !== 4) return time
  return `${time.slice(0, 2)}:${time.slice(2)}`
}

function formatDateFull(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return formatDateChinese(date)
  } catch {
    return dateStr
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'HK':
    case 'TK':
    case 'RR':
      return '✅'
    case 'UC':
    case 'UN':
      return '⏳'
    case 'XX':
    case 'SC':
      return '❌'
    case 'HL':
    case 'HN':
    case 'WL':
      return '📋'
    default:
      return '❓'
  }
}

export default {
  parseQueryIntent,
  processQuery,
  recordQuery,
  getQueryHistory
}
