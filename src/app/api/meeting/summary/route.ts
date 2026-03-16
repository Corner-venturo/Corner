import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth/server-auth'
import { ApiError } from '@/lib/api/response'

interface MeetingMessage {
  user: string
  message: string
}

export async function POST(req: NextRequest) {
  // 🔒 安全修復 2026-03-15：需要認證
  const auth = await getServerAuth()
  if (!auth.success) {
    return ApiError.unauthorized('請先登入')
  }
  try {
    const { messages } = await req.json()

    // 整理會議記錄
    const transcript = (messages as MeetingMessage[]).map(m => `${m.user}: ${m.message}`).join('\n')

    // 呼叫 OpenClaw 生成摘要
    const openclawResponse = await fetch('http://localhost:3067/api/sessions/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionKey: 'meeting-summary',
        message: `請根據以下會議記錄生成摘要，格式如下：

📊 會議摘要
時間：${new Date().toLocaleString('zh-TW')}

## 討論主題
[請提取主要討論的主題]

## 決議事項
[列出具體決定的事項]

## 待辦事項
[列出需要執行的任務，並註明負責人]

會議記錄：
${transcript}`,
      }),
    })

    if (!openclawResponse.ok) {
      throw new Error('OpenClaw API 呼叫失敗')
    }

    const data = await openclawResponse.json()

    // TODO: 發送摘要給 William (Telegram)
    // await sendToWilliam(data.reply);

    return NextResponse.json({
      success: true,
      summary: data.reply,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Summary API error:', error)
    return NextResponse.json(
      {
        error: '無法生成會議摘要',
        success: false,
      },
      { status: 500 }
    )
  }
}
