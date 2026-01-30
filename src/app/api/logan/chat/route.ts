/**
 * Logan Chat API
 * POST /api/logan/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { chatWithLogan, teachLogan, isLoganAvailable, type MemoryCategory } from '@/lib/logan'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  // 全局 AI 開關
  if (process.env.NEXT_PUBLIC_DISABLE_AI === 'true') {
    return NextResponse.json(
      { success: false, error: 'AI 功能已停用' },
      { status: 503 }
    )
  }

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
  // 全局 AI 開關 - 設定 NEXT_PUBLIC_DISABLE_AI=true 可完全禁用 AI
  if (process.env.NEXT_PUBLIC_DISABLE_AI === 'true') {
    return NextResponse.json({
      success: true,
      available: false,
      disabled: true,
      model: null,
    })
  }

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
