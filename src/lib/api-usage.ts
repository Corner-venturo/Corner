import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * API 用量追蹤工具
 * 統一管理各種 API 的使用量追蹤
 */

export interface ApiUsageCheckResult {
  canUse: boolean
  currentUsage: number
  monthlyLimit: number
  warning: string | null
}

// API 月度限制設定
export const API_LIMITS = {
  google_vision: 980,      // Google Vision 免費額度 1000，保守設 980
  gemini: 1500,            // Gemini 免費 60/分鐘，每日約 50 次使用
  ocr_space: 25000,        // OCR.space 免費額度 25000/月
} as const

export type ApiName = keyof typeof API_LIMITS

/**
 * 檢查 API 使用量是否已達上限
 */
export async function checkApiUsage(
  apiName: ApiName,
  requestCount: number = 1
): Promise<ApiUsageCheckResult> {
  try {
    const supabase = getSupabaseAdminClient()
    const monthlyLimit = API_LIMITS[apiName]
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const { data } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', apiName)
      .eq('month', currentMonth)
      .single()

    const currentUsage = data?.usage_count || 0
    const newUsage = currentUsage + requestCount

    // 判斷是否可以使用
    if (newUsage > monthlyLimit) {
      return {
        canUse: false,
        currentUsage,
        monthlyLimit,
        warning: `⚠️ ${apiName} API 本月已達上限 (${currentUsage}/${monthlyLimit})`,
      }
    }

    // 使用量警告
    const usagePercent = (newUsage / monthlyLimit) * 100
    let warning: string | null = null

    if (usagePercent >= 95) {
      warning = `🔴 ${apiName} API 使用量已達 ${usagePercent.toFixed(0)}% (${newUsage}/${monthlyLimit})，即將達到上限！`
    } else if (usagePercent >= 80) {
      warning = `🟡 ${apiName} API 使用量已達 ${usagePercent.toFixed(0)}% (${newUsage}/${monthlyLimit})`
    }

    return {
      canUse: true,
      currentUsage,
      monthlyLimit,
      warning,
    }
  } catch (error) {
    console.error(`檢查 ${apiName} API 使用量失敗:`, error)
    // 發生錯誤時仍允許使用（避免因為 DB 問題影響正常功能）
    return {
      canUse: true,
      currentUsage: 0,
      monthlyLimit: API_LIMITS[apiName],
      warning: null,
    }
  }
}

/**
 * 更新 API 使用量
 */
export async function updateApiUsage(
  apiName: ApiName,
  count: number = 1
): Promise<{ success: boolean; newCount: number }> {
  try {
    const supabase = getSupabaseAdminClient()
    const currentMonth = new Date().toISOString().slice(0, 7)

    // 先查詢當前使用量
    const { data: existing } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', apiName)
      .eq('month', currentMonth)
      .single()

    const newCount = (existing?.usage_count || 0) + count

    // 使用 upsert 更新或新增記錄
    const { error } = await supabase
      .from('api_usage')
      .upsert(
        {
          api_name: apiName,
          month: currentMonth,
          usage_count: newCount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'api_name,month',
        }
      )

    if (error) {
      console.error(`更新 ${apiName} 使用量失敗:`, error)
      return { success: false, newCount: 0 }
    }

    const monthlyLimit = API_LIMITS[apiName]
    console.log(`📊 ${apiName} 使用量更新: ${newCount}/${monthlyLimit}`)
    return { success: true, newCount }
  } catch (error) {
    console.error(`更新 ${apiName} 使用量失敗:`, error)
    return { success: false, newCount: 0 }
  }
}

/**
 * 取得 API 當月使用量
 */
export async function getApiUsage(apiName: ApiName): Promise<{
  usage_count: number
  monthly_limit: number
  percentage: number
}> {
  try {
    const supabase = getSupabaseAdminClient()
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('api_name', apiName)
      .eq('month', currentMonth)
      .single()

    const usage_count = data?.usage_count || 0
    const monthly_limit = API_LIMITS[apiName]
    const percentage = (usage_count / monthly_limit) * 100

    return { usage_count, monthly_limit, percentage }
  } catch {
    return {
      usage_count: 0,
      monthly_limit: API_LIMITS[apiName],
      percentage: 0,
    }
  }
}
