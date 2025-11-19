import { supabase } from './src/lib/supabase/client.ts'

async function addColumn() {
  console.log('正在新增 updated_by 欄位到 todos 表格...')
  
  const { data, error } = await supabase
    .from('todos')
    .select('id')
    .limit(1)
  
  if (error) {
    console.error('連接錯誤:', error)
    process.exit(1)
  }
  
  console.log('✅ Supabase 連接成功')
  console.log('\n請手動執行以下 SQL:')
  console.log('前往: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new')
  console.log('\n執行以下 SQL:\n')
  console.log(`ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

UPDATE public.todos
SET updated_by = created_by
WHERE updated_by IS NULL;`)
}

addColumn()
