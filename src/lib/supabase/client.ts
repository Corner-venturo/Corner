import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 簡單的單例模式，避免複雜的 Proxy
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
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
})

// 測試連接
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('employees').select('count').limit(1);

    if (error) {
      console.error('❌ Supabase 連接失敗:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase 連接成功！');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase 連接錯誤:', err);
    return { success: false, error: String(err) };
  }
}