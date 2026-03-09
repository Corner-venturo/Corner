import { NextRequest, NextResponse } from 'next/server'
import { getTriggeredAIs, callAI, AI_ENDPOINTS } from '@/lib/meeting/ai-endpoints'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    // 判斷哪些 AI 應該回應
    let triggeredAIs = getTriggeredAIs(message)

    // 如果沒有特定觸發，預設由 Yuzuki 回應
    if (triggeredAIs.length === 0) {
      const yuzuki = AI_ENDPOINTS.find(ai => ai.id === 'yuzuki')
      if (yuzuki) {
        triggeredAIs = [yuzuki]
      }
    }

    if (triggeredAIs.length === 0) {
      return NextResponse.json({ needsAI: false })
    }

    // 呼叫所有被觸發的 AI
    const responses = await Promise.all(
      triggeredAIs.map(async ai => {
        try {
          const reply = await callAI(ai, message)
          return {
            aiId: ai.id,
            aiName: ai.name,
            aiEmoji: ai.emoji,
            message: reply,
          }
        } catch {
          return {
            aiId: ai.id,
            aiName: ai.name,
            aiEmoji: ai.emoji,
            message: `⚠️ ${ai.name} 暫時無法回應`,
          }
        }
      })
    )

    return NextResponse.json({
      needsAI: true,
      responses,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Meeting API error:', error)

    return NextResponse.json(
      {
        error: '會議室系統錯誤',
        needsAI: false,
      },
      { status: 500 }
    )
  }
}
