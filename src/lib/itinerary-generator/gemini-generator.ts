/**
 * Gemini AI 行程生成器
 * 當資料庫景點不足時，使用 Gemini 即時生成行程內容
 */

import { logger } from '@/lib/utils/logger'
import type {
  GenerateItineraryRequest,
  DailyItineraryDay,
  DailyActivity,
  DailyMeals,
  ItineraryStyle,
  AccommodationPlan,
} from './types'

// Gemini API 設定
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

// 多 API Key 輪替
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[]

// Key 狀態追蹤
const keyStatus: Record<string, { blocked: boolean; blockedUntil: number }> = {}

function getAvailableKey(): string | null {
  const now = Date.now()
  for (const key of GEMINI_API_KEYS) {
    const status = keyStatus[key]
    if (!status || !status.blocked || now > status.blockedUntil) {
      if (status && now > status.blockedUntil) {
        keyStatus[key] = { blocked: false, blockedUntil: 0 }
      }
      return key
    }
  }
  return null
}

function markKeyAsBlocked(key: string, seconds = 60) {
  keyStatus[key] = { blocked: true, blockedUntil: Date.now() + seconds * 1000 }
}

// 風格描述
const STYLE_DESCRIPTIONS: Record<ItineraryStyle, string> = {
  relax: '悠閒放鬆風格，每天安排 2-3 個景點，留有充足的休息和自由時間',
  adventure: '冒險探索風格，每天安排 4-5 個景點，包含戶外活動和特殊體驗',
  culture: '文化深度風格，著重寺廟、神社、博物館、古蹟等文化景點',
  food: '美食探索風格，著重當地特色餐廳、市場、小吃，穿插景點',
}

interface GeminiItineraryRequest {
  destination: string        // 目的地名稱
  countryName?: string       // 國家名稱
  numDays: number
  departureDate: string
  arrivalTime: string        // 抵達時間 HH:mm
  departureTime: string      // 離開時間 HH:mm
  style?: ItineraryStyle
  accommodations?: AccommodationPlan[]
}

interface GeminiGenerateResult {
  success: boolean
  dailyItinerary: DailyItineraryDay[]
  error?: string
}

/**
 * 建構 Gemini prompt
 */
function buildItineraryPrompt(request: GeminiItineraryRequest): string {
  const styleDesc = request.style ? STYLE_DESCRIPTIONS[request.style] : '均衡安排'

  // 處理住宿城市
  let accommodationInfo = ''
  if (request.accommodations && request.accommodations.length > 0) {
    accommodationInfo = '\n住宿安排：\n'
    let dayCounter = 1
    for (const acc of request.accommodations) {
      accommodationInfo += `- 第 ${dayCounter} 天起住 ${acc.cityName} ${acc.nights} 晚\n`
      dayCounter += acc.nights
    }
    accommodationInfo += '\n請根據每天的住宿城市安排該城市的景點。'
  }

  return `你是專業的旅遊行程規劃師。請為以下旅程設計詳細行程：

目的地：${request.destination}${request.countryName ? `，${request.countryName}` : ''}
天數：${request.numDays} 天
出發日期：${request.departureDate}
第一天抵達時間：${request.arrivalTime}
最後一天離開時間：${request.departureTime}
風格：${styleDesc}
${accommodationInfo}

請用 JSON 格式回覆，結構如下：
{
  "dailyItinerary": [
    {
      "dayLabel": "Day 1",
      "date": "MM/DD（星期X）",
      "title": "行程標題（例：抵達 → 第一個景點名稱）",
      "highlight": "當日亮點景點名稱",
      "description": "當日行程概述（50字內）",
      "activities": [
        {
          "icon": "適當的 emoji",
          "title": "景點/活動名稱",
          "description": "景點介紹或活動說明（30-50字）",
          "duration": "建議停留時間，例如 1.5 小時"
        }
      ],
      "meals": {
        "breakfast": "早餐安排（例：飯店內享用）",
        "lunch": "午餐安排（推薦具體餐廳或料理）",
        "dinner": "晚餐安排（推薦具體餐廳或料理）"
      },
      "accommodation": "住宿安排（例：福岡博多精選飯店）",
      "recommendations": ["貼心提醒1", "貼心提醒2"]
    }
  ]
}

重要規則：
1. 第一天考慮抵達時間 ${request.arrivalTime}，安排抵達後的行程
2. 最後一天考慮離開時間 ${request.departureTime}，安排離開前的行程
3. activities 數量根據風格調整：悠閒 2-3 個，冒險 4-5 個
4. 每個 activity 都要有具體的當地景點名稱，不要用「自由活動」
5. 餐食要推薦具體的當地美食或餐廳類型
6. icon 使用合適的 emoji：🏛️景點 🍽️美食 🛍️購物 ⛩️寺廟 🏔️自然 🎭文化
7. 請用繁體中文
8. 只回傳 JSON，不要其他文字`
}

/**
 * 解析 Gemini 回應
 */
function parseGeminiResponse(text: string): DailyItineraryDay[] | null {
  try {
    // 移除可能的 markdown code block
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    // 嘗試找到 JSON 物件
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.error('[Gemini] 找不到 JSON 格式')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.dailyItinerary || !Array.isArray(parsed.dailyItinerary)) {
      logger.error('[Gemini] 缺少 dailyItinerary 陣列')
      return null
    }

    // 轉換格式
    return parsed.dailyItinerary.map((day: Record<string, unknown>) => {
      const activities: DailyActivity[] = Array.isArray(day.activities)
        ? day.activities.map((act: Record<string, unknown>) => ({
            icon: String(act.icon || '📍'),
            title: String(act.title || '景點'),
            description: String(act.description || ''),
            image: undefined,
          }))
        : []

      const meals: DailyMeals = day.meals && typeof day.meals === 'object'
        ? {
            breakfast: String((day.meals as Record<string, unknown>).breakfast || '飯店內享用'),
            lunch: String((day.meals as Record<string, unknown>).lunch || '當地特色餐廳'),
            dinner: String((day.meals as Record<string, unknown>).dinner || '當地特色餐廳'),
          }
        : {
            breakfast: '飯店內享用',
            lunch: '當地特色餐廳',
            dinner: '當地特色餐廳',
          }

      return {
        dayLabel: String(day.dayLabel || `Day ${parsed.dailyItinerary.indexOf(day) + 1}`),
        date: String(day.date || ''),
        title: String(day.title || '探索行程'),
        highlight: String(day.highlight || activities[0]?.title || '精彩行程'),
        description: String(day.description || ''),
        activities,
        meals,
        accommodation: String(day.accommodation || '當地精選飯店'),
        recommendations: Array.isArray(day.recommendations)
          ? day.recommendations.map(String)
          : ['建議穿著舒適的步行鞋'],
        images: [],
      } as DailyItineraryDay
    })
  } catch (error) {
    logger.error('[Gemini] 解析回應失敗:', error)
    return null
  }
}

/**
 * 使用 Gemini 生成行程
 */
export async function generateItineraryWithGemini(
  request: GeminiItineraryRequest
): Promise<GeminiGenerateResult> {
  if (GEMINI_API_KEYS.length === 0) {
    return {
      success: false,
      dailyItinerary: [],
      error: 'Gemini API Key 未設定',
    }
  }

  const prompt = buildItineraryPrompt(request)
  let lastError = ''
  let triedKeys = 0

  while (triedKeys < GEMINI_API_KEYS.length) {
    const apiKey = getAvailableKey()
    if (!apiKey) {
      return {
        success: false,
        dailyItinerary: [],
        error: '所有 API 配額已用完，請稍後再試',
      }
    }

    triedKeys++
    logger.log(`[Gemini Itinerary] 嘗試 key ${apiKey.slice(-6)}... (${triedKeys}/${GEMINI_API_KEYS.length})`)

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 4096,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = (errorData as { error?: { message?: string } }).error?.message || 'Unknown error'

        // 配額錯誤，換下一個 key
        if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          markKeyAsBlocked(apiKey, 60)
          lastError = errorMessage
          continue
        }

        return {
          success: false,
          dailyItinerary: [],
          error: `Gemini API 錯誤: ${errorMessage}`,
        }
      }

      const data = await response.json()
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textContent) {
        return {
          success: false,
          dailyItinerary: [],
          error: 'Gemini 未回傳有效內容',
        }
      }

      const dailyItinerary = parseGeminiResponse(textContent)
      if (!dailyItinerary) {
        return {
          success: false,
          dailyItinerary: [],
          error: 'Gemini 回應格式解析失敗',
        }
      }

      logger.log(`[Gemini Itinerary] 成功生成 ${dailyItinerary.length} 天行程`)

      return {
        success: true,
        dailyItinerary,
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed'
      logger.error('[Gemini Itinerary] 請求失敗:', error)
    }
  }

  return {
    success: false,
    dailyItinerary: [],
    error: lastError || '所有 API Key 都失敗了',
  }
}

/**
 * 從 GenerateItineraryRequest 轉換為 GeminiItineraryRequest
 */
export function convertToGeminiRequest(
  request: GenerateItineraryRequest,
  destinationName: string,
  countryName?: string
): GeminiItineraryRequest {
  return {
    destination: destinationName,
    countryName,
    numDays: request.numDays,
    departureDate: request.departureDate,
    arrivalTime: request.outboundFlight?.arrivalTime || '11:00',
    departureTime: request.returnFlight?.departureTime || '14:00',
    style: request.style,
    accommodations: request.accommodations,
  }
}
