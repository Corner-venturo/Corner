import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { POLLING_INTERVALS } from '@/lib/constants/timeouts'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Simple singleton pattern
// 🔧 新增：fetch timeout 防止請求卡住
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: (url, options = {}) => {
      // 60 秒超時，給本地網路更多時間
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), POLLING_INTERVALS.OCCASIONAL);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
})

// 獲取 Supabase client 實例的函數
export function getSupabaseClient() {
  return supabase;
}

// 測試 Supabase 連接
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('employees').select('count').limit(1);

    if (error) {
            return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
        return { success: false, error: String(err) };
  }
}