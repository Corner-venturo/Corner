const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

const moreAttractions = [
  // ============================================================
  // 菲律賓 - 宿霧
  // ============================================================
  { country_id: 'philippines', city_id: 'cebu', name: '奧斯洛布鯨鯊村', name_en: 'Oslob Whale Shark Watching', type: 'attraction', description: '與鯨鯊共游，超近距離體驗' },
  { country_id: 'philippines', city_id: 'cebu', name: '川山瀑布', name_en: 'Kawasan Falls', type: 'attraction', description: '層疊瀑布，溪降體驗' },
  { country_id: 'philippines', city_id: 'cebu', name: '聖嬰教堂', name_en: 'Basilica del Santo Nino', type: 'temple', description: '菲律賓最古老教堂' },
  { country_id: 'philippines', city_id: 'cebu', name: '麥哲倫十字架', name_en: 'Magellans Cross', type: 'heritage', description: '1521年麥哲倫豎立' },
  { country_id: 'philippines', city_id: 'cebu', name: '聖彼得堡', name_en: 'Fort San Pedro', type: 'heritage', description: '西班牙殖民堡壘' },
  { country_id: 'philippines', city_id: 'cebu', name: '道教廟', name_en: 'Taoist Temple', type: 'temple', description: '華人道教聖地' },
  { country_id: 'philippines', city_id: 'cebu', name: '墨寶沙丁魚風暴', name_en: 'Moalboal Sardine Run', type: 'attraction', description: '百萬沙丁魚群' },
  { country_id: 'philippines', city_id: 'cebu', name: '蘇米龍島', name_en: 'Sumilon Island', type: 'beach', description: '白沙沙洲，浮潛天堂' },
  { country_id: 'philippines', city_id: 'cebu', name: 'IT Park', name_en: 'IT Park', type: 'shopping', description: '美食夜市，現代商圈' },
  { country_id: 'philippines', city_id: 'cebu', name: '科隆街', name_en: 'Colon Street', type: 'shopping', description: '菲律賓最古老商業街' },
  { country_id: 'philippines', city_id: 'cebu', name: '薄荷島一日遊', name_en: 'Bohol Day Tour', type: 'attraction', description: '從宿霧出發' },
  { country_id: 'philippines', city_id: 'cebu', name: '馬克坦神社', name_en: 'Mactan Shrine', type: 'heritage', description: '拉普拉普酋長戰勝麥哲倫處' },

  // ============================================================
  // 菲律賓 - 薄荷島
  // ============================================================
  { country_id: 'philippines', city_id: 'bohol', name: '巧克力山', name_en: 'Chocolate Hills', type: 'landmark', description: '1776座圓錐形山丘' },
  { country_id: 'philippines', city_id: 'bohol', name: '眼鏡猴保護區', name_en: 'Tarsier Sanctuary', type: 'attraction', description: '世界最小靈長類' },
  { country_id: 'philippines', city_id: 'bohol', name: '羅伯克河遊船', name_en: 'Loboc River Cruise', type: 'attraction', description: '叢林遊河午餐' },
  { country_id: 'philippines', city_id: 'bohol', name: '巴卡容教堂', name_en: 'Baclayon Church', type: 'temple', description: '菲律賓最古老石造教堂' },
  { country_id: 'philippines', city_id: 'bohol', name: '人造森林', name_en: 'Bilar Man-Made Forest', type: 'park', description: '兩公里桃花心木林道' },
  { country_id: 'philippines', city_id: 'bohol', name: '阿羅娜海灘', name_en: 'Alona Beach', type: 'beach', description: '薄荷島主海灘' },
  { country_id: 'philippines', city_id: 'bohol', name: '巴里卡薩島', name_en: 'Balicasag Island', type: 'beach', description: '潛水聖地，大斷層' },
  { country_id: 'philippines', city_id: 'bohol', name: '處女島', name_en: 'Virgin Island', type: 'beach', description: '退潮沙洲，海膽料理' },
  { country_id: 'philippines', city_id: 'bohol', name: '血盟紀念碑', name_en: 'Blood Compact Monument', type: 'heritage', description: '西班牙與薄荷島結盟' },
  { country_id: 'philippines', city_id: 'bohol', name: '蜜蜂農場', name_en: 'Bee Farm', type: 'attraction', description: '有機農場餐廳' },
  { country_id: 'philippines', city_id: 'bohol', name: '邦勞島', name_en: 'Panglao Island', type: 'beach', description: '度假村集中區' },

  // ============================================================
  // 菲律賓 - 長灘島
  // ============================================================
  { country_id: 'philippines', city_id: 'boracay', name: '白沙灘', name_en: 'White Beach', type: 'beach', description: '亞洲最美白沙灘' },
  { country_id: 'philippines', city_id: 'boracay', name: 'D Mall', name_en: 'D Mall', type: 'shopping', description: '長灘島購物中心' },
  { country_id: 'philippines', city_id: 'boracay', name: '普卡海灘', name_en: 'Puka Beach', type: 'beach', description: '貝殼海灘' },
  { country_id: 'philippines', city_id: 'boracay', name: '鱷魚島', name_en: 'Crocodile Island', type: 'attraction', description: '浮潛看珊瑚' },
  { country_id: 'philippines', city_id: 'boracay', name: '魔術島', name_en: 'Magic Island', type: 'attraction', description: '跳水聖地' },
  { country_id: 'philippines', city_id: 'boracay', name: '長灘島日落帆船', name_en: 'Sunset Sailing', type: 'attraction', description: '螃蟹船看夕陽' },
  { country_id: 'philippines', city_id: 'boracay', name: '阿里爾角', name_en: 'Ariels Point', type: 'attraction', description: '跳水派對' },
  { country_id: 'philippines', city_id: 'boracay', name: '盧霍山觀景台', name_en: 'Mount Luho', type: 'viewpoint', description: '長灘島最高點' },
  { country_id: 'philippines', city_id: 'boracay', name: '貝殼博物館', name_en: 'Shell Museum', type: 'museum', description: '稀有貝殼收藏' },
  { country_id: 'philippines', city_id: 'boracay', name: '飛魚體驗', name_en: 'Flyfish', type: 'attraction', description: '水上飛行體驗' },
  { country_id: 'philippines', city_id: 'boracay', name: '香蕉船', name_en: 'Banana Boat', type: 'attraction', description: '刺激水上活動' },
  { country_id: 'philippines', city_id: 'boracay', name: '水晶洞', name_en: 'Crystal Cove', type: 'attraction', description: '島嶼洞穴探險' },

  // ============================================================
  // 土耳其 - 伊斯坦堡
  // ============================================================
  { country_id: 'turkey', city_id: 'istanbul', name: '藍色清真寺', name_en: 'Blue Mosque', type: 'temple', description: '六座宣禮塔，藍色瓷磚' },
  { country_id: 'turkey', city_id: 'istanbul', name: '聖索菲亞大教堂', name_en: 'Hagia Sophia', type: 'temple', description: '拜占庭建築傑作' },
  { country_id: 'turkey', city_id: 'istanbul', name: '托普卡匹皇宮', name_en: 'Topkapi Palace', type: 'heritage', description: '奧斯曼帝國皇宮' },
  { country_id: 'turkey', city_id: 'istanbul', name: '地下水宮殿', name_en: 'Basilica Cistern', type: 'heritage', description: '美杜莎石柱' },
  { country_id: 'turkey', city_id: 'istanbul', name: '大巴扎', name_en: 'Grand Bazaar', type: 'market', description: '世界最大室內市場之一' },
  { country_id: 'turkey', city_id: 'istanbul', name: '香料市場', name_en: 'Spice Bazaar', type: 'market', description: '埃及市場，香料天堂' },
  { country_id: 'turkey', city_id: 'istanbul', name: '加拉達塔', name_en: 'Galata Tower', type: 'landmark', description: '中世紀石塔，城市全景' },
  { country_id: 'turkey', city_id: 'istanbul', name: '博斯普魯斯海峽遊船', name_en: 'Bosphorus Cruise', type: 'attraction', description: '橫跨歐亞大陸' },
  { country_id: 'turkey', city_id: 'istanbul', name: '多爾瑪巴赫切宮', name_en: 'Dolmabahce Palace', type: 'heritage', description: '奧斯曼帝國末期皇宮' },
  { country_id: 'turkey', city_id: 'istanbul', name: '塔克西姆廣場', name_en: 'Taksim Square', type: 'landmark', description: '伊斯坦堡心臟' },
  { country_id: 'turkey', city_id: 'istanbul', name: '獨立大街', name_en: 'Istiklal Street', type: 'shopping', description: '步行購物街' },
  { country_id: 'turkey', city_id: 'istanbul', name: '蘇萊曼清真寺', name_en: 'Suleymaniye Mosque', type: 'temple', description: '奧斯曼帝國最大清真寺' },
  { country_id: 'turkey', city_id: 'istanbul', name: '皮埃爾洛蒂山', name_en: 'Pierre Loti Hill', type: 'viewpoint', description: '金角灣全景' },
  { country_id: 'turkey', city_id: 'istanbul', name: '卡德柯伊', name_en: 'Kadikoy', type: 'attraction', description: '亞洲區文青區' },

  // ============================================================
  // 土耳其 - 卡帕多奇亞
  // ============================================================
  { country_id: 'turkey', city_id: 'cappadocia', name: '熱氣球之旅', name_en: 'Hot Air Balloon', type: 'attraction', description: '世界最佳熱氣球地點' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '格雷梅露天博物館', name_en: 'Goreme Open Air Museum', type: 'heritage', description: '世界遺產，洞穴教堂' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '烏奇沙城堡', name_en: 'Uchisar Castle', type: 'heritage', description: '區域最高點，岩石城堡' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '凱馬克利地下城', name_en: 'Kaymakli Underground City', type: 'heritage', description: '八層地下城市' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '德林庫尤地下城', name_en: 'Derinkuyu Underground City', type: 'heritage', description: '最深地下城' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '愛情谷', name_en: 'Love Valley', type: 'attraction', description: '蘑菇狀岩石' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '鴿子谷', name_en: 'Pigeon Valley', type: 'attraction', description: '鴿舍岩洞' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '帕夏巴', name_en: 'Pasabag', type: 'attraction', description: '精靈煙囪' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '阿瓦諾斯', name_en: 'Avanos', type: 'attraction', description: '陶藝小鎮' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '洞穴飯店', name_en: 'Cave Hotel', type: 'attraction', description: '獨特洞穴住宿體驗' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '玫瑰谷', name_en: 'Rose Valley', type: 'attraction', description: '粉紅色岩石，日落美景' },
  { country_id: 'turkey', city_id: 'cappadocia', name: '土耳其之夜', name_en: 'Turkish Night', type: 'attraction', description: '洞穴餐廳，旋轉舞表演' },

  // ============================================================
  // 土耳其 - 棉堡
  // ============================================================
  { country_id: 'turkey', city_id: 'pamukkale', name: '棉堡石灰華梯田', name_en: 'Pamukkale Travertines', type: 'attraction', description: '世界遺產，白色梯田' },
  { country_id: 'turkey', city_id: 'pamukkale', name: '希拉波利斯古城', name_en: 'Hierapolis', type: 'heritage', description: '古羅馬溫泉城' },
  { country_id: 'turkey', city_id: 'pamukkale', name: '克麗奧帕特拉溫泉池', name_en: 'Cleopatra Pool', type: 'attraction', description: '古羅馬遺跡溫泉' },

  // ============================================================
  // 埃及 - 開羅
  // ============================================================
  { country_id: 'egypt', city_id: 'cairo', name: '埃及博物館', name_en: 'Egyptian Museum', type: 'museum', description: '圖坦卡門黃金面具' },
  { country_id: 'egypt', city_id: 'cairo', name: '薩拉丁城堡', name_en: 'Saladin Citadel', type: 'heritage', description: '中世紀伊斯蘭堡壘' },
  { country_id: 'egypt', city_id: 'cairo', name: '穆罕默德阿里清真寺', name_en: 'Mosque of Muhammad Ali', type: 'temple', description: '開羅地標' },
  { country_id: 'egypt', city_id: 'cairo', name: '哈利利市場', name_en: 'Khan el-Khalili', type: 'market', description: '中東最古老市場之一' },
  { country_id: 'egypt', city_id: 'cairo', name: '尼羅河遊船', name_en: 'Nile River Cruise', type: 'attraction', description: '晚餐遊船' },
  { country_id: 'egypt', city_id: 'cairo', name: '阿茲哈爾清真寺', name_en: 'Al-Azhar Mosque', type: 'temple', description: '伊斯蘭世界最古老大學' },
  { country_id: 'egypt', city_id: 'cairo', name: '開羅塔', name_en: 'Cairo Tower', type: 'landmark', description: '城市全景觀景台' },
  { country_id: 'egypt', city_id: 'cairo', name: '科普特區', name_en: 'Coptic Cairo', type: 'heritage', description: '基督教古蹟' },
  { country_id: 'egypt', city_id: 'cairo', name: '聖喬治教堂', name_en: 'Church of St George', type: 'temple', description: '希臘東正教教堂' },
  { country_id: 'egypt', city_id: 'cairo', name: '懸空教堂', name_en: 'Hanging Church', type: 'temple', description: '科普特基督教教堂' },

  // ============================================================
  // 埃及 - 吉薩
  // ============================================================
  { country_id: 'egypt', city_id: 'giza', name: '吉薩金字塔群', name_en: 'Giza Pyramids', type: 'heritage', description: '古代世界七大奇蹟唯一倖存' },
  { country_id: 'egypt', city_id: 'giza', name: '大金字塔', name_en: 'Great Pyramid of Khufu', type: 'heritage', description: '法老胡夫金字塔' },
  { country_id: 'egypt', city_id: 'giza', name: '獅身人面像', name_en: 'Sphinx', type: 'heritage', description: '神秘守護者' },
  { country_id: 'egypt', city_id: 'giza', name: '太陽船博物館', name_en: 'Solar Boat Museum', type: 'museum', description: '法老的太陽船' },
  { country_id: 'egypt', city_id: 'giza', name: '大埃及博物館', name_en: 'Grand Egyptian Museum', type: 'museum', description: '世界最大考古博物館' },
  { country_id: 'egypt', city_id: 'giza', name: '金字塔聲光秀', name_en: 'Pyramids Sound and Light Show', type: 'attraction', description: '夜間燈光表演' },

  // ============================================================
  // 埃及 - 路克索
  // ============================================================
  { country_id: 'egypt', city_id: 'luxor', name: '卡納克神廟', name_en: 'Karnak Temple', type: 'heritage', description: '古埃及最大神廟' },
  { country_id: 'egypt', city_id: 'luxor', name: '路克索神廟', name_en: 'Luxor Temple', type: 'heritage', description: '夜間照明壯觀' },
  { country_id: 'egypt', city_id: 'luxor', name: '帝王谷', name_en: 'Valley of the Kings', type: 'heritage', description: '法老陵墓群' },
  { country_id: 'egypt', city_id: 'luxor', name: '女王神廟', name_en: 'Temple of Hatshepsut', type: 'heritage', description: '哈特謝普蘇特女王神廟' },
  { country_id: 'egypt', city_id: 'luxor', name: '曼農巨像', name_en: 'Colossi of Memnon', type: 'heritage', description: '雙座巨型石像' },
  { country_id: 'egypt', city_id: 'luxor', name: '路克索熱氣球', name_en: 'Luxor Hot Air Balloon', type: 'attraction', description: '俯瞰帝王谷' },
  { country_id: 'egypt', city_id: 'luxor', name: '路克索博物館', name_en: 'Luxor Museum', type: 'museum', description: '古埃及文物' },
  { country_id: 'egypt', city_id: 'luxor', name: '尼羅河三桅帆船', name_en: 'Felucca Ride', type: 'attraction', description: '傳統帆船體驗' },

  // ============================================================
  // 埃及 - 亞斯文
  // ============================================================
  { country_id: 'egypt', city_id: 'aswan', name: '亞斯文高壩', name_en: 'Aswan High Dam', type: 'landmark', description: '世界最大水壩之一' },
  { country_id: 'egypt', city_id: 'aswan', name: '菲萊神廟', name_en: 'Philae Temple', type: 'heritage', description: '伊西斯女神神廟' },
  { country_id: 'egypt', city_id: 'aswan', name: '未完成方尖碑', name_en: 'Unfinished Obelisk', type: 'heritage', description: '古埃及石材開採場' },
  { country_id: 'egypt', city_id: 'aswan', name: '努比亞村', name_en: 'Nubian Village', type: 'attraction', description: '彩色房屋，努比亞文化' },
  { country_id: 'egypt', city_id: 'aswan', name: '象島', name_en: 'Elephantine Island', type: 'attraction', description: '尼羅河中小島' },
  { country_id: 'egypt', city_id: 'aswan', name: '亞斯文植物園', name_en: 'Aswan Botanical Garden', type: 'park', description: '基奇納島' },

  // ============================================================
  // 埃及 - 阿布辛貝
  // ============================================================
  { country_id: 'egypt', city_id: 'abu-simbel', name: '阿布辛貝神廟', name_en: 'Abu Simbel Temples', type: 'heritage', description: '拉美西斯二世巨型石像' },
  { country_id: 'egypt', city_id: 'abu-simbel', name: '哈索爾神廟', name_en: 'Temple of Hathor', type: 'heritage', description: '奈費塔莉王后神廟' },
  { country_id: 'egypt', city_id: 'abu-simbel', name: '阿布辛貝聲光秀', name_en: 'Abu Simbel Sound and Light', type: 'attraction', description: '神廟夜間表演' }
]

async function importMore() {
  console.log('========================================')
  console.log('  擴充景點資料庫')
  console.log('  總數: ' + moreAttractions.length + ' 個景點')
  console.log('========================================')
  console.log('')

  let success = 0
  let skipped = 0
  let failed = 0

  for (const attr of moreAttractions) {
    const { error } = await supabase
      .from('attractions')
      .insert({
        ...attr,
        workspace_id
      })

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        console.log('❌ ' + attr.name + ': ' + error.message)
        failed++
      }
    } else {
      console.log('✅ ' + attr.name + ' (' + attr.city_id + ')')
      success++
    }
  }

  console.log('')
  console.log('========================================')
  console.log('  導入完成！')
  console.log('  成功: ' + success + ' 個')
  console.log('  已存在: ' + skipped + ' 個')
  console.log('  失敗: ' + failed + ' 個')
  console.log('========================================')

  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  console.log('')
  console.log('資料庫總景點數: ' + count + ' 個')
}

importMore()
