import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function findRequiredFields() {
  console.log('\n=== 尋找 Orders 表所有必填欄位 ===\n')

  const timestamp = Date.now()
  let testOrder = {
    id: 'order-test-' + timestamp,
    code: 'O' + timestamp.toString().slice(-6),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const requiredFields = ['id', 'code', 'created_at', 'updated_at']
  const attemptedFields = new Set(requiredFields)
  let attempts = 0
  const maxAttempts = 20

  while (attempts < maxAttempts) {
    attempts++
    console.log(`\n嘗試 ${attempts}: 測試欄位 ${Object.keys(testOrder).length} 個`)

    const { data, error } = await supabase.from('orders').insert([testOrder]).select()

    if (error) {
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "(.+?)"/)
        if (match) {
          const missingField = match[1]
          console.log(`  ❌ 缺少必填欄位: ${missingField}`)

          if (attemptedFields.has(missingField)) {
            console.log('  ⚠️  無限循環，停止測試')
            break
          }

          requiredFields.push(missingField)
          attemptedFields.add(missingField)

          // 根據欄位名稱猜測合適的預設值
          if (missingField.includes('phone')) {
            testOrder[missingField] = '0912345678'
          } else if (missingField.includes('email')) {
            testOrder[missingField] = 'test@example.com'
          } else if (missingField.includes('amount') || missingField.includes('price')) {
            testOrder[missingField] = 0
          } else if (missingField.includes('count')) {
            testOrder[missingField] = 0
          } else if (missingField.includes('status')) {
            testOrder[missingField] = '未收款'
          } else if (missingField.includes('name') || missingField.includes('person')) {
            testOrder[missingField] = '測試'
          } else if (missingField.includes('date')) {
            testOrder[missingField] = new Date().toISOString()
          } else {
            testOrder[missingField] = ''
          }

          continue
        }
      } else if (error.message.includes('not found')) {
        const match = error.message.match(/Could not find the '(.+?)' column/)
        if (match) {
          console.log(`  ⚠️  欄位不存在於資料庫: ${match[1]}`)
          delete testOrder[match[1]]
          continue
        }
      }

      console.log('  其他錯誤:', error.message)
      break
    } else {
      console.log('  ✅ 建立成功！')
      console.log('\n找到所有必填欄位：')
      console.log(requiredFields.join(', '))

      console.log('\n完整測試資料：')
      console.log(JSON.stringify(testOrder, null, 2))

      // 清理
      await supabase.from('orders').delete().eq('id', testOrder.id)
      console.log('\n已清理測試資料')
      break
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n達到最大嘗試次數')
  }
}

findRequiredFields()
