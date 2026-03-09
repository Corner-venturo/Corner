const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

// 新國家資料 (id 格式與現有國家一致)
const newCountries = [
  { id: 'singapore', name: '新加坡', name_en: 'Singapore', region: '東南亞' },
  { id: 'malaysia', name: '馬來西亞', name_en: 'Malaysia', region: '東南亞' },
  { id: 'indonesia', name: '印尼', name_en: 'Indonesia', region: '東南亞' },
]

// 新城市資料 (用 id 匹配，不用 slug)
const newCities = [
  // 日本 - 沖繩 & 北海道
  { id: 'naha', name: '那霸', country_id: 'japan' },
  { id: 'ishigaki', name: '石垣島', country_id: 'japan' },
  { id: 'miyako', name: '宮古島', country_id: 'japan' },
  { id: 'sapporo', name: '札幌', country_id: 'japan' },
  { id: 'hakodate', name: '函館', country_id: 'japan' },
  { id: 'otaru', name: '小樽', country_id: 'japan' },
  { id: 'furano', name: '富良野', country_id: 'japan' },
  { id: 'noboribetsu', name: '登別', country_id: 'japan' },
  { id: 'toyako', name: '洞爺湖', country_id: 'japan' },
  { id: 'biei', name: '美瑛', country_id: 'japan' },
  // 新加坡
  { id: 'singapore-city', name: '新加坡', country_id: 'singapore' },
  // 馬來西亞
  { id: 'kuala-lumpur', name: '吉隆坡', country_id: 'malaysia' },
  { id: 'penang', name: '檳城', country_id: 'malaysia' },
  { id: 'langkawi', name: '蘭卡威', country_id: 'malaysia' },
  { id: 'malacca', name: '馬六甲', country_id: 'malaysia' },
  { id: 'sabah', name: '沙巴', country_id: 'malaysia' },
  { id: 'ipoh', name: '怡保', country_id: 'malaysia' },
  // 印尼
  { id: 'bali', name: '峇里島', country_id: 'indonesia' },
  { id: 'jakarta', name: '雅加達', country_id: 'indonesia' },
  { id: 'yogyakarta', name: '日惹', country_id: 'indonesia' },
  { id: 'lombok', name: '龍目島', country_id: 'indonesia' },
]

// 景點資料
const attractions = [
  // ========== 日本 - 沖繩 ==========
  // 那霸
  {
    name: '首里城',
    city: 'naha',
    type: 'heritage',
    description: '琉球王國的王城遺址，世界文化遺產',
  },
  { name: '國際通', city: 'naha', type: 'shopping', description: '那霸最熱鬧的購物街，1.6公里長' },
  {
    name: '牧志公設市場',
    city: 'naha',
    type: 'market',
    description: '沖繩的廚房，新鮮海產和當地美食',
  },
  { name: '波上宮', city: 'naha', type: 'temple', description: '沖繩最著名的神社，位於懸崖上' },
  { name: '波之上海灘', city: 'naha', type: 'beach', description: '那霸市區唯一的海灘' },
  { name: '壺屋陶器街', city: 'naha', type: 'shopping', description: '傳統沖繩陶器工藝品街' },
  { name: '玉陵', city: 'naha', type: 'heritage', description: '琉球王族的陵墓，世界文化遺產' },
  { name: '沖繩縣立博物館', city: 'naha', type: 'museum', description: '展示沖繩歷史與文化' },
  { name: '福州園', city: 'naha', type: 'garden', description: '紀念那霸與福州友好的中國式庭園' },
  {
    name: '沖繩美食居酒屋',
    city: 'naha',
    type: 'food',
    description: '品嚐阿古豬、苦瓜炒蛋、沖繩麵',
  },
  {
    name: '美麗海水族館',
    city: 'naha',
    type: 'attraction',
    description: '世界最大的水族館之一，黑潮之海',
  },
  { name: '古宇利島', city: 'naha', type: 'attraction', description: '心型岩和美麗海灘的浪漫島嶼' },
  { name: '萬座毛', city: 'naha', type: 'viewpoint', description: '象鼻岩和斷崖絕景' },
  { name: '美國村', city: 'naha', type: 'shopping', description: '美式風格的購物娛樂區' },
  { name: '殘波岬', city: 'naha', type: 'viewpoint', description: '沖繩最西端的海角與燈塔' },
  { name: '座喜味城跡', city: 'naha', type: 'heritage', description: '琉球王國時代的城堡遺跡' },
  {
    name: '齋場御嶽',
    city: 'naha',
    type: 'heritage',
    description: '琉球王國最高聖地，世界文化遺產',
  },
  { name: '知念岬公園', city: 'naha', type: 'viewpoint', description: '眺望太平洋的絕美海角' },
  {
    name: '玉泉洞',
    city: 'naha',
    type: 'attraction',
    description: '日本最大的鐘乳石洞，30萬年歷史',
  },
  { name: '琉球村', city: 'naha', type: 'experience', description: '體驗傳統琉球文化和工藝' },

  // 石垣島
  { name: '川平灣', city: 'ishigaki', type: 'beach', description: '日本百景之一，翡翠綠的海灣' },
  {
    name: '石垣島鐘乳洞',
    city: 'ishigaki',
    type: 'attraction',
    description: '20萬年歷史的鐘乳石洞',
  },
  {
    name: '玉取崎展望台',
    city: 'ishigaki',
    type: 'viewpoint',
    description: '眺望太平洋和東海的絕景',
  },
  { name: '米原海灘', city: 'ishigaki', type: 'beach', description: '最佳浮潛地點，珊瑚礁生態' },
  { name: '平久保崎燈塔', city: 'ishigaki', type: 'viewpoint', description: '石垣島最北端的絕景' },
  { name: '竹富島', city: 'ishigaki', type: 'attraction', description: '水牛車遊覽傳統琉球村落' },
  { name: '西表島', city: 'ishigaki', type: 'attraction', description: '亞熱帶原始森林和紅樹林' },
  { name: '石垣牛燒肉', city: 'ishigaki', type: 'food', description: '頂級和牛，入口即化' },

  // 宮古島
  {
    name: '與那霸前濱海灘',
    city: 'miyako',
    type: 'beach',
    description: '東洋第一美海灘，7公里白沙',
  },
  { name: '池間大橋', city: 'miyako', type: 'viewpoint', description: '連接池間島的絕美跨海大橋' },
  { name: '伊良部大橋', city: 'miyako', type: 'viewpoint', description: '日本最長的免費跨海大橋' },
  { name: '下地島17END', city: 'miyako', type: 'beach', description: '夢幻透明海水，飛機起降觀賞' },
  { name: '砂山海灘', city: 'miyako', type: 'beach', description: '天然拱門和純白沙灘' },
  { name: '東平安名崎', city: 'miyako', type: 'viewpoint', description: '宮古島最東端的海角絕景' },
  { name: '新城海岸', city: 'miyako', type: 'beach', description: '最佳浮潛點，海龜常出沒' },
  { name: '宮古島海鮮', city: 'miyako', type: 'food', description: '新鮮龍蝦和夜光貝料理' },

  // ========== 日本 - 北海道 ==========
  // 札幌
  {
    name: '札幌時計台',
    city: 'sapporo',
    type: 'landmark',
    description: '札幌象徵，北海道開拓時代建築',
  },
  { name: '大通公園', city: 'sapporo', type: 'park', description: '札幌市中心的綠洲，雪祭會場' },
  { name: '札幌電視塔', city: 'sapporo', type: 'viewpoint', description: '大通公園地標，夜景觀賞' },
  { name: '北海道神宮', city: 'sapporo', type: 'temple', description: '北海道總鎮守，圓山公園內' },
  {
    name: '狸小路商店街',
    city: 'sapporo',
    type: 'shopping',
    description: '北海道最大的商店街，200多店舖',
  },
  { name: '二條市場', city: 'sapporo', type: 'market', description: '百年歷史的海鮮市場' },
  {
    name: '札幌啤酒博物館',
    city: 'sapporo',
    type: 'museum',
    description: '日本唯一啤酒博物館，免費參觀',
  },
  { name: '白色戀人公園', city: 'sapporo', type: 'attraction', description: '巧克力工廠主題公園' },
  { name: '藻岩山', city: 'sapporo', type: 'viewpoint', description: '日本新三大夜景之一' },
  { name: '北海道大學', city: 'sapporo', type: 'attraction', description: '銀杏大道和歷史建築' },
  { name: '中島公園', city: 'sapporo', type: 'park', description: '市區最大公園，日本庭園' },
  {
    name: '札幌拉麵共和國',
    city: 'sapporo',
    type: 'food',
    description: '8家名店齊聚，味噌拉麵聖地',
  },
  { name: '成吉思汗烤羊肉', city: 'sapporo', type: 'food', description: '北海道代表美食' },
  { name: '札幌雪祭', city: 'sapporo', type: 'experience', description: '2月舉辦，世界級冰雪祭典' },
  { name: '場外市場', city: 'sapporo', type: 'market', description: '在地人愛去的海鮮市場' },

  // 函館
  { name: '函館山夜景', city: 'hakodate', type: 'viewpoint', description: '世界三大夜景之一' },
  {
    name: '五稜郭',
    city: 'hakodate',
    type: 'heritage',
    description: '日本最大的西式城堡，星形要塞',
  },
  { name: '五稜郭塔', city: 'hakodate', type: 'viewpoint', description: '俯瞰星形城堡全景' },
  { name: '函館朝市', city: 'hakodate', type: 'market', description: '北海道最大朝市，活烏賊刺身' },
  {
    name: '金森紅磚倉庫',
    city: 'hakodate',
    type: 'shopping',
    description: '明治時代倉庫群，購物餐飲',
  },
  { name: '八幡坂', city: 'hakodate', type: 'viewpoint', description: '最美坡道，直通港口' },
  {
    name: '元町教會群',
    city: 'hakodate',
    type: 'heritage',
    description: '東正教會、天主教會建築群',
  },
  { name: '舊函館區公會堂', city: 'hakodate', type: 'heritage', description: '藍黃色的明治洋館' },
  { name: '湯之川溫泉', city: 'hakodate', type: 'experience', description: '北海道三大溫泉之一' },
  { name: '幸運小丑漢堡', city: 'hakodate', type: 'food', description: '函館限定，超人氣漢堡店' },
  { name: '函館鹽拉麵', city: 'hakodate', type: 'food', description: '清爽透明的招牌拉麵' },

  // 小樽
  { name: '小樽運河', city: 'otaru', type: 'landmark', description: '浪漫運河，煤油燈夜景' },
  { name: '堺町通', city: 'otaru', type: 'shopping', description: '玻璃工藝品和音樂盒專賣街' },
  { name: '小樽音樂盒堂', city: 'otaru', type: 'museum', description: '日本最大音樂盒專門店' },
  { name: '北一硝子', city: 'otaru', type: 'shopping', description: '百年玻璃工藝品店' },
  { name: '天狗山', city: 'otaru', type: 'viewpoint', description: '眺望小樽港和市區夜景' },
  { name: '小樽水族館', city: 'otaru', type: 'attraction', description: '海豹表演和企鵝遊行' },
  { name: '小樽壽司屋通', city: 'otaru', type: 'food', description: '新鮮握壽司，漁港直送' },
  { name: 'LeTAO雙層起司蛋糕', city: 'otaru', type: 'food', description: '小樽必買甜點' },

  // 富良野
  { name: '富田農場', city: 'furano', type: 'garden', description: '薰衣草花海聖地，7月盛開' },
  { name: '彩香之里', city: 'furano', type: 'garden', description: '七彩花田，夏季限定' },
  { name: '四季彩之丘', city: 'furano', type: 'garden', description: '15公頃彩虹花田' },
  { name: '富良野起司工房', city: 'furano', type: 'experience', description: '起司製作體驗' },
  {
    name: '富良野葡萄酒工廠',
    city: 'furano',
    type: 'experience',
    description: '葡萄酒試飲和工廠見學',
  },
  { name: '富良野哈密瓜', city: 'furano', type: 'food', description: '夕張哈密瓜，甜度驚人' },
  {
    name: '富良野滑雪場',
    city: 'furano',
    type: 'attraction',
    description: '粉雪天堂，冬季滑雪勝地',
  },

  // 美瑛
  { name: '青池', city: 'biei', type: 'attraction', description: '夢幻蒂芬妮藍的神秘池塘' },
  { name: '拼布之路', city: 'biei', type: 'viewpoint', description: '丘陵田園風光，廣告取景地' },
  { name: '超廣角之路', city: 'biei', type: 'viewpoint', description: '360度全景丘陵' },
  {
    name: 'Ken & Mary之樹',
    city: 'biei',
    type: 'landmark',
    description: '日產汽車廣告取景的白楊樹',
  },
  { name: '七星之樹', city: 'biei', type: 'landmark', description: '七星香菸廣告的柏樹' },
  { name: '親子之樹', city: 'biei', type: 'landmark', description: '三棵柏樹如親子相依' },
  { name: '白鬚瀑布', city: 'biei', type: 'attraction', description: '藍河源頭，地下水瀑布' },

  // 登別
  { name: '地獄谷', city: 'noboribetsu', type: 'attraction', description: '火山噴氣口，溫泉源頭' },
  { name: '登別溫泉街', city: 'noboribetsu', type: 'experience', description: '北海道最大溫泉鄉' },
  { name: '大湯沼', city: 'noboribetsu', type: 'attraction', description: '天然足湯，火山湖' },
  {
    name: '登別熊牧場',
    city: 'noboribetsu',
    type: 'attraction',
    description: '北海道棕熊近距離觀賞',
  },
  {
    name: '登別伊達時代村',
    city: 'noboribetsu',
    type: 'theme_park',
    description: '江戶時代主題樂園',
  },
  {
    name: '閻魔堂',
    city: 'noboribetsu',
    type: 'attraction',
    description: '閻羅王變臉機關，溫泉街地標',
  },

  // 洞爺湖
  { name: '洞爺湖', city: 'toyako', type: 'attraction', description: '火山口湖，北海道三景之一' },
  { name: '有珠山纜車', city: 'toyako', type: 'viewpoint', description: '眺望洞爺湖和昭和新山' },
  { name: '昭和新山', city: 'toyako', type: 'attraction', description: '1943年火山噴發形成的新山' },
  { name: '洞爺湖遊覽船', city: 'toyako', type: 'experience', description: '湖上遊覽，中島登島' },
  { name: '洞爺湖花火', city: 'toyako', type: 'experience', description: '4-10月每晚施放煙火' },
  { name: '洞爺湖溫泉', city: 'toyako', type: 'experience', description: '湖畔溫泉旅館群' },

  // ========== 新加坡 ==========
  {
    name: '濱海灣金沙',
    city: 'singapore-city',
    type: 'landmark',
    description: '世界最貴賭場酒店，無邊際泳池',
  },
  {
    name: '魚尾獅公園',
    city: 'singapore-city',
    type: 'landmark',
    description: '新加坡象徵，必訪地標',
  },
  { name: '濱海灣花園', city: 'singapore-city', type: 'garden', description: '超級樹和雲霧森林' },
  {
    name: '聖淘沙島',
    city: 'singapore-city',
    type: 'attraction',
    description: '度假島嶼，環球影城所在地',
  },
  {
    name: '新加坡環球影城',
    city: 'singapore-city',
    type: 'theme_park',
    description: '東南亞唯一環球影城',
  },
  {
    name: 'S.E.A.海洋館',
    city: 'singapore-city',
    type: 'attraction',
    description: '全球最大海洋館之一',
  },
  {
    name: '牛車水',
    city: 'singapore-city',
    type: 'shopping',
    description: '新加坡唐人街，美食購物',
  },
  {
    name: '小印度',
    city: 'singapore-city',
    type: 'attraction',
    description: '印度文化區，色彩繽紛',
  },
  {
    name: '甘榜格南',
    city: 'singapore-city',
    type: 'attraction',
    description: '馬來文化區，蘇丹回教堂',
  },
  {
    name: '克拉碼頭',
    city: 'singapore-city',
    type: 'attraction',
    description: '河畔酒吧餐廳區，夜生活',
  },
  { name: '烏節路', city: 'singapore-city', type: 'shopping', description: '新加坡最大購物街' },
  {
    name: '夜間野生動物園',
    city: 'singapore-city',
    type: 'attraction',
    description: '全球首座夜間動物園',
  },
  {
    name: '新加坡動物園',
    city: 'singapore-city',
    type: 'attraction',
    description: '開放式動物園，與動物近距離',
  },
  {
    name: '河川生態園',
    city: 'singapore-city',
    type: 'attraction',
    description: '亞洲首座河川主題動物園',
  },
  {
    name: '裕廊飛禽公園',
    city: 'singapore-city',
    type: 'attraction',
    description: '亞洲最大鳥類公園',
  },
  {
    name: '濱海藝術中心',
    city: 'singapore-city',
    type: 'landmark',
    description: '榴蓮造型的表演藝術中心',
  },
  {
    name: '新加坡摩天觀景輪',
    city: 'singapore-city',
    type: 'viewpoint',
    description: '亞洲最高摩天輪',
  },
  {
    name: '麥士威熟食中心',
    city: 'singapore-city',
    type: 'market',
    description: '天天海南雞飯所在地',
  },
  {
    name: '老巴剎美食廣場',
    city: 'singapore-city',
    type: 'market',
    description: '維多利亞建築內的沙嗲街',
  },
  {
    name: '天天海南雞飯',
    city: 'singapore-city',
    type: 'food',
    description: '米其林推薦，國民美食',
  },
  { name: '松發肉骨茶', city: 'singapore-city', type: 'food', description: '胡椒味肉骨茶名店' },
  { name: '亞坤咖椰吐司', city: 'singapore-city', type: 'food', description: '新加坡早餐代表' },
  { name: '珍寶海鮮', city: 'singapore-city', type: 'food', description: '辣椒螃蟹創始店' },
  { name: '328加東叻沙', city: 'singapore-city', type: 'food', description: '米其林推薦叻沙' },
  {
    name: '了凡香港油雞飯麵',
    city: 'singapore-city',
    type: 'food',
    description: '全球最便宜米其林一星',
  },

  // ========== 馬來西亞 ==========
  // 吉隆坡
  {
    name: '雙子塔',
    city: 'kuala-lumpur',
    type: 'landmark',
    description: '世界最高雙塔，吉隆坡地標',
  },
  {
    name: '吉隆坡塔',
    city: 'kuala-lumpur',
    type: 'viewpoint',
    description: '421米高塔，360度觀景台',
  },
  { name: '茨廠街', city: 'kuala-lumpur', type: 'market', description: '吉隆坡唐人街，小吃購物' },
  { name: '獨立廣場', city: 'kuala-lumpur', type: 'landmark', description: '馬來西亞獨立宣言地' },
  { name: '國家清真寺', city: 'kuala-lumpur', type: 'temple', description: '馬來西亞最大清真寺' },
  {
    name: '黑風洞',
    city: 'kuala-lumpur',
    type: 'temple',
    description: '印度教聖地，272級彩虹階梯',
  },
  { name: '中央藝術坊', city: 'kuala-lumpur', type: 'shopping', description: '傳統工藝品購物中心' },
  { name: '阿羅街', city: 'kuala-lumpur', type: 'market', description: '最熱鬧的夜市美食街' },
  { name: '十號胡同', city: 'kuala-lumpur', type: 'food', description: '老字號美食集中地' },
  { name: '武吉免登', city: 'kuala-lumpur', type: 'shopping', description: '吉隆坡購物天堂' },
  {
    name: '雲頂高原',
    city: 'kuala-lumpur',
    type: 'attraction',
    description: '馬來西亞唯一賭場度假村',
  },
  {
    name: '肉骨茶',
    city: 'kuala-lumpur',
    type: 'food',
    description: '藥材燉排骨，馬來西亞代表美食',
  },
  { name: '椰漿飯', city: 'kuala-lumpur', type: 'food', description: '馬來西亞國民早餐' },

  // 檳城
  { name: '喬治城壁畫', city: 'penang', type: 'attraction', description: '世界遺產城市的街頭藝術' },
  { name: '極樂寺', city: 'penang', type: 'temple', description: '東南亞最大佛教寺院之一' },
  { name: '升旗山', city: 'penang', type: 'viewpoint', description: '纜車登頂，眺望檳城全景' },
  { name: '姓氏橋', city: 'penang', type: 'heritage', description: '水上人家，百年華人村落' },
  { name: '藍屋', city: 'penang', type: 'heritage', description: '張弼士故居，藍色峇峇建築' },
  { name: '龍山堂邱公司', city: 'penang', type: 'heritage', description: '華麗的福建宗祠建築' },
  { name: '檳城娘惹博物館', city: 'penang', type: 'museum', description: '峇峇娘惹文化展示' },
  { name: '汕頭街', city: 'penang', type: 'market', description: '在地美食一條街' },
  { name: '新關仔角', city: 'penang', type: 'market', description: '檳城最大夜市' },
  { name: '炒粿條', city: 'penang', type: 'food', description: '檳城必吃美食第一名' },
  { name: '福建蝦麵', city: 'penang', type: 'food', description: '橙紅湯底的招牌麵食' },
  { name: '檳城叻沙', city: 'penang', type: 'food', description: '亞參叻沙，酸辣魚湯麵' },
  { name: '煎蕊', city: 'penang', type: 'food', description: '綠色粉條椰糖刨冰' },

  // 蘭卡威
  { name: '天空之橋', city: 'langkawi', type: 'viewpoint', description: '懸空彎曲橋，山頂絕景' },
  { name: '蘭卡威纜車', city: 'langkawi', type: 'viewpoint', description: '世界最陡纜車之一' },
  { name: '珍南海灘', city: 'langkawi', type: 'beach', description: '蘭卡威最熱鬧的海灘' },
  { name: '丹絨魯海灘', city: 'langkawi', type: 'beach', description: '日落美景，寧靜沙灘' },
  { name: '孕婦湖', city: 'langkawi', type: 'attraction', description: '淡水湖，傳說求子靈驗' },
  { name: '紅樹林生態遊', city: 'langkawi', type: 'experience', description: '探索紅樹林和蝙蝠洞' },
  { name: '巨鷹廣場', city: 'langkawi', type: 'landmark', description: '蘭卡威象徵，12米巨鷹雕像' },
  { name: '蘭卡威夜市', city: 'langkawi', type: 'market', description: '每天不同地點的流動夜市' },
  { name: '免稅購物', city: 'langkawi', type: 'shopping', description: '免稅島，巧克力酒類超便宜' },

  // 馬六甲
  { name: '雞場街', city: 'malacca', type: 'shopping', description: '古城最熱鬧的老街' },
  { name: '荷蘭紅屋', city: 'malacca', type: 'heritage', description: '東南亞最古老的荷蘭建築' },
  { name: '基督堂', city: 'malacca', type: 'heritage', description: '粉紅色的荷蘭教堂' },
  {
    name: '聖保羅教堂',
    city: 'malacca',
    type: 'heritage',
    description: '葡萄牙時代遺跡，山頂教堂',
  },
  { name: '聖地牙哥城門', city: 'malacca', type: 'heritage', description: '葡萄牙要塞遺跡' },
  { name: '峇峇娘惹博物館', city: 'malacca', type: 'museum', description: '土生華人文化精華' },
  {
    name: '馬六甲河遊船',
    city: 'malacca',
    type: 'experience',
    description: '遊覽兩岸壁畫和歷史建築',
  },
  {
    name: '馬六甲海峽清真寺',
    city: 'malacca',
    type: 'temple',
    description: '水上清真寺，日落絕景',
  },
  { name: '雞飯粒', city: 'malacca', type: 'food', description: '馬六甲特色，圓球狀雞飯' },
  { name: '娘惹糕點', city: 'malacca', type: 'food', description: '彩色傳統糕點' },

  // 沙巴
  { name: '神山公園', city: 'sabah', type: 'attraction', description: '東南亞最高峰，世界遺產' },
  { name: '神山登頂', city: 'sabah', type: 'experience', description: '挑戰4095米東南亞屋脊' },
  { name: '沙比島', city: 'sabah', type: 'beach', description: '浮潛天堂，東姑阿都拉曼海洋公園' },
  { name: '馬努干島', city: 'sabah', type: 'beach', description: '水上活動和海灘度假' },
  { name: '美人魚島', city: 'sabah', type: 'beach', description: '夢幻藍海，長尾鯊出沒' },
  { name: '丹絨亞路海灘', city: 'sabah', type: 'beach', description: '世界三大日落之一' },
  { name: '水上清真寺', city: 'sabah', type: 'temple', description: '亞庇地標，倒映水中的清真寺' },
  { name: '螢火蟲生態遊', city: 'sabah', type: 'experience', description: '夜遊紅樹林賞螢火蟲' },
  { name: '長鼻猴生態遊', city: 'sabah', type: 'experience', description: '觀賞婆羅洲特有長鼻猴' },
  { name: '沙巴海鮮', city: 'sabah', type: 'food', description: '便宜新鮮的海鮮料理' },
  { name: '沙巴叻沙', city: 'sabah', type: 'food', description: '沙巴式叻沙，口味獨特' },

  // 怡保
  { name: '舊街場白咖啡', city: 'ipoh', type: 'food', description: '白咖啡發源地' },
  { name: '二奶巷', city: 'ipoh', type: 'attraction', description: '文青打卡老街巷弄' },
  { name: '凱利古堡', city: 'ipoh', type: 'heritage', description: '神秘未完成的蘇格蘭城堡' },
  { name: '極樂洞', city: 'ipoh', type: 'temple', description: '石灰岩洞穴寺廟' },
  { name: '三寶洞', city: 'ipoh', type: 'temple', description: '400年歷史的洞穴寺廟' },
  { name: '怡保芽菜雞', city: 'ipoh', type: 'food', description: '肥美雞肉配脆嫩芽菜' },
  { name: '鹽焗雞', city: 'ipoh', type: 'food', description: '怡保名菜，皮脆肉嫩' },

  // ========== 印尼 ==========
  // 峇里島
  { name: '烏布皇宮', city: 'bali', type: 'heritage', description: '峇里島藝術文化中心' },
  { name: '烏布市場', city: 'bali', type: 'market', description: '傳統手工藝品市集' },
  { name: '聖猴森林', city: 'bali', type: 'attraction', description: '猴群棲息的神聖森林' },
  { name: '德格拉朗梯田', city: 'bali', type: 'viewpoint', description: '世界遺產，壯觀梯田' },
  { name: '海神廟', city: 'bali', type: 'temple', description: '海上日落絕景，峇里島象徵' },
  {
    name: '烏魯瓦圖斷崖廟',
    city: 'bali',
    type: 'temple',
    description: '懸崖上的古老寺廟，日落景觀',
  },
  { name: '聖泉寺', city: 'bali', type: 'temple', description: '千年聖水湧出的寺廟' },
  { name: '百沙基母廟', city: 'bali', type: 'temple', description: '峇里島最大最神聖的寺廟' },
  { name: '水之宮殿', city: 'bali', type: 'heritage', description: '提爾塔甘加皇家水上花園' },
  { name: '京打馬尼火山', city: 'bali', type: 'viewpoint', description: '壯觀的活火山和火山湖' },
  { name: '庫塔海灘', city: 'bali', type: 'beach', description: '衝浪和日落派對聖地' },
  { name: '水明漾', city: 'bali', type: 'shopping', description: '精品店和時尚咖啡廳' },
  { name: '金巴蘭海灘', city: 'bali', type: 'beach', description: '海灘燭光晚餐，日落BBQ' },
  { name: '努沙杜瓦', city: 'bali', type: 'beach', description: '五星級度假村區域' },
  { name: '藍夢島', city: 'bali', type: 'beach', description: '夢幻藍海，惡魔的眼淚' },
  { name: '佩妮達島', city: 'bali', type: 'beach', description: '恐龍灣、天使海灘' },
  { name: '烏布SPA', city: 'bali', type: 'experience', description: '峇里島式按摩和SPA體驗' },
  { name: '烹飪課程', city: 'bali', type: 'experience', description: '學做印尼傳統料理' },
  { name: '峇里島傳統舞蹈', city: 'bali', type: 'experience', description: '觀賞克差舞和雷貢舞' },
  { name: '髒鴨飯', city: 'bali', type: 'food', description: '烏布招牌，香酥鴨子' },
  { name: '豬肋排', city: 'bali', type: 'food', description: "Naughty Nuri's招牌" },
  { name: '印尼炒飯', city: 'bali', type: 'food', description: 'Nasi Goreng國民美食' },

  // 雅加達
  { name: '獨立紀念碑', city: 'jakarta', type: 'landmark', description: '印尼獨立象徵，132米高塔' },
  { name: '伊斯蒂克拉爾清真寺', city: 'jakarta', type: 'temple', description: '東南亞最大清真寺' },
  {
    name: '雅加達大教堂',
    city: 'jakarta',
    type: 'heritage',
    description: '荷蘭殖民時期新哥德式教堂',
  },
  { name: '舊城區', city: 'jakarta', type: 'heritage', description: '荷蘭殖民建築群' },
  { name: '法塔希拉廣場', city: 'jakarta', type: 'heritage', description: '舊城中心，博物館群' },
  { name: '印尼國家博物館', city: 'jakarta', type: 'museum', description: '東南亞最豐富的博物館' },
  { name: '安佐爾夢幻樂園', city: 'jakarta', type: 'theme_park', description: '印尼最大主題樂園' },
  { name: '千島群島', city: 'jakarta', type: 'beach', description: '雅加達近郊的海島度假' },

  // 日惹
  {
    name: '婆羅浮屠',
    city: 'yogyakarta',
    type: 'heritage',
    description: '世界最大佛教遺跡，世界遺產',
  },
  { name: '普蘭巴南', city: 'yogyakarta', type: 'heritage', description: '世界最大印度教神廟群' },
  { name: '日惹蘇丹王宮', city: 'yogyakarta', type: 'heritage', description: '現存的蘇丹皇宮' },
  { name: '水宮', city: 'yogyakarta', type: 'heritage', description: '蘇丹的水上花園和浴場' },
  {
    name: '馬里奧波羅大街',
    city: 'yogyakarta',
    type: 'shopping',
    description: '日惹最熱鬧的購物街',
  },
  { name: '婆羅浮屠日出', city: 'yogyakarta', type: 'experience', description: '清晨觀賞佛塔日出' },
  {
    name: '爪哇傳統蠟染',
    city: 'yogyakarta',
    type: 'experience',
    description: 'Batik蠟染工藝體驗',
  },
  { name: '皮影戲表演', city: 'yogyakarta', type: 'experience', description: '傳統爪哇皮影戲' },
  { name: '默拉皮火山', city: 'yogyakarta', type: 'attraction', description: '印尼最活躍的火山' },

  // 龍目島
  { name: '吉利群島', city: 'lombok', type: 'beach', description: '三座小島，潛水天堂' },
  { name: '吉利特拉旺安', city: 'lombok', type: 'beach', description: '派對島，夜生活熱鬧' },
  {
    name: '林賈尼火山',
    city: 'lombok',
    type: 'attraction',
    description: '印尼第二高火山，登山挑戰',
  },
  { name: '庫塔龍目', city: 'lombok', type: 'beach', description: '衝浪勝地，未開發海灘' },
  { name: '粉紅海灘', city: 'lombok', type: 'beach', description: '世界僅有的粉紅色沙灘' },
  { name: '薩薩克村', city: 'lombok', type: 'heritage', description: '傳統龍目島原住民村落' },
]

async function importData() {
  console.log('========================================')
  console.log('  擴充景點資料庫 - 第三批')
  console.log('  日本(沖繩+北海道) + 新加坡 + 馬來西亞 + 印尼')
  console.log('========================================\n')

  // 1. 新增國家
  console.log('📍 新增國家...')
  for (const country of newCountries) {
    const { data: existing } = await supabase
      .from('countries')
      .select('id')
      .eq('id', country.id)
      .single()

    if (existing) {
      console.log(`  ⏭️ ${country.name} 已存在`)
    } else {
      const { error } = await supabase.from('countries').insert(country)
      if (error) {
        console.log(`  ❌ ${country.name} 失敗: ${error.message}`)
      } else {
        console.log(`  ✅ ${country.name} 新增成功`)
      }
    }
  }

  // 2. 新增城市
  console.log('\n📍 新增城市...')
  for (const city of newCities) {
    const { data: existing } = await supabase.from('cities').select('id').eq('id', city.id).single()

    if (existing) {
      console.log(`  ⏭️ ${city.name} 已存在`)
    } else {
      const { error } = await supabase.from('cities').insert(city)
      if (error) {
        console.log(`  ❌ ${city.name} 失敗: ${error.message}`)
      } else {
        console.log(`  ✅ ${city.name} 新增成功`)
      }
    }
  }

  // 3. 取得所有城市
  const { data: cities } = await supabase.from('cities').select('id, country_id')

  const cityMap = {}
  if (cities) {
    cities.forEach(c => (cityMap[c.id] = { id: c.id, country_id: c.country_id }))
  }

  // 4. 導入景點
  console.log('\n📍 導入景點...')
  console.log(`  總數: ${attractions.length} 個\n`)

  let success = 0
  let skipped = 0
  let failed = 0

  for (const attr of attractions) {
    const cityInfo = cityMap[attr.city]
    if (!cityInfo) {
      console.log(`❌ ${attr.name} - 找不到城市 ${attr.city}`)
      failed++
      continue
    }

    // 檢查是否已存在
    const { data: existing } = await supabase
      .from('attractions')
      .select('id')
      .eq('name', attr.name)
      .eq('city_id', cityInfo.id)
      .single()

    if (existing) {
      console.log(`⏭️ ${attr.name} (${attr.city}) 已存在`)
      skipped++
      continue
    }

    const { error } = await supabase.from('attractions').insert({
      name: attr.name,
      description: attr.description,
      type: attr.type,
      city_id: cityInfo.id,
      country_id: cityInfo.country_id,
      workspace_id: WORKSPACE_ID,
    })

    if (error) {
      console.log(`❌ ${attr.name} 失敗: ${error.message}`)
      failed++
    } else {
      console.log(`✅ ${attr.name} (${attr.city})`)
      success++
    }
  }

  // 統計
  console.log('\n========================================')
  console.log('  導入完成！')
  console.log(`  成功: ${success} 個`)
  console.log(`  已存在: ${skipped} 個`)
  console.log(`  失敗: ${failed} 個`)
  console.log('========================================')

  // 顯示總數
  const { count } = await supabase.from('attractions').select('*', { count: 'exact', head: true })

  console.log(`\n資料庫總景點數: ${count} 個`)
}

importData()
