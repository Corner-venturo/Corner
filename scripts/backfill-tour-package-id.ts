/**
 * 補上舊 Tour 的 proposal_package_id
 * 透過 proposals.converted_tour_id 反查
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function backfill() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. 找出所有已轉開團的提案
  const { data: proposals, error: proposalError } = await supabase
    .from('proposals')
    .select('id, code, converted_tour_id, selected_package_id')
    .eq('status', 'converted')
    .not('converted_tour_id', 'is', null)

  if (proposalError) {
    console.error('查詢提案失敗:', proposalError)
    return
  }

  const count = proposals ? proposals.length : 0
  console.log(`找到 ${count} 個已轉開團的提案`)

  if (!proposals || proposals.length === 0) {
    console.log('沒有需要補上的資料')
    return
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const proposal of proposals) {
    if (!proposal.converted_tour_id || !proposal.selected_package_id) {
      console.log(`跳過提案 ${proposal.code}: 缺少 tour_id 或 package_id`)
      skipped++
      continue
    }

    // 2. 檢查 Tour 是否已有 proposal_package_id
    const { data: tour } = await supabase
      .from('tours')
      .select('id, code, proposal_package_id')
      .eq('id', proposal.converted_tour_id)
      .single()

    if (!tour) {
      console.log(`跳過提案 ${proposal.code}: 找不到對應的 Tour`)
      skipped++
      continue
    }

    if (tour.proposal_package_id) {
      console.log(`跳過 ${tour.code}: 已有 proposal_package_id`)
      skipped++
      continue
    }

    // 3. 更新 Tour 的 proposal_package_id
    const { error: updateError } = await supabase
      .from('tours')
      .update({ proposal_package_id: proposal.selected_package_id })
      .eq('id', tour.id)

    if (updateError) {
      console.error(`更新 ${tour.code} 失敗:`, updateError)
      failed++
    } else {
      console.log(`✅ 已更新 ${tour.code} -> package ${proposal.selected_package_id}`)
      updated++
    }
  }

  console.log('\n========== 完成 ==========')
  console.log(`更新: ${updated}`)
  console.log(`跳過: ${skipped}`)
  console.log(`失敗: ${failed}`)
}

backfill()
