// 東南亞景點優化腳本 - 菲律賓、馬來西亞、新加坡
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== 菲律賓景點 ====================
const philippinesAttractions = [
  // 長灘島
  {
    name: '白沙灘',
    duration_minutes: 240,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '世界最美', '日落', '沙灘', '長灘島'],
    notes: '長灘島最著名的海灘，綿延4公里的細白沙灘，被評為世界最美海灘之一。分為S1（高級度假村區）、S2（熱鬧商圈）、S3（安靜）三區。日落時分沙灘染成金橘色，美不勝收。\n\n旅遊提示：S1區沙子最細最白，S2區最熱鬧方便'
  },
  {
    name: '長灘島白沙灘',
    duration_minutes: 240,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '世界最美', '日落', '沙灘', '度假'],
    notes: '世界十大最美海灘之一，粉狀白沙綿延約4公里。海水清澈湛藍，沙質細如麵粉。是長灘島的代名詞。傍晚的日落配上風帆剪影是經典畫面。\n\n旅遊提示：建議住S1或S2區，交通和餐飲都方便'
  },
  {
    name: '普卡海灘',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '貝殼', '安靜', '浮潛', '原始'],
    notes: '長灘島北端較原始的海灘，以貝殼聞名（普卡=貝殼）。比白沙灘安靜許多，遊客較少。海水清澈，適合浮潛。有當地攤販賣椰子和烤物。\n\n旅遊提示：可以撿到美麗的貝殼，但不要帶太多出境'
  },
  {
    name: 'D Mall',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['購物', '餐廳', '夜生活', '商圈', '長灘島'],
    notes: '長灘島主要商圈，位於S2區，有餐廳、酒吧、商店、按摩店。晚上最熱鬧，是長灘島夜生活的中心。從白沙灘步行可達。\n\n旅遊提示：晚餐和購物的首選地點'
  },
  {
    name: '長灘島日落帆船',
    duration_minutes: 90,
    opening_hours: { open: '16:30', close: '18:30' },
    tags: ['帆船', '日落', '浪漫', '體驗', '必做'],
    notes: '長灘島最經典的體驗，搭乘傳統螃蟹船（Paraw）出海看日落。金色夕陽映照海面，帆船剪影是長灘島的代表畫面。通常含一杯飲料。\n\n旅遊提示：提前在沙灘上跟船家預約，約500-700披索'
  },
  {
    name: '盧霍山',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:30' },
    tags: ['觀景台', '俯瞰', '拍照', '全景', '長灘島'],
    notes: '長灘島最高點（約100公尺），可俯瞰整個長灘島。觀景台可看到白沙灘、布拉波海灘和周邊島嶼。有拍照道具。搭三輪車可達。\n\n旅遊提示：建議傍晚去，可以看日落全景'
  },
  {
    name: '盧霍山觀景台',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:30' },
    tags: ['觀景台', '全景', '拍照', '最高點', '長灘島'],
    notes: '長灘島最高點的觀景台，可360度俯瞰長灘島全貌。天氣好時可看到周邊島嶼。有各種拍照道具和佈景。門票約100披索。\n\n旅遊提示：中午太熱，建議早上或傍晚去'
  },
  {
    name: '跳島遊',
    duration_minutes: 360,
    opening_hours: { open: '09:00', close: '16:00' },
    tags: ['跳島', '浮潛', '一日遊', '螃蟹船', '探險'],
    notes: '長灘島經典行程，搭螃蟹船前往周邊小島浮潛。通常包含鱷魚島、普卡海灘、水晶洞等景點。含午餐和浮潛裝備。可看到豐富海底生態。\n\n旅遊提示：建議參加整天行程，含午餐約1500披索'
  },
  {
    name: '星期五海灘',
    duration_minutes: 60,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '跳水', '懸崖', '年輕人', '刺激'],
    notes: '白沙灘北端的小海灘，以懸崖跳水聞名。有木製跳台，可從不同高度跳入海中。年輕人和冒險者的最愛。周邊有酒吧。\n\n旅遊提示：跳水前先確認水深和安全'
  },
  {
    name: '魔術島',
    duration_minutes: 180,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['跳水', '懸崖', '刺激', '浮潛', '體驗'],
    notes: '長灘島著名的跳水點，有不同高度的跳台（3-10公尺）。可嘗試懸崖跳水的刺激體驗。周邊海域適合浮潛。門票含基本使用。\n\n旅遊提示：從最低的開始嘗試，安全第一'
  },
  {
    name: '阿里爾角',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['跳水', '懸崖', '日落', '拍照', '體驗'],
    notes: '以迪士尼小美人魚命名的懸崖跳水點。有多個高度的跳台。也是觀賞日落的好地點。周邊有餐廳和酒吧。\n\n旅遊提示：即使不跳水也可以來看日落'
  },
  {
    name: '飛魚體驗',
    duration_minutes: 15,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['水上活動', '刺激', '飛行', '拍照', '體驗'],
    notes: '被快艇拉著在海上飛起來的刺激水上活動。可以飛到10-15公尺高空俯瞰長灘島。有專業教練控制，相對安全。\n\n旅遊提示：怕高的人慎選，但真的很刺激好玩'
  },
  {
    name: '香蕉船',
    duration_minutes: 20,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['水上活動', '親子', '刺激', '團體', '有趣'],
    notes: '經典水上活動，坐在香蕉造型充氣船上被快艇拉著衝浪。會故意翻船讓大家落水，非常歡樂。適合親子和團體。\n\n旅遊提示：穿救生衣很安全，放鬆享受就好'
  },
  // 宿霧
  {
    name: '麥哲倫十字架',
    duration_minutes: 30,
    opening_hours: { open: '08:00', close: '18:00' },
    tags: ['歷史', '地標', '教堂', '麥哲倫', '宿霧'],
    notes: '1521年麥哲倫登陸菲律賓時豎立的十字架，是菲律賓天主教的起點。現存於八角亭內保護。旁邊是聖嬰大教堂。是宿霧最重要的歷史地標。\n\n旅遊提示：與聖嬰大教堂一起參觀，步行可達'
  },
  {
    name: '聖嬰大教堂',
    duration_minutes: 45,
    opening_hours: { open: '05:00', close: '20:00' },
    tags: ['教堂', '宗教', '歷史', '菲律賓最古老', '宿霧'],
    notes: '菲律賓最古老的天主教堂，建於1565年。供奉的聖嬰像（Santo Niño）是菲律賓最重要的宗教聖物。每年1月的聖嬰節是宿霧最大慶典。\n\n旅遊提示：進入教堂需穿著端莊'
  },
  {
    name: '聖嬰教堂',
    duration_minutes: 45,
    opening_hours: { open: '05:00', close: '20:00' },
    tags: ['教堂', '歷史', '聖嬰', '朝聖', '宿霧'],
    notes: '即Basilica del Santo Niño，菲律賓最古老的教堂。聖嬰像據說是麥哲倫送給宿霧女王的禮物，歷經多次火災仍保存完好。信徒絡繹不絕。\n\n旅遊提示：週日彌撒時信徒很多'
  },
  {
    name: '宿霧鯨鯊',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '12:00' },
    tags: ['鯨鯊', '浮潛', '體驗', '必做', '歐斯陸'],
    notes: '在歐斯陸（Oslob）與世界最大的魚類鯨鯊共游。鯨鯊體長可達12公尺，但以浮游生物為食，對人無害。是宿霧最熱門的體驗。\n\n旅遊提示：需凌晨出發，建議前一晚住歐斯陸附近'
  },
  {
    name: '奧斯洛布鯨鯊村',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '12:00' },
    tags: ['鯨鯊', '浮潛', '深潛', '生態', '體驗'],
    notes: '歐斯陸（Oslob）是世界少數可近距離接觸鯨鯊的地方。漁民每天餵食吸引鯨鯊聚集。可浮潛或深潛觀賞。鯨鯊溫馴但禁止觸摸。\n\n旅遊提示：6-9點鯨鯊最活躍，越早去越好'
  },
  {
    name: '與鯨鯊共游 - 歐斯陸海洋體驗',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '12:00' },
    tags: ['鯨鯊', '浮潛', '終生難忘', '必做', '海洋'],
    notes: '一生必做的體驗！在清澈海水中與巨大但溫和的鯨鯊共游。每次下水約30分鐘，可近距離觀察鯨鯊進食。穿救生衣浮潛即可。\n\n旅遊提示：不能塗防曬乳，會傷害鯨鯊'
  },
  {
    name: '墨寶沙丁魚風暴',
    duration_minutes: 120,
    opening_hours: { open: '06:00', close: '10:00' },
    tags: ['浮潛', '沙丁魚', '壯觀', '海洋', '墨寶'],
    notes: '在墨寶（Moalboal）可看到數以百萬計的沙丁魚形成的「沙丁魚風暴」。魚群隨著光線變換隊形，壯觀震撼。從岸邊游出即可看到。\n\n旅遊提示：早上光線好時最壯觀，可與海龜一起遊'
  },
  {
    name: '卡瓦山瀑布',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '17:00' },
    tags: ['瀑布', '溯溪', '跳水', '探險', '自然'],
    notes: '宿霧南部的美麗瀑布，需經過一段叢林健行。可在瀑布下游泳、從岩石跳水。碧綠的潭水非常清澈。是鯨鯊行程後的熱門景點。\n\n旅遊提示：需穿溯溪鞋，現場有救生衣租借'
  },
  {
    name: '川山瀑布',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '17:00' },
    tags: ['瀑布', '天然泳池', '自然', '健行', '清涼'],
    notes: '即Kawasan Falls，宿霧最著名的瀑布。分多層，每層都有天然泳池。碧綠色的水質清澈見底。可在瀑布下按摩（水柱SPA）。\n\n旅遊提示：建議安排半天，可慢慢玩每一層'
  },
  {
    name: '圖馬洛瀑布',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['瀑布', '自然', '清涼', '拍照', '宿霧'],
    notes: '宿霧市區附近最容易到達的瀑布，約30分鐘車程。瀑布從山壁傾瀉而下，可在潭中游泳。比川山瀑布小但交通方便。\n\n旅遊提示：適合時間有限的遊客'
  },
  {
    name: '道教廟',
    duration_minutes: 45,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['寺廟', '中國風', '觀景', '宿霧', '華人'],
    notes: '宿霧華人社區建造的道教廟宇，位於山上可俯瞰宿霧市區。有99級台階，代表天上99位神仙。建築融合中國傳統風格。\n\n旅遊提示：可以求籤問卜，體驗華人文化'
  },
  {
    name: '科隆街',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '20:00' },
    tags: ['購物', '市場', '在地', '便宜', '宿霧'],
    notes: '菲律賓最古老的街道，現為宿霧的平價購物區。有各種服飾、電子產品、日用品。價格便宜但品質參差。體驗當地人購物的好地方。\n\n旅遊提示：注意隨身財物，這區較混亂'
  },
  {
    name: '宿霧烤乳豬',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['美食', '必吃', '烤乳豬', 'Lechon', '宿霧'],
    notes: '宿霧的Lechon（烤乳豬）是菲律賓最好吃的。外皮金黃酥脆，肉質多汁鮮嫩。Zubuchon和Rico\'s是最有名的店。是宿霧必吃美食。\n\n旅遊提示：一定要吃皮，最酥脆美味'
  },
  {
    name: 'Zubuchon',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['餐廳', '烤乳豬', '必吃', '名店', '宿霧'],
    notes: '宿霧最著名的烤乳豬餐廳，被安東尼乘波登評為「世界最好吃的烤乳豬」。外皮超酥脆，肉質鮮美多汁。經常大排長龍。\n\n旅遊提示：建議點烤乳豬拼盤，可吃到不同部位'
  },
  {
    name: 'Ayala Center Cebu',
    duration_minutes: 150,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['購物', '商場', '餐廳', '電影', '宿霧'],
    notes: '宿霧最高級的購物中心，有國際品牌、餐廳、電影院。環境舒適有冷氣。是宿霧人購物休閒的首選。旁邊有IT Park科技園區。\n\n旅遊提示：餐廳選擇多，用餐時段人較多'
  },
  {
    name: 'SM Seaside City',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['購物', '大型商場', '娛樂', '宿霧', '海邊'],
    notes: '宿霧最大的購物中心，就在海邊。有購物、餐飲、娛樂、溜冰場。頂樓有摩天輪可看海景。是宿霧新地標。\n\n旅遊提示：傍晚可在海邊步道看日落'
  },
  // 薄荷島
  {
    name: '巧克力山',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:30' },
    tags: ['地質奇觀', '地標', '薄荷島', '自然', '必看'],
    notes: '薄荷島最著名景點，超過1200座圓錐形小山。旱季時草地變成巧克力色而得名。是世界獨特的地質奇觀。可登上觀景台俯瞰。\n\n旅遊提示：4-6月旱季時最像巧克力色'
  },
  {
    name: '巧克力山觀景台',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:30' },
    tags: ['觀景台', '全景', '拍照', '地標', '薄荷島'],
    notes: '爬214級階梯登上觀景台，可360度欣賞巧克力山全景。有兩個觀景台：Carmen和Sagbayan。Carmen較近較熱門。\n\n旅遊提示：建議早上去，避免中午太陽太大'
  },
  {
    name: '眼鏡猴保護區',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '16:00' },
    tags: ['動物', '眼鏡猴', '保育', '可愛', '薄荷島'],
    notes: '可近距離觀賞世界最小靈長類動物眼鏡猴（Tarsier）。眼睛超大超可愛，是夜行性動物所以白天都在睡覺。禁止觸摸和使用閃光燈。\n\n旅遊提示：保持安靜，閃光燈會傷害眼鏡猴'
  },
  {
    name: '羅博河遊船',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '15:00' },
    tags: ['遊船', '午餐', '叢林', '表演', '薄荷島'],
    notes: '搭乘竹筏船遊覽羅博河，兩岸是茂密叢林。船上享用菲律賓自助餐，有當地人表演音樂。是薄荷島經典行程。\n\n旅遊提示：建議午餐時段搭乘，含餐約700披索'
  },
  {
    name: '羅伯克河遊船',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '15:00' },
    tags: ['遊船', '叢林午餐', '悠閒', '自然', '體驗'],
    notes: '即Loboc River，薄荷島最悠閒的體驗。邊吃自助餐邊欣賞叢林風光，有當地樂隊在水上平台演奏。全程約1小時。\n\n旅遊提示：食物普通但體驗獨特，重點是風景'
  },
  {
    name: '人造森林',
    duration_minutes: 20,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['森林', '紅木', '拍照', '公路', '薄荷島'],
    notes: '薄荷島著名的林蔭大道，兩旁種滿高聳的桃花心木。形成綠色隧道非常壯觀。是前往巧克力山路上的必經之地。\n\n旅遊提示：可停車在路邊拍照，注意來車'
  },
  {
    name: '巴卡容教堂',
    duration_minutes: 30,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['教堂', '歷史', '珊瑚石', '古蹟', '薄荷島'],
    notes: '菲律賓最古老的教堂之一，建於1727年，用珊瑚石建造。2013年地震損毀後已修復。建築莊嚴典雅，是重要歷史古蹟。\n\n旅遊提示：注意參觀時的服裝禮儀'
  },
  {
    name: '巴卡永教堂',
    duration_minutes: 30,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['教堂', '古蹟', '西班牙式', '建築', '歷史'],
    notes: '即Baclayon Church，全名「聖母無染原罪教堂」。珊瑚石和蛋白建造的堅固建築，旁邊有博物館展示宗教文物。\n\n旅遊提示：地震後部分區域仍在修復中'
  },
  {
    name: '阿羅娜海灘',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '潛水', '餐廳', '夜生活', '邦勞島'],
    notes: '邦勞島（薄荷島旁）最熱鬧的海灘，是潛水和浮潛的基地。沙灘上有眾多餐廳和酒吧。是薄荷島住宿的熱門區域。\n\n旅遊提示：很多潛店在這裡，可安排考潛水證照'
  },
  {
    name: '邦勞島',
    duration_minutes: 360,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['島嶼', '潛水', '海灘', '度假', '薄荷島'],
    notes: '與薄荷島相連的度假小島，以美麗海灘和潛水著名。有阿羅娜海灘、處女島等景點。比本島更多住宿選擇。\n\n旅遊提示：建議住在邦勞島，再一日遊薄荷島景點'
  },
  {
    name: '處女島',
    duration_minutes: 120,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['沙洲', '潮汐', '浮潛', '海膽', '薄荷島'],
    notes: '退潮時才出現的白沙洲，長約1公里。清澈淺水中可看到海星、海膽。當地人賣新鮮海膽和烤海鮮。是跳島遊必去景點。\n\n旅遊提示：退潮時才能上島，需注意潮汐時間'
  },
  {
    name: '巴里卡薩島',
    duration_minutes: 240,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['潛水', '浮潛', '海龜', '斷崖', '海洋保護區'],
    notes: '菲律賓最著名的潛水點之一，海底斷崖壯觀。可看到海龜、傑克魚群、各種珊瑚。浮潛也能看到豐富海底生態。\n\n旅遊提示：這裡看到海龜的機率很高'
  },
  {
    name: '蜜蜂農場',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['有機', '餐廳', '農場', '健康', '薄荷島'],
    notes: 'Bohol Bee Farm是薄荷島著名的有機農場餐廳。供應有機蔬菜、蜂蜜製品和健康料理。餐廳面海風景美。有民宿可住。\n\n旅遊提示：招牌是蜂蜜冰淇淋和有機沙拉'
  },
  // 巴拉望
  {
    name: '愛妮島',
    duration_minutes: 480,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['秘境', '潟湖', '跳島', '石灰岩', '巴拉望'],
    notes: '菲律賓最美的秘境之一，有壯觀的石灰岩地形和清澈潟湖。Big Lagoon、Small Lagoon、Secret Lagoon是必去景點。跳島遊是最佳體驗方式。\n\n旅遊提示：建議參加Tour A和Tour C，涵蓋主要景點'
  },
  {
    name: '科隆島',
    duration_minutes: 480,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['沉船潛水', '溫泉湖', '跳島', '清澈湖水', '巴拉望'],
    notes: '巴拉望北部的跳島天堂，以二戰日本沉船潛水和凱央根湖聞名。湖水清澈見底被譽為菲律賓最乾淨的湖。有溫泉湖可泡。\n\n旅遊提示：凱央根湖需爬一小段山路才能到達'
  },
  {
    name: '公主港地下河',
    duration_minutes: 240,
    opening_hours: { open: '08:00', close: '16:00' },
    tags: ['世界遺產', '地下河', '洞穴', '鐘乳石', '巴拉望'],
    notes: '世界自然遺產，全長8.2公里的地下河流，是世界最長的地下河之一。搭船進入洞穴，可看到壯觀的鐘乳石和蝙蝠。需提前預約許可證。\n\n旅遊提示：名額有限，建議提前一週預約'
  },
  // 馬尼拉
  {
    name: '王城區',
    duration_minutes: 180,
    opening_hours: { open: '08:00', close: '18:00' },
    tags: ['歷史', '西班牙殖民', '古城', '教堂', '馬尼拉'],
    notes: '馬尼拉舊城區Intramuros，西班牙殖民時期的城牆內古城。有聖奧古斯丁教堂（世界遺產）、馬尼拉大教堂、聖地牙哥堡壘等。可騎馬車遊覽。\n\n旅遊提示：建議租馬車或參加步行導覽團'
  },
  {
    name: '聖奧古斯丁教堂',
    duration_minutes: 45,
    opening_hours: { open: '08:00', close: '18:00' },
    tags: ['世界遺產', '教堂', '巴洛克', '歷史', '馬尼拉'],
    notes: '菲律賓最古老的石造教堂，建於1607年，是UNESCO世界遺產。巴洛克式建築風格，內有精美的祭壇和壁畫。位於王城區內。\n\n旅遊提示：旁邊有博物館可參觀'
  },
  {
    name: '馬尼拉大教堂',
    duration_minutes: 30,
    opening_hours: { open: '07:00', close: '17:30' },
    tags: ['教堂', '地標', '歷史', '馬尼拉', '建築'],
    notes: '馬尼拉的天主教主教座堂，經歷多次重建。現在的建築是二戰後重建的新羅馬式風格。內有玫瑰花窗和精美管風琴。\n\n旅遊提示：可免費參觀，但須注意服裝'
  },
  {
    name: '西堤區',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海濱', '日落', '購物', '賭場', '馬尼拉'],
    notes: 'Mall of Asia所在的海濱區域，是馬尼拉現代化地標。有大型購物中心、賭場、眼球觀景輪。傍晚可在海濱看日落。\n\n旅遊提示：MOA商場超大，建議安排半天'
  }
];

// ==================== 馬來西亞景點 ====================
const malaysiaAttractions = [
  // 吉隆坡
  {
    name: '雙峰塔',
    duration_minutes: 120,
    opening_hours: { open: '09:00', close: '21:00', note: '週一休館' },
    tags: ['地標', '觀景台', '購物', '吉隆坡', '必去'],
    notes: '吉隆坡最著名地標，曾是世界最高雙子塔（452公尺）。可購票上空中走廊和觀景台。塔下是KLCC購物中心和公園。夜景絕美。\n\n旅遊提示：觀景台門票需提前官網預約，經常售罄'
  },
  {
    name: '吉隆坡塔',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '22:00' },
    tags: ['地標', '觀景台', '360度', '夜景', '吉隆坡'],
    notes: '421公尺高的通訊塔，觀景台比雙峰塔更高。有旋轉餐廳和玻璃地板觀景台。可360度欣賞吉隆坡市景，天氣好能看到很遠。\n\n旅遊提示：門票比雙峰塔便宜，且不用提前預約'
  },
  {
    name: '黑風洞',
    duration_minutes: 120,
    opening_hours: { open: '06:00', close: '21:00' },
    tags: ['印度教', '洞穴', '272階梯', '彩色', '吉隆坡近郊'],
    notes: '馬來西亞最著名的印度教聖地，有42.7公尺高的金色神像。需爬272級彩色階梯進入洞穴寺廟。每年大寶森節有百萬信徒朝聖。小心猴子。\n\n旅遊提示：穿長褲才能進廟，階梯上猴子會搶食物'
  },
  {
    name: '茨廠街',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['唐人街', '購物', '美食', '夜市', '吉隆坡'],
    notes: '吉隆坡的唐人街，充滿中國風情。有許多小吃、假貨、紀念品攤販。旁邊有關帝廟和印度廟。是體驗吉隆坡多元文化的好地方。\n\n旅遊提示：殺價是必須的，但品質參差不齊'
  },
  {
    name: '獨立廣場',
    duration_minutes: 45,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['歷史', '地標', '草坪', '殖民建築', '吉隆坡'],
    notes: '1957年馬來西亞宣布獨立的歷史地點。有世界最高的旗桿（100公尺）。周邊是殖民時期建築群，包括蘇丹阿都沙末大廈。\n\n旅遊提示：晚上打燈後建築很美'
  },
  {
    name: '國家清真寺',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '18:00', note: '祈禱時間不開放' },
    tags: ['清真寺', '建築', '免費', '宗教', '吉隆坡'],
    notes: '馬來西亞最大的清真寺，可容納15000人。現代建築設計，有73公尺高的尖塔和星形屋頂。非穆斯林可免費參觀，需借用長袍。\n\n旅遊提示：週五中午祈禱時間不開放參觀'
  },
  {
    name: '中央藝術坊',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['購物', '手工藝', '紀念品', '藝術', '吉隆坡'],
    notes: '前身是濕巴剎，現為文創藝術市集。有蠟染、手工藝品、紀念品等。是購買馬來西亞傳統工藝品的好地方。有很多按摩店。\n\n旅遊提示：比茨廠街品質好但價格稍貴'
  },
  {
    name: '亞羅街夜市',
    duration_minutes: 90,
    opening_hours: { open: '17:00', close: '03:00' },
    tags: ['夜市', '美食', '海鮮', '大排檔', '吉隆坡'],
    notes: '吉隆坡最著名的美食街，有各種大排檔和海鮮。必吃炒粿條、沙爹、福建麵、烤雞翅。價格親民，氣氛熱鬧。是吉隆坡必訪的夜市。\n\n旅遊提示：黃亞華烤雞翅和亞羅街福建麵最有名'
  },
  {
    name: '武吉免登',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['購物', '商圈', '美食', '百貨', '吉隆坡'],
    notes: '吉隆坡最熱鬧的購物區，有Pavilion、Lot 10等大型商場。劉蝶廣場（BB Plaza）有很多便宜貨。十號胡同美食廣場是必吃美食。\n\n旅遊提示：Pavilion最高級，十號胡同必吃'
  },
  // 檳城
  {
    name: '喬治市',
    duration_minutes: 240,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['世界遺產', '壁畫', '古蹟', '美食', '檳城'],
    notes: '檳城首府，2008年列入世界遺產。有許多殖民建築、宗祠、壁畫街區。以壁畫藝術和美食聞名。可步行或騎腳踏車遊覽。\n\n旅遊提示：壁畫散布各處，可以尋寶方式找壁畫'
  },
  {
    name: '極樂寺',
    duration_minutes: 90,
    opening_hours: { open: '08:30', close: '17:30' },
    tags: ['佛寺', '觀音像', '纜車', '地標', '檳城'],
    notes: '東南亞最大的佛教寺廟之一，有七層寶塔和巨大觀音像。可搭纜車上山。融合中國、泰國、緬甸建築風格。新年期間有燈會。\n\n旅遊提示：搭纜車上去看觀音像視野最好'
  },
  {
    name: '升旗山',
    duration_minutes: 150,
    opening_hours: { open: '06:30', close: '23:00' },
    tags: ['纜車', '觀景', '健行', '避暑', '檳城'],
    notes: '檳城最高點（833公尺），可俯瞰喬治市和海峽。搭百年歷史的纜車上山。山頂涼爽，有步道、咖啡廳、貓頭鷹博物館。\n\n旅遊提示：傍晚上山可看日落和夜景'
  },
  {
    name: '檳城娘惹博物館',
    duration_minutes: 60,
    opening_hours: { open: '09:30', close: '17:00' },
    tags: ['博物館', '娘惹文化', '建築', '歷史', '檳城'],
    notes: '又稱僑生博物館，展示海峽華人（峇峇娘惹）文化。建築本身是19世紀富商大宅，有精美的瓷磚和木雕。是了解娘惹文化的最佳去處。\n\n旅遊提示：有導覽團講解，更能了解文化背景'
  },
  {
    name: '姓氏橋',
    duration_minutes: 60,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['水上人家', '文化', '拍照', '歷史', '檳城'],
    notes: '喬治市海邊的水上木屋聚落，以姓氏命名（姓周橋、姓林橋等）。是早期華人移民的聚居地。現為觀光景點，有小吃和紀念品。\n\n旅遊提示：姓周橋最大最熱門'
  },
  {
    name: '檳城叻沙',
    duration_minutes: 45,
    opening_hours: { open: '07:00', close: '15:00' },
    tags: ['美食', '必吃', '酸辣', '在地', '檳城'],
    notes: 'Assam Laksa是檳城招牌美食，酸辣魚湯麵。與吉隆坡的咖哩叻沙不同。CNN評為世界50大美食。亞依淡是最有名的叻沙店。\n\n旅遊提示：Air Itam巴剎旁的攤子最著名'
  },
  {
    name: '炒粿條',
    duration_minutes: 30,
    opening_hours: { open: '18:00', close: '23:00' },
    tags: ['美食', '小吃', '必吃', '大排檔', '檳城'],
    notes: '檳城最著名小吃，用炭火大火快炒，有蛤蜊、蝦、豆芽。必加辣椒醬才正宗。每家味道不同。是馬來西亞最受歡迎的街頭小吃之一。\n\n旅遊提示：姊妹炒粿條（Sisters Char Koay Teow）很有名'
  },
  // 蘭卡威
  {
    name: '天空之橋',
    duration_minutes: 120,
    opening_hours: { open: '09:30', close: '19:00' },
    tags: ['天空之橋', '纜車', '觀景', '刺激', '蘭卡威'],
    notes: '蘭卡威最著名景點，搭纜車到馬西崗山頂，再走上125公尺長的弧形天空步道。可俯瞰叢林和海峽。需要勇氣但風景絕美。\n\n旅遊提示：建議早上去避免人潮和午後雷雨'
  },
  {
    name: '蘭卡威纜車',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '19:00' },
    tags: ['纜車', '觀景', '天空之橋', '蘭卡威', '地標'],
    notes: '東南亞最長的纜車之一，全長2.2公里，從山腳到660公尺高山頂。中途站和山頂站都有觀景台。天空之橋就在山頂站。\n\n旅遊提示：套票含纜車和天空之橋較划算'
  },
  {
    name: '珍南海灘',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '水上活動', '餐廳', '度假', '蘭卡威'],
    notes: '蘭卡威最熱鬧的海灘，有各種水上活動和海灘餐廳。沙質細白，海水清澈。傍晚日落美景。周邊有夜市和酒吧。\n\n旅遊提示：水上活動建議殺價'
  },
  {
    name: '老鷹廣場',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['地標', '老鷹雕像', '拍照', '蘭卡威', '免費'],
    notes: '蘭卡威地標，12公尺高的巨大老鷹雕像。「蘭卡威」在馬來語中意思就是「紅褐色老鷹」。位於瓜鎮海邊，周邊有購物和餐飲。\n\n旅遊提示：傍晚拍照光線最好'
  },
  {
    name: '紅樹林探險',
    duration_minutes: 180,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['生態', '紅樹林', '老鷹餵食', '探險', '蘭卡威'],
    notes: '搭船遊覽Kilim紅樹林地質公園，是聯合國認證的地質公園。可看到老鷹、猴子、水蛇等。有餵食老鷹的體驗。還會參觀蝙蝠洞和魚養殖場。\n\n旅遊提示：建議半日遊含午餐'
  },
  {
    name: '免稅購物',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['免稅', '購物', '巧克力', '酒', '蘭卡威'],
    notes: '蘭卡威是免稅島，巧克力、酒類、化妝品都便宜。瓜鎮有多家免稅商店。巧克力是最熱門伴手禮。酒類比馬來西亞本土便宜很多。\n\n旅遊提示：Coco Valley巧克力專賣店選擇多'
  },
  // 沙巴
  {
    name: '神山',
    duration_minutes: 480,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['世界遺產', '登山', '東南亞最高', '自然', '沙巴'],
    notes: '京那巴魯山是東南亞最高峰（4095公尺），世界自然遺產。兩天一夜登山行程，需提前許可證。即使不登頂，山下的國家公園也值得一遊。\n\n旅遊提示：登山需要數月前預約，名額有限'
  },
  {
    name: '丹絨亞路海灘',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '日落', '世界最美', '沙巴', '亞庇'],
    notes: '沙巴最美的日落海灘，連續被評為世界最美日落之一。海灘面向西邊，日落時天空染成橘紅色。有許多海鮮餐廳可邊吃邊看。\n\n旅遊提示：日落前1小時到達，占好位子'
  },
  {
    name: '水上清真寺',
    duration_minutes: 45,
    opening_hours: { open: '08:00', close: '17:00', note: '祈禱時間不開放' },
    tags: ['清真寺', '水上', '倒影', '地標', '亞庇'],
    notes: '亞庇市立清真寺，漲潮時如漂浮在水上。藍色圓頂配白色建築非常美麗。日落時倒影更加夢幻。非穆斯林可免費入內參觀。\n\n旅遊提示：日落時分拍倒影最美'
  },
  {
    name: '美人魚島',
    duration_minutes: 600,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['離島', '浮潛', '海龜', '清澈', '沙巴'],
    notes: 'Mantanani島是沙巴最美的離島，以清澈海水和海龜聞名。可看到海龜的機率很高。浮潛可看到豐富珊瑚和魚群。一日遊含船程約3小時。\n\n旅遊提示：船程較長容易暈船，可準備暈船藥'
  },
  {
    name: '沙比島',
    duration_minutes: 360,
    opening_hours: { open: '08:00', close: '16:00' },
    tags: ['離島', '海洋公園', '浮潛', '水上活動', '沙巴'],
    notes: '東姑阿都拉曼海洋公園的島嶼之一，距離亞庇最近（船程15分鐘）。海水清澈，適合浮潛和各種水上活動。有餐廳和基本設施。\n\n旅遊提示：可搭配馬奴干島一起玩'
  },
  {
    name: '長鼻猴生態遊',
    duration_minutes: 240,
    opening_hours: { open: '14:00', close: '20:00' },
    tags: ['生態', '長鼻猴', '螢火蟲', '紅樹林', '沙巴'],
    notes: '沙巴特有的生態體驗，搭船遊紅樹林看長鼻猴（婆羅洲特有種）。傍晚看日落，天黑後看螢火蟲。是沙巴必做體驗。\n\n旅遊提示：通常下午2-3點出發，含晚餐'
  },
  // 新山
  {
    name: '樂高樂園',
    duration_minutes: 480,
    opening_hours: { open: '10:00', close: '18:00' },
    tags: ['主題樂園', '樂高', '親子', '水上樂園', '新山'],
    notes: '亞洲第一座樂高樂園，有超過70種遊樂設施。Miniland用樂高搭建亞洲著名地標。有水上樂園和樂高主題酒店。非常適合親子。\n\n旅遊提示：建議買兩園套票，玩兩天'
  },
  {
    name: '三井Outlet',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['購物', 'Outlet', '品牌', '折扣', '新山'],
    notes: '馬來西亞最大的Outlet，靠近樂高樂園。有各種國際品牌，折扣力度大。比新加坡購物便宜很多。是新加坡人週末購物的熱門目的地。\n\n旅遊提示：可與樂高樂園安排同一天'
  }
];

// ==================== 新加坡景點 ====================
const singaporeAttractions = [
  {
    name: '濱海灣金沙',
    duration_minutes: 180,
    opening_hours: { open: '09:30', close: '23:00' },
    tags: ['地標', '賭場', '購物', '空中花園', '新加坡'],
    notes: '新加坡最著名地標，三棟大樓頂端連接的船型空中花園（Skypark）可俯瞰全市。有賭場、購物中心、博物館。無邊際泳池僅供住客使用。\n\n旅遊提示：觀景台和泳池是分開的，觀景台可購票'
  },
  {
    name: '魚尾獅公園',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['地標', '魚尾獅', '拍照', '免費', '新加坡'],
    notes: '新加坡國家象徵，魚尾獅像高8.6公尺。是遊客必訪的拍照景點。可拍出嘴接噴水的經典照片。晚上打燈配對岸金沙夜景更美。\n\n旅遊提示：晚上來拍照有金沙燈光秀當背景'
  },
  {
    name: '濱海灣花園',
    duration_minutes: 180,
    opening_hours: { open: '05:00', close: '02:00' },
    tags: ['花園', '超級樹', '溫室', '燈光秀', '新加坡'],
    notes: '新加坡最美的城市花園，有18棵高25-50公尺的超級樹。每晚有免費燈光秀（19:45和20:45）。雲霧林和花穹是付費溫室，很值得參觀。\n\n旅遊提示：傍晚來看日落和燈光秀最佳'
  },
  {
    name: '聖淘沙',
    duration_minutes: 480,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['島嶼', '度假', '環球影城', '海灘', '新加坡'],
    notes: '新加坡的度假島嶼，有環球影城、S.E.A.海洋館、海灘、賭場等。可搭纜車、單軌列車或步行入島。是新加坡最主要的旅遊景點。\n\n旅遊提示：建議安排1-2天慢慢玩'
  },
  {
    name: '新加坡環球影城',
    duration_minutes: 480,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['主題樂園', '環球影城', '過山車', '變形金剛', '聖淘沙'],
    notes: '東南亞唯一的環球影城，有7個主題區和24種遊樂設施。變形金剛、木乃伊復仇記、侏羅紀世界是必玩。比日本和美國的規模小但人也少。\n\n旅遊提示：建議買Express Pass跳過排隊'
  },
  {
    name: 'S.E.A.海洋館',
    duration_minutes: 150,
    opening_hours: { open: '10:00', close: '17:00' },
    tags: ['水族館', '海洋生物', '親子', '聖淘沙', '世界最大'],
    notes: '曾是世界最大的水族館，有超過10萬隻海洋生物。最壯觀的是36公尺寬的海洋視窗，可看到鯊魚和鬼蝠魟。有沉船、珊瑚礁等主題區。\n\n旅遊提示：可與環球影城買套票'
  },
  {
    name: '烏節路',
    duration_minutes: 240,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['購物', '百貨', '美食', '商圈', '新加坡'],
    notes: '新加坡最著名的購物街，綿延2.2公里。有ION、義安城、高島屋等大型商場。從平價到奢侈品牌都有。是購物愛好者的天堂。\n\n旅遊提示：ION最時尚，Lucky Plaza有便宜貨'
  },
  {
    name: '牛車水',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['唐人街', '美食', '購物', '文化', '新加坡'],
    notes: '新加坡的唐人街，有傳統商店、美食、寺廟。佛牙寺龍華院是必訪。史密斯街是美食街。麥士威熟食中心的天天海南雞飯超有名。\n\n旅遊提示：天天海南雞飯要排很久的隊'
  },
  {
    name: '小印度',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '21:00' },
    tags: ['印度文化', '色彩', '美食', '寺廟', '新加坡'],
    notes: '新加坡的印度區，色彩繽紛的建築和商店。有維拉馬卡里亞曼興都廟、竹腳市場。可買香料、金飾、紗麗。印度餐廳正宗便宜。\n\n旅遊提示：週日人最多，是印度客工的休假日'
  },
  {
    name: '甘榜格南',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '21:00' },
    tags: ['馬來文化', '清真寺', '咖啡廳', '壁畫', '新加坡'],
    notes: '新加坡的馬來區和阿拉伯區，有蘇丹回教堂、哈芝巷。哈芝巷有許多彩色壁畫和文創小店。是新加坡最文青的區域。\n\n旅遊提示：哈芝巷適合拍照和喝咖啡'
  },
  {
    name: '克拉碼頭',
    duration_minutes: 120,
    opening_hours: { open: '11:00', close: '02:00' },
    tags: ['夜生活', '河岸', '酒吧', '餐廳', '新加坡'],
    notes: '新加坡河畔的娛樂區，有眾多餐廳和酒吧。彩色建築倒映河面非常美。是新加坡夜生活的中心。可搭船遊河。\n\n旅遊提示：晚餐後來喝酒看夜景最棒'
  },
  {
    name: '樟宜機場',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['機場', '購物', '星耀樟宜', '瀑布', '新加坡'],
    notes: '連續多年被評為世界最佳機場。星耀樟宜有世界最高室內瀑布（40公尺）。有花園、電影院、彈跳網、滑梯等。不搭機也值得來玩。\n\n旅遊提示：T3星耀樟宜的瀑布最壯觀'
  },
  {
    name: '夜間動物園',
    duration_minutes: 180,
    opening_hours: { open: '19:15', close: '24:00' },
    tags: ['動物園', '夜間', '獨特', '親子', '新加坡'],
    notes: '世界第一座夜間動物園，可近距離觀察夜行動物。有徒步小徑和遊園車。有精彩的動物表演。是新加坡獨特的體驗。\n\n旅遊提示：建議18:00到達，先吃晚餐'
  },
  {
    name: '新加坡動物園',
    duration_minutes: 240,
    opening_hours: { open: '08:30', close: '18:00' },
    tags: ['動物園', '開放式', '親子', '紅毛猩猩', '新加坡'],
    notes: '世界最佳動物園之一，採開放式設計沒有鐵欄。可與紅毛猩猩共進早餐（需預約）。有超過300種動物。非常適合親子遊。\n\n旅遊提示：紅毛猩猩早餐很熱門要提前預約'
  },
  {
    name: '新加坡摩天輪',
    duration_minutes: 45,
    opening_hours: { open: '14:00', close: '22:00' },
    tags: ['摩天輪', '觀景', '夜景', '浪漫', '新加坡'],
    notes: '亞洲最大摩天輪（165公尺），一圈約30分鐘。可360度俯瞰新加坡市區、濱海灣和馬來西亞。有雞尾酒航班和晚餐航班。\n\n旅遊提示：日落時搭乘可同時看日景和夜景'
  },
  {
    name: '辣椒螃蟹',
    duration_minutes: 90,
    opening_hours: { open: '17:00', close: '23:00' },
    tags: ['美食', '必吃', '海鮮', '國菜', '新加坡'],
    notes: '新加坡國菜，用辣椒番茄醬炒的斯里蘭卡蟹。必配饅頭沾醬汁。珍寶海鮮、無招牌海鮮是著名餐廳。價格不便宜但值得一試。\n\n旅遊提示：一隻約60-100新幣，可2-3人分'
  },
  {
    name: '海南雞飯',
    duration_minutes: 30,
    opening_hours: { open: '10:00', close: '20:00' },
    tags: ['美食', '必吃', '國民美食', '平價', '新加坡'],
    notes: '新加坡最著名美食，滑嫩雞肉配油飯和三種醬料。天天海南雞飯（牛車水麥士威熟食中心）排隊最長。文東記也很有名。\n\n旅遊提示：一碗約5-6新幣，非常超值'
  },
  {
    name: '肉骨茶',
    duration_minutes: 45,
    opening_hours: { open: '07:00', close: '21:00' },
    tags: ['美食', '必吃', '藥材', '排骨', '新加坡'],
    notes: '用藥材熬煮的排骨湯，新加坡和馬來西亞的代表美食。松發肉骨茶是最有名的連鎖店。通常配油條、白飯、茶。適合當早餐或消夜。\n\n旅遊提示：松發克拉碼頭店最方便'
  }
];

// 更新函數
async function updateAttractions(countryId, attractions, countryName) {
  console.log(`\n🔄 正在更新 ${countryName} 景點深度資料...`);
  let successCount = 0;

  for (const attraction of attractions) {
    const updateData = {
      duration_minutes: attraction.duration_minutes,
      opening_hours: attraction.opening_hours,
      tags: attraction.tags,
      notes: attraction.notes
    };

    const { error } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('country_id', countryId)
      .ilike('name', attraction.name);

    if (error) {
      console.log(`  ❌ ${attraction.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${attraction.name}`);
      successCount++;
    }
  }

  return successCount;
}

// 主程式
async function main() {
  console.log('========================================');
  console.log('東南亞景點優化工具');
  console.log('菲律賓 + 馬來西亞 + 新加坡');
  console.log('========================================');

  const phCount = await updateAttractions('philippines', philippinesAttractions, '菲律賓');
  const myCount = await updateAttractions('malaysia', malaysiaAttractions, '馬來西亞');
  const sgCount = await updateAttractions('singapore', singaporeAttractions, '新加坡');

  console.log('\n📊 更新統計:');
  console.log(`  菲律賓: ${phCount} 筆`);
  console.log(`  馬來西亞: ${myCount} 筆`);
  console.log(`  新加坡: ${sgCount} 筆`);
  console.log(`  總計: ${phCount + myCount + sgCount} 筆`);
  console.log('\n✅ 東南亞優化完成！');
}

main();
