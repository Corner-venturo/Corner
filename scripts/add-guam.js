// 新增關島國家和景點
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
const supabase = createClient(supabaseUrl, supabaseKey)

// 關島景點
const guamAttractions = [
  {
    name: '杜夢灣',
    name_en: 'Tumon Bay',
    type: 'attraction',
    category: '海灘',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '購物', '飯店區', '浮潛', '日落'],
    notes:
      '關島最熱鬧的觀光區，白沙海灘綿延2公里。聚集各大飯店、免稅店、餐廳。海水清澈適合浮潛，傍晚日落美景動人。DFS免稅店和各大購物中心都在此區。\n\n旅遊提示：這是關島旅遊的核心區域，住宿選這裡最方便',
  },
  {
    name: '戀人岬',
    name_en: 'Two Lovers Point',
    type: 'attraction',
    category: '自然景觀',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '19:00' },
    tags: ['地標', '傳說', '觀景台', '愛情', '懸崖'],
    notes:
      '關島最著名地標，因查莫洛族戀人殉情傳說得名。123公尺高的懸崖觀景台可俯瞰菲律賓海。有愛情鎖牆和望遠鏡。是情侶必訪的浪漫景點。\n\n旅遊提示：建議傍晚去，可同時看日落',
  },
  {
    name: '魚眼海洋公園',
    name_en: 'Fish Eye Marine Park',
    type: 'attraction',
    category: '海洋公園',
    duration_minutes: 120,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['水族館', '海底', '浮潛', '海豚', '親子'],
    notes:
      '獨特的海底展望塔，可在水下10公尺觀賞珊瑚和熱帶魚。有浮潛、海底漫步、海豚共游等活動。不會游泳也能近距離看海洋生物。適合親子同遊。\n\n旅遊提示：海底漫步不需要會游泳，很適合初學者',
  },
  {
    name: '亞加納',
    name_en: 'Hagatna',
    type: 'attraction',
    category: '城市',
    duration_minutes: 90,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['首府', '歷史', '教堂', '西班牙', '查莫洛'],
    notes:
      '關島首府，擁有400年西班牙殖民歷史。必看聖母瑪利亞大教堂、西班牙廣場、拉提石公園。可了解查莫洛原住民文化。週三有夜市。\n\n旅遊提示：週三晚上的查莫洛夜市很熱鬧，有道地美食',
  },
  {
    name: '查莫洛夜市',
    name_en: 'Chamorro Village Night Market',
    type: 'attraction',
    category: '市場',
    duration_minutes: 120,
    opening_hours: { open: '18:00', close: '21:00', note: '僅週三營業' },
    tags: ['夜市', '美食', '文化', '表演', '購物'],
    notes:
      '每週三晚上在亞加納舉辦的傳統夜市。有查莫洛傳統美食：紅米飯、烤肉串、椰子蟹。有傳統舞蹈表演和手工藝品。是體驗關島在地文化的最佳機會。\n\n旅遊提示：必吃BBQ烤肉和紅米飯',
  },
  {
    name: '太平洋戰爭國家歷史公園',
    name_en: 'War in the Pacific NHP',
    type: 'attraction',
    category: '歷史',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '16:30' },
    tags: ['二戰', '歷史', '戰爭遺跡', '博物館', '免費'],
    notes:
      '紀念太平洋戰爭的國家公園，關島是二戰重要戰場。有阿桑海灘登陸紀念碑、日軍洞穴、歷史展覽。免費參觀，是了解關島戰爭歷史的重要景點。\n\n旅遊提示：對二戰歷史有興趣的必訪',
  },
  {
    name: '瑞提迪恩岬',
    name_en: 'Ritidian Point',
    type: 'attraction',
    category: '自然景觀',
    duration_minutes: 120,
    opening_hours: { open: '07:30', close: '16:00' },
    tags: ['野生動物', '海灘', '原始', '浮潛', '自然保護區'],
    notes:
      '關島最北端的自然保護區，有原始海灘和野生動物。是觀賞海龜的絕佳地點。海水清澈見底，珊瑚保存完好。遠離觀光區，保持原始風貌。\n\n旅遊提示：需租車前往，道路有點顛簸但風景值得',
  },
  {
    name: '可可島',
    name_en: 'Cocos Island',
    type: 'attraction',
    category: '島嶼',
    duration_minutes: 360,
    opening_hours: { open: '08:00', close: '16:00' },
    tags: ['離島', '浮潛', '水上活動', '珊瑚', '一日遊'],
    notes:
      '關島南部的私人小島，搭船約10分鐘。有浮潛、香蕉船、水上摩托車等水上活動。珊瑚礁生態豐富，海水能見度極高。是關島水上活動的最佳去處。\n\n旅遊提示：建議參加一日遊套裝，含船票和水上活動',
  },
  {
    name: '伊納拉漢天然池',
    name_en: 'Inarajan Natural Pool',
    type: 'attraction',
    category: '自然景觀',
    duration_minutes: 90,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['天然泳池', '免費', '在地人推薦', '原始', '礁石'],
    notes:
      '由珊瑚礁自然形成的天然游泳池，海水清澈平靜。是當地人喜愛的秘境，遊客較少。免費開放，有基本設施。體驗關島原始自然的好地方。\n\n旅遊提示：帶浮潛裝備，可以看到很多魚',
  },
  {
    name: '關島購物中心',
    name_en: 'Guam Premier Outlets',
    type: 'attraction',
    category: '購物',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['購物', 'Outlet', '免稅', '品牌', '美式'],
    notes:
      '關島最大的Outlet購物中心，有超過90個品牌。Coach、Michael Kors、Tommy Hilfiger等美國品牌價格優惠。關島是免稅島，購物更划算。\n\n旅遊提示：結合DFS免稅店，一次買齊',
  },
  {
    name: 'DFS免稅店',
    name_en: 'T Galleria by DFS',
    type: 'attraction',
    category: '購物',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '23:00' },
    tags: ['免稅', '精品', '購物', '杜夢灣', '必逛'],
    notes:
      '位於杜夢灣的大型免稅店，集合各大國際精品品牌。化妝品、香水、手錶、珠寶應有盡有。部分商品比台灣便宜。是關島購物的重點。\n\n旅遊提示：先上官網看優惠券',
  },
  {
    name: '亞特蘭提斯潛水艇',
    name_en: 'Atlantis Submarine',
    type: 'attraction',
    category: '體驗活動',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '15:00' },
    tags: ['潛水艇', '海底', '親子', '不濕身', '觀光'],
    notes:
      '搭乘真正的觀光潛水艇下潛到水下30公尺。不需要會游泳或潛水就能欣賞海底世界。可看到沉船、珊瑚、熱帶魚群。非常適合親子和不想下水的遊客。\n\n旅遊提示：有懼高或幽閉空間恐懼者可能不適合',
  },
  {
    name: '密克羅尼西亞購物中心',
    name_en: 'Micronesia Mall',
    type: 'attraction',
    category: '購物',
    duration_minutes: 150,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['購物中心', '電影院', '美食街', '超市', '家庭'],
    notes:
      '關島本地人最愛的大型購物中心，有Macy百貨、電影院、美食街。比DFS更有美式生活感。Ross和Payless價格實惠。有K-Mart超市可買零食。\n\n旅遊提示：可以來這裡感受美國本土的購物氛圍',
  },
  {
    name: '塔羅佛佛瀑布',
    name_en: 'Talofofo Falls',
    type: 'attraction',
    category: '自然景觀',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['瀑布', '纜車', '自然', '叢林', '歷史'],
    notes:
      '關島最大的瀑布，位於南部叢林中。搭纜車進入，沿途可見熱帶植物。附近有二戰時日本兵橫井莊一躲藏28年的洞穴。結合自然和歷史的景點。\n\n旅遊提示：搭纜車下去，爬階梯上來，要有體力準備',
  },
  {
    name: '傑夫海盜船',
    name_en: "Jeff's Pirate Cove",
    type: 'food',
    category: '餐廳',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '21:00' },
    tags: ['BBQ', '海景', '烤肉', '啤酒', '美式'],
    notes:
      '關島必吃的BBQ餐廳，位於海邊獨特的海盜船造型建築。招牌是巨大的BBQ拼盤和豬肋排。可邊吃邊看海景。份量超大，美式風格濃厚。\n\n旅遊提示：2人點一份大拼盤就夠了',
  },
  {
    name: 'Proa餐廳',
    name_en: 'Proa Restaurant',
    type: 'food',
    category: '餐廳',
    duration_minutes: 90,
    opening_hours: { open: '11:00', close: '22:00' },
    tags: ['查莫洛料理', '創意', '當地推薦', '海鮮', '高評價'],
    notes:
      '關島評價最高的餐廳之一，提供創意查莫洛料理。招牌菜有椰子蝦、紅米飯、BBQ肋排。食材新鮮，擺盤精美。在地人和遊客都推薦。\n\n旅遊提示：晚餐建議預約',
  },
  {
    name: 'Beachin Shrimp',
    name_en: 'Beachin Shrimp',
    type: 'food',
    category: '餐廳',
    duration_minutes: 60,
    opening_hours: { open: '10:30', close: '21:00' },
    tags: ['蝦料理', '夏威夷風', '蒜蓝蝦', '平價', 'IG打卡'],
    notes:
      '人氣蝦料理餐廳，夏威夷風味。招牌蒜蓉奶油蝦超級美味，配白飯絕配。價格親民，份量適中。裝潢可愛適合拍照。\n\n旅遊提示：蒜蓉奶油口味最受歡迎',
  },
  {
    name: '高空跳傘',
    name_en: 'Skydive Guam',
    type: 'attraction',
    category: '極限運動',
    duration_minutes: 180,
    opening_hours: { open: '08:00', close: '16:00' },
    tags: ['跳傘', '極限運動', '空拍', '刺激', '體驗'],
    notes:
      '從4000公尺高空跳下，俯瞰關島全景和蔚藍太平洋。有專業教練雙人跳傘，新手也能體驗。自由落體約60秒，終生難忘的體驗。\n\n旅遊提示：建議預約上午時段，天氣較穩定',
  },
  {
    name: '實彈射擊',
    name_en: 'Guam Shooting Range',
    type: 'attraction',
    category: '體驗活動',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '20:00' },
    tags: ['射擊', '體驗', '槍', '刺激', '美式'],
    notes:
      '關島合法的真槍實彈射擊體驗，有多家射擊場可選。從手槍到步槍各種槍械。有專業教練指導，安全有保障。是很多人關島必玩的項目。\n\n旅遊提示：WESTERN FRONTIER或GOA射擊場評價較好',
  },
  {
    name: '關島星沙海灘',
    name_en: 'Gun Beach',
    type: 'attraction',
    category: '海灘',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '浮潛', '星沙', '日落', '清靜'],
    notes:
      '比杜夢灣更清靜的海灘，以星型沙粒聞名。浮潛可看到豐富的海底生態。是看日落的絕佳地點。遊客較少，適合想放鬆的人。\n\n旅遊提示：傍晚來看日落特別美',
  },
]

async function main() {
  console.log('========================================')
  console.log('新增關島國家和景點')
  console.log('========================================')

  // 1. 新增關島國家
  console.log('\n🔄 新增關島國家...')
  const { error: countryError } = await supabase.from('countries').insert({
    id: 'guam',
    name: '關島',
    name_en: 'Guam',
    code: 'GU',
    region: 'Oceania',
    has_regions: false,
    is_active: true,
  })

  if (countryError) {
    if (countryError.message.includes('duplicate')) {
      console.log('  ⏭️ 關島已存在')
    } else {
      console.log('  ❌ 新增失敗:', countryError.message)
      return
    }
  } else {
    console.log('  ✅ 關島新增成功')
  }

  // 2. 新增景點
  console.log('\n🔄 新增關島景點...')
  let successCount = 0

  for (const attraction of guamAttractions) {
    const { error } = await supabase.from('attractions').insert({
      name: attraction.name,
      name_en: attraction.name_en,
      country_id: 'guam',
      type: attraction.type,
      category: attraction.category,
      duration_minutes: attraction.duration_minutes,
      opening_hours: attraction.opening_hours,
      tags: attraction.tags,
      notes: attraction.notes,
    })

    if (error) {
      if (error.message.includes('duplicate')) {
        console.log(`  ⏭️ ${attraction.name} (已存在)`)
      } else {
        console.log(`  ❌ ${attraction.name}: ${error.message}`)
      }
    } else {
      console.log(`  ✅ ${attraction.name}`)
      successCount++
    }
  }

  console.log(`\n📊 新增關島景點: ${successCount} 筆`)
  console.log('\n✅ 關島新增完成！')
}

main()
