/**
 * Claude Provider
 * Anthropic 的 Claude API
 */

import type { AIProvider, Message, ChatOptions, ChatResponse } from './base'

export interface ClaudeConfig {
  apiKey: string
  model?: string
}

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude'
  private apiKey: string
  private model: string

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'claude-3-haiku-20240307'
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    // 分離 system message
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 2048,
        system: systemMessage?.content,
        messages: chatMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()

    return {
      content: data.content?.[0]?.text || '',
      model: this.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    }
  }

  async healthCheck(): Promise<boolean> {
    // Claude 沒有直接的 health check endpoint
    // 簡單檢查 API key 是否存在
    return !!this.apiKey
  }
}
