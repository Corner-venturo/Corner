import { NextRequest } from 'next/server'
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { logErrorSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 認證：防止未登入者濫用日誌 API
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse(auth.error.error, 401, ErrorCode.UNAUTHORIZED)
    }

    const validation = await validateBody(request, logErrorSchema)
    if (!validation.success) return validation.error
    const errorData = validation.data

    // 創建 logs 目錄（如果不存在）
    const logsDir = join(process.cwd(), 'logs')
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true })
    }

    // 寫入錯誤日誌
    const logFile = join(logsDir, 'errors.json')
    const logEntry =
      JSON.stringify({
        ...errorData,
        userAgent: request.headers.get('user-agent'),
        url: request.headers.get('referer'),
      }) + '\n'

    if (existsSync(logFile)) {
      appendFileSync(logFile, logEntry)
    } else {
      writeFileSync(logFile, logEntry)
    }

    return successResponse(null)
  } catch (error) {
    logger.error('Failed to log error:', error)
    return errorResponse('Failed to log error', 500, ErrorCode.INTERNAL_ERROR)
  }
}
