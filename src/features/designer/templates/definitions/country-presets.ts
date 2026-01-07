/**
 * 國家別預設備忘錄內容
 *
 * 根據不同國家提供預設的旅遊提醒內容
 * 使用者可以勾選啟用/停用各個項目
 */
import type { CountryCode, MemoSettings, MemoItem, SeasonInfo, MemoInfoItem } from './types'

// ============================================
// 日本 (JP)
// ============================================
const japanMemoSettings: MemoSettings = {
  title: '日本旅遊小提醒',
  subtitle: 'Travel Tips',
  headerIcon: 'local_florist',
  footerText: '旅の心得 • 溫馨筆記',
  items: [
    // 禮儀類
    {
      id: 'jp-etiquette-1',
      category: 'etiquette',
      icon: 'volume_off',
      title: '電車内では静かに',
      titleZh: '電車保持安靜',
      content: '搭乘電車時請保持安靜，將手機設為靜音模式。避免通話或大聲喧嘩，這是日本通勤的基本禮儀。',
      enabled: true,
    },
    {
      id: 'jp-etiquette-2',
      category: 'etiquette',
      icon: 'footprint',
      title: '土足厳禁',
      titleZh: '脫鞋入室',
      content: '進入室內玄關、榻榻米區域或更衣室時，請務必脫鞋。脫下的鞋子請將鞋尖朝外，整齊擺放。',
      enabled: true,
    },
    {
      id: 'jp-etiquette-3',
      category: 'etiquette',
      icon: 'delete_outline',
      title: 'ゴミは持ち帰る',
      titleZh: '垃圾自行帶走',
      content: '街道上垃圾桶較少，請隨身攜帶塑膠袋，將垃圾帶回飯店處理。請勿在路上邊走邊吃。',
      enabled: true,
    },
    {
      id: 'jp-etiquette-4',
      category: 'etiquette',
      icon: 'photo_camera',
      title: '撮影のマナー',
      titleZh: '攝影禮儀',
      content: '在私人道路、神社禁止區域，或面對藝妓、舞妓時，請勿未經允許隨意拍照，請保持尊重的距離。',
      enabled: true,
    },
    // 航空/行李類
    {
      id: 'jp-flight-1',
      category: 'flight',
      icon: 'schedule',
      title: '空港到着時間',
      titleZh: '報到時間',
      content: '請務必於起飛前 2-3 小時抵達機場辦理登機手續，以免因安檢排隊延誤。',
      enabled: true,
    },
    {
      id: 'jp-flight-2',
      category: 'flight',
      icon: 'water_drop',
      title: '液体の持ち込み',
      titleZh: '隨身液體限制',
      content: '搭乘國際線，隨身攜帶之液體、膠狀及噴霧類物品，每瓶不可超過 100ml，且需全部裝入一個 1 公升以下可重複密封的透明塑膠袋中。',
      enabled: true,
    },
    {
      id: 'jp-flight-3',
      category: 'flight',
      icon: 'phone_iphone',
      title: 'オンラインチェックイン',
      titleZh: '線上報到',
      content: '建議事先透過航空 APP 完成 Online Check-in，可節省現場排隊時間。',
      enabled: true,
    },
    {
      id: 'jp-flight-4',
      category: 'flight',
      icon: 'scale',
      title: '重量制限',
      titleZh: '託運重量',
      content: '一般經濟艙託運約為 23kg（依各航空公司規定為主），超重費通常較高，建議出發前確認。',
      enabled: true,
    },
    {
      id: 'jp-flight-5',
      category: 'flight',
      icon: 'battery_alert',
      title: 'リチウム電池',
      titleZh: '嚴禁託運',
      content: '鋰電池、行動電源、電子菸務必「隨身攜帶」上飛機，不可放入託運行李。',
      enabled: true,
    },
    {
      id: 'jp-flight-6',
      category: 'flight',
      icon: 'block',
      title: '禁止品',
      titleZh: '違禁品',
      content: '肉類製品（含肉乾、肉鬆）、新鮮蔬果、植物種子等嚴禁攜帶入境日本，違者將面臨高額罰款。',
      enabled: true,
    },
    {
      id: 'jp-flight-7',
      category: 'flight',
      icon: 'local_fire_department',
      title: 'ライター',
      titleZh: '打火機',
      content: '每人限隨身攜帶 1 個（傳統型），防風打火機（藍焰）禁止攜帶。',
      enabled: true,
    },
  ],
  seasons: [
    {
      season: 'spring',
      icon: 'local_florist',
      iconColor: '#f9a8d4',
      months: '3-5月',
      description: '氣溫漸暖但早晚仍涼，建議穿著薄外套或風衣。櫻花季人潮眾多，需提早訂房。',
      enabled: true,
    },
    {
      season: 'summer',
      icon: 'wb_sunny',
      iconColor: '#fdba74',
      months: '6-8月',
      description: '梅雨季悶熱潮濕，盛夏高溫可達35度。建議透氣衣物，並隨身攜帶陽傘與補充水分。',
      enabled: true,
    },
    {
      season: 'autumn',
      icon: 'spa',
      iconColor: '#d97706',
      months: '9-11月',
      description: '氣候舒爽，賞楓季節早晚溫差大。建議多層次穿搭，攜帶輕便保暖外套。',
      enabled: true,
    },
    {
      season: 'winter',
      icon: 'ac_unit',
      iconColor: '#38bdf8',
      months: '12-2月',
      description: '乾燥寒冷，室內暖氣強。建議採取「洋蔥式穿法」，必備保暖大衣、圍巾與手套。',
      enabled: true,
    },
  ],
  infoItems: [
    {
      id: 'jp-info-wifi',
      icon: 'wifi',
      title: '網路與通訊',
      content: '日本免費 Wi-Fi 覆蓋率尚可，但建議購買 SIM 卡或租用分享器以備導航之需。',
      enabled: true,
    },
    {
      id: 'jp-info-emergency',
      icon: 'emergency',
      iconColor: '#b91c1c',
      title: '緊急聯絡',
      content: '警察 110 / 消防救護 119。遇緊急狀況請保持冷靜，許多單位提供英語服務。',
      enabled: true,
    },
  ],
}

// ============================================
// 泰國 (TH)
// ============================================
const thailandMemoSettings: MemoSettings = {
  title: '泰國旅遊小提醒',
  subtitle: 'Travel Tips',
  headerIcon: 'temple_buddhist',
  footerText: '旅遊心得 • 溫馨筆記',
  items: [
    {
      id: 'th-etiquette-1',
      category: 'etiquette',
      icon: 'temple_buddhist',
      title: 'วัด (寺廟禮儀)',
      titleZh: '寺廟禮儀',
      content: '進入寺廟需脫鞋，穿著過膝長褲或長裙，不可穿無袖上衣。女性不可觸碰僧侶。',
      enabled: true,
    },
    {
      id: 'th-etiquette-2',
      category: 'etiquette',
      icon: 'crown',
      title: 'พระมหากษัตริย์',
      titleZh: '尊重皇室',
      content: '泰國人民非常尊重皇室，請勿對皇室成員做出不敬言論或行為，這在泰國是嚴重罪行。',
      enabled: true,
    },
    {
      id: 'th-etiquette-3',
      category: 'etiquette',
      icon: 'front_hand',
      title: 'ไหว้ (合十禮)',
      titleZh: '合十禮儀',
      content: '泰式問候「Wai」：雙手合十於胸前，微微低頭。對長輩、僧侶需將手舉至更高位置以示尊敬。',
      enabled: true,
    },
    {
      id: 'th-etiquette-4',
      category: 'etiquette',
      icon: 'do_not_touch',
      title: 'หัว (頭部禁忌)',
      titleZh: '頭部禁忌',
      content: '頭部在泰國文化中是神聖的，絕對不可觸摸他人頭部。用腳指人或踩踏佛像也是禁忌。',
      enabled: true,
    },
    {
      id: 'th-flight-1',
      category: 'flight',
      icon: 'schedule',
      title: 'สนามบิน',
      titleZh: '機場抵達時間',
      content: '建議起飛前 2.5 ~ 3 小時抵達機場。曼谷機場人潮眾多，請預留充裕時間辦理登機。',
      enabled: true,
    },
    {
      id: 'th-flight-2',
      category: 'flight',
      icon: 'water_drop',
      title: 'ของเหลว',
      titleZh: '液體攜帶規定',
      content: '隨身液體單瓶限 100ml 以下，需裝入 1 公升透明夾鏈袋。超過限制請務必放入託運行李。',
      enabled: true,
    },
    {
      id: 'th-flight-3',
      category: 'flight',
      icon: 'battery_alert',
      title: 'แบตเตอรี่',
      titleZh: '鋰電池規定',
      content: '行動電源、鋰電池「嚴禁託運」，必須隨身攜帶上機。請確認瓦特小時數符合航空規範。',
      enabled: true,
    },
    {
      id: 'th-flight-4',
      category: 'flight',
      icon: 'shopping_bag',
      title: 'สินค้าปลอดภาษี',
      titleZh: '免稅品規定',
      content: '泰國免稅菸酒入境限制：香菸 200 支、酒類 1 公升。超量可能被沒收或罰款。',
      enabled: true,
    },
  ],
  seasons: [
    {
      season: 'spring',
      icon: 'wb_sunny',
      iconColor: '#ef4444',
      months: '3-5月',
      description: '熱季，氣溫最高可達 40°C。建議穿著輕薄透氣，隨身攜帶防曬用品與水。',
      enabled: true,
    },
    {
      season: 'summer',
      icon: 'thunderstorm',
      iconColor: '#3b82f6',
      months: '6-10月',
      description: '雨季，午後常有雷陣雨。建議攜帶雨具，規劃室內備案行程。',
      enabled: true,
    },
    {
      season: 'autumn',
      icon: 'cloud',
      iconColor: '#9ca3af',
      months: '11月',
      description: '轉涼過渡期，偶有降雨。氣候較舒適，是旅遊淡季尾聲。',
      enabled: true,
    },
    {
      season: 'winter',
      icon: 'ac_unit',
      iconColor: '#22d3ee',
      months: '12-2月',
      description: '涼季，氣溫約 20-32°C。最佳旅遊季節，早晚稍涼可帶薄外套。',
      enabled: true,
    },
  ],
  infoItems: [
    {
      id: 'th-info-money',
      icon: 'payments',
      title: '貨幣與小費',
      content: '泰銖(THB)。建議給小費：按摩 50-100 銖、飯店行李 20 銖、餐廳 10%。',
      enabled: true,
    },
    {
      id: 'th-info-emergency',
      icon: 'emergency',
      iconColor: '#b91c1c',
      title: '緊急聯絡',
      content: '觀光警察 1155 / 急難救助 191。曼谷觀光警察提供多國語言服務。',
      enabled: true,
    },
  ],
}

// ============================================
// 韓國 (KR)
// ============================================
const koreaMemoSettings: MemoSettings = {
  title: '韓國旅遊小提醒',
  subtitle: 'Travel Tips',
  headerIcon: 'castle',
  footerText: '여행 팁 • 溫馨筆記',
  items: [
    {
      id: 'kr-etiquette-1',
      category: 'etiquette',
      icon: 'elderly',
      title: '어른 공경',
      titleZh: '尊敬長輩',
      content: '韓國非常重視輩分，見面時晚輩需先鞠躬問候。用餐時需等長輩先動筷，飲酒時側身避開長輩。',
      enabled: true,
    },
    {
      id: 'kr-etiquette-2',
      category: 'etiquette',
      icon: 'restaurant',
      title: '식사 예절',
      titleZh: '用餐禮儀',
      content: '韓國用餐使用筷子和湯匙。飯碗不可端起，需放在桌上食用。湯匙吃飯、筷子夾菜。',
      enabled: true,
    },
    {
      id: 'kr-etiquette-3',
      category: 'etiquette',
      icon: 'train',
      title: '지하철 매너',
      titleZh: '地鐵禮儀',
      content: '地鐵上應保持安靜，讓座給老弱婦孺。博愛座即使空著也盡量不坐，韓國人對此非常敏感。',
      enabled: true,
    },
    {
      id: 'kr-etiquette-4',
      category: 'etiquette',
      icon: 'front_hand',
      title: '양손 예절',
      titleZh: '雙手禮儀',
      content: '接受或遞交物品給長輩時，應使用雙手或以左手托住右手肘，以示尊重。',
      enabled: true,
    },
    {
      id: 'kr-flight-1',
      category: 'flight',
      icon: 'schedule',
      title: '공항 도착',
      titleZh: '機場抵達時間',
      content: '建議起飛前 2.5 ~ 3 小時抵達機場。仁川機場航廈大，請預留交通與步行時間。',
      enabled: true,
    },
    {
      id: 'kr-flight-2',
      category: 'flight',
      icon: 'water_drop',
      title: '액체류',
      titleZh: '液體攜帶規定',
      content: '隨身液體單瓶限 100ml 以下，需裝入 1 公升透明夾鏈袋。韓國免稅店可在登機口取貨。',
      enabled: true,
    },
    {
      id: 'kr-flight-3',
      category: 'flight',
      icon: 'battery_alert',
      title: '배터리',
      titleZh: '鋰電池規定',
      content: '行動電源、鋰電池「嚴禁託運」，必須隨身攜帶上機。請確認瓦特小時數符合航空規範。',
      enabled: true,
    },
    {
      id: 'kr-flight-4',
      category: 'flight',
      icon: 'local_pharmacy',
      title: '의약품',
      titleZh: '藥品規定',
      content: '韓國對藥品攜帶較嚴格。處方藥請攜帶醫師證明，感冒藥等成藥建議帶原包裝。',
      enabled: true,
    },
  ],
  seasons: [
    {
      season: 'spring',
      icon: 'local_florist',
      iconColor: '#f9a8d4',
      months: '3-5月',
      description: '櫻花季氣溫回升但仍涼，建議洋蔥式穿搭。黃沙期間建議戴口罩。',
      enabled: true,
    },
    {
      season: 'summer',
      icon: 'wb_sunny',
      iconColor: '#fdba74',
      months: '6-8月',
      description: '梅雨季後進入盛夏，高溫潮濕。建議攜帶雨具與防曬用品。',
      enabled: true,
    },
    {
      season: 'autumn',
      icon: 'eco',
      iconColor: '#d97706',
      months: '9-11月',
      description: '秋高氣爽，賞楓最佳季節。早晚溫差大，建議攜帶薄外套。',
      enabled: true,
    },
    {
      season: 'winter',
      icon: 'ac_unit',
      iconColor: '#38bdf8',
      months: '12-2月',
      description: '嚴寒乾燥，首爾可達 -10°C。必備保暖衣物、暖暖包，建議帶護唇膏。',
      enabled: true,
    },
  ],
  infoItems: [
    {
      id: 'kr-info-tmoney',
      icon: 'credit_card',
      title: 'T-money 交通卡',
      content: '便利商店購買儲值，可搭地鐵、公車、計程車，便利商店也可使用。',
      enabled: true,
    },
    {
      id: 'kr-info-emergency',
      icon: 'emergency',
      iconColor: '#b91c1c',
      title: '緊急聯絡',
      content: '警察 112 / 消防救護 119 / 觀光諮詢 1330（中英日服務）。',
      enabled: true,
    },
  ],
}

// ============================================
// 越南 (VN)
// ============================================
const vietnamMemoSettings: MemoSettings = {
  title: '越南旅遊小提醒',
  subtitle: 'Travel Tips',
  headerIcon: 'rice_bowl',
  footerText: '旅遊心得 • 溫馨筆記',
  items: [
    {
      id: 'vn-etiquette-1',
      category: 'etiquette',
      icon: 'temple_buddhist',
      title: 'Chùa (寺廟)',
      titleZh: '寺廟禮儀',
      content: '進入寺廟需脫鞋，穿著端莊（過膝、有袖）。參拜時保持安靜，不可用手指向佛像。',
      enabled: true,
    },
    {
      id: 'vn-etiquette-2',
      category: 'etiquette',
      icon: 'two_wheeler',
      title: 'Giao thông',
      titleZh: '交通安全',
      content: '越南機車眾多，過馬路需緩慢穩定前進，讓車輛避開你。切勿突然停下或後退。',
      enabled: true,
    },
    {
      id: 'vn-etiquette-3',
      category: 'etiquette',
      icon: 'handshake',
      title: 'Mặc cả',
      titleZh: '議價文化',
      content: '市場購物可議價，通常可從開價的 50-70% 開始談。但在超市、便利店不議價。',
      enabled: true,
    },
    {
      id: 'vn-etiquette-4',
      category: 'etiquette',
      icon: 'payments',
      title: 'Tiền tip',
      titleZh: '小費文化',
      content: '非必要但受歡迎。建議：按摩 50,000-100,000 盾、導遊每天 100,000 盾。',
      enabled: true,
    },
    {
      id: 'vn-flight-1',
      category: 'flight',
      icon: 'schedule',
      title: 'Sân bay',
      titleZh: '機場抵達時間',
      content: '建議起飛前 2.5 ~ 3 小時抵達機場。河內、胡志明機場安檢較慢，請預留時間。',
      enabled: true,
    },
    {
      id: 'vn-flight-2',
      category: 'flight',
      icon: 'water_drop',
      title: 'Chất lỏng',
      titleZh: '液體攜帶規定',
      content: '隨身液體單瓶限 100ml 以下，需裝入 1 公升透明夾鏈袋。超過限制請放入託運行李。',
      enabled: true,
    },
    {
      id: 'vn-flight-3',
      category: 'flight',
      icon: 'battery_alert',
      title: 'Pin lithium',
      titleZh: '鋰電池規定',
      content: '行動電源、鋰電池「嚴禁託運」，必須隨身攜帶上機。請確認瓦特小時數符合規範。',
      enabled: true,
    },
    {
      id: 'vn-flight-4',
      category: 'flight',
      icon: 'currency_exchange',
      title: 'Đổi tiền',
      titleZh: '換匯建議',
      content: '越南盾面額大（1台幣≈800盾）。建議在當地銀行或金店換匯，匯率較機場好。',
      enabled: true,
    },
  ],
  seasons: [
    {
      season: 'spring',
      icon: 'cloud',
      iconColor: '#9ca3af',
      months: '2-4月',
      description: '北越涼爽多霧，中南越溫暖。適合旅遊，建議攜帶薄外套。',
      enabled: true,
    },
    {
      season: 'summer',
      icon: 'thunderstorm',
      iconColor: '#3b82f6',
      months: '5-8月',
      description: '雨季，午後常有大雨。北越悶熱，南越較涼。建議攜帶雨具。',
      enabled: true,
    },
    {
      season: 'autumn',
      icon: 'wb_sunny',
      iconColor: '#fdba74',
      months: '9-11月',
      description: '中越雨季、颱風季。北越秋高氣爽，是最佳旅遊季節。',
      enabled: true,
    },
    {
      season: 'winter',
      icon: 'ac_unit',
      iconColor: '#22d3ee',
      months: '12-1月',
      description: '北越涼冷（可達 10°C），南越溫暖。沙巴可能下雪。',
      enabled: true,
    },
  ],
  infoItems: [
    {
      id: 'vn-info-water',
      icon: 'local_drink',
      title: '飲水安全',
      content: '自來水不可生飲。建議購買瓶裝水，路邊冰塊也需小心。',
      enabled: true,
    },
    {
      id: 'vn-info-emergency',
      icon: 'emergency',
      iconColor: '#b91c1c',
      title: '緊急聯絡',
      content: '警察 113 / 消防 114 / 急救 115。建議存好駐越南代表處電話。',
      enabled: true,
    },
  ],
}

// ============================================
// 通用預設（其他國家）
// ============================================
const defaultMemoSettings: MemoSettings = {
  title: '旅遊小提醒',
  subtitle: 'Travel Tips',
  headerIcon: 'travel_explore',
  footerText: '旅遊心得 • 溫馨筆記',
  items: [
    {
      id: 'default-etiquette-1',
      category: 'etiquette',
      icon: 'public',
      title: '尊重當地文化',
      content: '了解並尊重當地習俗與禮儀。進入宗教場所請穿著端莊，遵守相關規定。',
      enabled: true,
    },
    {
      id: 'default-etiquette-2',
      category: 'etiquette',
      icon: 'photo_camera',
      title: '攝影禮儀',
      content: '拍攝當地人前請先徵得同意。部分宗教場所或博物館禁止攝影，請留意告示。',
      enabled: true,
    },
    {
      id: 'default-etiquette-3',
      category: 'etiquette',
      icon: 'restaurant',
      title: '用餐禮儀',
      content: '各國用餐習慣不同，建議事先了解當地餐桌禮儀，避免失禮。',
      enabled: true,
    },
    {
      id: 'default-etiquette-4',
      category: 'etiquette',
      icon: 'payments',
      title: '小費文化',
      content: '各國小費習慣不同。建議事先了解當地是否需要給小費，以及建議金額。',
      enabled: true,
    },
    {
      id: 'default-flight-1',
      category: 'flight',
      icon: 'schedule',
      title: '機場抵達時間',
      content: '建議起飛前 2.5 ~ 3 小時抵達機場，預留充裕時間辦理登機與安檢。',
      enabled: true,
    },
    {
      id: 'default-flight-2',
      category: 'flight',
      icon: 'water_drop',
      title: '液體攜帶規定',
      content: '隨身液體單瓶限 100ml 以下，需裝入 1 公升透明夾鏈袋。超過限制請放入託運行李。',
      enabled: true,
    },
    {
      id: 'default-flight-3',
      category: 'flight',
      icon: 'battery_alert',
      title: '鋰電池規定',
      content: '行動電源、鋰電池「嚴禁託運」，必須隨身攜帶上機。請確認符合航空規範。',
      enabled: true,
    },
    {
      id: 'default-flight-4',
      category: 'flight',
      icon: 'badge',
      title: '證件確認',
      content: '出發前請確認護照效期（至少 6 個月）、簽證是否辦妥，並備妥相關文件影本。',
      enabled: true,
    },
  ],
  seasons: [
    {
      season: 'spring',
      icon: 'local_florist',
      iconColor: '#f9a8d4',
      months: '春季',
      description: '請查詢目的地春季氣候，準備適當衣物。',
      enabled: true,
    },
    {
      season: 'summer',
      icon: 'wb_sunny',
      iconColor: '#fdba74',
      months: '夏季',
      description: '請查詢目的地夏季氣候，注意防曬與補充水分。',
      enabled: true,
    },
    {
      season: 'autumn',
      icon: 'eco',
      iconColor: '#d97706',
      months: '秋季',
      description: '請查詢目的地秋季氣候，早晚可能較涼。',
      enabled: true,
    },
    {
      season: 'winter',
      icon: 'ac_unit',
      iconColor: '#38bdf8',
      months: '冬季',
      description: '請查詢目的地冬季氣候，準備保暖衣物。',
      enabled: true,
    },
  ],
  infoItems: [
    {
      id: 'default-info-sim',
      icon: 'sim_card',
      title: '網路與通訊',
      content: '建議購買當地 SIM 卡或租用 Wi-Fi 分享器，以便導航與聯繫。',
      enabled: true,
    },
    {
      id: 'default-info-emergency',
      icon: 'emergency',
      iconColor: '#b91c1c',
      title: '緊急聯絡',
      content: '請事先查詢當地緊急電話號碼，並記錄我國駐外代表處聯絡方式。',
      enabled: true,
    },
  ],
}

/**
 * 根據國家代碼取得預設備忘錄設定
 */
export function getMemoSettingsByCountry(countryCode: CountryCode): MemoSettings {
  switch (countryCode) {
    case 'JP':
      return JSON.parse(JSON.stringify(japanMemoSettings)) // deep clone
    case 'TH':
      return JSON.parse(JSON.stringify(thailandMemoSettings))
    case 'KR':
      return JSON.parse(JSON.stringify(koreaMemoSettings))
    case 'VN':
      return JSON.parse(JSON.stringify(vietnamMemoSettings))
    default:
      return JSON.parse(JSON.stringify(defaultMemoSettings))
  }
}

/**
 * 國家名稱對照
 */
export const countryNames: Record<CountryCode, string> = {
  JP: '日本',
  TH: '泰國',
  KR: '韓國',
  VN: '越南',
  CN: '中國',
  TW: '台灣',
  GU: '關島',
  OTHER: '其他',
}

/**
 * 從國家名稱或代碼取得國家代碼
 * 支援：ISO 代碼 (JP)、中文名稱 (日本)、英文名稱 (Japan)
 */
export function getCountryCodeFromName(countryNameOrCode: string): CountryCode {
  const input = countryNameOrCode.toLowerCase().trim()

  // 直接匹配 ISO 代碼
  const upperInput = countryNameOrCode.toUpperCase().trim()
  if (['JP', 'TH', 'KR', 'VN', 'CN', 'TW', 'GU'].includes(upperInput)) {
    return upperInput as CountryCode
  }

  // 名稱匹配
  if (input.includes('日本') || input.includes('japan')) return 'JP'
  if (input.includes('泰國') || input.includes('泰国') || input.includes('thailand')) return 'TH'
  if (input.includes('韓國') || input.includes('韩国') || input.includes('korea')) return 'KR'
  if (input.includes('越南') || input.includes('vietnam')) return 'VN'
  if (input.includes('中國') || input.includes('中国') || input.includes('china')) return 'CN'
  if (input.includes('台灣') || input.includes('台湾') || input.includes('taiwan')) return 'TW'
  if (input.includes('關島') || input.includes('关岛') || input.includes('guam')) return 'GU'

  return 'OTHER'
}

/**
 * 計算啟用的項目需要幾頁（每頁 4 個項目）
 */
export function calculateMemoPageCount(settings: MemoSettings): number {
  const enabledItems = settings.items.filter((item) => item.enabled)
  const enabledSeasons = settings.seasons?.filter((s) => s.enabled) || []
  const enabledInfoItems = settings.infoItems?.filter((i) => i.enabled) || []

  // 禮儀+航空項目：每頁 4 個
  const itemPages = Math.ceil(enabledItems.length / 4)

  // 天氣頁：如果有啟用的季節或資訊項目，則需要 1 頁
  const hasWeatherPage = enabledSeasons.length > 0 || enabledInfoItems.length > 0

  return itemPages + (hasWeatherPage ? 1 : 0)
}

/**
 * 取得指定頁面的項目
 */
export function getMemoItemsForPage(
  settings: MemoSettings,
  pageIndex: number
): { items: MemoItem[]; isWeatherPage: boolean } {
  const enabledItems = settings.items.filter((item) => item.enabled)
  const enabledSeasons = settings.seasons?.filter((s) => s.enabled) || []
  const enabledInfoItems = settings.infoItems?.filter((i) => i.enabled) || []

  const itemPages = Math.ceil(enabledItems.length / 4)

  // 如果是項目頁
  if (pageIndex < itemPages) {
    const start = pageIndex * 4
    const end = start + 4
    return {
      items: enabledItems.slice(start, end),
      isWeatherPage: false,
    }
  }

  // 如果是天氣頁
  if (enabledSeasons.length > 0 || enabledInfoItems.length > 0) {
    return {
      items: [],
      isWeatherPage: true,
    }
  }

  return { items: [], isWeatherPage: false }
}
