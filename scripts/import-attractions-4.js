const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

const WORKSPACE_ID = '8ef05a74-1f87-48ab-afd3-9bfeb423935d'

// 新城市
const newCities = [
  // 中國補強
  { id: 'beijing', name: '北京', country_id: 'china' },
  { id: 'hangzhou', name: '杭州', country_id: 'china' },
  { id: 'nanjing', name: '南京', country_id: 'china' },
  { id: 'suzhou', name: '蘇州', country_id: 'china' },
  { id: 'kunming', name: '昆明', country_id: 'china' },
  { id: 'dali', name: '大理', country_id: 'china' },
  { id: 'lijiang', name: '麗江', country_id: 'china' },
  { id: 'guilin', name: '桂林', country_id: 'china' },
  { id: 'zhangjiajie', name: '張家界', country_id: 'china' },
  { id: 'huangshan', name: '黃山', country_id: 'china' },
  { id: 'qingdao', name: '青島', country_id: 'china' },
  { id: 'xiamen-city', name: '廈門市', country_id: 'china' }, // 如果重複會跳過
  { id: 'sanya', name: '三亞', country_id: 'china' },
  { id: 'haikou', name: '海口', country_id: 'china' },
  { id: 'lhasa', name: '拉薩', country_id: 'china' },
  { id: 'shangri-la', name: '香格里拉', country_id: 'china' },
  { id: 'jiuzhaigou', name: '九寨溝', country_id: 'china' },
]

// 景點 + 飯店資料
const attractions = [
  // ========== 中國 - 北京 ==========
  { name: '故宮博物院', city: 'beijing', type: 'heritage', description: '世界最大宮殿建築群，世界文化遺產' },
  { name: '天安門廣場', city: 'beijing', type: 'landmark', description: '世界最大城市廣場' },
  { name: '長城-八達嶺', city: 'beijing', type: 'heritage', description: '萬里長城最著名段落' },
  { name: '長城-慕田峪', city: 'beijing', type: 'heritage', description: '較少人的長城段落，景色優美' },
  { name: '頤和園', city: 'beijing', type: 'heritage', description: '皇家園林，世界文化遺產' },
  { name: '天壇', city: 'beijing', type: 'heritage', description: '明清皇帝祭天之所' },
  { name: '圓明園', city: 'beijing', type: 'heritage', description: '萬園之園遺址' },
  { name: '南鑼鼓巷', city: 'beijing', type: 'shopping', description: '北京最有名的胡同商業街' },
  { name: '什剎海', city: 'beijing', type: 'attraction', description: '老北京風情，酒吧街' },
  { name: '798藝術區', city: 'beijing', type: 'attraction', description: '當代藝術聚落' },
  { name: '景山公園', city: 'beijing', type: 'viewpoint', description: '俯瞰故宮全景' },
  { name: '北海公園', city: 'beijing', type: 'park', description: '皇家園林，白塔地標' },
  { name: '雍和宮', city: 'beijing', type: 'temple', description: '北京最大藏傳佛教寺院' },
  { name: '恭王府', city: 'beijing', type: 'heritage', description: '清代親王府邸' },
  { name: '鳥巢', city: 'beijing', type: 'landmark', description: '2008奧運主場館' },
  { name: '水立方', city: 'beijing', type: 'landmark', description: '奧運游泳館' },
  { name: '王府井', city: 'beijing', type: 'shopping', description: '北京最著名商業街' },
  { name: '三里屯', city: 'beijing', type: 'shopping', description: '時尚潮流區，太古里' },
  { name: '全聚德烤鴨', city: 'beijing', type: 'food', description: '北京烤鴨老字號' },
  { name: '大董烤鴨', city: 'beijing', type: 'food', description: '創意北京烤鴨' },
  { name: '老北京炸醬麵', city: 'beijing', type: 'food', description: '地道老北京味道' },
  { name: '涮羊肉', city: 'beijing', type: 'food', description: '銅鍋涮肉老北京火鍋' },

  // ========== 中國 - 杭州 ==========
  { name: '西湖', city: 'hangzhou', type: 'attraction', description: '人間天堂，世界文化遺產' },
  { name: '雷峰塔', city: 'hangzhou', type: 'landmark', description: '白蛇傳傳說地' },
  { name: '靈隱寺', city: 'hangzhou', type: 'temple', description: '江南名剎' },
  { name: '西溪濕地', city: 'hangzhou', type: 'park', description: '城市濕地公園' },
  { name: '河坊街', city: 'hangzhou', type: 'shopping', description: '南宋御街，老字號' },
  { name: '宋城', city: 'hangzhou', type: 'theme_park', description: '宋代主題樂園' },
  { name: '龍井茶園', city: 'hangzhou', type: 'experience', description: '品茶體驗，茶文化' },
  { name: '千島湖', city: 'hangzhou', type: 'attraction', description: '1078座島嶼的人工湖' },
  { name: '西湖印象', city: 'hangzhou', type: 'experience', description: '張藝謀山水實景演出' },
  { name: '知味觀', city: 'hangzhou', type: 'food', description: '杭幫菜老字號' },
  { name: '外婆家', city: 'hangzhou', type: 'food', description: '杭幫家常菜連鎖' },
  { name: '龍井蝦仁', city: 'hangzhou', type: 'food', description: '杭州名菜' },
  { name: '東坡肉', city: 'hangzhou', type: 'food', description: '蘇東坡發明的名菜' },

  // ========== 中國 - 南京 ==========
  { name: '中山陵', city: 'nanjing', type: 'heritage', description: '國父孫中山陵墓' },
  { name: '明孝陵', city: 'nanjing', type: 'heritage', description: '明太祖陵墓，世界遺產' },
  { name: '夫子廟', city: 'nanjing', type: 'heritage', description: '秦淮河畔，夜景繁華' },
  { name: '秦淮河', city: 'nanjing', type: 'attraction', description: '十里秦淮，畫舫遊船' },
  { name: '南京城牆', city: 'nanjing', type: 'heritage', description: '世界最長城市城牆' },
  { name: '總統府', city: 'nanjing', type: 'heritage', description: '民國政府所在地' },
  { name: '玄武湖', city: 'nanjing', type: 'park', description: '江南最大皇家園林湖泊' },
  { name: '雞鳴寺', city: 'nanjing', type: 'temple', description: '南京最古老寺廟' },
  { name: '南京博物院', city: 'nanjing', type: 'museum', description: '中國三大博物館之一' },
  { name: '鹽水鴨', city: 'nanjing', type: 'food', description: '南京招牌美食' },
  { name: '鴨血粉絲湯', city: 'nanjing', type: 'food', description: '南京小吃代表' },
  { name: '獅子頭', city: 'nanjing', type: 'food', description: '淮揚菜經典' },

  // ========== 中國 - 蘇州 ==========
  { name: '拙政園', city: 'suzhou', type: 'garden', description: '中國四大名園之一' },
  { name: '獅子林', city: 'suzhou', type: 'garden', description: '假山迷宮園林' },
  { name: '留園', city: 'suzhou', type: 'garden', description: '中國四大名園之一' },
  { name: '虎丘', city: 'suzhou', type: 'heritage', description: '吳中第一名勝' },
  { name: '寒山寺', city: 'suzhou', type: 'temple', description: '楓橋夜泊詩中名寺' },
  { name: '平江路', city: 'suzhou', type: 'attraction', description: '老蘇州水巷風情' },
  { name: '山塘街', city: 'suzhou', type: 'shopping', description: '姑蘇第一名街' },
  { name: '周莊', city: 'suzhou', type: 'heritage', description: '江南第一水鄉' },
  { name: '同里古鎮', city: 'suzhou', type: 'heritage', description: '江南六大古鎮之一' },
  { name: '金雞湖', city: 'suzhou', type: 'attraction', description: '現代蘇州新地標' },
  { name: '蘇式麵', city: 'suzhou', type: 'food', description: '燜肉麵、爆魚麵' },
  { name: '松鼠桂魚', city: 'suzhou', type: 'food', description: '蘇幫菜代表' },

  // ========== 中國 - 雲南 ==========
  // 昆明
  { name: '石林', city: 'kunming', type: 'attraction', description: '世界自然遺產，喀斯特奇觀' },
  { name: '滇池', city: 'kunming', type: 'attraction', description: '高原明珠，海鷗季節' },
  { name: '翠湖公園', city: 'kunming', type: 'park', description: '市中心翡翠般的湖泊' },
  { name: '雲南民族村', city: 'kunming', type: 'attraction', description: '26個民族風情展示' },
  { name: '西山龍門', city: 'kunming', type: 'viewpoint', description: '俯瞰滇池的懸崖步道' },
  { name: '過橋米線', city: 'kunming', type: 'food', description: '雲南第一美食' },
  { name: '汽鍋雞', city: 'kunming', type: 'food', description: '雲南傳統名菜' },

  // 大理
  { name: '洱海', city: 'dali', type: 'attraction', description: '蒼山洱海，風花雪月' },
  { name: '大理古城', city: 'dali', type: 'heritage', description: '白族建築風格古城' },
  { name: '蒼山', city: 'dali', type: 'attraction', description: '十九峰十八溪' },
  { name: '崇聖寺三塔', city: 'dali', type: 'heritage', description: '大理地標，千年古塔' },
  { name: '雙廊古鎮', city: 'dali', type: 'attraction', description: '洱海邊的文藝小鎮' },
  { name: '喜洲古鎮', city: 'dali', type: 'heritage', description: '白族傳統建築群' },
  { name: '環洱海騎行', city: 'dali', type: 'experience', description: '130公里環湖公路' },
  { name: '白族三道茶', city: 'dali', type: 'experience', description: '一苦二甜三回味' },
  { name: '乳扇', city: 'dali', type: 'food', description: '白族特色乳製品' },
  { name: '餌絲', city: 'dali', type: 'food', description: '大理傳統小吃' },

  // 麗江
  { name: '麗江古城', city: 'lijiang', type: 'heritage', description: '世界文化遺產，納西文化' },
  { name: '玉龍雪山', city: 'lijiang', type: 'attraction', description: '海拔5596米的聖山' },
  { name: '藍月谷', city: 'lijiang', type: 'attraction', description: '玉龍雪山下的藍色湖泊' },
  { name: '束河古鎮', city: 'lijiang', type: 'heritage', description: '比麗江更寧靜的古鎮' },
  { name: '黑龍潭', city: 'lijiang', type: 'park', description: '玉龍雪山倒影' },
  { name: '瀘沽湖', city: 'lijiang', type: 'attraction', description: '摩梭族母系社會，走婚風俗' },
  { name: '印象麗江', city: 'lijiang', type: 'experience', description: '張藝謀高原實景演出' },
  { name: '納西古樂', city: 'lijiang', type: 'experience', description: '世界非物質文化遺產' },
  { name: '雞豆涼粉', city: 'lijiang', type: 'food', description: '麗江特色小吃' },
  { name: '臘排骨火鍋', city: 'lijiang', type: 'food', description: '納西族特色' },

  // 香格里拉
  { name: '普達措國家公園', city: 'shangri-la', type: 'park', description: '中國第一個國家公園' },
  { name: '松贊林寺', city: 'shangri-la', type: 'temple', description: '雲南最大藏傳佛教寺院' },
  { name: '獨克宗古城', city: 'shangri-la', type: 'heritage', description: '世界最大轉經筒' },
  { name: '納帕海', city: 'shangri-la', type: 'attraction', description: '高原草甸濕地' },
  { name: '虎跳峽', city: 'shangri-la', type: 'attraction', description: '世界最深峽谷之一' },
  { name: '梅里雪山', city: 'shangri-la', type: 'viewpoint', description: '日照金山奇觀' },
  { name: '犛牛火鍋', city: 'shangri-la', type: 'food', description: '藏族特色美食' },
  { name: '青稞酒', city: 'shangri-la', type: 'food', description: '藏族傳統酒' },

  // ========== 中國 - 桂林 ==========
  { name: '灕江遊船', city: 'guilin', type: 'experience', description: '桂林山水甲天下' },
  { name: '陽朔西街', city: 'guilin', type: 'shopping', description: '洋人街，夜生活' },
  { name: '象鼻山', city: 'guilin', type: 'landmark', description: '桂林城徽' },
  { name: '龍脊梯田', city: 'guilin', type: 'viewpoint', description: '世界梯田之冠' },
  { name: '印象劉三姐', city: 'guilin', type: 'experience', description: '張藝謀山水實景演出' },
  { name: '遇龍河竹筏', city: 'guilin', type: 'experience', description: '小灕江，更寧靜' },
  { name: '十里畫廊', city: 'guilin', type: 'viewpoint', description: '騎行賞喀斯特地貌' },
  { name: '銀子岩', city: 'guilin', type: 'attraction', description: '溶洞奇觀' },
  { name: '桂林米粉', city: 'guilin', type: 'food', description: '天下第一粉' },
  { name: '啤酒魚', city: 'guilin', type: 'food', description: '陽朔名菜' },

  // ========== 中國 - 張家界 ==========
  { name: '張家界國家森林公園', city: 'zhangjiajie', type: 'park', description: '阿凡達取景地' },
  { name: '天門山', city: 'zhangjiajie', type: 'attraction', description: '天門洞，玻璃棧道' },
  { name: '天門山索道', city: 'zhangjiajie', type: 'experience', description: '世界最長高山索道' },
  { name: '玻璃橋', city: 'zhangjiajie', type: 'attraction', description: '世界最高最長玻璃橋' },
  { name: '百龍天梯', city: 'zhangjiajie', type: 'attraction', description: '世界最高戶外電梯' },
  { name: '金鞭溪', city: 'zhangjiajie', type: 'attraction', description: '峽谷溪流步道' },
  { name: '袁家界', city: 'zhangjiajie', type: 'viewpoint', description: '阿凡達懸浮山原型' },
  { name: '天子山', city: 'zhangjiajie', type: 'viewpoint', description: '峰林奇觀' },
  { name: '鳳凰古城', city: 'zhangjiajie', type: 'heritage', description: '沈從文筆下的邊城' },
  { name: '三下鍋', city: 'zhangjiajie', type: 'food', description: '土家族特色火鍋' },

  // ========== 中國 - 黃山 ==========
  { name: '黃山風景區', city: 'huangshan', type: 'attraction', description: '五嶽歸來不看山，黃山歸來不看嶽' },
  { name: '迎客松', city: 'huangshan', type: 'landmark', description: '黃山地標' },
  { name: '光明頂', city: 'huangshan', type: 'viewpoint', description: '黃山第二高峰' },
  { name: '西海大峽谷', city: 'huangshan', type: 'attraction', description: '夢幻峽谷' },
  { name: '宏村', city: 'huangshan', type: 'heritage', description: '世界文化遺產徽派建築' },
  { name: '西遞', city: 'huangshan', type: 'heritage', description: '世界文化遺產古村落' },
  { name: '屯溪老街', city: 'huangshan', type: 'shopping', description: '徽州文化老街' },
  { name: '臭鱖魚', city: 'huangshan', type: 'food', description: '徽菜代表' },
  { name: '毛豆腐', city: 'huangshan', type: 'food', description: '徽州特色發酵豆腐' },

  // ========== 中國 - 青島 ==========
  { name: '棧橋', city: 'qingdao', type: 'landmark', description: '青島地標' },
  { name: '八大關', city: 'qingdao', type: 'heritage', description: '萬國建築博覽會' },
  { name: '嶗山', city: 'qingdao', type: 'attraction', description: '海上仙山' },
  { name: '青島啤酒博物館', city: 'qingdao', type: 'museum', description: '百年啤酒歷史' },
  { name: '五四廣場', city: 'qingdao', type: 'landmark', description: '五月的風雕塑' },
  { name: '金沙灘', city: 'qingdao', type: 'beach', description: '亞洲第一灘' },
  { name: '天主教堂', city: 'qingdao', type: 'heritage', description: '德國哥德式教堂' },
  { name: '小青島', city: 'qingdao', type: 'attraction', description: '燈塔和海景' },
  { name: '青島海鮮', city: 'qingdao', type: 'food', description: '新鮮海產' },
  { name: '青島啤酒', city: 'qingdao', type: 'food', description: '用塑膠袋裝的生啤' },

  // ========== 中國 - 三亞 ==========
  { name: '亞龍灣', city: 'sanya', type: 'beach', description: '天下第一灣' },
  { name: '蜈支洲島', city: 'sanya', type: 'beach', description: '中國馬爾地夫' },
  { name: '天涯海角', city: 'sanya', type: 'landmark', description: '浪漫愛情地標' },
  { name: '南山文化旅遊區', city: 'sanya', type: 'temple', description: '108米海上觀音' },
  { name: '呀諾達雨林', city: 'sanya', type: 'park', description: '熱帶雨林探險' },
  { name: '三亞灣', city: 'sanya', type: 'beach', description: '椰夢長廊日落' },
  { name: '大東海', city: 'sanya', type: 'beach', description: '市區最近海灘' },
  { name: '後海村', city: 'sanya', type: 'attraction', description: '衝浪勝地' },
  { name: '第一市場', city: 'sanya', type: 'market', description: '海鮮加工一條街' },
  { name: '文昌雞', city: 'sanya', type: 'food', description: '海南四大名菜' },
  { name: '椰子雞', city: 'sanya', type: 'food', description: '海南特色火鍋' },

  // ========== 中國 - 九寨溝 ==========
  { name: '九寨溝風景區', city: 'jiuzhaigou', type: 'attraction', description: '童話世界，世界自然遺產' },
  { name: '五花海', city: 'jiuzhaigou', type: 'attraction', description: '九寨溝精華' },
  { name: '諾日朗瀑布', city: 'jiuzhaigou', type: 'attraction', description: '中國最寬瀑布' },
  { name: '長海', city: 'jiuzhaigou', type: 'attraction', description: '九寨溝最大湖泊' },
  { name: '五彩池', city: 'jiuzhaigou', type: 'attraction', description: '黃龍景區精華' },
  { name: '黃龍風景區', city: 'jiuzhaigou', type: 'attraction', description: '彩池梯田，世界遺產' },

  // ========== 中國 - 拉薩 ==========
  { name: '布達拉宮', city: 'lhasa', type: 'heritage', description: '藏傳佛教聖地，世界遺產' },
  { name: '大昭寺', city: 'lhasa', type: 'temple', description: '藏傳佛教最神聖寺廟' },
  { name: '八廓街', city: 'lhasa', type: 'shopping', description: '轉經道，藏族文化' },
  { name: '羅布林卡', city: 'lhasa', type: 'heritage', description: '達賴喇嘛夏宮' },
  { name: '納木錯', city: 'lhasa', type: 'attraction', description: '世界最高鹹水湖' },
  { name: '羊卓雍錯', city: 'lhasa', type: 'attraction', description: '西藏三大聖湖之一' },
  { name: '色拉寺', city: 'lhasa', type: 'temple', description: '辯經場面壯觀' },
  { name: '酥油茶', city: 'lhasa', type: 'food', description: '藏族傳統飲品' },
  { name: '糌粑', city: 'lhasa', type: 'food', description: '藏族主食' },
  { name: '藏式火鍋', city: 'lhasa', type: 'food', description: '犛牛肉火鍋' },

  // ===============================================
  // 網紅飯店 / 奢華飯店 / 野奢住宿
  // ===============================================

  // ===== 日本 =====
  { name: '安縵東京', city: 'tokyo', type: 'hotel', description: '大手町最頂級奢華酒店，日式極簡美學' },
  { name: '東京柏悅酒店', city: 'tokyo', type: 'hotel', description: '新宿頂樓景觀，設計大師作品' },
  { name: '東京半島酒店', city: 'tokyo', type: 'hotel', description: '皇居旁頂級奢華酒店' },
  { name: '虹夕諾雅東京', city: 'tokyo', type: 'hotel', description: '都市中的日式旅館，星野頂級品牌' },
  { name: '安縵京都', city: 'kyoto', type: 'hotel', description: '洛北山林中的極致奢華' },
  { name: '虹夕諾雅京都', city: 'kyoto', type: 'hotel', description: '嵐山船隻才能抵達的秘境旅館' },
  { name: '翠嵐豪華精選', city: 'kyoto', type: 'hotel', description: '嵐山竹林旁的奢華旅館' },
  { name: '柊家旅館', city: 'kyoto', type: 'hotel', description: '200年歷史的傳統京都老舖旅館' },
  { name: '俵屋旅館', city: 'kyoto', type: 'hotel', description: '京都三大老舖旅館之一' },
  { name: '大阪瑞吉酒店', city: 'osaka', type: 'hotel', description: '大阪最奢華酒店之一' },
  { name: '虹夕諾雅富士', city: 'furano', type: 'hotel', description: '富士山腳的野奢露營' },
  { name: '虹夕諾雅輕井澤', city: 'takayama', type: 'hotel', description: '水上獨棟Villa' },
  { name: '界 阿蘇', city: 'kumamoto', type: 'hotel', description: '阿蘇火山野奢溫泉' },
  { name: '由布院玉之湯', city: 'fukuoka', type: 'hotel', description: '九州最頂級溫泉旅館' },

  // ===== 泰國 =====
  { name: '安縵布里', city: 'phuket', type: 'hotel', description: '普吉島最奢華私密度假村' },
  { name: '悅榕莊普吉島', city: 'phuket', type: 'hotel', description: 'Banyan Tree頂級Villa' },
  { name: '斯攀瓦角', city: 'phuket', type: 'hotel', description: '懸崖上的設計酒店' },
  { name: '四季蘇梅島', city: 'koh-samui', type: 'hotel', description: '私人泳池Villa' },
  { name: '六善蘇梅島', city: 'koh-samui', type: 'hotel', description: 'Six Senses極致spa' },
  { name: '安納塔拉金三角', city: 'chiang-rai', type: 'hotel', description: '與大象共處的野奢營地' },
  { name: '四季清邁', city: 'chiang-mai', type: 'hotel', description: '蘭納風格田園Villa' },
  { name: '137柱府公館', city: 'chiang-mai', type: 'hotel', description: '殖民風格精品酒店' },
  { name: '曼谷文華東方', city: 'bangkok', type: 'hotel', description: '亞洲最傳奇酒店之一' },
  { name: '曼谷半島酒店', city: 'bangkok', type: 'hotel', description: '湄南河畔經典奢華' },
  { name: 'Rosewood曼谷', city: 'bangkok', type: 'hotel', description: '頂級設計酒店' },
  { name: 'Keemala普吉', city: 'phuket', type: 'hotel', description: '樹屋鳥巢造型網紅酒店' },

  // ===== 峇里島 =====
  { name: '安縵吉沃', city: 'bali', type: 'hotel', description: '婆羅浮屠旁的極致奢華' },
  { name: '安縵達里', city: 'bali', type: 'hotel', description: '烏布梯田中的奢華隱居' },
  { name: '寶格麗峇里島', city: 'bali', type: 'hotel', description: '懸崖上的義式奢華' },
  { name: '虹夕諾雅峇里', city: 'bali', type: 'hotel', description: '阿勇河峽谷中的日式Villa' },
  { name: '四季峇里烏布', city: 'bali', type: 'hotel', description: '河谷梯田中的Villa' },
  { name: '四季峇里金巴蘭', city: 'bali', type: 'hotel', description: '海灘私人Villa' },
  { name: '烏布空中花園', city: 'bali', type: 'hotel', description: '網紅無邊際泳池' },
  { name: 'Capella Ubud', city: 'bali', type: 'hotel', description: '雨林中的帳篷野奢' },

  // ===== 馬來西亞 =====
  { name: 'The Datai蘭卡威', city: 'langkawi', type: 'hotel', description: '雨林海灘頂級度假村' },
  { name: '四季蘭卡威', city: 'langkawi', type: 'hotel', description: '私人海灘Villa' },
  { name: '嘉佩樂沙巴', city: 'sabah', type: 'hotel', description: 'Gaya島上的頂級度假村' },
  { name: '六善沙巴', city: 'sabah', type: 'hotel', description: '雨林與海洋的野奢' },
  { name: '文華東方吉隆坡', city: 'kuala-lumpur', type: 'hotel', description: '雙子塔景觀奢華酒店' },

  // ===== 越南 =====
  { name: '安縵峴港', city: 'danang', type: 'hotel', description: '越南最奢華安縵' },
  { name: '六善寧雲灣', city: 'nha-trang', type: 'hotel', description: 'Six Senses越南' },
  { name: '洲際峴港', city: 'danang', type: 'hotel', description: 'Sun Peninsula懸崖Villa' },
  { name: '嘉佩樂富國島', city: 'phu-quoc', type: 'hotel', description: '熱帶島嶼頂級度假村' },
  { name: 'JW萬豪富國島', city: 'phu-quoc', type: 'hotel', description: '翡翠灣絕美Villa' },

  // ===== 新加坡 =====
  { name: '萊佛士酒店', city: 'singapore-city', type: 'hotel', description: '新加坡最經典傳奇酒店' },
  { name: '嘉佩樂聖淘沙', city: 'singapore-city', type: 'hotel', description: '殖民建築頂級度假村' },
  { name: '濱海灣金沙', city: 'singapore-city', type: 'hotel', description: '無邊際泳池地標酒店' },
  { name: '麗思卡爾頓新加坡', city: 'singapore-city', type: 'hotel', description: '濱海灣頂級奢華' },

  // ===== 中國 =====
  { name: '安縵頤和', city: 'beijing', type: 'hotel', description: '頤和園旁的極致奢華' },
  { name: '北京瑰麗', city: 'beijing', type: 'hotel', description: '王府井最頂級酒店' },
  { name: '北京寶格麗', city: 'beijing', type: 'hotel', description: '義式奢華精品酒店' },
  { name: '上海外灘華爾道夫', city: 'shanghai', type: 'hotel', description: '外灘萬國建築群中的傳奇' },
  { name: '上海璞麗', city: 'shanghai', type: 'hotel', description: '靜安寺旁的設計酒店' },
  { name: '安縵法雲', city: 'hangzhou', type: 'hotel', description: '靈隱寺旁的古村落酒店' },
  { name: '西湖國賓館', city: 'hangzhou', type: 'hotel', description: '西湖私人島嶼上的國賓館' },
  { name: '裸心谷莫干山', city: 'hangzhou', type: 'hotel', description: '竹林野奢度假村' },
  { name: '法雲安縵', city: 'hangzhou', type: 'hotel', description: '茶園古村中的極致隱居' },
  { name: '鬆贊林卡香格里拉', city: 'shangri-la', type: 'hotel', description: '藏式野奢酒店' },
  { name: '鬆贊塔城', city: 'shangri-la', type: 'hotel', description: '滇金絲猴棲息地野奢' },
  { name: '既下山大理', city: 'dali', type: 'hotel', description: '洱海邊的網紅設計酒店' },
  { name: '大理實力希爾頓', city: 'dali', type: 'hotel', description: '蒼山洱海景觀' },
  { name: '麗江金茂璞修', city: 'lijiang', type: 'hotel', description: '雪山景觀野奢Villa' },
  { name: '麗江悅榕莊', city: 'lijiang', type: 'hotel', description: '納西風格頂級Villa' },
  { name: '三亞艾迪遜', city: 'sanya', type: 'hotel', description: '設計酒店網紅地標' },
  { name: '三亞太陽灣柏悅', city: 'sanya', type: 'hotel', description: '私人海灘頂級Villa' },
  { name: '三亞保利瑰麗', city: 'sanya', type: 'hotel', description: '崖州灣藝術酒店' },
  { name: '三亞安納塔拉', city: 'sanya', type: 'hotel', description: '親子度假村首選' },
  { name: '亞龍灣麗思卡爾頓', city: 'sanya', type: 'hotel', description: '亞龍灣最奢華酒店' },
]

async function importData() {
  console.log('========================================')
  console.log('  擴充景點資料庫 - 第四批')
  console.log('  中國補強 + 網紅/奢華/野奢飯店')
  console.log('========================================\n')

  // 1. 新增城市
  console.log('📍 新增城市...')
  for (const city of newCities) {
    const { data: existing } = await supabase
      .from('cities')
      .select('id')
      .eq('id', city.id)
      .single()

    if (existing) {
      console.log(`  ⏭️ ${city.name} 已存在`)
    } else {
      const { error } = await supabase
        .from('cities')
        .insert(city)
      if (error) {
        console.log(`  ❌ ${city.name} 失敗: ${error.message}`)
      } else {
        console.log(`  ✅ ${city.name} 新增成功`)
      }
    }
  }

  // 2. 取得所有城市
  const { data: cities } = await supabase
    .from('cities')
    .select('id, country_id')

  const cityMap = {}
  if (cities) {
    cities.forEach(c => cityMap[c.id] = { id: c.id, country_id: c.country_id })
  }

  // 3. 導入景點
  console.log('\n📍 導入景點與飯店...')
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

    const { error } = await supabase
      .from('attractions')
      .insert({
        name: attr.name,
        description: attr.description,
        type: attr.type,
        city_id: cityInfo.id,
        country_id: cityInfo.country_id,
        workspace_id: WORKSPACE_ID
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
  const { count } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  console.log(`\n資料庫總景點數: ${count} 個`)
}

importData()
