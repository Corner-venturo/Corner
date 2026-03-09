/**
 * 將 WILLIAM 設定為 super_admin
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function setWilliamSuperAdmin() {
  console.log('🔍 查找 WILLIAM...')

  // 查找 WILLIAM 的員工記錄
  const { data: employee, error: findError } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, english_name')
    .or('english_name.ilike.%william%,display_name.ilike.%william%')
    .single()

  if (findError || !employee) {
    console.error('❌ 找不到 WILLIAM:', findError?.message)
    return
  }

  console.log('✅ 找到員工:', {
    id: employee.id,
    employee_number: employee.employee_number,
    display_name: employee.display_name,
    english_name: employee.english_name,
  })

  // 更新 employees 表格的 permissions 欄位，加入 super_admin 權限
  const { error: updateError } = await supabase
    .from('employees')
    .update({
      permissions: ['super_admin'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', employee.id)

  if (updateError) {
    console.error('❌ 更新權限失敗:', updateError.message)
    return
  }

  console.log('✅ WILLIAM 已設定為 super_admin')

  // 驗證結果
  const { data: updatedEmployee, error: checkError } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, permissions')
    .eq('id', employee.id)
    .single()

  if (checkError) {
    console.error('❌ 驗證失敗:', checkError.message)
    return
  }

  console.log('✅ 權限驗證:', updatedEmployee)
}

setWilliamSuperAdmin()
  .then(() => {
    console.log('\n✅ 完成！')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ 執行失敗:', err)
    process.exit(1)
  })
