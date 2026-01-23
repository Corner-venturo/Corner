/**
 * Logan Chat API
 * POST /api/logan/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { chatWithLogan, teachLogan, isLoganAvailable, type MemoryCategory } from '@/lib/logan'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // 驗證身份
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error.error },
        { status: 401 }
      )
    }

    const { workspaceId, employeeId } = auth.data
    const body = await request.json()
    const { message, action = 'chat' } = body

    // 根據 action 處理
    switch (action) {
      case 'chat': {
        if (!message || typeof message !== 'string') {
          return NextResponse.json(
            { success: false, error: '請提供訊息內容' },
            { status: 400 }
          )
        }

        const result = await chatWithLogan(workspaceId, employeeId, message)
        return NextResponse.json(result)
      }

      case 'teach': {
        const { title, content, category, tags, importance } = body
        if (!title || !content) {
          return NextResponse.json(
            { success: false, error: '請提供標題和內容' },
            { status: 400 }
          )
        }

        const result = await teachLogan(workspaceId, employeeId, {
          title,
          content,
          category: category as MemoryCategory,
          tags,
          importance,
        })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json(
          { success: false, error: '未知的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Logan API error:', error)
    return NextResponse.json(
      { success: false, error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const available = await isLoganAvailable()
    return NextResponse.json({
      success: true,
      available,
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      available: false,
      error: '無法檢查 Logan 狀態',
    })
  }
}
