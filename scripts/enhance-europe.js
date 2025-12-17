// 歐洲景點優化腳本 - 法國、英國、義大利、西班牙
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== 法國景點 ====================
const franceAttractions = [
  {
    name: '艾菲爾鐵塔',
    duration_minutes: 150,
    opening_hours: { open: '09:00', close: '00:45' },
    tags: ['地標', '必去', '夜景', '觀景台', '巴黎'],
    notes: '巴黎最著名地標，324公尺高，建於1889年世界博覽會。可搭電梯或爬樓梯上塔。有三層觀景台，頂層可俯瞰整個巴黎。每晚整點有燈光閃爍秀。\n\n旅遊提示：建議網路預訂門票避免排隊，日落時上塔可同時看日景和夜景'
  },
  {
    name: '羅浮宮',
    duration_minutes: 240,
    opening_hours: { open: '09:00', close: '18:00', note: '週二休館，週五延長至21:45' },
    tags: ['博物館', '世界三大', '蒙娜麗莎', '藝術', '必去'],
    notes: '世界最大博物館之一，收藏超過38萬件藝術品。必看蒙娜麗莎、勝利女神、維納斯。玻璃金字塔是著名入口。建議至少安排半天。\n\n旅遊提示：週五晚上延長開放人較少，建議先看蒙娜麗莎避開人潮'
  },
  {
    name: '凱旋門',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '23:00' },
    tags: ['地標', '拿破崙', '香榭麗舍', '觀景', '歷史'],
    notes: '拿破崙為紀念戰勝奧地利建造，高50公尺。位於香榭麗舍大道盡頭，12條大道從此輻射。可登頂俯瞰巴黎城市規劃。無名戰士墓在此。\n\n旅遊提示：登頂看日落，可看到艾菲爾鐵塔方向的美景'
  },
  {
    name: '聖母院',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '18:45', note: '2019火災後修復中' },
    tags: ['教堂', '哥德式', '雨果', '歷史', '巴黎'],
    notes: '12世紀哥德式建築傑作，雨果《鐘樓怪人》背景。2019年大火後正在修復，預計2024年重新開放。外觀仍可參觀。是巴黎最古老的教堂之一。\n\n旅遊提示：目前內部關閉修復中，但周邊仍值得參觀'
  },
  {
    name: '凡爾賽宮',
    duration_minutes: 300,
    opening_hours: { open: '09:00', close: '18:30', note: '週一休館' },
    tags: ['皇宮', '世界遺產', '花園', '鏡廳', '必去'],
    notes: '路易十四建造的奢華皇宮，世界遺產。鏡廳有357面鏡子，是凡爾賽和約簽署地。花園佔地800公頃。距巴黎約1小時車程。\n\n旅遊提示：建議買含花園的套票，夏天有噴泉音樂秀'
  },
  {
    name: '香榭麗舍大道',
    duration_minutes: 90,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['大道', '購物', '名牌', '散步', '巴黎'],
    notes: '巴黎最著名的大道，全長1.9公里，連接協和廣場和凱旋門。兩旁有精品店、咖啡廳、電影院。聖誕節燈飾和跨年倒數著名。\n\n旅遊提示：聖誕節期間的燈飾非常浪漫'
  },
  {
    name: '奧賽博物館',
    duration_minutes: 180,
    opening_hours: { open: '09:30', close: '18:00', note: '週一休館，週四延長至21:45' },
    tags: ['博物館', '印象派', '梵谷', '莫內', '藝術'],
    notes: '由火車站改建的博物館，專門收藏印象派作品。有梵谷、莫內、雷諾瓦、竇加等大師傑作。建築本身就是藝術品。與羅浮宮並列巴黎必看博物館。\n\n旅遊提示：週四晚上延長開放是最佳參觀時間'
  },
  {
    name: '蒙馬特',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['藝術區', '聖心堂', '畫家', '浪漫', '巴黎'],
    notes: '巴黎最浪漫的藝術區，山丘上有聖心堂和畫家廣場。曾是畢卡索、梵谷等藝術家聚集地。有許多咖啡館和小店。可搭纜車上山。\n\n旅遊提示：小心扒手和強迫推銷的人'
  },
  {
    name: '蒙馬特高地',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['藝術區', '浪漫', '畫家廣場', '小店', '巴黎'],
    notes: '巴黎最高的山丘，充滿波西米亞風情。小巷中有許多藝術家工作室、葡萄園、咖啡館。愛牆和達利美術館是必訪景點。《艾蜜莉的異想世界》取景地。\n\n旅遊提示：傍晚來可在聖心堂前看日落和巴黎全景'
  },
  {
    name: '聖心堂',
    duration_minutes: 45,
    opening_hours: { open: '06:00', close: '22:30' },
    tags: ['教堂', '白色圓頂', '蒙馬特', '免費', '巴黎'],
    notes: '蒙馬特山頂的白色教堂，羅馬拜占庭風格。可俯瞰巴黎市區。免費入內參觀，登圓頂需付費。教堂前階梯是欣賞日落的好地方。\n\n旅遊提示：免費入場但內部禁止拍照'
  },
  {
    name: '塞納河遊船',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '22:30' },
    tags: ['遊船', '夜景', '浪漫', '必做', '巴黎'],
    notes: '從水上欣賞巴黎最浪漫的方式。沿途可看到艾菲爾鐵塔、聖母院、羅浮宮等。有日間和夜間航班，晚餐遊船最浪漫。Bateaux Mouches是最著名公司。\n\n旅遊提示：日落時段的航班可同時看日景和夜景'
  },
  {
    name: '龐畢度中心',
    duration_minutes: 120,
    opening_hours: { open: '11:00', close: '21:00', note: '週二休館' },
    tags: ['現代藝術', '建築', '博物館', '設計', '巴黎'],
    notes: '獨特的高科技建築風格，管線外露是設計特色。收藏現代和當代藝術作品，有畢卡索、馬諦斯、杜象等。頂樓有觀景台和餐廳。\n\n旅遊提示：廣場上經常有街頭藝人表演'
  },
  {
    name: '盧森堡公園',
    duration_minutes: 90,
    opening_hours: { open: '07:30', close: '21:30' },
    tags: ['公園', '法式花園', '野餐', '休閒', '巴黎'],
    notes: '巴黎最美的公園之一，法式花園設計。有噴泉、雕像、蘋果園、網球場。巴黎人喜愛的休閒去處。可以租帆船在池中玩。\n\n旅遊提示：帶點麵包在公園野餐很愜意'
  },
  {
    name: '杜樂麗花園',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '21:00' },
    tags: ['花園', '皇家', '雕像', '散步', '巴黎'],
    notes: '連接羅浮宮和協和廣場的皇家花園。有噴泉和雕像。秋天有臨時遊樂園。是散步休息的好地方。橘園美術館就在公園內。\n\n旅遊提示：參觀羅浮宮後可來此休息'
  },
  {
    name: '橘園美術館',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '18:00', note: '週二休館' },
    tags: ['美術館', '莫內', '睡蓮', '印象派', '巴黎'],
    notes: '以莫內巨幅睡蓮壁畫聞名，8幅睡蓮環繞兩個橢圓形展廳。是印象派愛好者必訪。規模小巧精緻，1-2小時可看完。\n\n旅遊提示：莫內的睡蓮是鎮館之寶'
  },
  {
    name: '先賢祠',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '18:00' },
    tags: ['神殿', '名人墓', '建築', '歷史', '巴黎'],
    notes: '原為教堂，現為法國名人安葬地。伏爾泰、盧梭、居里夫人、大仲馬等長眠於此。建築仿羅馬萬神殿設計，圓頂壯觀。\n\n旅遊提示：地下墓穴可參觀名人棺槨'
  },
  {
    name: '瑪黑區',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['古區', '猶太區', '潮流', '美食', '巴黎'],
    notes: '巴黎最古老的街區之一，混合猶太文化和時尚潮流。有許多精品店、藝廊、餐廳。週日也營業（巴黎少數）。Falafel是必吃美食。\n\n旅遊提示：L As du Fallafel是最有名的口袋餅店'
  },
  {
    name: '巴黎歌劇院',
    duration_minutes: 75,
    opening_hours: { open: '10:00', close: '17:00' },
    tags: ['歌劇院', '建築', '歌劇魅影', '華麗', '巴黎'],
    notes: '加尼葉歌劇院，新巴洛克風格建築傑作。《歌劇魅影》故事背景。內部金碧輝煌，大階梯和水晶吊燈壯觀。可買票參觀或看演出。\n\n旅遊提示：天花板由夏卡爾繪製，非常值得一看'
  },
  {
    name: '拉法葉百貨',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '20:30' },
    tags: ['購物', '百貨', '名牌', '退稅', '巴黎'],
    notes: '巴黎最著名的百貨公司，有美麗的穹頂。聚集各大名牌，可辦理退稅。頂樓免費觀景台可看到歌劇院和艾菲爾鐵塔。\n\n旅遊提示：穹頂和頂樓觀景台都免費'
  },
  {
    name: '巴黎迪士尼',
    duration_minutes: 600,
    opening_hours: { open: '09:30', close: '23:00' },
    tags: ['主題樂園', '迪士尼', '親子', '遊樂設施', '巴黎近郊'],
    notes: '歐洲唯一的迪士尼樂園，有兩個園區。睡美人城堡是粉紅色的。有獨特的巴黎風情和歐洲限定活動。距巴黎約40分鐘RER。\n\n旅遊提示：買兩園票可以玩得比較完整'
  },
  {
    name: '花神咖啡館',
    duration_minutes: 60,
    opening_hours: { open: '07:30', close: '01:30' },
    tags: ['咖啡館', '文學', '歷史', '左岸', '巴黎'],
    notes: '存在主義發源地，沙特和波娃常客。1887年開業的老字號咖啡館。巴黎左岸知識分子聚集地。裝潢保持傳統風格。\n\n旅遊提示：咖啡很貴但體驗無價'
  },
  {
    name: '雙叟咖啡館',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '01:00' },
    tags: ['咖啡館', '文學', '歷史', '左岸', '巴黎'],
    notes: '與花神咖啡館齊名的老字號，海明威、畢卡索曾是常客。店名來自店內兩尊中國人偶。是體驗巴黎咖啡文化的經典去處。\n\n旅遊提示：熱巧克力是招牌'
  },
  {
    name: '莎士比亞書店',
    duration_minutes: 45,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['書店', '文學', '電影取景', '歷史', '巴黎'],
    notes: '巴黎最著名的英文書店，曾出版喬伊斯《尤利西斯》。海明威、乃托曾是常客。電影《乘乘乘午夜巴黎》取景地。二樓可免費閱讀。\n\n旅遊提示：週日下午有免費活動和讀書會'
  },
  // 米其林餐廳
  {
    name: 'Alain Ducasse au Plaza Athénée',
    duration_minutes: 180,
    opening_hours: { open: '19:00', close: '22:00', note: '需預約' },
    tags: ['米其林三星', '法式料理', '奢華', '名廚', '巴黎'],
    notes: '傳奇名廚Alain Ducasse的旗艦餐廳，米其林三星。以蔬菜、穀物和魚類為主的自然料理。用餐環境極度奢華。需提前數週預約。\n\n旅遊提示：套餐約400歐元起，需正式著裝'
  },
  {
    name: 'Le Cinq',
    duration_minutes: 180,
    opening_hours: { open: '12:30', close: '14:00', note: '需預約' },
    tags: ['米其林三星', '法式料理', '四季酒店', '精緻', '巴黎'],
    notes: '四季酒店內的米其林三星餐廳，主廚Christian Le Squer。經典法式料理的巔峰之作。金碧輝煌的用餐環境。\n\n旅遊提示：午餐套餐相對晚餐划算'
  },
  {
    name: 'Guy Savoy',
    duration_minutes: 180,
    opening_hours: { open: '12:00', close: '14:00', note: '需預約' },
    tags: ['米其林三星', '法式料理', '傳奇', '藝術品', '巴黎'],
    notes: '傳奇主廚Guy Savoy的同名餐廳，米其林三星。朝鮮薊湯和牡蠣是招牌。餐廳內有許多藝術品裝飾。\n\n旅遊提示：需提前1-2個月預約'
  },
  {
    name: 'Arpège',
    duration_minutes: 180,
    opening_hours: { open: '12:00', close: '14:30', note: '需預約' },
    tags: ['米其林三星', '蔬食', '創意', '有機', '巴黎'],
    notes: '主廚Alain Passard以蔬菜料理聞名的米其林三星。自家農場提供有機蔬菜。蔬菜料理的藝術達到巔峰。\n\n旅遊提示：素食者的夢想餐廳'
  },
  {
    name: 'L Ambroisie',
    duration_minutes: 180,
    opening_hours: { open: '12:00', close: '14:00', note: '需預約' },
    tags: ['米其林三星', '古典法式', '私密', '瑪黑區', '巴黎'],
    notes: '位於孚日廣場的米其林三星，只有40個座位。Bernard Pacaud主理的古典法式料理。低調私密的用餐體驗。\n\n旅遊提示：只收現金，不接受信用卡'
  }
];

// ==================== 英國景點 ====================
const ukAttractions = [
  {
    name: '大笨鐘',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['地標', '國會大廈', '鐘樓', '必拍', '倫敦'],
    notes: '倫敦最著名地標，伊莉莎白塔上的大鐘。建於1859年，高96公尺。每15分鐘敲鐘報時。目前正在修復中，部分被腳手架包圍。\n\n旅遊提示：從西敏橋拍攝角度最佳'
  },
  {
    name: '倫敦眼',
    duration_minutes: 45,
    opening_hours: { open: '10:00', close: '20:30' },
    tags: ['摩天輪', '觀景', '泰晤士河', '夜景', '倫敦'],
    notes: '135公尺高的觀景摩天輪，一圈約30分鐘。可360度俯瞰倫敦市區。旁邊就是大笨鐘和西敏寺。夜景特別美麗。\n\n旅遊提示：網上提前買票可省10%且免排隊'
  },
  {
    name: '大英博物館',
    duration_minutes: 240,
    opening_hours: { open: '10:00', close: '17:00', note: '週五延長至20:30' },
    tags: ['博物館', '免費', '木乃伊', '羅塞塔石碑', '世界級'],
    notes: '世界最著名博物館之一，收藏超過800萬件文物。必看埃及木乃伊、羅塞塔石碑、帕德嫩神廟雕塑。免費入場。建議至少安排半天。\n\n旅遊提示：免費但建議捐款，週五晚上人較少'
  },
  {
    name: '倫敦塔',
    duration_minutes: 150,
    opening_hours: { open: '09:00', close: '17:30' },
    tags: ['城堡', '世界遺產', '皇冠珠寶', '烏鴉', '歷史'],
    notes: '近千年歷史的城堡，曾是皇宮和監獄。可看到皇冠珠寶和烏鴉（傳說烏鴉離開倫敦塔就會滅亡）。有Beefeater導覽講述血腥歷史。\n\n旅遊提示：皇冠珠寶排隊最長，建議一開門先去'
  },
  {
    name: '倫敦塔橋',
    duration_minutes: 60,
    opening_hours: { open: '09:30', close: '18:00' },
    tags: ['大橋', '地標', '維多利亞', '開橋', '倫敦'],
    notes: '倫敦最具代表性的大橋，1894年建成的維多利亞式建築。可購票參觀塔橋展覽和玻璃步道。每天有幾次開橋讓大船通過。\n\n旅遊提示：官網有開橋時刻表，可提前查詢'
  },
  {
    name: '白金漢宮',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '19:30', note: '夏季開放，換崗儀式11:00' },
    tags: ['皇宮', '皇室', '衛兵換崗', '地標', '倫敦'],
    notes: '英國皇室正式居所，夏季部分開放參觀。衛兵換崗儀式是必看（11:00，約45分鐘）。旗幟升起表示女王/國王在宮中。\n\n旅遊提示：換崗儀式要提前30分鐘到佔位子'
  },
  {
    name: '西敏寺',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '15:30', note: '週日不開放觀光' },
    tags: ['教堂', '世界遺產', '加冕', '皇室婚禮', '歷史'],
    notes: '英國最重要的教堂，皇室加冕和婚禮場所。牛頓、達爾文、狄更斯等名人長眠於此。哥德式建築宏偉壯觀。威廉王子在此結婚。\n\n旅遊提示：語音導覽很詳細，建議租借'
  },
  {
    name: '聖保羅大教堂',
    duration_minutes: 90,
    opening_hours: { open: '08:30', close: '16:30' },
    tags: ['教堂', '圓頂', '戴安娜婚禮', '觀景', '倫敦'],
    notes: '倫敦的標誌性教堂，有著名的大圓頂。戴安娜王妃在此結婚。可登頂俯瞰倫敦。低語迴廊是建築奇觀。\n\n旅遊提示：登頂需爬500多級台階但風景值得'
  },
  {
    name: '國家美術館',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '18:00', note: '週五延長至21:00' },
    tags: ['美術館', '免費', '梵谷', '莫內', '達文西'],
    notes: '位於特拉法加廣場的國家級美術館，免費入場。收藏13-19世紀歐洲繪畫大師作品。有梵谷向日葵、達文西等傑作。\n\n旅遊提示：免費入場，建議使用APP導覽'
  },
  {
    name: '特拉法加廣場',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['廣場', '納爾遜紀念柱', '獅子', '地標', '倫敦'],
    notes: '倫敦市中心的大廣場，紀念特拉法加海戰勝利。有納爾遜紀念柱和四隻青銅獅子。國家美術館就在廣場北側。經常舉辦活動。\n\n旅遊提示：跨年倒數這裡人山人海'
  },
  {
    name: '泰特現代美術館',
    duration_minutes: 150,
    opening_hours: { open: '10:00', close: '18:00' },
    tags: ['現代藝術', '免費', '發電站', '畢卡索', '倫敦'],
    notes: '由廢棄發電站改建的現代藝術博物館，免費入場。有畢卡索、達利、沃荷等現代大師作品。頂樓餐廳可看泰晤士河和聖保羅大教堂。\n\n旅遊提示：免費入場，特展需另付費'
  },
  {
    name: '自然史博物館',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '17:50' },
    tags: ['博物館', '恐龍', '免費', '親子', '倫敦'],
    notes: '收藏超過8000萬件標本的自然博物館，免費入場。入口大廳的恐龍骨架是招牌。有地震模擬器和藍鯨模型。非常適合親子。\n\n旅遊提示：恐龍展區最熱門，建議早到'
  },
  {
    name: '海德公園',
    duration_minutes: 120,
    opening_hours: { open: '05:00', close: '24:00' },
    tags: ['公園', '皇家', '演說角', '散步', '倫敦'],
    notes: '倫敦最大的皇家公園之一，佔地142公頃。有蛇形湖可以划船。演說角是言論自由的象徵。戴安娜王妃紀念噴泉也在此。\n\n旅遊提示：租躺椅在草地上休息很愜意'
  },
  {
    name: '科芬園',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '20:00' },
    tags: ['市集', '街頭表演', '購物', '餐廳', '倫敦'],
    notes: '倫敦最有氣氛的購物區，前身是蔬果市場。有許多特色小店和餐廳。街頭藝人表演精彩。Apple Market有手工藝品。\n\n旅遊提示：週末街頭表演最精彩'
  },
  {
    name: '諾丁山',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['彩色房屋', '市集', '電影取景', '波多貝羅', '倫敦'],
    notes: '以彩色房屋和波多貝羅市集聞名，電影《乳乳尼山的乳人》取景地。週六古董市集最熱鬧。有許多咖啡廳和精品店。\n\n旅遊提示：週六一早來逛古董市集'
  },
  {
    name: 'Borough Market',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '17:00', note: '週日休息' },
    tags: ['市集', '美食', '起司', '麵包', '倫敦'],
    notes: '倫敦最有名的美食市集，超過1000年歷史。有各種起司、麵包、肉類、海鮮。可以邊逛邊試吃。週六最熱鬧。\n\n旅遊提示：早餐或午餐來這裡吃最棒'
  },
  {
    name: '牛津街',
    duration_minutes: 150,
    opening_hours: { open: '09:00', close: '21:00' },
    tags: ['購物', '百貨', '平價', '逛街', '倫敦'],
    notes: '倫敦最主要的購物街，有300多家商店。從平價到高檔品牌都有。Selfridges和John Lewis是著名百貨。聖誕燈飾很美。\n\n旅遊提示：Primark超平價但品質一般'
  },
  {
    name: '攝政街',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '20:00' },
    tags: ['購物', '建築', '名牌', '弧形', '倫敦'],
    notes: '以優雅弧形建築聞名的購物街，比牛津街高檔。有Apple Store、Burberry旗艦店。建築本身就是景點。\n\n旅遊提示：聖誕節的天使燈飾是必看'
  },
  {
    name: '碎片大廈',
    duration_minutes: 60,
    opening_hours: { open: '10:00', close: '22:00' },
    tags: ['觀景台', '摩天大樓', '夜景', '最高', '倫敦'],
    notes: '英國最高建築（310公尺），有觀景台The View。可360度俯瞰倫敦，天氣好能看到40英里遠。有香檳酒吧。\n\n旅遊提示：日落時段票最貴但最值得'
  },
  {
    name: '哈利波特影城',
    duration_minutes: 300,
    opening_hours: { open: '09:00', close: '20:00' },
    tags: ['哈利波特', '片場', '魔法', '親子', '倫敦近郊'],
    notes: '華納兄弟哈利波特片場之旅，可看到電影真實場景、道具、服裝。有霍格華茲大廳、斜角巷、九又四分之三月台等。距倫敦約20英里。\n\n旅遊提示：必須提前網路預約，現場不售票'
  }
];

// ==================== 義大利景點 ====================
const italyAttractions = [
  {
    name: '羅馬競技場',
    duration_minutes: 120,
    opening_hours: { open: '08:30', close: '19:00' },
    tags: ['世界遺產', '古羅馬', '圓形劇場', '必去', '羅馬'],
    notes: '古羅馬最偉大的建築，可容納5萬觀眾觀看角鬥士比賽。建於西元80年。世界新七大奇蹟之一。建議買含古羅馬廣場的套票。\n\n旅遊提示：建議買Roma Pass或套票避免排隊'
  },
  {
    name: '古羅馬廣場',
    duration_minutes: 90,
    opening_hours: { open: '08:30', close: '19:00' },
    tags: ['遺跡', '古羅馬', '神廟', '歷史', '羅馬'],
    notes: '古羅馬帝國的政治經濟中心，有神廟、凱旋門、元老院遺跡。曾是世界的中心。與競技場門票可通用。建議請導覽解說。\n\n旅遊提示：沒有導覽可能看不懂，建議租語音導覽'
  },
  {
    name: '帕拉廷山',
    duration_minutes: 90,
    opening_hours: { open: '08:30', close: '19:00' },
    tags: ['遺跡', '皇宮', '起源', '花園', '羅馬'],
    notes: '羅馬建城的傳說之地，羅馬七丘中最古老的。有古羅馬皇帝宮殿遺跡和法爾內塞花園。可俯瞰古羅馬廣場。與競技場門票通用。\n\n旅遊提示：這裡視野最好，可以俯瞰整個古羅馬廣場'
  },
  {
    name: '梵蒂岡博物館',
    duration_minutes: 240,
    opening_hours: { open: '08:00', close: '18:00', note: '週日休館（每月最後週日免費）' },
    tags: ['博物館', '世界級', '拉斐爾', '藝術', '梵蒂岡'],
    notes: '收藏教宗歷代收藏的藝術品，有拉斐爾畫室、地圖廊等。最後通往西斯廷教堂。收藏之豐富需要一整天。每月最後週日免費但超擠。\n\n旅遊提示：網路預約門票可省2小時排隊'
  },
  {
    name: '西斯廷教堂',
    duration_minutes: 45,
    opening_hours: { open: '08:00', close: '18:00' },
    tags: ['教堂', '米開朗基羅', '創世紀', '最後審判', '梵蒂岡'],
    notes: '米開朗基羅的曠世傑作，天花板的《創世紀》和祭壇的《最後審判》。是選舉教宗的地方。位於梵蒂岡博物館最後，禁止拍照和說話。\n\n旅遊提示：內部不能拍照和講話，要保持安靜'
  },
  {
    name: '聖彼得大教堂',
    duration_minutes: 120,
    opening_hours: { open: '07:00', close: '19:00' },
    tags: ['教堂', '世界最大', '米開朗基羅', '圓頂', '梵蒂岡'],
    notes: '天主教最神聖的教堂，世界最大教堂。米開朗基羅設計的圓頂。有聖殤像和聖彼得寶座。可登頂俯瞰梵蒂岡。免費入場但登頂收費。\n\n旅遊提示：搭電梯上圓頂還需爬320級台階'
  },
  {
    name: '聖天使城堡',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '19:30' },
    tags: ['城堡', '哈德良', '教宗', '觀景', '羅馬'],
    notes: '原為哈德良皇帝陵墓，後成為教宗避難所和監獄。《乳使與乳乳》取景地。頂層可360度俯瞰羅馬和梵蒂岡。有秘密通道連接梵蒂岡。\n\n旅遊提示：傍晚上頂層看日落最美'
  },
  {
    name: '萬神殿',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '19:00' },
    tags: ['神廟', '古羅馬', '圓頂', '拉斐爾墓', '免費'],
    notes: '古羅馬保存最完整的建築，2000年歷史。巨大無柱圓頂是建築奇蹟，頂部有圓孔透光。拉斐爾長眠於此。免費入場。\n\n旅遊提示：下雨天進去可看到雨水從圓孔落下'
  },
  {
    name: '特雷維噴泉',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['噴泉', '許願', '巴洛克', '必去', '羅馬'],
    notes: '羅馬最著名的噴泉，巴洛克風格傑作。傳說背對噴泉投硬幣會重返羅馬。經典電影《乳乳乳泉》取景地。24小時開放，夜景更美。\n\n旅遊提示：右手拿硬幣從左肩往後丟許願'
  },
  {
    name: '西班牙階梯',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['階梯', '地標', '購物', '電影取景', '羅馬'],
    notes: '135級台階連接西班牙廣場和聖三一教堂。《乳馬假期》取景地。周邊是精品購物區。春天有杜鵑花裝飾。禁止在階梯上坐著吃東西。\n\n旅遊提示：禁止在階梯上吃東西，會被罰款'
  },
  {
    name: '納沃納廣場',
    duration_minutes: 45,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['廣場', '噴泉', '巴洛克', '咖啡廳', '羅馬'],
    notes: '羅馬最美的巴洛克廣場，有三座噴泉。四河噴泉是貝尼尼傑作。周圍有咖啡廳和街頭藝人。是羅馬人散步約會的好地方。\n\n旅遊提示：廣場上的咖啡很貴，建議去旁邊巷子'
  },
  {
    name: '真理之口',
    duration_minutes: 20,
    opening_hours: { open: '09:30', close: '17:50' },
    tags: ['雕刻', '傳說', '電影取景', '必拍', '羅馬'],
    notes: '古羅馬的排水孔蓋，傳說說謊者把手伸進嘴裡會被咬斷。《羅馬假期》經典場景。位於希臘聖母堂門廊。排隊拍照通常要等20-30分鐘。\n\n旅遊提示：免費但要排隊等拍照'
  }
];

// ==================== 西班牙景點 ====================
const spainAttractions = [
  {
    name: '聖家堂',
    duration_minutes: 120,
    opening_hours: { open: '09:00', close: '20:00' },
    tags: ['教堂', '高第', '世界遺產', '必去', '巴塞隆納'],
    notes: '高第畢生傑作，1882年開工至今仍在建造。世界遺產。獨特的自然主義設計，彩色玻璃窗絕美。是巴塞隆納最著名地標。預計2026年完工。\n\n旅遊提示：必須網路預約，至少提前兩週'
  },
  {
    name: '桂爾公園',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '19:30' },
    tags: ['公園', '高第', '馬賽克', '世界遺產', '巴塞隆納'],
    notes: '高第設計的童話公園，世界遺產。有馬賽克蜥蜴、糖果屋、波浪長椅。可俯瞰巴塞隆納市區和地中海。收費區需預約。\n\n旅遊提示：早上8點前和晚上收費區關閉後可免費入園'
  },
  {
    name: '巴特略之家',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '21:00' },
    tags: ['建築', '高第', '海洋風', '彩色', '巴塞隆納'],
    notes: '高第最具想像力的作品，靈感來自海洋和骨骼。屋頂像龍背，陽台像骷髏面具。內部裝潢如置身海底。是加泰隆尼亞現代主義代表。\n\n旅遊提示：夜間票可看燈光投影秀'
  },
  {
    name: '米拉之家',
    duration_minutes: 75,
    opening_hours: { open: '09:00', close: '20:30' },
    tags: ['建築', '高第', '波浪', '屋頂', '巴塞隆納'],
    notes: '高第最後的私人住宅設計，波浪形外觀像海浪或沙丘。屋頂有奇特的煙囪群如戴面具的士兵。內部可參觀高第展覽和豪華公寓。\n\n旅遊提示：夜間屋頂有燈光秀和飲料'
  },
  {
    name: '蘭布拉大道',
    duration_minutes: 60,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['大道', '步行街', '街頭藝人', '市集', '巴塞隆納'],
    notes: '巴塞隆納最著名的步行街，1.2公里長。有街頭藝人、花攤、小吃。連接加泰隆尼亞廣場和海邊。周邊有波蓋利亞市集。小心扒手。\n\n旅遊提示：扒手很多，注意隨身物品'
  },
  {
    name: '波蓋利亞市場',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '20:30', note: '週日休息' },
    tags: ['市場', '美食', '海鮮', '果汁', '巴塞隆納'],
    notes: '歐洲最美的菜市場之一，色彩繽紛。有新鮮果汁、海鮮、火腿、起司。可在攤位上吃Tapas。是感受巴塞隆納飲食文化的最佳去處。\n\n旅遊提示：新鮮果汁和海鮮Tapas必吃'
  },
  {
    name: '哥德區',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['古城區', '中世紀', '迷宮', '歷史', '巴塞隆納'],
    notes: '巴塞隆納最古老的街區，有2000年歷史。迷宮般的窄巷有許多小店和餐廳。有大教堂、國王廣場等。畢卡索曾在此生活。\n\n旅遊提示：容易迷路但很有探險樂趣'
  },
  {
    name: '加泰隆尼亞廣場',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['廣場', '地標', '購物', '交通樞紐', '巴塞隆納'],
    notes: '巴塞隆納的心臟，連接舊城區和擴建區。有百貨公司、噴泉、鴿子。是地鐵和巴士的轉運站。蘭布拉大道從此開始。\n\n旅遊提示：El Corte Inglés百貨頂樓有城市全景'
  },
  {
    name: '巴塞隆納海灘',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['海灘', '地中海', '沙灘', '海鮮', '巴塞隆納'],
    notes: '1992年奧運後開發的城市海灘，綿延4公里。有Barceloneta等多個海灘。可游泳、曬太陽、打沙灘排球。沿海有許多海鮮餐廳。\n\n旅遊提示：夏天人很多，建議早上去佔位子'
  },
  {
    name: '畢卡索博物館',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '19:00', note: '週一休館' },
    tags: ['博物館', '畢卡索', '藝術', '早期作品', '巴塞隆納'],
    notes: '收藏畢卡索早期作品的博物館，超過4000件作品。可看到藝術家的成長歷程。位於哥德區的五棟中世紀宮殿中。\n\n旅遊提示：週四下午4點後和每月第一個週日免費'
  },
  {
    name: '蒙特惠克山',
    duration_minutes: 180,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['山丘', '纜車', '城堡', '噴泉', '巴塞隆納'],
    notes: '巴塞隆納南邊的山丘，1992年奧運場館所在地。有城堡、美術館、魔幻噴泉。可搭纜車上山。魔幻噴泉夜間有燈光水舞秀。\n\n旅遊提示：魔幻噴泉夏天週四到週日晚上表演'
  },
  {
    name: '諾坎普球場',
    duration_minutes: 120,
    opening_hours: { open: '09:30', close: '19:30' },
    tags: ['足球', '巴薩', '球場', '博物館', '巴塞隆納'],
    notes: '歐洲最大足球場，FC巴塞隆納主場。可容納99000觀眾。球場導覽可進入球員通道、更衣室、看台。有巴薩博物館展示獎盃。\n\n旅遊提示：看球賽需提前幾個月訂票'
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
  console.log('歐洲景點優化工具');
  console.log('法國 + 英國 + 義大利 + 西班牙');
  console.log('========================================');

  const frCount = await updateAttractions('france', franceAttractions, '法國');
  const ukCount = await updateAttractions('uk', ukAttractions, '英國');
  const itCount = await updateAttractions('italy', italyAttractions, '義大利');
  const esCount = await updateAttractions('spain', spainAttractions, '西班牙');

  console.log('\n📊 更新統計:');
  console.log(`  法國: ${frCount} 筆`);
  console.log(`  英國: ${ukCount} 筆`);
  console.log(`  義大利: ${itCount} 筆`);
  console.log(`  西班牙: ${esCount} 筆`);
  console.log(`  總計: ${frCount + ukCount + itCount + esCount} 筆`);
  console.log('\n✅ 歐洲優化完成！');
}

main();
