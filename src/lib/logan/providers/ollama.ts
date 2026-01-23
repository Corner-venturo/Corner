/**
 * Ollama Provider
 * 本地運行的開源模型
 */

import type { AIProvider, Message, ChatOptions, ChatResponse } from './base'

export interface OllamaConfig {
  baseUrl: string
  model: string
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama'
  private baseUrl: string
  private model: string

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434'
    this.model = config.model || 'qwen2.5:7b'
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${error}`)
    }

    const data = await response.json()

    return {
      content: data.message?.content || '',
      model: this.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 列出可用的模型
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`)
    if (!response.ok) {
      throw new Error('Failed to list models')
    }
    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  }
}
