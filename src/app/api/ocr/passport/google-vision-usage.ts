/**
 * Google Vision API 使用量追蹤
 * 支援多 Key 輪換和月額度限制
 */

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// Google Vision 每月免費額度限制（每個 Key 980 次）
const GOOGLE_VISION_LIMIT_PER_KEY = 980

/**
 * 取得 Google Vision API Keys（支援多 Key 輪換）
 */
export function getGoogleVisionKeys(): string[] {
  const multiKeys = process.env.GOOGLE_VISION_API_KEYS
  if (multiKeys) {
    return multiKeys.split(',').map(k => k.trim()).filter(Boolean)
  }
  const singleKey = process.env.GOOGLE_VISION_API_KEY
  if (singleKey) {
    return [singleKey]
  }
  return []
}

interface GoogleVisionUsageResult {
  canUseGoogleVision: boolean
  availableKey: string | null
  currentUsage: number
  totalLimit: number
  warning: string | null
}

/**
 * 檢查 Google Vision API 使用量（支援多 Key 輪換）
 */
export async function checkGoogleVisionUsage(
  requestCount: number,
  apiKeys: string[]
): Promise<GoogleVisionUsageResult> {
  if (apiKeys.length === 0) {
    return {
      canUseGoogleVision: false,
      availableKey: null,
      currentUsage: 0,
      totalLimit: 0,
      warning: '⚠️ Google Vision API Key 未設定，中文名辨識已停用。',
    }
  }

  try {
    const supabase = getSupabaseAdminClient()
    const currentMonth = new Date().toISOString().slice(0, 7)
    const totalLimit = GOOGLE_VISION_LIMIT_PER_KEY * apiKeys.length

    const { data: usageData } = await supabase
      .from('api_usage')
      .select('api_name, usage_count')
      .like('api_name', 'google_vision_%')
      .eq('month', currentMonth)

    const usageByKey: Record<string, number> = {}
    let totalUsage = 0

    for (let i = 0; i < apiKeys.length; i++) {
      const keyId = `google_vision_${i}`
      const usage = usageData?.find(d => d.api_name === keyId)?.usage_count || 0
      usageByKey[keyId] = usage
      totalUsage += usage
    }

    let availableKey: string | null = null

    for (let i = 0; i < apiKeys.length; i++) {
      const keyId = `google_vision_${i}`
      const usage = usageByKey[keyId] || 0
      if (usage + requestCount <= GOOGLE_VISION_LIMIT_PER_KEY) {
        availableKey = apiKeys[i]
        break
      }
    }

    if (!availableKey) {
      return {
        canUseGoogleVision: false,
        availableKey: null,
        currentUsage: totalUsage,
        totalLimit,
        warning: `⚠️ Google Vision API 本月所有 Key 額度都已用完 (${totalUsage}/${totalLimit})，中文名辨識已停用。護照其他資訊仍可正常辨識。`,
      }
    }

    const usagePercent = (totalUsage / totalLimit) * 100
    let warning: string | null = null

    if (usagePercent >= 95) {
      warning = `🔴 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${totalUsage}/${totalLimit})，即將達到上限！`
    } else if (usagePercent >= 80) {
      warning = `🟡 Google Vision API 使用量已達 ${usagePercent.toFixed(0)}% (${totalUsage}/${totalLimit})`
    }

    return { canUseGoogleVision: true, availableKey, currentUsage: totalUsage, totalLimit, warning }
  } catch (error) {
    logger.error('檢查 API 使用量失敗:', error)
    return {
      canUseGoogleVision: true,
      availableKey: apiKeys[0],
      currentUsage: 0,
      totalLimit: GOOGLE_VISION_LIMIT_PER_KEY * apiKeys.length,
      warning: null,
    }
  }
}

/**
 * 更新 Google Vision API 使用量（支援多 Key 追蹤）
 */
export async function updateGoogleVisionUsage(count: number, usedKey: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient()
    const currentMonth = new Date().toISOString().slice(0, 7)
    const apiKeys = getGoogleVisionKeys()

    const keyIndex = apiKeys.findIndex(k => k === usedKey)
    const keyId = keyIndex >= 0 ? `google_vision_${keyIndex}` : 'google_vision_0'

    const { data: existing } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', keyId)
      .eq('month', currentMonth)
      .single()

    const newCount = (existing?.usage_count || 0) + count

    const { error } = await supabase
      .from('api_usage')
      .upsert(
        {
          api_name: keyId,
          month: currentMonth,
          usage_count: newCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'api_name,month' }
      )

    if (error) {
      logger.error('upsert 失敗:', error)
    }
  } catch (error) {
    logger.error('更新 API 使用量失敗:', error)
  }
}
