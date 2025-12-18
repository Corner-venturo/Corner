const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmployee() {
  console.log('🔍 檢查 E001 員工資料...\n')
  
  const { data, error } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, workspace_id, password_hash')
    .eq('employee_number', 'E001')
    .single()
  
  if (error) {
    console.log('Error:', error.message)
    return
  }
  
  console.log('員工資料:')
  console.log('  ID:', data.id)
  console.log('  員工編號:', data.employee_number)
  console.log('  顯示名稱:', data.display_name)
  console.log('  Workspace ID:', data.workspace_id)
  console.log('  有密碼:', data.password_hash ? '✅ 是' : '❌ 否')
  
  if (data.password_hash) {
    // 驗證密碼
    const bcrypt = require('bcryptjs')
    const isValid = await bcrypt.compare('abc123', data.password_hash)
    console.log('  密碼 abc123 正確:', isValid ? '✅ 是' : '❌ 否')
  }
}

checkEmployee()
