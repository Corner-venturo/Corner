/**
 * 批次重新處理護照 passport_name_print
 *
 * 執行方式：npx tsx scripts/batch-reprocess-passport.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('=== 批次處理 passport_name_print ===\n')

  // 1. 查詢需要處理的數量
  const { count: customerNeedOcr } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .not('passport_image_url', 'is', null)
    .is('passport_name_print', null)

  const { count: memberNeedOcr } = await supabase
    .from('order_members')
    .select('id', { count: 'exact', head: true })
    .not('passport_image_url', 'is', null)
    .is('passport_name_print', null)

  const { count: customerCanFallback } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .not('passport_name', 'is', null)
    .is('passport_name_print', null)

  const { count: memberCanFallback } = await supabase
    .from('order_members')
    .select('id', { count: 'exact', head: true })
    .not('passport_name', 'is', null)
    .is('passport_name_print', null)

  console.log('統計資訊：')
  console.log(`- Customers 有護照圖片可 OCR: ${customerNeedOcr || 0}`)
  console.log(`- Order Members 有護照圖片可 OCR: ${memberNeedOcr || 0}`)
  console.log(`- Customers 有 passport_name 可轉換: ${customerCanFallback || 0}`)
  console.log(`- Order Members 有 passport_name 可轉換: ${memberCanFallback || 0}`)
  console.log('')

  // 2. 先用 fallback 方式處理有 passport_name 的記錄
  console.log('=== 開始 Fallback 轉換（無法還原連字號）===\n')

  // 處理 customers
  const { data: customersToFallback } = await supabase
    .from('customers')
    .select('id, passport_name')
    .not('passport_name', 'is', null)
    .is('passport_name_print', null)

  let customerUpdated = 0
  if (customersToFallback) {
    for (const customer of customersToFallback) {
      const passportNamePrint = customer.passport_name!.replace('/', ', ')
      const { error } = await supabase
        .from('customers')
        .update({ passport_name_print: passportNamePrint })
        .eq('id', customer.id)

      if (!error) {
        customerUpdated++
        console.log(`✓ Customer ${customer.id}: ${customer.passport_name} → ${passportNamePrint}`)
      } else {
        console.log(`✗ Customer ${customer.id}: ${error.message}`)
      }
    }
  }

  // 處理 order_members
  const { data: membersToFallback } = await supabase
    .from('order_members')
    .select('id, passport_name')
    .not('passport_name', 'is', null)
    .is('passport_name_print', null)

  let memberUpdated = 0
  if (membersToFallback) {
    for (const member of membersToFallback) {
      const passportNamePrint = member.passport_name!.replace('/', ', ')
      const { error } = await supabase
        .from('order_members')
        .update({ passport_name_print: passportNamePrint })
        .eq('id', member.id)

      if (!error) {
        memberUpdated++
        console.log(`✓ Member ${member.id}: ${member.passport_name} → ${passportNamePrint}`)
      } else {
        console.log(`✗ Member ${member.id}: ${error.message}`)
      }
    }
  }

  console.log('')
  console.log('=== 完成 ===')
  console.log(`Customers 已更新: ${customerUpdated}`)
  console.log(`Order Members 已更新: ${memberUpdated}`)

  // 3. 如果有 OCR API Key，可以進一步處理有圖片的
  if (OCR_SPACE_API_KEY && ((customerNeedOcr || 0) > 0 || (memberNeedOcr || 0) > 0)) {
    console.log('\n=== OCR 重新處理（可還原連字號）===')
    console.log('注意：這會消耗 OCR API 額度')
    console.log('如需執行，請使用 --ocr 參數')
  }
}

main().catch(console.error)
