/**
 * OpenAI Provider
 * OpenAI 的 GPT API
 */

import type { AIProvider, Message, ChatOptions, ChatResponse } from './base'

export interface OpenAIConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4o-mini'
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: this.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
