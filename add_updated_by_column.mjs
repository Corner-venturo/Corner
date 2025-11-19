import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjgxNzkyNywiZXhwIjoyMDQyMzkzOTI3fQ.VPkW0LWKT3X0glvr1a2rSXNNnN0FW-JCsJuqZ3zZEJ0'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addColumn() {
  try {
    console.log('🔄 正在新增 updated_by 欄位...')
    
    // 使用 Postgres 的 ALTER TABLE
    const { data, error } = await supabase.rpc('exec', {
      sql: `ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id); UPDATE public.todos SET updated_by = created_by WHERE updated_by IS NULL;`
    })
    
    if (error) {
      console.error('❌ 錯誤:', error.message)
      process.exit(1)
    }
    
    console.log('✅ updated_by 欄位已成功新增！')
  } catch (err) {
    console.error('❌ 執行失敗:', err.message)
    process.exit(1)
  }
}

addColumn()
