/**
 * AI Providers 匯出
 */

export * from './base'
export { OllamaProvider } from './ollama'
export { ClaudeProvider } from './claude'
export { OpenAIProvider } from './openai'

import type { AIProvider, AIProviderConfig } from './base'
import { OllamaProvider } from './ollama'
import { ClaudeProvider } from './claude'
import { OpenAIProvider } from './openai'

/**
 * 建立 AI Provider
 */
export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.baseUrl || 'http://localhost:11434',
        model: config.model,
      })

    case 'claude':
      if (!config.apiKey) {
        throw new Error('Claude API key is required')
      }
      return new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model,
      })

    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required')
      }
      return new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      })

    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}
