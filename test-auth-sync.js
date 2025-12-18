const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 從命令列取得帳號密碼
const employeeNumber = process.argv[2]
const password = process.argv[3]

if (!employeeNumber || !password) {
  console.log('使用方式: node test-auth-sync.js <員工編號> <密碼>')
  console.log('範例: node test-auth-sync.js E001 your_password')
  process.exit(1)
}

async function testAuthSync() {
  const email = `${employeeNumber}@venturo.com`
  
  console.log('🔍 測試認證同步...\n')
  console.log(`   帳號: ${email}`)
  
  try {
    // 1. 登入
    console.log('\n1️⃣ 嘗試登入...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (authError) {
      console.log('❌ 登入失敗:', authError.message)
      return
    }
    
    console.log('✅ 登入成功')
    console.log('   User ID:', authData.user?.id)
    
    // 2. 檢查 user_metadata
    console.log('\n2️⃣ 檢查 user_metadata...')
    const userMetadata = authData.user?.user_metadata || {}
    console.log('   user_metadata:', JSON.stringify(userMetadata, null, 2))
    
    // 3. 從 employees 表查詢實際的 workspace_id
    console.log('\n3️⃣ 從 employees 表查詢...')
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, workspace_id, display_name')
      .eq('id', authData.user?.id)
      .single()
    
    if (empError) {
      console.log('❌ 查詢 employees 失敗:', empError.message)
    } else {
      console.log('   Employee:', employee?.display_name)
      console.log('   Workspace ID (from employees table):', employee?.workspace_id)
    }
    
    // 4. 比對結果
    console.log('\n4️⃣ 同步狀態:')
    const metaWorkspaceId = userMetadata?.workspace_id
    const dbWorkspaceId = employee?.workspace_id
    
    if (metaWorkspaceId && metaWorkspaceId === dbWorkspaceId) {
      console.log('   ✅ 完全同步！user_metadata.workspace_id 和 employees 表一致')
      console.log(`   workspace_id: ${metaWorkspaceId}`)
    } else if (!metaWorkspaceId && dbWorkspaceId) {
      console.log('   ⚠️  尚未同步')
      console.log('   user_metadata.workspace_id: (空)')
      console.log(`   employees.workspace_id: ${dbWorkspaceId}`)
      console.log('\n   👉 這是舊用戶，請透過【前端網頁】重新登入一次來同步')
      console.log('   👉 前端登入會呼叫 auth-store.validateLogin()，其中包含 updateUser()')
    } else if (metaWorkspaceId !== dbWorkspaceId) {
      console.log('   ❌ 不一致！')
      console.log(`   user_metadata.workspace_id: ${metaWorkspaceId}`)
      console.log(`   employees.workspace_id: ${dbWorkspaceId}`)
    }
    
    // 5. 登出
    await supabase.auth.signOut()
    console.log('\n5️⃣ 已登出')
    
  } catch (error) {
    console.error('💥 錯誤:', error)
  }
}

testAuthSync()
