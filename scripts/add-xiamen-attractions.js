const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

async function addXiamenData() {
  // 1. 先確保廈門城市存在
  const { error: cityError } = await supabase
    .from('cities')
    .upsert({
      id: 'xiamen',
      name: '廈門',
      name_en: 'Xiamen',
      country_id: 'china'
    }, { onConflict: 'id' })

  if (cityError) {
    console.log('新增廈門城市錯誤:', cityError.message)
  } else {
    console.log('✅ 已確認廈門城市')
  }

  // 2. 廈門景點資料
  const attractions = [
    // 經典必去
    { name: '鼓浪嶼', name_en: 'Gulangyu Island', type: 'attraction', description: '世界文化遺產，琴島風情，萬國建築博覽' },
    { name: '南普陀寺', name_en: 'Nanputuo Temple', type: 'temple', description: '閩南佛教聖地，始建於唐代' },
    { name: '廈門大學', name_en: 'Xiamen University', type: 'attraction', description: '中國最美大學，芙蓉湖、上弦場' },
    { name: '中山路步行街', name_en: 'Zhongshan Road', type: 'shopping', description: '百年老街，騎樓建築，閩南小吃' },
    { name: '環島路', name_en: 'Huandao Road', type: 'attraction', description: '最美海濱大道，騎行勝地' },
    { name: '曾厝垵', name_en: 'Zengcuoan Village', type: 'attraction', description: '文藝漁村，網紅打卡勝地' },
    { name: '胡里山炮台', name_en: 'Hulishan Fortress', type: 'attraction', description: '世界最大古炮，海防古蹟' },
    { name: '廈門園林植物園', name_en: 'Xiamen Botanical Garden', type: 'park', description: '萬石山風景區，熱帶雨林、仙人掌世界' },

    // 博物館
    { name: '廈門博物館', name_en: 'Xiamen Museum', type: 'museum', description: '閩南文化歷史，對台文物' },
    { name: '華僑博物院', name_en: 'Overseas Chinese Museum', type: 'museum', description: '全國唯一華僑主題博物館' },
    { name: '鼓浪嶼鋼琴博物館', name_en: 'Gulangyu Piano Museum', type: 'museum', description: '世界級鋼琴收藏，音樂文化' },
    { name: '廈門科技館', name_en: 'Xiamen Science Museum', type: 'museum', description: '親子科普，互動體驗' },
    { name: '奧林匹克博物館', name_en: 'Olympic Museum', type: 'museum', description: '亞洲唯一奧運主題博物館' },

    // 網紅打卡點
    { name: '沙坡尾藝術西區', name_en: 'Shapowei Art District', type: 'attraction', description: '舊漁港改造，文創園區，網紅咖啡廳' },
    { name: '廈門雙子塔', name_en: 'Xiamen Twin Towers', type: 'landmark', description: '世茂海峽大廈，廈門地標' },
    { name: '演武大橋觀景台', name_en: 'Yanwu Bridge Observation Deck', type: 'viewpoint', description: '最佳日落觀賞點，俯瞰廈門灣' },
    { name: '黃厝海灘', name_en: 'Huangcuo Beach', type: 'beach', description: '廈門最美海灘，水上運動' },
    { name: '白城沙灘', name_en: 'Baicheng Beach', type: 'beach', description: '廈大旁邊，學生海灘' },

    // 閩南文化體驗
    { name: '集美學村', name_en: 'Jimei School Village', type: 'attraction', description: '陳嘉庚故居，嘉庚建築風格' },
    { name: '鰲園', name_en: 'Ao Garden', type: 'park', description: '陳嘉庚紀念園，石雕藝術' },
    { name: '天竺山森林公園', name_en: 'Tianzhu Mountain', type: 'park', description: '海拔933米，健行登山' },
    { name: '五緣灣濕地公園', name_en: 'Wuyuan Bay Wetland Park', type: 'park', description: '城市綠肺，黑天鵝棲息地' },

    // 美食街區
    { name: '八市（第八菜市場）', name_en: 'Bashi Market', type: 'market', description: '百年老市場，海鮮集散地，沙茶麵發源地' },
    { name: '廈門台灣小吃街', name_en: 'Taiwan Snack Street', type: 'food', description: '兩岸美食交流' },
    { name: '頂澳仔貓街', name_en: 'Cat Street', type: 'attraction', description: '貓咪主題街區，文創小店' },

    // 鼓浪嶼島上景點
    { name: '日光岩', name_en: 'Sunlight Rock', type: 'viewpoint', description: '鼓浪嶼最高點，俯瞰全島' },
    { name: '菽莊花園', name_en: 'Shuzhuang Garden', type: 'garden', description: '林爾嘉私家園林，鋼琴博物館所在' },
    { name: '皓月園', name_en: 'Haoyue Garden', type: 'garden', description: '鄭成功雕像，愛國主義教育基地' },
    { name: '國際刻字藝術館', name_en: 'International Lettering Art Museum', type: 'museum', description: '世界刻字藝術' },
    { name: '風琴博物館', name_en: 'Organ Museum', type: 'museum', description: '世界風琴收藏' },

    // 新興景點
    { name: '廈門方特旅遊區', name_en: 'Fantawild Adventure', type: 'theme_park', description: '大型主題樂園，親子必去' },
    { name: '觀音山夢幻海岸', name_en: 'Guanyin Mountain Dream Coast', type: 'theme_park', description: '水上樂園，海濱娛樂' },
    { name: '誠毅科技探索中心', name_en: 'Chengyi Science Discovery Center', type: 'attraction', description: '航天主題，VR體驗' },
    { name: '海滄大橋旅遊區', name_en: 'Haicang Bridge Tourism Area', type: 'attraction', description: '跨海大橋觀景' },

    // 寺廟古蹟
    { name: '梵天寺', name_en: 'Fantian Temple', type: 'temple', description: '同安古寺，福建最早佛寺之一' },
    { name: '青礁慈濟宮', name_en: 'Qingjiao Ciji Temple', type: 'temple', description: '保生大帝祖廟' },
    { name: '廈門城遺址', name_en: 'Xiamen Ancient City Ruins', type: 'heritage', description: '明代衛城遺址' }
  ]

  console.log('')
  console.log('========================================')
  console.log('  新增廈門景點')
  console.log('========================================')
  console.log('')

  let success = 0
  let failed = 0

  for (const attr of attractions) {
    const { error } = await supabase
      .from('attractions')
      .insert({
        ...attr,
        country_id: 'china',
        city_id: 'xiamen',
        workspace_id
      })

    if (error) {
      if (error.code === '23505') {
        console.log('⏭️ 已存在: ' + attr.name)
      } else {
        console.log('❌ ' + attr.name + ': ' + error.message)
        failed++
      }
    } else {
      console.log('✅ ' + attr.name)
      success++
    }
  }

  console.log('')
  console.log('========================================')
  console.log('  完成！成功: ' + success + ' 個, 失敗: ' + failed + ' 個')
  console.log('========================================')

  // 統計
  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', 'xiamen')

  console.log('')
  console.log('廈門景點總數: ' + count + ' 個')
}

addXiamenData()
