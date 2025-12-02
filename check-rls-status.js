import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

async function checkRLS() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' }
  })

  console.log('🔍 檢查 todos 資料表狀態...\n')

  try {
    // 嘗試查詢 todos 表
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ 查詢錯誤:', error.message)
      console.error('完整錯誤:', JSON.stringify(error, null, 2))

      if (error.message.includes('updated_by')) {
        console.log('\n⚠️ 確認問題：updated_by 欄位不存在')
        console.log('\n需要手動執行以下 SQL:')
        console.log('前往: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new')
        console.log('\nBEGIN;')
        console.log('ALTER TABLE public.todos')
        console.log('ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);')
        console.log('\nCOMMENT ON COLUMN public.todos.updated_by IS \'Last user who updated this todo\';')
        console.log('\nUPDATE public.todos')
        console.log('SET updated_by = created_by')
        console.log('WHERE updated_by IS NULL;')
        console.log('COMMIT;')
      }
    } else {
      console.log('✅ todos 資料表可正常查詢')
      console.log(`📊 資料筆數: ${data ? data.length : 0}`)
      if (data && data.length > 0) {
        console.log('欄位:', Object.keys(data[0]).join(', '))
        if ('updated_by' in data[0]) {
          console.log('✅ updated_by 欄位已存在')
        } else {
          console.log('❌ updated_by 欄位不存在')
        }
      }
    }
  } catch (err) {
    console.error('❌ 執行錯誤:', err.message)
  }
}

checkRLS()
