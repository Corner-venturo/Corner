// 新增並深度優化景點資料 - 東京、北海道、沖繩重要景點
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const workspace_id = '8ef05a74-1f87-48ab-afd3-9bfeb423935d';

// 完整的景點資料（新增+深度資訊）
const attractions = [
  // === 東京重要景點 ===
  {
    city: "東京",
    name: "上野公園",
    type: "landmark",
    description: "東京最大的公園之一，佔地約53萬平方公尺，園內有東京國立博物館、國立科學博物館、上野動物園等眾多文化設施。春季約1200棵櫻花樹盛開，是東京最知名的賞櫻名所。不忍池的蓮花與划船體驗也是人氣行程。",
    duration_minutes: 180,
    opening_hours: "5:00-23:00（公園免費開放，各設施時間不同）",
    tags: ["賞櫻名所", "博物館群", "動物園", "蓮花池", "免費入場", "親子景點", "文化藝術", "划船體驗"],
    notes: "上野動物園大熊貓「香香」超人氣，建議平日前往。博物館週一休館。不忍池划船約700日圓/30分鐘。"
  },
  {
    city: "東京",
    name: "東京車站",
    type: "landmark",
    description: "1914年開業的紅磚建築，歷經戰爭損毀後於2012年完成復原。丸之內站舍的圓頂內部雕刻精美，車站內的東京站一番街匯集動漫商品、拉麵街、甜點街。地下街「八重洲地下城」是購物美食的寶庫。",
    duration_minutes: 90,
    opening_hours: "車站24小時，商店街約10:00-21:00",
    tags: ["歷史建築", "紅磚建築", "購物商場", "美食街", "動漫商品", "拉麵街", "甜點天堂", "交通樞紐"],
    notes: "東京站限定伴手禮必買「東京芭娜娜」。一番街的動漫周邊商品比秋葉原便宜。晚上車站點燈非常美麗。"
  },
  {
    city: "東京",
    name: "秋葉原電器街",
    type: "shopping",
    description: "全球最大的電器與動漫文化聖地。從傳統電器街發展成動漫、遊戲、偶像文化的中心。有數百家動漫商品店、女僕咖啡廳、扭蛋專門店。Radio會館、虎之穴、Animate是代表性商店。",
    duration_minutes: 180,
    opening_hours: "各店約11:00-20:00，部分至21:00",
    tags: ["電器街", "動漫聖地", "女僕咖啡廳", "扭蛋天堂", "遊戲中心", "偶像文化", "公仔模型", "二次元"],
    notes: "Radio會館8層樓都是動漫商品。女僕咖啡廳建議選有英文菜單的店。週日中央通行人天國12:00-18:00。"
  },
  {
    city: "東京",
    name: "原宿竹下通",
    type: "shopping",
    description: "全長約400公尺的青年時尚發源地，兩側林立超過100家流行服飾店、可愛雜貨店、甜點店。可麗餅是竹下通的代表美食，「馬里昂可麗餅」是元祖名店。裏原宿則是潮牌集中地。",
    duration_minutes: 90,
    opening_hours: "約11:00-20:00（各店不同）",
    tags: ["青年時尚", "可麗餅", "原宿風格", "潮流服飾", "可愛雜貨", "年輕人聖地", "裏原宿", "網紅甜點"],
    notes: "週末人潮洶湧建議平日前往。可麗餅約400-600日圓。附近的表參道可以一起逛。"
  },
  {
    city: "東京",
    name: "六本木Hills森大樓",
    type: "landmark",
    description: "2003年開業的大型複合都市開發，包含森大樓52樓的東京城市觀景台（海拔250m）、森美術館、豪華購物商場。毛利庭園是江戶時代大名庭園遺跡。夜景被評為東京最美之一。",
    duration_minutes: 150,
    opening_hours: "觀景台10:00-23:00（週五六至凌晨1:00）",
    tags: ["360度全景", "東京鐵塔景", "森美術館", "夜景勝地", "毛利庭園", "高級購物", "聖誕點燈", "約會景點"],
    notes: "觀景台門票2000日圓，含森美術館。週五六可看到凌晨1點，避開跨年人潮。"
  },
  {
    city: "東京",
    name: "銀座購物區",
    type: "shopping",
    description: "日本最高級的商業街區，有「日本第五大道」之稱。百年老店與國際精品林立，GINZA SIX、銀座三越、和光等百貨是代表。中央通週末12:00-18:00成為步行者天國。",
    duration_minutes: 180,
    opening_hours: "各店約11:00-20:00",
    tags: ["高級購物", "精品百貨", "百年老店", "歌舞伎座", "步行者天國", "下午茶", "和果子", "銀座和光"],
    notes: "週末中央通禁止車輛，變成步行區。木村屋紅豆麵包、資生堂Parlour下午茶是老店推薦。"
  },
  {
    city: "東京",
    name: "代官山蔦屋書店",
    type: "shopping",
    description: "東京最時尚的住宅區「代官山」的地標，被譽為世界最美書店之一。三棟建築以通道連接，24小時營業。2樓星巴克可邊看書邊喝咖啡。書籍按主題而非作者分類，設計感十足。",
    duration_minutes: 120,
    opening_hours: "7:00-26:00（24小時概念）",
    tags: ["最美書店", "建築設計", "咖啡文化", "設計選品", "文青聖地", "24小時", "星巴克", "小巴黎"],
    notes: "2樓星巴克可帶書閱讀。代官山整區很適合散步。建議與惠比壽、中目黑一起安排。"
  },
  {
    city: "東京",
    name: "東京迪士尼樂園",
    type: "theme_park",
    description: "1983年開幕的亞洲第一座迪士尼樂園，佔地約51萬平方公尺。分為7大主題區域：世界市集、冒險樂園、西部樂園、動物天地、夢幻樂園、卡通城、明日樂園。經典設施包括飛濺山、巨雷山、幽靈公館等。",
    duration_minutes: 600,
    opening_hours: "8:00-21:00（依季節調整）",
    tags: ["迪士尼", "主題樂園", "夢幻城堡", "花車遊行", "煙火秀", "親子必去", "角色見面", "限定商品"],
    notes: "門票約7900-9400日圓。使用Disney Premier Access可快速通關人氣設施。平日人較少，避開日本長假。"
  },
  {
    city: "東京",
    name: "東京迪士尼海洋",
    type: "theme_park",
    description: "2001年開幕的全球唯一海洋主題迪士尼樂園，以航海冒險為概念設計7大主題區。刺激度高於陸園，達菲熊家族是海洋專屬角色。必玩：玩具總動員瘋狂遊戲屋、驚魂古塔、地心探險。",
    duration_minutes: 600,
    opening_hours: "8:00-21:00（依季節調整）",
    tags: ["迪士尼海洋", "達菲熊", "刺激設施", "火山景觀", "地中海港灣", "大人向樂園", "限定角色", "夜景浪漫"],
    notes: "適合大人的迪士尼。達菲商品是海洋限定必買。晚上7點的火山噴發與煙火不可錯過。"
  },
  {
    city: "東京",
    name: "台場海濱公園",
    type: "landmark",
    description: "東京灣人工島，集購物、娛樂、觀光於一身。彩虹大橋、18公尺高獨角獸鋼彈立像、富士電視台球體展望室是地標。DiverCity、AQUA CITY、維納斯城堡是代表性購物中心。",
    duration_minutes: 300,
    opening_hours: "各設施約10:00-21:00",
    tags: ["彩虹大橋", "鋼彈立像", "海濱公園", "富士電視台", "購物商場", "teamLab", "夕陽美景", "約會勝地"],
    notes: "搭百合海鷗號從新橋到台場約15分鐘。夕陽時分的彩虹大橋最美。鋼彈立像晚間有燈光變身秀。"
  },
  {
    city: "東京",
    name: "表參道",
    type: "shopping",
    description: "連接明治神宮到青山的林蔭大道，全長約1公里。兩側是國際精品旗艦店與設計師品牌，建築本身就是藝術品。Omotesando Hills由安藤忠雄設計，表參道之丘是代表性商場。",
    duration_minutes: 120,
    opening_hours: "各店約11:00-20:00",
    tags: ["林蔭大道", "精品街", "建築藝術", "設計師品牌", "表參道之丘", "咖啡廳", "安藤忠雄", "時尚地標"],
    notes: "與原宿竹下通相鄰但風格完全不同。聖誕節燈飾非常華麗。週末人潮較多。"
  },
  // === 北海道重要景點 ===
  {
    city: "小樽",
    name: "小樽運河",
    type: "landmark",
    description: "1923年完工的運河，全長約1140公尺。沿岸的石造倉庫群改建成餐廳、商店、博物館。每到黃昏點亮63盞煤氣燈，冬季雪中的運河更是夢幻絕景。",
    duration_minutes: 120,
    opening_hours: "全天開放，煤氣燈點亮至24:00",
    tags: ["運河夜景", "煤氣燈", "石造倉庫", "人力車", "玻璃工藝", "音樂盒館", "浪漫景點", "雪景"],
    notes: "每年2月小樽雪燈之路是年度盛事。建議傍晚前往看日落與點燈。LeTAO雙層起司蛋糕是必買伴手禮。"
  },
  {
    city: "函館",
    name: "函館山夜景",
    type: "landmark",
    description: "海拔334公尺，從山頂可俯瞰函館市區呈扇形分佈於兩個海灣之間的獨特地形。夜景與香港維多利亞港、那不勒斯並稱「世界三大夜景」。搭乘纜車3分鐘即可登頂。",
    duration_minutes: 90,
    opening_hours: "纜車10:00-22:00（冬季至21:00）",
    tags: ["世界三大夜景", "百萬夜景", "纜車", "360度全景", "教會群", "西洋建築", "約會聖地", "攝影勝地"],
    notes: "日落前30分鐘抵達最佳。冬季建議搭纜車，夏季可開車或登山。纜車來回1500日圓。"
  },
  {
    city: "旭川",
    name: "旭山動物園",
    type: "theme_park",
    description: "日本最北端的動物園，以「行動展示」革命性展示方式聞名世界。可以看到企鵝在頭頂游泳、北極熊跳水、海豹穿過透明管道。冬季的「企鵝散步」是招牌活動。",
    duration_minutes: 240,
    opening_hours: "夏季9:30-17:15，冬季10:30-15:30",
    tags: ["行動展示", "企鵝散步", "北極熊", "海豹館", "親子必去", "冬季限定", "動物近距離", "日本最北"],
    notes: "冬季企鵝散步11:00和14:30各一次，約30分鐘。夏季休園較早要注意。門票1000日圓。"
  },
  {
    city: "富良野",
    name: "富田農場薰衣草田",
    type: "nature",
    description: "北海道夏季代表風景，每年7月中旬至8月上旬薰衣草盛開。富田農場是最知名的免費景點，彩虹花田由7種不同顏色花卉組成。薰衣草冰淇淋、精油是人氣商品。",
    duration_minutes: 120,
    opening_hours: "8:30-17:00（7-8月至18:00）",
    tags: ["薰衣草", "花田絕景", "免費入場", "薰衣草冰淇淋", "北海道夏天", "拍照聖地", "精油香氛", "富田農場"],
    notes: "最佳賞花期7月10-25日。建議清晨6點前到避開人潮。從旭川開車約1小時。"
  },
  {
    city: "美瑛",
    name: "美瑛青池",
    type: "nature",
    description: "因Apple選為macOS桌布而聞名世界的神秘藍色池塘。池水因含有氫氧化鋁而呈現夢幻的青藍色，枯木倒映水中更添神秘感。冬季夜間點燈的雪景更是絕美。",
    duration_minutes: 60,
    opening_hours: "全天開放，冬季點燈17:00-21:00",
    tags: ["青藍色池", "Apple桌布", "枯木倒影", "冬季點燈", "攝影勝地", "自然奇景", "四季不同", "免費參觀"],
    notes: "從美瑛車站開車約20分鐘。陰天時顏色較不明顯，晴天最美。停車場免費。"
  },
  {
    city: "札幌",
    name: "大通公園",
    type: "landmark",
    description: "札幌市中心長約1.5公里的帶狀公園，是札幌雪祭、啤酒節等大型活動的主要會場。公園內有電視塔、噴水池、花壇，四季都有不同風景。",
    duration_minutes: 60,
    opening_hours: "全天開放",
    tags: ["雪祭會場", "啤酒節", "電視塔", "城市綠洲", "四季花卉", "免費入場", "札幌地標", "散步路線"],
    notes: "2月雪祭期間人潮眾多需提早訂房。電視塔展望台門票1000日圓。夏天啤酒花園很熱鬧。"
  },
  {
    city: "札幌",
    name: "北海道神宮",
    type: "temple",
    description: "北海道最大的神社，創建於1869年明治天皇北海道開拓時期。境內有15萬棵原始森林，春季約1400棵櫻花與梅花同時綻放。是祈求事業、良緣的人氣神社。",
    duration_minutes: 60,
    opening_hours: "6:00-17:00（依季節調整）",
    tags: ["北海道總鎮守", "原始森林", "賞櫻名所", "開拓神社", "御朱印", "良緣祈願", "冬季雪景", "圓山公園"],
    notes: "與圓山公園相鄰，可一起遊覽。新年參拜人數北海道第一。境內有休息處可品嚐六花亭點心。"
  },
  // === 沖繩重要景點 ===
  {
    city: "本部町",
    name: "沖繩美麗海水族館",
    type: "theme_park",
    description: "沖繩最具代表性的景點，擁有世界最大的壓克力觀景窗「黑潮之海」（長35m x 高10m x 深27m）。館內飼養多隻鯨鯊與鬼蝠魟，是全球少數能同時展示兩種巨型魚類的水族館。",
    duration_minutes: 240,
    opening_hours: "8:30-18:30（夏季至20:00）",
    tags: ["鯨鯊", "黑潮之海", "世界第一", "鬼蝠魟", "海豚表演", "親子必去", "珊瑚礁", "海龜"],
    notes: "16:00後門票優惠。黑潮之海餵食秀15:00和17:00。海豚表演免費。附近有翡翠海灘可順遊。"
  },
  {
    city: "那霸",
    name: "首里城公園",
    type: "landmark",
    description: "琉球王國500年歷史的象徵，世界文化遺產。2019年大火燒毀正殿後正在重建中，預計2026年完工。城牆、石門、守禮門等遺構仍可參觀，展示琉球獨特的文化融合。",
    duration_minutes: 120,
    opening_hours: "8:00-19:30（冬季至18:30）",
    tags: ["世界遺產", "琉球王國", "重建中", "守禮門", "歷史文化", "沖繩象徵", "城牆遺跡", "夕陽美景"],
    notes: "正殿重建中但大部分區域可參觀。從那霸機場單軌電車約30分鐘。門票400日圓。"
  },
  {
    city: "那霸",
    name: "國際通商店街",
    type: "shopping",
    description: "那霸市最熱鬧的購物街，全長約1.6公里，有「奇蹟的一英里」之稱。戰後從廢墟快速復興的象徵。沖繩伴手禮、琉球玻璃、泡盛酒、海鹽、沖繩料理餐廳應有盡有。",
    duration_minutes: 150,
    opening_hours: "約10:00-22:00",
    tags: ["購物街", "伴手禮", "泡盛酒", "沖繩料理", "牧志市場", "琉球玻璃", "紅芋塔", "夜生活"],
    notes: "牧志公設市場2樓可代客料理海鮮。週日12:00-18:00是行人步行區。「御菓子御殿」紅芋塔是人氣伴手禮。"
  },
  {
    city: "那霸",
    name: "波上宮",
    type: "temple",
    description: "沖繩最具代表性的神社，創建於琉球王國時代。建於懸崖之上俯瞰東海，是祈求航海安全、生意興隆的聖地。旁邊的波之上海灘是那霸市區唯一的海灘。",
    duration_minutes: 45,
    opening_hours: "自由參拜",
    tags: ["琉球八社", "海景神社", "懸崖絕景", "航海守護", "市區海灘", "沖繩信仰", "御朱印", "免費參拜"],
    notes: "從國際通步行約20分鐘。可與波之上海灘一起遊覽。神社旁有停車場。"
  },
  {
    city: "今歸仁村",
    name: "古宇利島",
    type: "nature",
    description: "透過古宇利大橋連接的離島，有「戀之島」美稱。傳說這裡是沖繩版亞當與夏娃的誕生地。心形礁岩「Heart Rock」因偶像劇取景一躍成名，翡翠色海水清澈見底。",
    duration_minutes: 150,
    opening_hours: "全天開放",
    tags: ["戀之島", "心形岩", "古宇利大橋", "翡翠海", "偶像劇取景", "海膽丼", "浮潛聖地", "日落美景"],
    notes: "建議租車前往。Heart Rock在島的北端。「しらさ食堂」的海膽丼超有名但要排隊。"
  },
  {
    city: "讀谷村",
    name: "殘波岬",
    type: "nature",
    description: "沖繩本島最西端的海岬，高30公尺的斷崖絕壁綿延約2公里。純白的殘波岬燈塔是地標，可登頂眺望東海。夕陽西下時的景色被譽為沖繩最美。",
    duration_minutes: 60,
    opening_hours: "燈塔9:00-16:30",
    tags: ["斷崖絕壁", "燈塔", "夕陽勝地", "沖繩最西", "海景步道", "攝影勝地", "免費入場", "自然景觀"],
    notes: "燈塔登頂300日圓。夕陽時刻最美。附近有殘波之驛可用餐購物。"
  },
  // === 更多日本重要景點 ===
  {
    city: "鎌倉",
    name: "鎌倉大佛",
    type: "temple",
    description: "高達11.3公尺的青銅阿彌陀佛像，建於1252年。原本安置於大佛殿內，但經多次海嘯沖毀後成為露天大佛。可進入佛像內部參觀，感受700年歷史的莊嚴。",
    duration_minutes: 60,
    opening_hours: "8:00-17:30（10-3月至17:00）",
    tags: ["國寶", "露天大佛", "青銅佛像", "鎌倉象徵", "歷史遺跡", "內部參觀", "攝影勝地", "長谷寺"],
    notes: "門票300日圓，進入大佛內部另加50日圓。可與長谷寺、江之電一日遊。"
  },
  {
    city: "箱根",
    name: "箱根神社",
    type: "temple",
    description: "創建於757年的古老神社，以蘆之湖畔的「水中鳥居」聞名。被稱為「關東總鎮守」，是祈求心願成就、良緣、事業的人氣神社。參道兩旁是高聳的杉木林。",
    duration_minutes: 60,
    opening_hours: "全天開放",
    tags: ["水中鳥居", "蘆之湖", "關東總鎮守", "杉木參道", "能量景點", "良緣祈願", "攝影勝地", "箱根三社"],
    notes: "水中鳥居清晨最適合拍照。可搭箱根海賊船從湖上欣賞。附近有九頭龍神社。"
  },
  {
    city: "河口湖",
    name: "富士山五合目",
    type: "nature",
    description: "富士山登山的起點，海拔約2300公尺。即使不登山也能搭巴士抵達，近距離感受日本第一高峰的壯觀。五合目有商店、餐廳、神社，是欣賞富士山最近距離的觀光地。",
    duration_minutes: 120,
    opening_hours: "依季節開放（7-9月全天，其他季節限時）",
    tags: ["富士山", "日本最高峰", "登山起點", "雲海", "御來光", "高山體驗", "紀念品", "神社"],
    notes: "7-8月開山期間人潮最多。高山反應注意慢慢走。冬季道路封閉需確認。巴士從河口湖站約50分鐘。"
  },
  {
    city: "奈良",
    name: "奈良公園",
    type: "nature",
    description: "佔地約660公頃的廣大公園，棲息著約1200頭野生鹿。鹿被視為神的使者，遊客可購買鹿仙貝餵食。園內有東大寺、春日大社、興福寺等世界遺產。",
    duration_minutes: 180,
    opening_hours: "全天開放（各寺院有營業時間）",
    tags: ["神鹿", "餵鹿體驗", "世界遺產", "東大寺", "春日大社", "親子景點", "免費入場", "鹿仙貝"],
    notes: "鹿仙貝200日圓。鹿會鞠躬討食物。小心母鹿帶小鹿時較有攻擊性。與京都一日遊很適合。"
  },
  {
    city: "奈良",
    name: "東大寺",
    type: "temple",
    description: "世界遺產，擁有世界最大的木造建築「大佛殿」。殿內供奉15公尺高的盧舍那大佛，重達250噸。柱子底部有「佛鼻孔」洞穴，據說穿過可獲得智慧與幸運。",
    duration_minutes: 90,
    opening_hours: "7:30-17:30（11-2月8:00-17:00）",
    tags: ["世界遺產", "大佛殿", "奈良大佛", "木造建築", "佛鼻孔", "國寶", "南大門", "歷史遺跡"],
    notes: "門票600日圓。南大門的金剛力士像是國寶。佛鼻孔排隊可能要20分鐘以上。"
  },
  {
    city: "廣島",
    name: "嚴島神社",
    type: "temple",
    description: "世界遺產，以海上大鳥居聞名於世。退潮時可走到鳥居腳下，漲潮時神社彷彿漂浮於海上。593年創建，現在的建築為1168年平清盛建造的寢殿造樣式。",
    duration_minutes: 120,
    opening_hours: "6:30-18:00（依季節調整）",
    tags: ["世界遺產", "海上鳥居", "日本三景", "潮汐變化", "寢殿造", "平清盛", "彌山", "宮島"],
    notes: "大鳥居目前整修中（預計2024年完工）。退潮時間查詢：約6小時一次循環。宮島口搭渡輪約10分鐘。"
  },
  {
    city: "金澤",
    name: "兼六園",
    type: "nature",
    description: "日本三大名園之一，歷經加賀藩主前田家歷代共170年歲月打造。取名「兼六」意為兼具六種庭園美德：宏大、幽邃、人力、蒼古、水泉、眺望。四季皆有不同風情。",
    duration_minutes: 120,
    opening_hours: "7:00-18:00（10月中-2月8:00-17:00）",
    tags: ["日本三名園", "雪吊", "徽軫燈籠", "霞之池", "四季庭園", "加賀藩", "夜間點燈", "梅花"],
    notes: "門票320日圓。冬季雪吊是金澤代表風景。春季賞梅、夏季燕子花、秋季紅葉都很美。"
  }
];

async function addAndEnhanceAttractions() {
  console.log('開始新增並深度優化景點資料...\n');

  // 先取得城市ID對照表（包含country_id）
  const { data: cities, error: cityError } = await supabase
    .from('cities')
    .select('id, name, country_id');

  if (cityError || !cities) {
    console.log('取得城市資料失敗:', cityError?.message);
    return;
  }

  const cityMap = {};
  cities.forEach(c => cityMap[c.name] = { id: c.id, country_id: c.country_id });

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of attractions) {
    const cityData = cityMap[item.city];
    if (!cityData) {
      console.log(`✗ 找不到城市: ${item.city}`);
      errors++;
      continue;
    }

    const insertData = {
      name: item.name,
      city_id: cityData.id,
      country_id: cityData.country_id,
      workspace_id,
      type: item.type,
      description: item.description,
      duration_minutes: item.duration_minutes,
      opening_hours: item.opening_hours,
      tags: item.tags,
      notes: item.notes
    };

    const { error } = await supabase
      .from('attractions')
      .insert(insertData);

    if (error) {
      if (error.code === '23505') {
        // 已存在，嘗試更新
        const { error: updateError } = await supabase
          .from('attractions')
          .update({
            description: item.description,
            duration_minutes: item.duration_minutes,
            opening_hours: item.opening_hours,
            tags: item.tags,
            notes: item.notes
          })
          .eq('name', item.name)
          .eq('city_id', cityData.id);

        if (updateError) {
          console.log(`✗ 更新失敗: ${item.name} - ${updateError.message}`);
          errors++;
        } else {
          console.log(`⟳ 已更新: ${item.name}`);
          skipped++;
        }
      } else {
        console.log(`✗ 新增失敗: ${item.name} - ${error.message}`);
        errors++;
      }
    } else {
      console.log(`✓ 已新增: ${item.name}`);
      added++;
    }
  }

  console.log(`\n完成！新增: ${added} 筆, 更新: ${skipped} 筆, 錯誤: ${errors} 筆`);
}

addAndEnhanceAttractions();
