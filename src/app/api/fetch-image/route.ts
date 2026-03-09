import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { fetchImageSchema } from '@/lib/validations/api-schemas'

/**
 * 後端 API 代理下載圖片
 * 用於繞過瀏覽器的 CORS 限制
 *
 * 注意：此 API 成功時直接回傳圖片 binary，錯誤時使用統一格式
 */
export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：防止未登入者使用此代理進行 SSRF 攻擊
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }

    const validation = await validateBody(request, fetchImageSchema)
    if (!validation.success) return validation.error
    const { url } = validation.data

    // 下載圖片
    const response = await fetch(url, {
      headers: {
        // 模擬瀏覽器請求
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return errorResponse('無法下載圖片', 502, ErrorCode.EXTERNAL_API_ERROR)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 確認是圖片類型
    if (!contentType.startsWith('image/')) {
      return errorResponse('URL 不是圖片', 400, ErrorCode.INVALID_FORMAT)
    }

    const imageBuffer = await response.arrayBuffer()

    // 回傳圖片資料（這是特殊情況，成功時直接回傳 binary）
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    logger.error('Fetch image error:', error)
    return errorResponse('下載圖片失敗', 500, ErrorCode.INTERNAL_ERROR)
  }
}
