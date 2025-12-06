const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

const attractions = [
  // ===== 成都網紅景點 =====
  {
    name: 'IFS熊貓（爬牆熊貓）',
    name_en: 'IFS Climbing Panda',
    description: '成都春熙路地標！美國藝術家設計的巨型大熊貓「I Am Here」趴在IFS大樓屋頂，超萌的黑白熊已成為成都必拍打卡點。從春熙路廣場抬頭就能看到，是成都最具代表性的網紅景點。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '網紅地標',
    tags: ['網紅', '地標', '熊貓', '打卡', '免費'],
    duration_minutes: 30,
    address: '成都市錦江區紅星路三段1號IFS',
    latitude: 30.6567,
    longitude: 104.0817,
    is_active: true,
    display_order: 30,
    notes: '在春熙路廣場抬頭即可看到',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '339電視塔（四川廣播電視塔）',
    name_en: 'Sichuan Radio & TV Tower',
    description: '成都第一高塔，高339米。塔頂觀景台可360度俯瞰成都全景，夜晚燈光秀絢麗。塔身造型獨特，是成都天際線的標誌性建築。塔內有旋轉餐廳。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '觀景地標',
    tags: ['地標', '觀景', '夜景', '燈光秀'],
    duration_minutes: 90,
    address: '成都市成華區猛追灣街168號',
    latitude: 30.6717,
    longitude: 104.0900,
    is_active: true,
    display_order: 31,
    notes: '夜晚燈光秀很美',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '交子大道',
    name_en: 'Jiaozi Avenue',
    description: '成都封面級景觀！全長1.7公里，背靠「天府雙塔」和「交子之環」。雙塔外立面有5.2萬㎡的LED屏幕，可呈現多元燈光秀。是成都時尚潮流、藝術文化活動最受歡迎的場地，經常舉辦消費節、藝術節、品牌路演等活動。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '商業街區',
    tags: ['網紅', '夜景', '燈光秀', '地標', '購物'],
    duration_minutes: 120,
    address: '成都市高新區交子大道',
    latitude: 30.5750,
    longitude: 104.0650,
    is_active: true,
    display_order: 32,
    notes: '天府雙塔LED燈光秀必看',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '環球中心',
    name_en: 'New Century Global Center',
    description: '曾是世界最大單體建築！集娛樂、購物、餐飲於一體的超大型綜合體。內有世界級海洋樂園「天堂島」、五星級酒店、IMAX影院。可以在室內體驗人造沙灘、衝浪。是大學生和觀光客必去商圈。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '購物娛樂',
    tags: ['購物', '海洋樂園', '室內沙灘', '親子', '網紅'],
    duration_minutes: 300,
    address: '成都市武侯區天府大道北段1700號',
    latitude: 30.5683,
    longitude: 104.0633,
    is_active: true,
    display_order: 33,
    notes: '天堂島海洋樂園適合親子',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '麓湖水城',
    name_en: 'Luxelakes Water Town',
    description: '成都新晉網紅打卡地！現代建築與自然景觀完美融合，有藝術博物館、設計感十足的商業區。A4美術館是成都最好的當代藝術空間之一。湖景優美，是拍照和週末休閒的好去處。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '文創園區',
    tags: ['網紅', '建築', '藝術', '湖景', '拍照'],
    duration_minutes: 180,
    address: '成都市天府新區麓湖生態城',
    latitude: 30.4833,
    longitude: 104.0500,
    is_active: true,
    display_order: 34,
    notes: 'A4美術館值得一看',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '天府藝術公園',
    name_en: 'Tianfu Art Park',
    description: '成都最美公園之一！由天府美術館、當代藝術館、人工湖組成。建築設計極具未來感，水天一色的湖景是網紅打卡熱點。免費開放，週末經常有藝術展覽和活動。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '藝術公園',
    tags: ['免費', '美術館', '湖景', '建築', '網紅'],
    duration_minutes: 180,
    address: '成都市金牛區金牛大道',
    latitude: 30.7167,
    longitude: 104.0333,
    is_active: true,
    display_order: 35,
    notes: '天府美術館建築超美',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '四川博物院',
    name_en: 'Sichuan Museum',
    description: '西南地區最大的綜合性博物館，收藏文物超過30萬件。張大千書畫館、巴蜀青銅器、漢代陶俑是三大亮點。免費參觀，週一閉館。需預約。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '博物館',
    tags: ['博物館', '免費', '張大千', '青銅器', '歷史'],
    duration_minutes: 180,
    address: '成都市青羊區浣花南路251號',
    latitude: 30.6600,
    longitude: 104.0233,
    is_active: true,
    display_order: 36,
    notes: '免費需預約，週一閉館',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '四川科技館',
    name_en: 'Sichuan Science and Technology Museum',
    description: '適合親子遊的科普展館，有航空航天、機器人、虛擬現實等互動展區。4D影院和球幕電影很受孩子喜愛。免費開放，週一閉館。',
    country_id: 'china',
    city_id: 'chengdu',
    category: '科技館',
    tags: ['科技', '親子', '免費', '互動', '4D影院'],
    duration_minutes: 180,
    address: '成都市青羊區人民中路一段16號',
    latitude: 30.6650,
    longitude: 104.0650,
    is_active: true,
    display_order: 37,
    notes: '親子必去，免費但需預約',
    workspace_id: WORKSPACE_ID
  },

  // ===== 重慶網紅景點 =====
  {
    name: '來福士廣場',
    name_en: 'Raffles City Chongqing',
    description: '重慶新地標！由8棟塔樓組成，頂部有橫跨四棟塔樓的「水晶連廊」，是世界最高的空中連廊。摩登現代的建築設計與老重慶形成鮮明對比。頂樓觀景台可俯瞰兩江交匯。「重慶之圓」是最美合影機位。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '購物娛樂',
    tags: ['地標', '購物', '觀景', '建築', '免費'],
    duration_minutes: 180,
    address: '重慶市渝中區朝天門廣場1號',
    latitude: 29.5650,
    longitude: 106.5850,
    is_active: true,
    display_order: 30,
    notes: '「重慶之圓」是最佳合影點',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '千廝門大橋',
    name_en: 'Qiansi Gate Bridge',
    description: '拍攝洪崖洞夜景的最佳位置！走在橋上可以眺望洪崖洞全景，燈光倒映在江面上，如夢如幻。亮燈時間19:30-21:30。建議傍晚6點就去卡位，攝影愛好者超多。免費。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '觀景地標',
    tags: ['夜景', '洪崖洞', '免費', '拍照', '必去'],
    duration_minutes: 60,
    address: '重慶市渝中區千廝門大橋',
    latitude: 29.5650,
    longitude: 106.5800,
    is_active: true,
    display_order: 31,
    notes: '拍洪崖洞夜景最佳位置',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '交通茶館',
    name_en: 'Jiaotong Teahouse',
    description: '重慶最有老味道的茶館！隱藏在黃桷坪區，穿過低調的門口，裡頭別有洞天。老舊磚瓦斑駁牆面，茶客坐在長凳上喝茶打牌。沏上一壺茶，品嚐復古情懷，感受傳承老重慶的最佳地方。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '茶館體驗',
    tags: ['茶館', '復古', '當地人推薦', '拍照', '老重慶'],
    duration_minutes: 90,
    address: '重慶市九龍坡區黃桷坪正街',
    latitude: 29.4967,
    longitude: 106.5133,
    is_active: true,
    display_order: 32,
    notes: '重慶最有老味道的茶館',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '重慶鐘書閣',
    name_en: 'Zhongshuge Bookstore Chongqing',
    description: '中國最美書店之一！2019年開幕，設計靈感來自重慶的山城地形。樓梯如同山路般蜿蜒，鏡面天花板營造出無限延伸的錯覺。每間鐘書閣都不一樣，重慶店堪稱最魔幻。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '網紅書店',
    tags: ['書店', '網紅', '建築', '拍照', '設計'],
    duration_minutes: 60,
    address: '重慶市南岸區中迪廣場3樓',
    latitude: 29.5450,
    longitude: 106.5933,
    is_active: true,
    display_order: 33,
    notes: '中國最美書店之一',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '皇冠大扶梯',
    name_en: 'Crown Escalator',
    description: '全亞洲第二長的扶梯！全長112米，垂直高度52米，搭乘一趟需2分30秒。連接兩路口和菜園壩火車站，是重慶人日常通勤工具。速度快坡度陡，體驗重慶特殊地形的獨特交通。票價2元。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '特色交通',
    tags: ['交通體驗', '亞洲之最', '打卡', '特色'],
    duration_minutes: 15,
    address: '重慶市渝中區兩路口',
    latitude: 29.5533,
    longitude: 106.5500,
    is_active: true,
    display_order: 34,
    notes: '亞洲第二長扶梯，2元/次',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '懷舊輪渡',
    name_en: 'Chongqing Retro Ferry',
    description: '體驗老重慶人的過江方式！比長江索道更有懷舊感，而且人少價格便宜。從朝天門碼頭出發，可以欣賞兩江四岸的風景。建議傍晚搭乘，看日落和夜景交替。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '特色交通',
    tags: ['交通體驗', '懷舊', '輪渡', '江景', '小眾'],
    duration_minutes: 30,
    address: '重慶市渝中區朝天門碼頭',
    latitude: 29.5650,
    longitude: 106.5867,
    is_active: true,
    display_order: 35,
    notes: '比長江索道人少便宜',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '重慶科技館',
    name_en: 'Chongqing Science and Technology Museum',
    description: '親子必去的科普展館！位於江北嘴，建築造型獨特像一艘帆船。生活科技、宇宙探索、兒童科技樂園等展區互動性強。免費開放，週一閉館。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '科技館',
    tags: ['科技', '親子', '免費', '互動', '江北嘴'],
    duration_minutes: 180,
    address: '重慶市江北區江北嘴文星門街7號',
    latitude: 29.5700,
    longitude: 106.5717,
    is_active: true,
    display_order: 36,
    notes: '親子必去，免費但需預約',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '重慶自然博物館',
    name_en: 'Chongqing Natural History Museum',
    description: '西部最大的自然博物館，新館位於北碚縉雲山下。恐龍化石是最大亮點，有完整的合川馬門溪龍骨架。還有地球奧秘、生命激流等展區。免費參觀。',
    country_id: 'china',
    city_id: 'chongqing',
    category: '博物館',
    tags: ['博物館', '免費', '恐龍', '親子', '自然'],
    duration_minutes: 180,
    address: '重慶市北碚區金華路398號',
    latitude: 29.8267,
    longitude: 106.4333,
    is_active: true,
    display_order: 37,
    notes: '恐龍化石是最大亮點',
    workspace_id: WORKSPACE_ID
  },

  // ===== 西安網紅景點 =====
  {
    name: '長安十二時辰主題街區',
    name_en: 'Chang\'an Twelve Hours Theme Street',
    description: '根據同名電視劇打造的沉浸式唐朝體驗街區！所有工作人員都穿著唐裝，遊客也可以租借漢服融入其中。有唐朝市集、表演、互動遊戲。門票約60元，含多項體驗。',
    country_id: 'china',
    city_id: 'xian',
    category: '主題街區',
    tags: ['沉浸式', '唐朝', '漢服', '體驗', '網紅'],
    duration_minutes: 240,
    address: '西安市曲江新區曼蒂廣場',
    latitude: 34.2100,
    longitude: 108.9700,
    is_active: true,
    display_order: 20,
    notes: '可穿漢服沉浸體驗唐朝',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '大明宮國家遺址公園',
    name_en: 'Daming Palace National Heritage Park',
    description: '唐代大明宮的遺址，曾有17位皇帝在此處理朝政長達200多年。武則天、唐高宗、太平公主都曾在宮中生活。公園分免費區和收費區，收費區有含元殿、宣政殿等遺址及博物館。',
    country_id: 'china',
    city_id: 'xian',
    category: '遺址公園',
    tags: ['唐代', '遺址', '歷史', '武則天', '博物館'],
    duration_minutes: 180,
    address: '西安市未央區自強東路585號',
    latitude: 34.2850,
    longitude: 108.9550,
    is_active: true,
    display_order: 21,
    notes: '唐代皇宮遺址',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '西安千古情景區',
    name_en: 'The Romance of Xi\'an',
    description: '由宋城演藝打造的大型演藝景區。《西安千古情》演出重現大唐盛世、絲綢之路等歷史場景，視覺效果震撼。景區內有紀年大道、天空之城、望湖閣等一步一景。',
    country_id: 'china',
    city_id: 'xian',
    category: '主題演藝',
    tags: ['演出', '千古情', '唐朝', '表演', '網紅'],
    duration_minutes: 300,
    address: '西安市浐灞生態區世博大道',
    latitude: 34.2867,
    longitude: 109.0567,
    is_active: true,
    display_order: 22,
    notes: '千古情演出必看',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '秦嶺野生動物園',
    name_en: 'Qinling Wildlife Park',
    description: '西北最大的野生動物園，集動物保護、科普教育、旅遊於一體。有大熊貓、金絲猴、朱鹮等珍稀動物。自駕區可近距離接觸動物。是西安親子遊的熱門選擇。',
    country_id: 'china',
    city_id: 'xian',
    category: '動物園',
    tags: ['動物園', '親子', '大熊貓', '自駕', '秦嶺'],
    duration_minutes: 300,
    address: '西安市長安區灃峪口',
    latitude: 34.0167,
    longitude: 108.9000,
    is_active: true,
    display_order: 23,
    notes: '有大熊貓和金絲猴',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '曲江海洋極地公園',
    name_en: 'Qujiang Polar Ocean Park',
    description: '西北最大的海洋主題公園，有極地動物館、海底隧道、海豚表演。企鵝、北極熊、白鯨等極地動物是亮點。適合親子遊，室內設施不受天氣影響。',
    country_id: 'china',
    city_id: 'xian',
    category: '海洋公園',
    tags: ['海洋', '親子', '室內', '極地動物', '表演'],
    duration_minutes: 240,
    address: '西安市雁塔區曲江二路',
    latitude: 34.2050,
    longitude: 108.9700,
    is_active: true,
    display_order: 24,
    notes: '西北最大海洋館',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '西安博物院',
    name_en: 'Xi\'an Museum',
    description: '小雁塔所在地，集博物館、名勝古蹟、城市公園於一體。館藏11萬餘件文物，周秦漢唐文物精品眾多。小雁塔是唐代佛塔，曾經歷三次地震自動癒合。免費參觀。',
    country_id: 'china',
    city_id: 'xian',
    category: '博物館',
    tags: ['博物館', '小雁塔', '免費', '唐代', '文物'],
    duration_minutes: 150,
    address: '西安市碑林區友誼西路72號',
    latitude: 34.2417,
    longitude: 108.9367,
    is_active: true,
    display_order: 25,
    notes: '小雁塔所在地，免費',
    workspace_id: WORKSPACE_ID
  },

  // ===== 長沙網紅景點 =====
  {
    name: '謝子龍影像藝術館',
    name_en: 'Xie Zilong Photography Museum',
    description: '中國最大的公益影像藝術館！建築由白色清水混凝土一次性現澆而成，是國內最白的清水混凝土建築。獲2019亞洲建築師協會金獎。位於洋湖濕地公園內，免費參觀。',
    country_id: 'china',
    city_id: 'changsha',
    category: '藝術館',
    tags: ['藝術', '攝影', '建築', '免費', '網紅'],
    duration_minutes: 120,
    address: '長沙市岳麓區瀟湘南路一段387號',
    latitude: 28.1500,
    longitude: 112.9167,
    is_active: true,
    display_order: 20,
    notes: '國內最白清水混凝土建築',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '李自健美術館',
    name_en: 'Li Zijian Art Museum',
    description: '全球最大的藝術家個人美術館！2024年接待觀眾超過138萬人次。「美術+音樂」是其特色，經常舉辦音樂會。免費參觀，建築本身也是藝術品，適合文青打卡。',
    country_id: 'china',
    city_id: 'changsha',
    category: '美術館',
    tags: ['美術館', '免費', '音樂會', '藝術', '網紅'],
    duration_minutes: 150,
    address: '長沙市岳麓區瀟湘南路',
    latitude: 28.1467,
    longitude: 112.9133,
    is_active: true,
    display_order: 21,
    notes: '全球最大藝術家個人美術館',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '馬欄山視頻文創產業園',
    name_en: 'Malanshan Video Culture Creative Park',
    description: '中國首個國家級視頻文創產業園，芒果TV、湖南衛視所在地。經常有明星出沒，是追星族的打卡地。可以參觀芒果城大樓外觀，運氣好能遇到節目錄製。',
    country_id: 'china',
    city_id: 'changsha',
    category: '文創園區',
    tags: ['湖南衛視', '芒果TV', '追星', '文創', '網紅'],
    duration_minutes: 90,
    address: '長沙市開福區馬欄山路',
    latitude: 28.2283,
    longitude: 113.0267,
    is_active: true,
    display_order: 22,
    notes: '湖南衛視、芒果TV所在地',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '湖南博物院',
    name_en: 'Hunan Museum',
    description: '中國八大博物館之一！馬王堆漢墓出土文物是鎮館之寶：辛追夫人千年不腐女屍、素紗襌衣（世界最輕的衣服，僅49克）。免費預約參觀，週一閉館。',
    country_id: 'china',
    city_id: 'changsha',
    category: '博物館',
    tags: ['博物館', '免費', '馬王堆', '辛追夫人', '國寶'],
    duration_minutes: 180,
    address: '長沙市開福區東風路50號',
    latitude: 28.2167,
    longitude: 112.9833,
    is_active: true,
    display_order: 23,
    notes: '辛追夫人必看，需預約',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '五一廣場',
    name_en: 'Wuyi Square',
    description: '長沙最熱鬧的商業中心！五一廣場站是最繁忙的地鐵站，周邊聚集太平老街、黃興路步行街。茶顏悅色、黑色經典臭豆腐隨處可見。是感受長沙繁華夜生活的最佳起點。',
    country_id: 'china',
    city_id: 'changsha',
    category: '商業廣場',
    tags: ['商業', '夜生活', '美食', '購物', '地標'],
    duration_minutes: 180,
    address: '長沙市芙蓉區五一廣場',
    latitude: 28.1950,
    longitude: 112.9767,
    is_active: true,
    display_order: 24,
    notes: '長沙最熱鬧的地方',
    workspace_id: WORKSPACE_ID
  },
  {
    name: 'IFS國金中心',
    name_en: 'Changsha IFS',
    description: '長沙最高端的購物中心，7樓有超大「KAWS同款雕塑」是網紅打卡點。頂樓可以看到長沙城市天際線。結合了國際大牌和本土網紅餐飲，是長沙潮人聚集地。',
    country_id: 'china',
    city_id: 'changsha',
    category: '購物娛樂',
    tags: ['購物', 'KAWS', '打卡', '潮流', '地標'],
    duration_minutes: 150,
    address: '長沙市芙蓉區解放西路188號',
    latitude: 28.1933,
    longitude: 112.9733,
    is_active: true,
    display_order: 25,
    notes: 'KAWS雕塑是網紅打卡點',
    workspace_id: WORKSPACE_ID
  },

  // ===== 深圳網紅景點 =====
  {
    name: '深圳人才公園',
    name_en: 'Shenzhen Talent Park',
    description: '深圳最美公園之一！位於春筍（深圳灣體育中心）腳下，有人才功勳牆、潮汐廣場、百傑山等景點。經常舉辦主題活動，如2025年初的Pokémon主題嘉年華有10米高卡比獸。免費開放。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '城市公園',
    tags: ['公園', '免費', '打卡', '活動', '網紅'],
    duration_minutes: 120,
    address: '深圳市南山區沙河西路',
    latitude: 22.5100,
    longitude: 113.9517,
    is_active: true,
    display_order: 20,
    notes: '經常有主題活動',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '前海石公園',
    name_en: 'Qianhai Stone Park',
    description: '深圳市區看海看日落的最佳去處！無邊際海景，黃昏時分特別浪漫。有粉黛草、狼尾草等花海，適合拍照。地標「前海石」是必拍點。免費開放。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '海濱公園',
    tags: ['海景', '日落', '免費', '花海', '拍照'],
    duration_minutes: 120,
    address: '深圳市南山區前灣一路',
    latitude: 22.5267,
    longitude: 113.8967,
    is_active: true,
    display_order: 21,
    notes: '日落時分最美',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '官湖村',
    name_en: 'Guanhu Village',
    description: '深圳的「小鎌倉」！多姿多彩的民宿和與鎌倉車站相似的十字路口，吸引大量網紅打卡。面臨大鵬灣，對面是香港塔門。是海邊拍攝、享受寧靜的好地方。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '濱海村落',
    tags: ['小鎌倉', '海邊', '民宿', '拍照', '網紅'],
    duration_minutes: 240,
    address: '深圳市大鵬新區葵涌街道官湖村',
    latitude: 22.5500,
    longitude: 114.4167,
    is_active: true,
    display_order: 22,
    notes: '深圳的「小鎌倉」',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '楊梅坑',
    name_en: 'Yangmeikeng',
    description: '深圳最美海岸線之一！壯闘海景、曲折海岸線、綠意盎然的海岸公路。可以騎單車沿海濱漫遊，也可以去鹿嘴山莊看日落。是攝影愛好者的天堂。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '海濱景區',
    tags: ['海岸', '騎車', '日落', '攝影', '自然'],
    duration_minutes: 300,
    address: '深圳市大鵬新區南澳街道楊梅坑',
    latitude: 22.5550,
    longitude: 114.4833,
    is_active: true,
    display_order: 23,
    notes: '深圳最美海岸線',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '較場尾',
    name_en: 'Jiaochangwei',
    description: '深圳唯一有海岸線的村落！民宿林立，每棟都有不同風格。沙灘柔軟，可以游泳、玩水上活動。週末非常熱鬧，適合度假放鬆。建議住一晚體驗。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '濱海村落',
    tags: ['沙灘', '民宿', '度假', '週末遊', '水上活動'],
    duration_minutes: 480,
    address: '深圳市大鵬新區大鵬街道較場尾',
    latitude: 22.5833,
    longitude: 114.4833,
    is_active: true,
    display_order: 24,
    notes: '建議住一晚',
    workspace_id: WORKSPACE_ID
  },
  {
    name: 'teamLab共創！未來園',
    name_en: 'teamLab Future Park',
    description: '知名的沉浸式光影互動藝術展！設有10個主題場景及互動裝置，光影與藝術的完美結合。適合親子、情侶、閨蜜。拍照超級出片！',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '藝術展覽',
    tags: ['teamLab', '沉浸式', '光影', '互動', '網紅'],
    duration_minutes: 150,
    address: '深圳市福田區下沙',
    latitude: 22.5267,
    longitude: 114.0433,
    is_active: true,
    display_order: 25,
    notes: '光影藝術展，超級出片',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '深圳博物館',
    name_en: 'Shenzhen Museum',
    description: '了解深圳從小漁村到國際大都市發展歷程的最佳場所！古代深圳、近代深圳、深圳改革開放史等展區。免費參觀，週一閉館。有老館和新館兩個館址。',
    country_id: 'china',
    city_id: 'shenzhen',
    category: '博物館',
    tags: ['博物館', '免費', '深圳歷史', '改革開放'],
    duration_minutes: 150,
    address: '深圳市福田區福中路市民中心A區',
    latitude: 22.5433,
    longitude: 114.0583,
    is_active: true,
    display_order: 26,
    notes: '了解深圳發展史',
    workspace_id: WORKSPACE_ID
  },

  // ===== 廣州網紅景點 =====
  {
    name: '廣州K11',
    name_en: 'Guangzhou K11',
    description: '廣州網紅打卡地！東門處有一個約1米多高的石階，站上去抬頭可以拍到「三件套」大樓直入雲霄的震撼畫面。曾因阿童木藝術展一晚上百人打卡，甚至吸引旅行社帶團前往。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '購物娛樂',
    tags: ['購物', '打卡', '三件套', '網紅', '藝術'],
    duration_minutes: 150,
    address: '廣州市天河區珠江東路6號',
    latitude: 23.1200,
    longitude: 113.3217,
    is_active: true,
    display_order: 20,
    notes: '「三件套」打卡必去',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '獵德大橋',
    name_en: 'Liede Bridge',
    description: '拍攝珠江新城、海心沙、廣州塔的絕佳機位！視野開闊，可同時拍到廣州珠江兩岸地標。日出、日落、晚霞時分都是攝影師最愛的時刻。免費，從海心橋步行約1.5km可達。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '觀景地標',
    tags: ['拍照', '日落', '夜景', '免費', '攝影'],
    duration_minutes: 60,
    address: '廣州市天河區獵德大橋',
    latitude: 23.1117,
    longitude: 113.3350,
    is_active: true,
    display_order: 21,
    notes: '拍廣州塔最佳位置',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '海心沙',
    name_en: 'Haixinsha Island',
    description: '2010年廣州亞運會開幕式場館，現為文化勝地。島上可以近距離觀賞廣州塔，是珠江夜遊的中轉站。經常舉辦演唱會、音樂節等大型活動。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '文化地標',
    tags: ['地標', '亞運', '演唱會', '廣州塔', '夜景'],
    duration_minutes: 90,
    address: '廣州市天河區臨江大道',
    latitude: 23.1133,
    longitude: 113.3217,
    is_active: true,
    display_order: 22,
    notes: '經常有演唱會、音樂節',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '花城廣場',
    name_en: 'Huacheng Square',
    description: '廣州城市客廳！被省博、圖書館、歌劇院、K11、廣州塔、海心沙包圍。綠意環繞，高樓聳立，是感受廣州現代都市魅力的最佳地點。夜景尤其美麗。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '城市廣場',
    tags: ['廣場', '地標', '夜景', '免費', '都市'],
    duration_minutes: 90,
    address: '廣州市天河區花城廣場',
    latitude: 23.1183,
    longitude: 113.3200,
    is_active: true,
    display_order: 23,
    notes: '廣州城市客廳',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '珠江琶醍',
    name_en: 'Party Pier',
    description: '廣州最時尚的酒吧街！位於珠江南岸，由舊啤酒廠改造。酒吧、餐廳林立，夜晚燈火輝煌。可以一邊喝酒一邊欣賞對岸的珠江新城夜景。適合夜生活體驗。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '夜生活',
    tags: ['酒吧', '夜生活', '江景', '餐廳', '時尚'],
    duration_minutes: 180,
    address: '廣州市海珠區閱江西路118號',
    latitude: 23.1050,
    longitude: 113.3283,
    is_active: true,
    display_order: 24,
    notes: '廣州最時尚的酒吧街',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '珠江夜遊',
    name_en: 'Pearl River Night Cruise',
    description: '廣州夜景精華！乘船從珠江西及白鵝潭到廣州大橋，沿途欣賞嶺南古建築群、珠江新城、廣州塔。猶如一道十里畫廊，是感受廣州璀璨夜景的最佳方式。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '遊船體驗',
    tags: ['夜遊', '珠江', '夜景', '遊船', '必體驗'],
    duration_minutes: 90,
    address: '廣州市海珠區天字碼頭',
    latitude: 23.1133,
    longitude: 113.2650,
    is_active: true,
    display_order: 25,
    notes: '必體驗珠江夜景',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '廣東省博物館',
    name_en: 'Guangdong Museum',
    description: '華南地區最大的博物館！外觀像一個精美的漆盒，設計獨特。廣東歷史文化、自然資源、嶺南工藝、潮州木雕等展區內容豐富。免費預約參觀，週一閉館。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '博物館',
    tags: ['博物館', '免費', '嶺南文化', '建築', '文物'],
    duration_minutes: 180,
    address: '廣州市天河區珠江東路2號',
    latitude: 23.1183,
    longitude: 113.3267,
    is_active: true,
    display_order: 26,
    notes: '華南最大博物館，免費',
    workspace_id: WORKSPACE_ID
  },
  {
    name: '廣州圖書館',
    name_en: 'Guangzhou Library',
    description: '世界最大的城市公共圖書館之一！建築外觀獨特，內部空間寬敞明亮。有咖啡廳、兒童區、音樂區等。是廣州人週末休閒的好去處。免費開放。',
    country_id: 'china',
    city_id: 'guangzhou',
    category: '文化設施',
    tags: ['圖書館', '免費', '建築', '休閒', '親子'],
    duration_minutes: 120,
    address: '廣州市天河區珠江東路4號',
    latitude: 23.1200,
    longitude: 113.3233,
    is_active: true,
    display_order: 27,
    notes: '世界最大城市公共圖書館之一',
    workspace_id: WORKSPACE_ID
  }
]

async function importAttractions() {
  console.log(`開始匯入 ${attractions.length} 個網紅/博物館景點...`)
  console.log('')

  const batchSize = 10
  let successCount = 0
  let errorCount = 0
  let skipCount = 0

  for (let i = 0; i < attractions.length; i += batchSize) {
    const batch = attractions.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1

    const { data, error } = await supabase
      .from('attractions')
      .insert(batch)
      .select('id, name, city_id')

    if (error) {
      if (error.message.includes('duplicate key')) {
        console.log(`批次 ${batchNum}: 部分景點已存在，逐一處理...`)
        for (const item of batch) {
          const { data: singleData, error: singleError } = await supabase
            .from('attractions')
            .insert(item)
            .select('id, name')

          if (singleError) {
            if (singleError.message.includes('duplicate')) {
              skipCount++
            } else {
              console.error(`  ❌ ${item.name}: ${singleError.message}`)
              errorCount++
            }
          } else {
            console.log(`  ✅ ${item.name}`)
            successCount++
          }
        }
      } else {
        console.error(`批次 ${batchNum} 錯誤:`, error.message)
        errorCount += batch.length
      }
    } else {
      console.log(`批次 ${batchNum} 成功: ${data.map(d => d.name).join(', ')}`)
      successCount += data.length
    }
  }

  console.log('')
  console.log('========================================')
  console.log(`匯入完成！`)
  console.log(`  ✅ 新增成功: ${successCount} 個`)
  console.log(`  ⏭️  跳過(已存在): ${skipCount} 個`)
  console.log(`  ❌ 失敗: ${errorCount} 個`)
  console.log('========================================')
}

importAttractions()
