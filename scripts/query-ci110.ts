import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function main() {
  console.log('=== 查詢「北極熊畢業旅行」提案 ===\n')
  
  // 1. 查詢提案
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .ilike('title', '%北極熊%')
  
  if (!proposals || proposals.length === 0) {
    console.log('找不到「北極熊」相關提案')
    
    // 列出所有提案
    const { data: all } = await supabase.from('proposals').select('id, title')
    console.log('\n所有提案:')
    all?.forEach((p: any) => console.log('-', p.title))
    return
  }
  
  console.log('找到提案:', proposals.length, '筆\n')
  
  for (const proposal of proposals) {
    console.log('========================================')
    console.log('提案標題:', proposal.title)
    console.log('提案 ID:', proposal.id)
    console.log('預計出發:', proposal.expected_start_date)
    console.log('預計回程:', proposal.expected_end_date)
    console.log('國家:', proposal.country_id)
    console.log('城市:', proposal.main_city_id)
    
    // 2. 查詢相關套件
    const { data: packages } = await supabase
      .from('proposal_packages')
      .select('*')
      .eq('proposal_id', proposal.id)
    
    if (packages && packages.length > 0) {
      console.log('\n【套件】共', packages.length, '個')
      
      for (const pkg of packages) {
        console.log('\n--- 套件:', pkg.version_name, '---')
        console.log('套件 ID:', pkg.id)
        console.log('出發日期:', pkg.start_date)
        console.log('回程日期:', pkg.end_date)
        console.log('天數:', pkg.days, '夜:', pkg.nights)
        
        // 3. 查詢相關行程表
        const { data: itineraries } = await supabase
          .from('itineraries')
          .select('id, outbound_flight, return_flight, created_at')
          .eq('proposal_package_id', pkg.id)
        
        if (itineraries && itineraries.length > 0) {
          console.log('\n行程表:', itineraries.length, '份')
          for (const it of itineraries) {
            console.log('\n  行程 ID:', it.id)
            console.log('  去程航班:', JSON.stringify(it.outbound_flight, null, 4))
            console.log('  回程航班:', JSON.stringify(it.return_flight, null, 4))
          }
        } else {
          console.log('\n無關聯行程表')
        }
      }
    } else {
      console.log('\n無套件')
    }
  }
}

main()
