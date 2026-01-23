/**
 * AI Provider 基礎介面
 * 讓羅根可以使用不同的 AI 模型（Ollama、Claude、OpenAI）
 */

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * AI Provider 抽象介面
 * 所有 AI 提供者都需要實作這個介面
 */
export interface AIProvider {
  /**
   * Provider 名稱
   */
  readonly name: string

  /**
   * 發送聊天請求
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>

  /**
   * 檢查連線狀態
   */
  healthCheck(): Promise<boolean>
}

/**
 * AI Provider 工廠
 */
export type AIProviderFactory = (config: AIProviderConfig) => AIProvider

export interface AIProviderConfig {
  provider: 'ollama' | 'claude' | 'openai'
  model: string
  baseUrl?: string
  apiKey?: string
  temperature?: number
}
