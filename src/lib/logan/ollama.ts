/**
 * Ollama 連接器
 * 用於與本地 Ollama 服務通訊
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
}

export interface OllamaStreamChunk {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

/**
 * 檢查 Ollama 是否運行中
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 取得可用的模型列表
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (!response.ok) return []

    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  } catch {
    return []
  }
}

/**
 * 發送對話請求到 Ollama（非串流）
 */
export async function chat(
  messages: OllamaMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`)
  }

  const data: OllamaResponse = await response.json()
  return data.message.content
}

/**
 * 發送對話請求到 Ollama（串流）
 */
export async function* chatStream(
  messages: OllamaMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): AsyncGenerator<string, void, unknown> {
  const model = options?.model || DEFAULT_MODEL

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 2048,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const data: OllamaStreamChunk = JSON.parse(line)
        if (data.message?.content) {
          yield data.message.content
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }
}

/**
 * 簡單的單輪對話
 */
export async function ask(
  question: string,
  systemPrompt?: string
): Promise<string> {
  const messages: OllamaMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: question })

  return chat(messages)
}
