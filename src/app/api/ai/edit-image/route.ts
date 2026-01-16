/**
 * POST /api/ai/edit-image
 * 用 Gemini AI 編輯圖片（去背、去人物、美化等）
 *
 * ⚠️ 限定功能：僅角落旅行社 (TP/TC) 可用
 * ⚠️ 每日使用限制：20 次/日
 */

import { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { checkApiUsage, updateApiUsage, API_LIMITS } from '@/lib/api-usage'
import { getServerAuth } from '@/lib/auth/server-auth'

// Gemini API 設定（複用多 Key 機制）
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[]

// 記錄每個 key 的狀態
const keyStatus: Record<string, { blocked: boolean; blockedUntil: number }> = {}

// 取得可用的 API Key
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

// 標記 Key 為暫時不可用
function markKeyAsBlocked(key: string, retryAfterSeconds: number = 60) {
  keyStatus[key] = {
    blocked: true,
    blockedUntil: Date.now() + retryAfterSeconds * 1000,
  }
  logger.log(`[Gemini Edit] Key ${key.slice(-6)} blocked for ${retryAfterSeconds}s`)
}

// 預設編輯動作及其 prompt
type EditAction =
  | 'clean_scene' // 淨空場景（去人物+清理雜物）
  | 'landscape_pro' // 專業風景攝影
  | 'travel_magazine' // 旅遊雜誌風格
  | 'food_delicious' // 美食攝影
  | 'architecture_dramatic' // 建築攝影
  | 'golden_hour' // 黃金時刻
  | 'blue_hour' // 藍調時刻
  | 'season_spring' // 春季
  | 'season_summer' // 夏季
  | 'season_autumn' // 秋季
  | 'season_winter' // 冬季

const ACTION_PROMPTS: Record<EditAction, string> = {
  clean_scene: `Clean up this scene completely:
- Remove all people, tourists, pedestrians, and crowds from the image
- Remove all distracting elements: trash, litter, signs, wires, cables, construction equipment, parked cars, bicycles, and any visual clutter
- Preserve the main subject, architecture, and natural scenery
- Fill all removed areas seamlessly using context-aware content fill
- Maintain natural lighting and shadows
- Result should be a pristine, empty scene as if photographed at dawn with no visitors
- Keep the atmosphere and mood of the original image`,

  landscape_pro: `Transform this into a professional landscape photograph with these specifications:
- Apply the "Rule of Thirds" composition adjustment
- Simulate 24-70mm f/2.8 lens characteristics with slight wide-angle perspective
- Enhance dynamic range like a graduated ND filter effect
- Add depth by increasing clarity in foreground and subtle atmospheric haze in background
- Color grading: Slightly desaturated greens, enhanced golden tones, deep rich shadows
- Increase micro-contrast for texture detail
- Simulate golden hour lighting warmth
- Add subtle vignette to draw eye to center
- Overall: National Geographic quality landscape photography`,

  travel_magazine: `Transform this into a luxury travel magazine cover photograph:
- Professional color grading with rich, vibrant but not oversaturated colors
- Simulate 35mm f/1.4 lens bokeh for dreamy background blur where appropriate
- Apply cinematic aspect ratio feel with subtle letterbox shading
- Enhance skin tones if people present (warm, healthy glow)
- Add subtle lens flare for sun-kissed feel
- Increase contrast and clarity for punchy, editorial look
- Color palette: Warm highlights, teal shadows (teal-orange color grading)
- Add subtle film grain for organic texture
- Overall: Condé Nast Traveler magazine quality`,

  food_delicious: `Transform this into a professional food photography shot:
- Simulate 85mm f/1.8 macro lens with shallow depth of field
- Apply dramatic top-down or 45-degree food photography lighting
- Enhance colors: Make reds more vibrant, greens fresher, browns richer
- Add appetizing warmth and slight golden highlights
- Increase texture detail on food surfaces
- Add subtle steam or freshness effects where appropriate
- Reduce harsh shadows, add soft fill light effect
- Color grading: Warm, inviting, restaurant menu quality
- Overall: Michelin-starred restaurant promotional quality`,

  architecture_dramatic: `Transform this into dramatic architectural photography:
- Apply perspective correction for straight vertical lines
- Simulate 16-35mm f/4 wide-angle lens characteristics
- Add dramatic sky enhancement (deeper blues, defined clouds)
- Increase structural contrast and building details
- Apply strong directional lighting effect from golden hour sun
- Color grading: Deep blues, warm accent highlights on building surfaces
- Add subtle HDR effect for shadow/highlight recovery
- Enhance building materials texture (stone, glass, metal reflections)
- Overall: Architectural Digest professional photography quality`,

  golden_hour: `Transform this image to golden hour (sunset) lighting conditions:
- Apply warm golden sunlight from low angle (15-30 degrees)
- Add long, dramatic shadows
- Color temperature: 3200K warm golden tones
- Sky gradient: Deep orange to purple to dark blue
- Add subtle lens flare from sun position
- Enhance golden highlights on all surfaces
- Deepen shadows with warm undertones
- Add atmospheric haze for depth
- Color grading: Orange highlights, magenta midtones, teal shadows
- Overall: Professional "magic hour" photography look`,

  blue_hour: `Transform this image to blue hour (twilight) lighting conditions:
- Apply cool blue ambient light with warm artificial lights
- Sky: Deep cobalt blue gradient to purple horizon
- Add city/building lights with warm glow
- Color temperature: Cool 7000K blue ambient, warm 2700K accent lights
- Enhance reflections on wet surfaces or water
- Add subtle mist/fog for atmospheric depth
- Increase contrast for dramatic night photography feel
- Color grading: Deep blues, warm orange accent lights
- Overall: Professional twilight cityscape photography look`,

  season_spring: `Transform this scene to spring season:
- Add cherry blossoms (sakura) or other spring flowers blooming on trees
- Change foliage to fresh, bright green with new leaves
- Add soft, diffused spring sunlight
- Include flower petals gently falling or scattered on ground
- Sky: Soft blue with light, fluffy white clouds
- Add fresh grass and spring wildflowers where appropriate
- Color palette: Soft pinks, fresh greens, light blues
- Atmosphere: Fresh, renewal, gentle warmth
- Overall: Beautiful spring scenery like Japanese hanami season`,

  season_summer: `Transform this scene to summer season:
- Lush, deep green foliage at full bloom
- Bright, intense sunlight with clear blue sky
- Add vibrant summer flowers (sunflowers, hydrangeas) where appropriate
- Strong shadows from high sun position
- Possible heat shimmer effect in distance
- Color palette: Deep greens, bright blues, golden sunlight
- Add summer elements: clear water reflections, beach vibes if coastal
- Atmosphere: Vibrant, energetic, hot summer day
- Overall: Peak summer vacation photography feel`,

  season_autumn: `Transform this scene to autumn/fall season:
- Change all foliage to autumn colors: red, orange, yellow, golden brown
- Add fallen leaves on ground and paths
- Warm, low-angle golden sunlight (autumn sun position)
- Slight mist or fog for atmospheric depth
- Sky: Deep blue with dramatic clouds
- Color palette: Rich reds, burnt oranges, golden yellows, warm browns
- Add autumn elements: pumpkins, harvest decorations if appropriate
- Atmosphere: Warm, nostalgic, cozy fall feeling
- Overall: Beautiful koyo (autumn leaves) or New England fall foliage quality`,

  season_winter: `Transform this scene to winter season:
- Add snow coverage on roofs, ground, trees, and surfaces
- Bare trees with snow on branches (or evergreens with snow)
- Overcast winter sky or crisp clear winter blue
- Frost and ice effects on windows and surfaces
- Cold, blue-tinted ambient light
- Add visible breath/mist effect if people present
- Color palette: White snow, cool blues, warm window lights
- Possible snowfall or snow flurries in the air
- Atmosphere: Quiet, peaceful, magical winter wonderland
- Overall: Beautiful winter postcard or Christmas card quality`,
}

const ACTION_LABELS: Record<EditAction, string> = {
  clean_scene: '淨空場景',
  landscape_pro: '風景大師',
  travel_magazine: '旅遊雜誌',
  food_delicious: '美食攝影',
  architecture_dramatic: '建築攝影',
  golden_hour: '黃金時刻',
  blue_hour: '藍調時刻',
  season_spring: '春季櫻花',
  season_summer: '盛夏風情',
  season_autumn: '秋楓紅葉',
  season_winter: '冬季雪景',
}

interface EditImageRequest {
  imageUrl: string // 要編輯的圖片 URL
  action: EditAction // 預設動作
  customPrompt?: string // 自訂 prompt（進階用戶）
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：確保用戶已登入
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }

    if (GEMINI_API_KEYS.length === 0) {
      return errorResponse('Gemini API Key 未設定', 500, ErrorCode.INTERNAL_ERROR)
    }

    // 檢查月度使用量限制
    const usageCheck = await checkApiUsage('gemini_image_edit')
    if (!usageCheck.canUse) {
      return errorResponse(
        `本月 AI 圖片編輯次數已用完 (${usageCheck.used}/${usageCheck.limit})`,
        429,
        ErrorCode.QUOTA_EXCEEDED
      )
    }

    const body: EditImageRequest = await request.json()

    if (!body.imageUrl) {
      return errorResponse('請提供圖片 URL', 400, ErrorCode.MISSING_FIELD)
    }

    if (!body.action && !body.customPrompt) {
      return errorResponse('請選擇編輯動作', 400, ErrorCode.MISSING_FIELD)
    }

    // 取得編輯 prompt
    const editPrompt = body.customPrompt || ACTION_PROMPTS[body.action]
    if (!editPrompt) {
      return errorResponse('無效的編輯動作', 400, ErrorCode.INVALID_FORMAT)
    }

    // 下載圖片並轉為 base64
    let imageBase64: string
    let mimeType: string

    try {
      const imageResponse = await fetch(body.imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`無法下載圖片: ${imageResponse.status}`)
      }

      const arrayBuffer = await imageResponse.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      imageBase64 = buffer.toString('base64')

      // 偵測 MIME type
      const contentType = imageResponse.headers.get('content-type')
      mimeType = contentType?.split(';')[0] || 'image/jpeg'
    } catch (fetchError) {
      logger.error('下載圖片失敗:', fetchError)
      return errorResponse('無法下載圖片', 400, ErrorCode.EXTERNAL_API_ERROR)
    }

    // 嘗試所有可用的 API Key
    let lastError = ''
    let triedKeys = 0

    while (triedKeys < GEMINI_API_KEYS.length) {
      const apiKey = getAvailableKey()

      if (!apiKey) {
        return errorResponse('所有 API 配額已用完，請稍後再試', 429, ErrorCode.QUOTA_EXCEEDED)
      }

      triedKeys++
      logger.log(
        `[Gemini Edit] Trying key ${apiKey.slice(-6)}... (attempt ${triedKeys}/${GEMINI_API_KEYS.length})`
      )

      const result = await tryEditImage(apiKey, imageBase64, mimeType, editPrompt)

      if (result.success && result.image) {
        // 更新使用量
        const usage = await updateApiUsage('gemini_image_edit')

        return successResponse({
          image: result.image,
          action: body.action,
          actionLabel: body.action ? ACTION_LABELS[body.action] : '自訂編輯',
          keyUsed: apiKey.slice(-6),
          usage: {
            used: usage.used,
            remaining: usage.remaining,
            limit: API_LIMITS.gemini_image_edit,
          },
        })
      }

      // 如果是配額錯誤，標記這個 key 並嘗試下一個
      if (result.isQuotaError) {
        markKeyAsBlocked(apiKey, result.retryAfter || 60)
        lastError = result.error || 'Quota exceeded'
        continue
      }

      // 其他錯誤直接回傳
      lastError = result.error || 'Unknown error'
    }

    return errorResponse(lastError || '圖片編輯失敗', 500, ErrorCode.EXTERNAL_API_ERROR)
  } catch (error) {
    logger.error('編輯圖片錯誤:', error)
    return errorResponse(
      error instanceof Error ? error.message : '編輯失敗',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}

// 使用指定的 key 嘗試編輯圖片
async function tryEditImage(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  editPrompt: string
): Promise<{
  success: boolean
  image?: string
  error?: string
  isQuotaError?: boolean
  retryAfter?: number
}> {
  try {
    // 使用 Gemini 2.0 Flash 進行圖片編輯
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: `Edit this image according to these instructions: ${editPrompt}. Generate an edited version of the image.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || 'Unknown error'

      // 檢查是否為配額錯誤
      if (
        response.status === 429 ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        const retryMatch = errorMessage.match(/retry in (\d+)/i)
        const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 60

        return {
          success: false,
          error: errorMessage,
          isQuotaError: true,
          retryAfter,
        }
      }

      return { success: false, error: errorMessage }
    }

    const data = await response.json()

    // 解析回應中的圖片
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            success: true,
            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          }
        }
      }
    }

    // 如果沒有返回圖片，可能是模型不支援這種編輯
    return {
      success: false,
      error: '無法完成此編輯操作，請嘗試其他動作',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

// GET 方法：返回可用的編輯動作列表
export async function GET() {
  const actions = Object.entries(ACTION_LABELS).map(([action, label]) => ({
    action,
    label,
    description: ACTION_PROMPTS[action as EditAction],
  }))

  return successResponse({ actions })
}
