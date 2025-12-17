// 批量優化景點深度資料
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== 埃及景點深度資料 ==========
const egyptEnhancements = [
  {
    name: '吉薩金字塔群',
    duration_minutes: 180,
    opening_hours: { open: '08:00', close: '17:00', note: '夏季延長至18:00' },
    tags: ['世界遺產', '古蹟', '必去', '金字塔', '攝影'],
    notes: '建議清晨或傍晚前往避開人潮和高溫。可購買聯票同時參觀金字塔內部、太陽船博物館。騎駱駝拍照需事先談好價格避免糾紛。'
  },
  {
    name: '獅身人面像',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['世界遺產', '古蹟', '地標', '攝影'],
    notes: '與金字塔同一園區，建議一起參觀。最佳拍照位置在正面稍遠處。聲光秀每晚舉行，需另外購票。'
  },
  {
    name: '大金字塔',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:00', note: '每日限300人入內' },
    tags: ['世界遺產', '古蹟', '必去', '胡夫金字塔'],
    notes: '進入內部需另購票約400埃鎊。通道狹窄陡峭，有幽閉恐懼症者不建議。每日限額，建議一開門就排隊。'
  },
  {
    name: '阿布辛貝神廟',
    duration_minutes: 120,
    opening_hours: { open: '05:00', close: '18:00', note: '建議日出時分抵達' },
    tags: ['世界遺產', '古蹟', '必去', '拉美西斯二世', '神廟'],
    notes: '距離亞斯文約3小時車程，通常凌晨出發看日出。每年2月22日和10月22日陽光會照進神廟最深處，為「太陽節」。建議參加當地一日遊團。'
  },
  {
    name: '阿布辛貝聲光秀',
    duration_minutes: 60,
    opening_hours: { open: '19:00', close: '21:00', note: '每晚兩場' },
    tags: ['表演', '夜間活動', '聲光秀'],
    notes: '需住宿阿布辛貝才能觀賞。有英文、法文等多語言場次，建議提前確認。'
  },
  {
    name: '帝王谷',
    duration_minutes: 180,
    opening_hours: { open: '06:00', close: '17:00', note: '夏季可能提早關閉' },
    tags: ['世界遺產', '古蹟', '必去', '法老墓', '盧克索'],
    notes: '基本票可參觀3座墓穴，圖坦卡門墓需另購票。墓內禁止攝影。建議清晨前往避開高溫。可搭小火車往返入口。'
  },
  {
    name: '卡納克神廟',
    duration_minutes: 150,
    opening_hours: { open: '06:00', close: '17:30' },
    tags: ['世界遺產', '古蹟', '必去', '神廟', '盧克索'],
    notes: '埃及最大神廟群，至少需2-3小時參觀。多柱廳的134根巨柱令人震撼。建議請導遊講解歷史背景。'
  },
  {
    name: '路克索神廟',
    duration_minutes: 90,
    opening_hours: { open: '06:00', close: '21:00', note: '夜間點燈更美' },
    tags: ['世界遺產', '古蹟', '神廟', '盧克索', '夜景'],
    notes: '與卡納克神廟相連的人面獅身大道已修復開放。晚間點燈後別有風情，建議白天和夜間各參觀一次。'
  },
  {
    name: '女王神廟',
    duration_minutes: 90,
    opening_hours: { open: '06:00', close: '17:00' },
    tags: ['世界遺產', '古蹟', '神廟', '哈乔普蘇特'],
    notes: '哈乔普蘇特女王的祭殿，建築依山而建非常壯觀。從停車場到神廟有接駁車。墓室壁畫保存完好。'
  },
  {
    name: '菲萊神廟',
    duration_minutes: 120,
    opening_hours: { open: '07:00', close: '16:00', note: '需搭船前往' },
    tags: ['世界遺產', '古蹟', '神廟', '亞斯文', '島嶼'],
    notes: '位於小島上，需搭摩托船前往（來回約150埃鎊/船）。神廟供奉愛西斯女神，浮雕精美。晚間有聲光秀。'
  },
  {
    name: '大埃及博物館',
    duration_minutes: 240,
    opening_hours: { open: '09:00', close: '19:00', note: '2025年全面開放' },
    tags: ['博物館', '必去', '圖坦卡門', '2025新景點', '古文物'],
    notes: '2025年全新開幕，收藏超過10萬件文物。完整展示圖坦卡門陵墓所有出土文物。建議預留半天時間參觀。門票約800埃鎊。'
  },
  {
    name: '埃及博物館',
    duration_minutes: 180,
    opening_hours: { open: '09:00', close: '17:00', note: '週五11:30-13:00休息' },
    tags: ['博物館', '古文物', '開羅', '必去'],
    notes: '開羅市中心的老博物館，收藏豐富但展示較擁擠。木乃伊廳需另購票。部分珍品已移至大埃及博物館。'
  },
  {
    name: '尼羅河遊船',
    duration_minutes: 120,
    opening_hours: { open: '19:00', close: '22:00', note: '晚宴遊船' },
    tags: ['遊船', '體驗', '尼羅河', '晚餐'],
    notes: '開羅尼羅河晚宴遊船包含自助餐和表演。建議選擇有肚皮舞和蘇菲舞表演的行程。約50-80美金/人。'
  },
  {
    name: '尼羅河晚宴遊船',
    duration_minutes: 180,
    opening_hours: { open: '19:30', close: '23:00' },
    tags: ['遊船', '體驗', '晚餐', '表演', '浪漫'],
    notes: '五星級遊船提供精緻晚餐，欣賞開羅夜景。包含肚皮舞、蘇菲舞表演。建議盛裝出席。'
  },
  {
    name: '尼羅河三桅帆船',
    duration_minutes: 90,
    opening_hours: { open: '日落時分最佳', note: '全天可預約' },
    tags: ['遊船', '體驗', '傳統', '亞斯文', '日落'],
    notes: '傳統帆船Felucca體驗，在亞斯文最受歡迎。建議黃昏時分乘坐欣賞日落。約100-200埃鎊/小時。'
  },
  {
    name: '路克索熱氣球',
    duration_minutes: 60,
    opening_hours: { open: '05:00', close: '07:00', note: '僅日出時段' },
    tags: ['體驗', '熱氣球', '日出', '必去', '空中'],
    notes: '清晨升空俯瞰帝王谷和尼羅河，絕美日出體驗。約80-150美金/人。需提前預訂，天候不佳會取消。'
  },
  {
    name: '金字塔聲光秀',
    duration_minutes: 60,
    opening_hours: { open: '19:00', close: '21:00', note: '每晚兩場' },
    tags: ['表演', '夜間活動', '聲光秀', '金字塔'],
    notes: '在獅身人面像前觀賞，有中文語音導覽場次。票價約300埃鎊。建議提前購票選好座位。'
  },
  {
    name: '哈利利市場',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '22:00', note: '週五下午休息' },
    tags: ['市場', '購物', '開羅', '紀念品'],
    notes: '開羅最大的傳統市集，可買到香料、紙莎草畫、金銀飾品。記得殺價，通常從3-5折開始談。'
  },
  {
    name: '薩拉丁城堡',
    duration_minutes: 120,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['古蹟', '城堡', '開羅', '清真寺'],
    notes: '城堡內有多座清真寺和博物館，穆罕默德阿里清真寺最為壯觀。可俯瞰開羅全景。門票約200埃鎊。'
  },
  {
    name: '穆罕默德阿里清真寺',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '17:00', note: '禮拜時間暫停參觀' },
    tags: ['清真寺', '宗教', '開羅', '建築'],
    notes: '位於薩拉丁城堡內，仿伊斯坦堡藍色清真寺設計。入內需脫鞋，女性需包頭巾。免費提供長袍借穿。'
  },
  {
    name: '開羅塔',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '01:00' },
    tags: ['地標', '觀景', '開羅', '夜景'],
    notes: '187公尺高的蓮花造型塔，頂層有360度觀景台和旋轉餐廳。建議傍晚時分前往欣賞日落和夜景。'
  },
  {
    name: '懸空教堂',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '16:00', note: '週日彌撒時間暫停' },
    tags: ['教堂', '科普特', '宗教', '開羅'],
    notes: '開羅科普特區最著名的教堂，建於羅馬堡壘上方。木製屋頂如同挪亞方舟，內部聖像畫精美。免費參觀。'
  },
  {
    name: '科普特區',
    duration_minutes: 120,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['歷史區', '科普特', '教堂', '開羅'],
    notes: '開羅最古老的基督教區，有多座古老教堂和猶太會堂。聖喬治教堂、懸空教堂都在此區。可步行遊覽。'
  },
  {
    name: '聖喬治教堂',
    duration_minutes: 30,
    opening_hours: { open: '09:00', close: '16:00' },
    tags: ['教堂', '科普特', '宗教'],
    notes: '科普特區的圓形教堂，獻給聖喬治。教堂內有精美的聖像和聖物。免費參觀。'
  },
  {
    name: '亞斯文高壩',
    duration_minutes: 60,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['水壩', '工程', '亞斯文', '納瑟湖'],
    notes: '1960年代建成的大型水壩，形成納瑟湖。可參觀紀念塔和俯瞰納瑟湖全景。門票約80埃鎊。'
  },
  {
    name: '亞斯文植物園',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['公園', '植物園', '亞斯文', '島嶼'],
    notes: '位於尼羅河中的小島上，需搭船前往。種植來自世界各地的熱帶植物。環境清幽，適合散步。'
  },
  {
    name: '努比亞村',
    duration_minutes: 120,
    opening_hours: { open: '全天開放' },
    tags: ['文化', '努比亞', '亞斯文', '彩色房屋'],
    notes: '色彩繽紛的努比亞傳統村落，可體驗當地文化。村民友善，但拍照前請徵得同意。可購買手工藝品。'
  },
  {
    name: '努比亞村晚餐',
    duration_minutes: 180,
    opening_hours: { open: '18:00', close: '22:00' },
    tags: ['體驗', '晚餐', '努比亞', '文化'],
    notes: '在努比亞家庭享用傳統晚餐，體驗當地生活。通常包含歌舞表演。需透過旅行社預約。'
  },
  {
    name: '象島',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['島嶼', '亞斯文', '古蹟', '博物館'],
    notes: '尼羅河中的花崗岩小島，有努比亞博物館和古代遺跡。可搭Felucca帆船前往。島上有努比亞村落。'
  },
  {
    name: '未完成方尖碑',
    duration_minutes: 45,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['古蹟', '亞斯文', '採石場'],
    notes: '古埃及採石場遺址，可見一根因裂縫而廢棄的巨大方尖碑。了解古人如何開採和運送石材。門票約80埃鎊。'
  },
  {
    name: '哈索爾神廟',
    duration_minutes: 90,
    opening_hours: { open: '07:00', close: '17:00' },
    tags: ['古蹟', '神廟', '丹德拉'],
    notes: '位於丹德拉，保存最完整的神廟之一。天花板上的黃道十二宮浮雕聞名於世（複製品）。需從盧克索包車前往。'
  },
  {
    name: '曼農巨像',
    duration_minutes: 30,
    opening_hours: { open: '全天開放', note: '免費參觀' },
    tags: ['古蹟', '雕像', '盧克索'],
    notes: '兩座18公尺高的法老坐像，曾因地震發出「歌聲」而聞名。位於路邊，免費參觀，通常與其他景點一起遊覽。'
  },
  {
    name: '路克索博物館',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '21:00' },
    tags: ['博物館', '盧克索', '古文物'],
    notes: '收藏精選的盧克索地區出土文物，展示精美。包含兩具皇家木乃伊。比開羅博物館更現代化。'
  },
  {
    name: '太陽船博物館',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '16:00' },
    tags: ['博物館', '金字塔', '太陽船'],
    notes: '展示胡夫法老的太陽船，船長43公尺。位於大金字塔旁。太陽船已移至大埃及博物館展示。'
  },
  {
    name: '帝王谷日出',
    duration_minutes: 60,
    opening_hours: { open: '05:30', close: '07:00' },
    tags: ['體驗', '日出', '攝影'],
    notes: '從尼羅河西岸觀賞日出照亮帝王谷的壯麗景色。需提前安排交通。熱氣球是另一種選擇。'
  },
  {
    name: '阿茲哈爾清真寺',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '21:00', note: '禮拜時間暫停' },
    tags: ['清真寺', '宗教', '開羅', '伊斯蘭'],
    notes: '開羅最古老的清真寺之一，也是著名的伊斯蘭大學。建築精美，氣氛莊嚴。免費參觀，需脫鞋。'
  },
  {
    name: '埃及料理課',
    duration_minutes: 180,
    opening_hours: { open: '預約制' },
    tags: ['體驗', '料理', '文化'],
    notes: '學習製作Koshari、Ful Medames等傳統埃及料理。通常包含市場採購行程。約40-60美金/人。'
  }
];

// ========== 沙烏地阿拉伯景點深度資料 ==========
const saudiEnhancements = [
  {
    name: '艾爾奧拉',
    duration_minutes: 480,
    opening_hours: { open: '全天', note: '各景點時間不同' },
    tags: ['世界遺產', '古蹟', '沙漠', '必去', '考古'],
    notes: '建議安排2-3天深度遊覽。包含瑪甸沙勒、象岩、老城區等景點。冬季（10-3月）氣候最舒適。需提前在官網預約。'
  },
  {
    name: '瑪甸沙勒',
    duration_minutes: 180,
    opening_hours: { open: '08:00', close: '17:00' },
    tags: ['世界遺產', '古蹟', '必去', '納巴泰', '沙漠'],
    notes: '沙烏地第一個世界遺產，納巴泰文明的石刻墓穴群。與約旦佩特拉同時期。需在艾爾奧拉官網預約導覽團。'
  },
  {
    name: '象岩',
    duration_minutes: 60,
    opening_hours: { open: '16:00', close: '22:00', note: '下午4點後開放' },
    tags: ['自然', '地標', '攝影', '日落'],
    notes: '天然風化形成的大象形狀岩石，是艾爾奧拉的地標。日落時分色彩最美。設有咖啡廳可休憩。'
  },
  {
    name: '艾爾奧拉老城',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '18:00' },
    tags: ['古蹟', '老城', '歷史'],
    notes: '超過800年歷史的泥磚老城遺跡，迷宮般的街道。傍晚點燈後非常有氣氛。可參加導覽深入了解歷史。'
  },
  {
    name: '王國塔',
    duration_minutes: 90,
    opening_hours: { open: '09:30', close: '23:00', note: 'Sky Bridge 10:00-22:00' },
    tags: ['地標', '觀景', '利雅德', '購物'],
    notes: '利雅德最著名地標，99層高。Sky Bridge觀景台可360度俯瞰城市。門票約75里亞爾。內有高級購物中心。'
  },
  {
    name: '國家博物館',
    duration_minutes: 180,
    opening_hours: { open: '09:00', close: '21:00', note: '週五14:00-21:00' },
    tags: ['博物館', '利雅德', '歷史', '文化'],
    notes: '展示沙烏地阿拉伯從史前到現代的完整歷史。8個展廳設計現代。免費入場。週日休息。'
  },
  {
    name: '馬斯瑪克堡',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '17:00', note: '週五休息' },
    tags: ['古蹟', '城堡', '利雅德', '歷史'],
    notes: '19世紀泥磚城堡，見證沙烏地建國歷史。門口仍可見1902年攻城戰的刀痕。免費參觀。'
  },
  {
    name: '德拉伊耶',
    duration_minutes: 150,
    opening_hours: { open: '09:00', close: '22:00' },
    tags: ['世界遺產', '古蹟', '利雅德', '沙烏地發源地'],
    notes: '沙烏地王朝發源地，泥磚城市遺址。已開發為文化區，有餐廳和活動。Bujairi Terrace用餐推薦。'
  },
  {
    name: '阿爾巴拉德老城',
    duration_minutes: 120,
    opening_hours: { open: '全天開放' },
    tags: ['世界遺產', '老城', '吉達', '珊瑚建築'],
    notes: '吉達歷史核心區，有傳統珊瑚岩建築和精美木窗。建議傍晚散步，夜間點燈後更美。可請當地導遊講解。'
  },
  {
    name: '法赫德國王噴泉',
    duration_minutes: 30,
    opening_hours: { open: '日落後最佳' },
    tags: ['地標', '噴泉', '吉達', '世界之最'],
    notes: '世界最高噴泉，可達312公尺。位於紅海濱海大道，日落後觀賞效果最佳。免費參觀。'
  },
  {
    name: '吉達濱海大道',
    duration_minutes: 120,
    opening_hours: { open: '全天開放' },
    tags: ['海濱', '休閒', '吉達', '散步'],
    notes: '30公里長的濱海步道，有雕塑公園、咖啡廳。傍晚時分當地人休閒散步的熱門地點。'
  },
  {
    name: '浮動清真寺',
    duration_minutes: 45,
    opening_hours: { open: '禮拜時間外', note: '非穆斯林可外觀參觀' },
    tags: ['清真寺', '吉達', '建築', '攝影'],
    notes: '建於紅海上的白色清真寺，漲潮時彷彿漂浮海上。日出時分最美。非穆斯林只能外觀參觀。'
  },
  {
    name: '紅海潛水',
    duration_minutes: 240,
    opening_hours: { open: '預約制' },
    tags: ['體驗', '潛水', '紅海', '珊瑚'],
    notes: '紅海海水清澈，珊瑚礁和魚類豐富。吉達和NEOM附近有多個潛水點。約150-300美金/次。需PADI證照。'
  },
  {
    name: '沙漠露營',
    duration_minutes: 960,
    opening_hours: { open: '預約制' },
    tags: ['體驗', '沙漠', '露營', '星空'],
    notes: '在Rub al Khali沙漠體驗貝都因傳統生活。包含駱駝騎乘、篝火晚餐、觀星。建議冬季前往。'
  },
  {
    name: '沙漠星空觀測',
    duration_minutes: 180,
    opening_hours: { open: '20:00', close: '23:00' },
    tags: ['體驗', '星空', '沙漠', '夜間'],
    notes: '沙漠光害少，是絕佳觀星地點。艾爾奧拉有專業觀星導覽。新月前後最佳。'
  },
  {
    name: '駱駝騎乘',
    duration_minutes: 60,
    opening_hours: { open: '預約制' },
    tags: ['體驗', '沙漠', '傳統'],
    notes: '體驗傳統沙漠交通方式。艾爾奧拉、利雅德郊區都可安排。約100-200里亞爾/小時。'
  },
  {
    name: '阿拉伯咖啡體驗',
    duration_minutes: 60,
    opening_hours: { open: '預約制' },
    tags: ['體驗', '文化', '咖啡', '傳統'],
    notes: '學習傳統阿拉伯咖啡（Qahwa）的製作方式，配搭椰棗。體驗貝都因待客文化。'
  },
  {
    name: '世界邊緣',
    duration_minutes: 180,
    opening_hours: { open: '全天', note: '日落最佳' },
    tags: ['自然', '懸崖', '利雅德郊區', '日落'],
    notes: '距利雅德約90公里的壯觀懸崖，俯瞰無盡沙漠。需四驅車前往。日落時分景色最震撼。帶足飲水。'
  },
  {
    name: 'The Line',
    duration_minutes: 60,
    opening_hours: { open: '建設中' },
    tags: ['未來城市', 'NEOM', '建築'],
    notes: 'NEOM計畫中的未來城市，170公里長的線性城市。預計2030年後陸續完工。目前可參觀展覽中心了解計畫。'
  },
  {
    name: 'NEOM未來城市',
    duration_minutes: 120,
    opening_hours: { open: '展覽中心開放中' },
    tags: ['未來城市', '科技', '願景'],
    notes: '5000億美元打造的未來城市計畫。目前可參觀利雅德或NEOM的展覽中心。部分區域已開放旅遊。'
  },
  {
    name: '先知清真寺',
    duration_minutes: 90,
    opening_hours: { open: '全天開放' },
    tags: ['清真寺', '麥地那', '聖地', '宗教'],
    notes: '伊斯蘭第二聖寺，先知穆罕默德長眠於此。非穆斯林不得進入麥地那禁區。穆斯林應遵守禮儀。'
  },
  {
    name: '庫巴清真寺',
    duration_minutes: 45,
    opening_hours: { open: '全天開放' },
    tags: ['清真寺', '麥地那', '宗教', '歷史'],
    notes: '伊斯蘭史上第一座清真寺。位於麥地那，非穆斯林不得進入。對穆斯林有特殊宗教意義。'
  },
  {
    name: '麥加大清真寺',
    duration_minutes: 180,
    opening_hours: { open: '全天開放' },
    tags: ['清真寺', '麥加', '聖地', '朝覲'],
    notes: '伊斯蘭最神聖的清真寺，環繞著天房卡巴。僅限穆斯林進入麥加。全球穆斯林朝聖目的地。'
  },
  {
    name: '麥加皇家鐘塔',
    duration_minutes: 60,
    opening_hours: { open: '博物館時間' },
    tags: ['地標', '麥加', '建築'],
    notes: '世界最高鐘塔，601公尺。位於麥加禁寺旁。內有博物館。僅限穆斯林進入麥加參觀。'
  },
  {
    name: '古城音樂節',
    duration_minutes: 240,
    opening_hours: { open: '12月-3月', note: '季節性活動' },
    tags: ['活動', '音樂', '艾爾奧拉', '冬季'],
    notes: '冬季在艾爾奧拉舉辦的大型文化活動，有國際音樂表演、藝術展覽。需提前購票。'
  },
  {
    name: '塔布克城堡',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['古蹟', '城堡', '塔布克'],
    notes: '奧斯曼時期建造的城堡，曾是朝聖者休息站。已修復開放參觀。免費。'
  },
  {
    name: '阿西爾國家公園',
    duration_minutes: 240,
    opening_hours: { open: '全天開放' },
    tags: ['自然', '山區', '健行'],
    notes: '沙國少見的綠色山區，有健行步道和涼爽氣候。艾卜哈是主要城市。適合夏季避暑。'
  },
  {
    name: '阿西爾傳統村落',
    duration_minutes: 120,
    opening_hours: { open: '全天開放' },
    tags: ['文化', '傳統村落', '建築'],
    notes: '保存傳統彩繪房屋的山區村落。Al Habala懸崖村可搭纜車前往。獨特的建築風格。'
  },
  {
    name: '紅海購物中心',
    duration_minutes: 180,
    opening_hours: { open: '10:00', close: '23:00' },
    tags: ['購物', '吉達', '商場'],
    notes: '吉達最大購物中心之一，有國際品牌、美食街。週末人潮較多。'
  },
  {
    name: '布萊達野生動物園',
    duration_minutes: 180,
    opening_hours: { open: '14:00', close: '21:00' },
    tags: ['動物園', '利雅德', '親子'],
    notes: '利雅德郊區的野生動物園，可自駕遊覽。有阿拉伯羚羊等本地物種。適合親子。'
  }
];

// ========== 執行更新 ==========
async function enhanceAttractions(countryId, enhancements, countryName) {
  console.log(`\n🔄 正在更新 ${countryName} 景點深度資料...`);
  let updated = 0;
  let failed = 0;

  for (const enhancement of enhancements) {
    const { error } = await supabase
      .from('attractions')
      .update({
        duration_minutes: enhancement.duration_minutes,
        opening_hours: enhancement.opening_hours,
        tags: enhancement.tags,
        notes: enhancement.notes
      })
      .eq('country_id', countryId)
      .eq('name', enhancement.name);

    if (error) {
      console.log(`  ❌ ${enhancement.name}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✅ ${enhancement.name}`);
      updated++;
    }
  }

  console.log(`\n📊 ${countryName} 更新完成: ${updated} 成功, ${failed} 失敗`);
  return { updated, failed };
}

async function main() {
  console.log('========================================');
  console.log('景點深度資料批量優化工具');
  console.log('========================================');

  // 更新埃及
  await enhanceAttractions('egypt', egyptEnhancements, '埃及');

  // 更新沙烏地阿拉伯
  await enhanceAttractions('saudi_arabia', saudiEnhancements, '沙烏地阿拉伯');

  console.log('\n✅ 所有更新完成！');
}

main().catch(console.error);
