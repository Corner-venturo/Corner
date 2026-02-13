import { NextRequest } from 'next/server'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { callOcrSpace, callGoogleVision } from './ocr-clients'
import { getGoogleVisionKeys, checkGoogleVisionUsage, updateGoogleVisionUsage } from './google-vision-usage'
import { parsePassportText } from './passport-parser'

/**
 * 護照 OCR 辨識 API
 * 雙 API 策略：
 * 1. OCR.space - 專門辨識 MRZ（護照號碼、效期、生日等）
 * 2. Google Vision - 辨識中文名字（每月限制 980 次）
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：驗證用戶身份（護照資料敏感）
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入', 401, ErrorCode.UNAUTHORIZED)
    }

    const contentType = request.headers.get('content-type') || ''

    let base64Images: { name: string; data: string }[] = []

    // 判斷是 JSON 還是 FormData
    if (contentType.includes('application/json')) {
      const json = await request.json()
      if (json.image) {
        base64Images = [{ name: 'passport.jpg', data: json.image }]
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]

      if (files && files.length > 0) {
        for (const file of files) {
          const buffer = await file.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const base64Image = `data:${file.type};base64,${base64}`
          base64Images.push({ name: file.name, data: base64Image })
        }
      }
    } else {
      return errorResponse('不支援的 Content-Type', 400, ErrorCode.INVALID_FORMAT)
    }

    if (base64Images.length === 0) {
      return errorResponse('沒有上傳檔案', 400, ErrorCode.MISSING_FIELD)
    }

    const ocrSpaceKey = process.env.OCR_SPACE_API_KEY
    const googleVisionKeys = getGoogleVisionKeys()

    // 至少需要一個 API Key
    if (!ocrSpaceKey && googleVisionKeys.length === 0) {
      return errorResponse(
        'OCR API Key 未設定。請設定 OCR_SPACE_API_KEY 或 GOOGLE_VISION_API_KEYS 環境變數。',
        500,
        ErrorCode.INTERNAL_ERROR
      )
    }

    // 檢查 Google Vision 使用量並取得可用的 Key
    const { canUseGoogleVision, availableKey, currentUsage, totalLimit, warning } = await checkGoogleVisionUsage(
      base64Images.length,
      googleVisionKeys
    )

    // 批次辨識所有護照
    const results = await Promise.all(
      base64Images.map(async (img) => {
        try {
          const [ocrSpaceResult, googleVisionResult] = await Promise.all([
            ocrSpaceKey ? callOcrSpace(img.data, ocrSpaceKey) : Promise.resolve(''),
            (availableKey && canUseGoogleVision) ? callGoogleVision(img.data, availableKey) : Promise.resolve(null),
          ])

          const customerData = parsePassportText(ocrSpaceResult, googleVisionResult, img.name)

          return {
            success: true,
            fileName: img.name,
            customer: customerData,
            rawText: ocrSpaceResult,
            imageBase64: img.data,
          }
        } catch (error) {
          logger.error(`辨識失敗 (${img.name}):`, error)
          return {
            success: false,
            fileName: img.name,
            error: error instanceof Error ? error.message : '未知錯誤',
          }
        }
      })
    )

    // 更新使用量
    if (canUseGoogleVision && availableKey) {
      await updateGoogleVisionUsage(base64Images.length, availableKey)
    }

    return successResponse({
      results,
      total: base64Images.length,
      successful: results.filter(r => r.success).length,
      usageWarning: warning,
      googleVisionUsage: {
        current: currentUsage + (canUseGoogleVision ? base64Images.length : 0),
        limit: totalLimit,
        enabled: canUseGoogleVision,
        keysAvailable: googleVisionKeys.length,
      },
    })
  } catch (error) {
    logger.error('護照辨識錯誤:', error)
    return errorResponse(
      error instanceof Error ? error.message : '處理失敗',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}
