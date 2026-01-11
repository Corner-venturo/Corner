import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // 檢查 employees 表中所有員工
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, employee_number, display_name, chinese_name, workspace_id, status')
    .order('employee_number')

  if (empError) {
    console.log('Error fetching employees:', empError)
    return
  }

  console.log('=== Employees ===')
  console.log('Total:', employees?.length || 0)
  if (employees) {
    for (const e of employees) {
      const name = e.display_name || e.chinese_name || 'Unknown'
      const wsId = e.workspace_id ? e.workspace_id.substring(0, 8) : 'null'
      console.log('  ' + e.employee_number + ': ' + name + ' (' + e.status + ') - workspace: ' + wsId + '...')
    }
  }

  // 檢查 tours 表
  const { data: tours, error: tourError } = await supabase
    .from('tours')
    .select('id, code, name, status, workspace_id')
    .limit(5)

  if (tourError) {
    console.log('\n=== Tours Error ===')
    console.log(tourError)
  } else {
    console.log('\n=== Tours (first 5) ===')
    console.log('Total fetched:', tours?.length || 0)
    if (tours) {
      for (const t of tours) {
        console.log('  ' + t.code + ': ' + t.name + ' (' + t.status + ')')
      }
    }
  }
}

check()
