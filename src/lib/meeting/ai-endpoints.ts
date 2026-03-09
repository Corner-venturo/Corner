// AI Endpoints 設定
// 透過 OpenClaw Gateway WebSocket 呼叫 AI

import WebSocket from 'ws'

export interface AIEndpoint {
  id: string
  name: string
  emoji: string
  triggers: string[]
  agentId: string
}

export const AI_ENDPOINTS: AIEndpoint[] = [
  {
    id: 'yuzuki',
    name: '悠月',
    emoji: '🌙',
    triggers: ['@悠月', '@yuzuki', '查詢', '幫我', '建議'],
    agentId: 'william',
  },
]

/**
 * 判斷訊息應該觸發哪些 AI
 */
export function getTriggeredAIs(message: string): AIEndpoint[] {
  return AI_ENDPOINTS.filter(ai => ai.triggers.some(trigger => message.includes(trigger)))
}

/**
 * 透過 OpenClaw Gateway WebSocket 呼叫 AI
 */
export async function callAI(endpoint: AIEndpoint, message: string): Promise<string> {
  const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789'
  const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || ''

  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      resolve(`⚠️ ${endpoint.name} 回應逾時`)
    }, 30000)

    try {
      const wsUrl = GATEWAY_TOKEN ? `${GATEWAY_URL}?token=${GATEWAY_TOKEN}` : GATEWAY_URL

      const ws = new WebSocket(wsUrl)
      let replied = false

      ws.on('open', () => {
        // Send hello
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'hello',
            id: 1,
            params: {
              clientId: `meeting-${Date.now()}`,
              mode: 'api',
            },
          })
        )
      })

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString())

          // After hello response, send the message
          if (msg.id === 1 && msg.result) {
            ws.send(
              JSON.stringify({
                jsonrpc: '2.0',
                method: 'sessions.turn',
                id: 2,
                params: {
                  agentId: endpoint.agentId,
                  sessionKey: `meeting-${Date.now()}`,
                  message: `[會議室訊息] ${message}`,
                },
              })
            )
          }

          // Collect the response
          if (msg.id === 2 && msg.result && !replied) {
            replied = true
            clearTimeout(timeout)
            const reply = msg.result.reply || msg.result.text || msg.result.message || ''
            ws.close()
            resolve(reply || `${endpoint.emoji} ${endpoint.name} 收到了`)
          }

          // Handle streaming - collect text
          if (msg.method === 'sessions.stream' && msg.params?.text && !replied) {
            // For streaming, we wait for the final result
          }

          // Handle errors
          if (msg.error) {
            replied = true
            clearTimeout(timeout)
            ws.close()
            resolve(`⚠️ ${endpoint.name}: ${msg.error.message || '未知錯誤'}`)
          }
        } catch {
          // ignore parse errors
        }
      })

      ws.on('error', () => {
        if (!replied) {
          replied = true
          clearTimeout(timeout)
          resolve(`⚠️ 無法連接 ${endpoint.name}（Gateway 離線？）`)
        }
      })

      ws.on('close', () => {
        if (!replied) {
          replied = true
          clearTimeout(timeout)
          resolve(`⚠️ ${endpoint.name} 連線中斷`)
        }
      })
    } catch {
      clearTimeout(timeout)
      resolve(`⚠️ 無法連接 ${endpoint.name}`)
    }
  })
}

/**
 * 同時呼叫多個 AI
 */
export async function callMultipleAIs(
  endpoints: AIEndpoint[],
  message: string
): Promise<Record<string, string>> {
  const promises = endpoints.map(async endpoint => ({
    id: endpoint.id,
    response: await callAI(endpoint, message),
  }))

  const results = await Promise.all(promises)

  return results.reduce(
    (acc, { id, response }) => {
      acc[id] = response
      return acc
    },
    {} as Record<string, string>
  )
}
