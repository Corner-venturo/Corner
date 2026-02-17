/**
 * POST /api/ai/suggest-attraction
 * 用 Gemini AI 補充景點缺失資料
 *
 * ⚠️ 限定功能：僅角落旅行社 (TP/TC) 可用
 * ⚠️ 每日使用限制：30 次/日
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { checkApiUsage, updateApiUsage, API_LIMITS } from '@/lib/api-usage'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { suggestAttractionSchema } from '@/lib/validations/api-schemas'

// Gemini API 設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

interface SuggestAttractionRequest {
  name: string          // 景點名稱
  city?: string         // 城市名稱
  country?: string      // 國家名稱
  category?: string     // 分類（景點、餐廳、購物等）
  existingData?: {      // 現有資料（避免重複查詢）
    latitude?: number
    longitude?: number
    duration_minutes?: number
    ticket_price?: string
    opening_hours?: string
    description?: string
  }
}

interface SuggestAttractionResponse {
  latitude?: number
  longitude?: number
  duration_minutes?: number
  ticket_price?: string
  opening_hours?: string
  description?: string
  tags?: string[]
  address?: string
  website?: string
  phone?: string
  confidence: number    // AI 信心度 0-1
  source: string        // 資料來源說明
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：確保用戶已登入
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }

    if (!GEMINI_API_KEY) {
      return errorResponse('Gemini API Key 未設定', 500, ErrorCode.INTERNAL_ERROR)
    }

    // 檢查月度使用量限制
    const usageCheck = await checkApiUsage('gemini_suggest')
    if (!usageCheck.canUse) {
      return errorResponse(
        `本月 AI 景點補充次數已用完 (${usageCheck.used}/${usageCheck.limit})`,
        429,
        ErrorCode.QUOTA_EXCEEDED
      )
    }

    const validation = await validateBody(request, suggestAttractionSchema)
    if (!validation.success) return validation.error
    const body = validation.data

    // 構建 prompt
    const location = [body.city, body.country].filter(Boolean).join(', ')
    const categoryHint = body.category ? `（類型：${body.category}）` : ''

    // 檢查哪些欄位需要補充
    const missingFields: string[] = []
    if (!body.existingData?.latitude || !body.existingData?.longitude) {
      missingFields.push('GPS座標（latitude, longitude）')
    }
    if (!body.existingData?.duration_minutes) {
      missingFields.push('建議停留時間（分鐘）')
    }
    if (!body.existingData?.ticket_price) {
      missingFields.push('門票價格')
    }
    if (!body.existingData?.opening_hours) {
      missingFields.push('營業時間')
    }
    if (!body.existingData?.description) {
      missingFields.push('景點介紹（100字內）')
    }

    const prompt = `你是旅遊資料專家。請提供以下景點的詳細資訊：

景點名稱：${body.name}
${location ? `位置：${location}` : ''}
${categoryHint}

需要補充的資料：
${missingFields.map(f => `- ${f}`).join('\n')}

請用 JSON 格式回覆，只回傳 JSON，不要有其他文字：
{
  "latitude": 數字（緯度，例如 18.7876）,
  "longitude": 數字（經度，例如 98.9893）,
  "duration_minutes": 數字（建議停留分鐘數，例如 60）,
  "ticket_price": "字串（例如 '免費' 或 'THB 200'）",
  "opening_hours": "字串（例如 '08:00-17:00' 或 '全天開放'）",
  "description": "字串（景點介紹，100字內，用繁體中文）",
  "tags": ["標籤1", "標籤2"],
  "address": "完整地址",
  "website": "官方網站（如有）",
  "phone": "聯絡電話（如有）",
  "confidence": 數字 0-1（你對這些資料的信心度）
}

注意：
1. 座標請提供精確到小數點後4位
2. 如果不確定某個欄位，可以省略該欄位
3. 門票價格請用當地貨幣
4. 介紹要用繁體中文，簡潔有吸引力`

    // 呼叫 Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,  // 低溫度，更精確
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Gemini API 錯誤:', errorData)
      return errorResponse('AI 服務暫時不可用', 503, ErrorCode.EXTERNAL_API_ERROR)
    }

    const data = await response.json()

    // 解析回應
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textContent) {
      return errorResponse('AI 未回傳有效資料', 500, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 從回應中提取 JSON
    let suggestion: SuggestAttractionResponse
    try {
      // 嘗試直接解析
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('找不到 JSON 格式')
      }
      suggestion = JSON.parse(jsonMatch[0])
      suggestion.source = 'Gemini AI 建議'
    } catch (parseError) {
      logger.error('解析 AI 回應失敗:', textContent)
      return errorResponse('AI 回應格式錯誤', 500, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 驗證座標合理性
    if (suggestion.latitude && (suggestion.latitude < -90 || suggestion.latitude > 90)) {
      delete suggestion.latitude
    }
    if (suggestion.longitude && (suggestion.longitude < -180 || suggestion.longitude > 180)) {
      delete suggestion.longitude
    }

    // 驗證時長合理性
    if (suggestion.duration_minutes && (suggestion.duration_minutes < 10 || suggestion.duration_minutes > 480)) {
      suggestion.duration_minutes = Math.min(Math.max(suggestion.duration_minutes, 10), 480)
    }

    // 更新使用量
    const usage = await updateApiUsage('gemini_suggest')

    return successResponse({
      suggestion,
      missingFields,
      message: `成功取得 ${Object.keys(suggestion).length - 2} 個欄位的建議資料`,
      usage: {
        used: usage.used,
        remaining: usage.remaining,
        limit: API_LIMITS.gemini_suggest,
      },
    })

  } catch (error) {
    logger.error('AI 補充景點資料錯誤:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'AI 補充失敗',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}
