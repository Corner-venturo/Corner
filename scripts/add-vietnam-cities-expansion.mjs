#!/usr/bin/env node
/**
 * 越南其他城市大擴充 - 每個城市擴充到 8 個景點
 * 峴港、會安、芽莊、下龍灣、富國島、順化
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const attractions = [
  // ========== 峴港擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《巴拿山》- 雲端上的法國城',
    name_en: 'Ba Na Hills',
    category: '體驗活動',
    description: '海拔1487公尺的《巴拿山》搭纜車穿越雲層，抵達法式城堡、哥德教堂。黃金橋由巨手托起漂浮雲端，夢幻景致爆紅全球，四季花園、酒窖、遊樂園一日玩不完。',
    tags: ['纜車', '必遊', '拍照', '法式'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《美溪沙灘》- 全球最美六大海灘',
    name_en: 'My Khe Beach',
    category: '自然景觀',
    description: '《美溪沙灘》長達30公里，細白沙灘、湛藍海水，被《富比士》評為全球最美六大海灘。日出時分金光灑落，衝浪、海鮮燒烤、按摩，悠閒海濱度假首選。',
    tags: ['海灘', '必遊', '衝浪', '日出'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《五行山》- 大理石聖地',
    name_en: 'Marble Mountains',
    category: '歷史文化',
    description: '五座大理石山峰代表金木水火土，《五行山》洞穴寺廟神秘莊嚴。爬石階登頂俯瞰峴港全景，靈應寺、玄空洞佛像莊嚴，周圍石雕村工藝品精緻。',
    tags: ['山岳', '寺廟', '洞穴', '石雕'],
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《龍橋》- 噴火飛龍大橋',
    name_en: 'Dragon Bridge',
    category: '體驗活動',
    description: '《龍橋》橫跨韓江長666公尺，金色巨龍造型璀璨奢華。每週六日晚上9點噴火噴水秀，火焰從龍口噴出，燈光變幻絢麗，成千上萬人擠爆橋頭拍照打卡。',
    tags: ['大橋', '表演', '夜景', '必看'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'da-nang',
    country_id: 'vietnam',
    name: '《韓江夜市》- 峴港美食天堂',
    name_en: 'Han Market',
    category: '體驗活動',
    description: '《韓江夜市》沿河畔綿延數百公尺，燒烤海鮮、米紙春捲、甘蔗蝦、越式法包道地美味。手工藝品、服飾攤位密集，價格便宜品質佳，夜晚燈火璀璨熱鬧非凡。',
    tags: ['夜市', '美食', '購物', '河畔'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 8,
    is_active: true
  },

  // ========== 會安擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《日本橋》- 會安地標',
    name_en: 'Japanese Covered Bridge',
    category: '歷史文化',
    description: '建於1593年的《日本橋》是會安最經典地標，木造拱橋連接兩岸。夜晚燈籠點亮倒映秋盆河，橋內供奉武財神，猴狗雕像守護兩端，見證四百年貿易歷史。',
    tags: ['古橋', '必遊', '燈籠', '拍照'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 60,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《會安燈籠節》- 滿城燈海',
    name_en: 'Lantern Festival',
    category: '體驗活動',
    description: '每月農曆十四《會安燈籠節》關閉電燈，數千盞燈籠點亮古城。秋盆河放水燈許願、街頭音樂表演、傳統服飾體驗，宛如穿越時空回到古代貿易港榮景。',
    tags: ['燈籠', '祭典', '浪漫', '必遊'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《福建會館》- 華人建築瑰寶',
    name_en: 'Fujian Assembly Hall',
    category: '歷史文化',
    description: '《福建會館》建於1697年供奉媽祖，精緻木雕、陶瓷裝飾、龍柱鳳凰展現閩南工藝巔峰。庭園寧靜典雅、香火鼎盛，記錄福建商人在會安繁榮歲月。',
    tags: ['會館', '歷史', '華人', '建築'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《安邦沙灘》- 古城旁的碧海',
    name_en: 'An Bang Beach',
    category: '自然景觀',
    description: '距會安5公里的《安邦沙灘》保留原始寧靜，細白沙灘、椰林搖曳。海鮮餐廳座椅直接放在沙灘上，腳踏海水享用越式龍蝦，日落時分天空染成橘紅漸層。',
    tags: ['海灘', '悠閒', '海鮮', '日落'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hoi-an',
    country_id: 'vietnam',
    name: '《迦南島》- 竹籃船體驗',
    name_en: 'Cam Thanh Coconut Village',
    category: '體驗活動',
    description: '《迦南島》水椰林密布，搭乘傳統竹籃船穿梭水道，船夫表演旋轉竹籃技巧。釣魚、捕蟹、品嚐椰子糖、編織水椰葉紀念品，體驗越南鄉村純樸生活。',
    tags: ['竹籃船', '體驗', '水鄉', '趣味'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 8,
    is_active: true
  },

  // ========== 芽莊擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《珍珠島樂園》- 越南迪士尼',
    name_en: 'Vinpearl Land',
    category: '體驗活動',
    description: '《珍珠島樂園》搭乘跨海纜車抵達，水上樂園、雲霄飛車、海洋館、4D電影一票玩到底。夜晚音樂噴泉秀絢麗奪目，是越南最大遊樂園，親子旅遊必訪。',
    tags: ['樂園', '纜車', '親子', '必遊'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 480,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《芽莊海灘》- 越南最美海岸線',
    name_en: 'Nha Trang Beach',
    category: '自然景觀',
    description: '長達6公里的《芽莊海灘》擁有細緻金沙、清澈海水，棕櫚樹椰林大道適合騎車兜風。沙灘椅、陽傘、水上活動、按摩服務齊全，《國家地理》評選最美海灘之一。',
    tags: ['海灘', '必遊', '水上活動', '度假'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 300,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《婆那加占婆塔》- 千年印度教遺跡',
    name_en: 'Po Nagar Cham Towers',
    category: '歷史文化',
    description: '建於8世紀的《婆那加占婆塔》供奉印度教女神，紅磚塔矗立山丘俯瞰芽莊港。占婆王國建築精湛，浮雕舞女婆娑、梵文石碑記載歷史，香火綿延千年不絕。',
    tags: ['古蹟', '占婆', '歷史', '俯瞰'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《泥漿浴》- 芽莊特色體驗',
    name_en: 'Mud Bath',
    category: '體驗活動',
    description: '《泥漿浴》是芽莊招牌體驗，富含礦物質泥漿滋潤皮膚、消除疲勞。I-Resort、Thap Ba溫泉中心設施完善，泡泥漿、溫泉、按摩、花瓣浴，一條龍SPA享受。',
    tags: ['溫泉', '泥漿浴', '放鬆', '必試'],
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'nha-trang',
    country_id: 'vietnam',
    name: '《芽莊四島跳島遊》- 海上冒險',
    name_en: 'Four Islands Tour',
    category: '體驗活動',
    description: '《四島跳島遊》搭船出海，浮潛看珊瑚、水族館餵魚、蠶島沙灘玩水、海上漂浮酒吧。船上唱歌跳舞、跳水比賽、越式海鮮午餐，歡樂氛圍嗨翻天，芽莊必玩行程。',
    tags: ['跳島', '浮潛', '派對', '必玩'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 420,
    display_order: 8,
    is_active: true
  },

  // ========== 下龍灣擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《下龍灣遊船》- 世界新七大奇景',
    name_en: 'Ha Long Bay Cruise',
    category: '自然景觀',
    description: '《下龍灣》1600座石灰岩島嶼矗立碧綠海面，聯合國教科文組織世界遺產。搭乘仿古帆船過夜，日出霧氣繚繞、日落金光灑落，鐘乳石洞、浮村、獨木舟探索秘境。',
    tags: ['遊船', '世界遺產', '必遊', '過夜'],
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85'],
    duration_minutes: 1440,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《天宮洞》- 下龍灣最美洞穴',
    name_en: 'Thien Cung Cave',
    category: '自然景觀',
    description: '《天宮洞》高25公尺、寬20公尺，五彩燈光照射下鐘乳石變化萬千。石筍、石柱形成龍鳳、仙女、宮殿造型，傳說是龍王舉辦婚禮之地，洞頂水滴清澈見底。',
    tags: ['鐘乳石洞', '燈光', '必訪', '奇景'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《驚訝洞》- 法國人命名的奇洞',
    name_en: 'Sung Sot Cave',
    category: '自然景觀',
    description: '《驚訝洞》分為三個區域，第一廳像歌劇院、第二廳如皇宮花園。法國探險家1901年發現時驚呼不已而得名，洞內氣勢磅礴，登高處俯瞰下龍灣全景壯麗。',
    tags: ['洞穴', '俯瞰', '壯觀', '歷史'],
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《英雄島》- 登頂看日出',
    name_en: 'Ti Top Island',
    category: '體驗活動',
    description: '《英雄島》以蘇聯太空人命名，爬414級階梯登頂觀景台，360度俯瞰下龍灣喀斯特地貌全景。沙灘游泳、獨木舟、日出時分雲霧繚繞如仙境，是遊船必停景點。',
    tags: ['登山', '沙灘', '日出', '全景'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'ha-long',
    country_id: 'vietnam',
    name: '《漁村水上人家》- 海上生活體驗',
    name_en: 'Floating Fishing Village',
    category: '體驗活動',
    description: '《漁村水上人家》世代生活在下龍灣，房屋、學校、商店全建在浮筒上。搭竹筏造訪漁民家庭、餵魚、釣魚、品嚐新鮮海產，體驗越南獨特海上游牧生活。',
    tags: ['漁村', '浮村', '體驗', '文化'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 8,
    is_active: true
  },

  // ========== 富國島擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《長灘》- 富國島最美夕陽',
    name_en: 'Long Beach',
    category: '自然景觀',
    description: '《長灘》綿延20公里，細白沙灘、清澈海水適合游泳浮潛。夕陽西下時橘紅天空倒映海面，海灘酒吧、海鮮燒烤、按摩服務齊全，是富國島最熱鬧海岸線。',
    tags: ['海灘', '夕陽', '必遊', '度假'],
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85'],
    duration_minutes: 300,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《珍珠遊樂園》- 富國島親子天堂',
    name_en: 'VinWonders Phu Quoc',
    category: '體驗活動',
    description: '《珍珠遊樂園》是越南最大主題樂園，雲霄飛車、水上樂園、海洋館、動物園、水舞秀一票到底。跨海纜車抵達，園區佔地廣大玩一整天不膩，親子旅遊首選。',
    tags: ['樂園', '親子', '纜車', '必玩'],
    images: ['https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&q=85'],
    duration_minutes: 540,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《星星沙灘》- 海星遍布奇景',
    name_en: 'Starfish Beach',
    category: '自然景觀',
    description: '《星星沙灘》淺灘佈滿橘紅色海星，數量驚人宛如星空降落海底。退潮時海水清澈見底，輕鬆拍到海星與自己合照，但切記不可帶走，保護自然生態。',
    tags: ['海灘', '海星', '拍照', '生態'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《跨海纜車》- 金氏世界紀錄',
    name_en: 'Sun World Cable Car',
    category: '體驗活動',
    description: '《跨海纜車》全長7899公尺，是全球最長跨海纜車獲金氏世界紀錄。從富國島飛越碧藍海域到香島，俯瞰漁船、珊瑚礁、小島星羅棋布，景色壯麗震撼。',
    tags: ['纜車', '世界紀錄', '必搭', '海景'],
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'phu-quoc',
    country_id: 'vietnam',
    name: '《富國夜市》- 海鮮美食天堂',
    name_en: 'Phu Quoc Night Market',
    category: '體驗活動',
    description: '《富國夜市》綿延數百公尺，龍蝦、螃蟹、鮑魚、扇貝現點現烤。魚露工廠試吃、珍珠飾品、越南咖啡、手工藝品攤位密集，價格比本土便宜，觀光客必逛。',
    tags: ['夜市', '海鮮', '購物', '美食'],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 8,
    is_active: true
  },

  // ========== 順化擴充 (3→8個) ==========
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《順化皇城》- 越南紫禁城',
    name_en: 'Imperial City of Hue',
    category: '歷史文化',
    description: '《順化皇城》仿北京紫禁城建造，阮朝13位皇帝居所。太和殿、午門、護城河、皇家圖書館保存完整，越戰砲火遺跡訴說滄桑歷史，聯合國世界文化遺產。',
    tags: ['皇城', '世界遺產', '必遊', '歷史'],
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=85'],
    duration_minutes: 240,
    display_order: 4,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《啟定皇陵》- 中西合璧陵墓',
    name_en: 'Khai Dinh Tomb',
    category: '歷史文化',
    description: '《啟定皇陵》融合法式、哥德、中式建築風格，陶瓷玻璃鑲嵌壁畫金碧輝煌。127級石階登頂，皇帝銅像端坐龍椅，精緻雕刻展現阮朝末期奢華美學。',
    tags: ['陵墓', '建築', '藝術', '獨特'],
    images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85'],
    duration_minutes: 150,
    display_order: 5,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《香江遊船》- 順化母親河',
    name_en: 'Perfume River Cruise',
    category: '體驗活動',
    description: '《香江》因上游開滿香花得名，搭龍船遊河欣賞兩岸風光。天姥寺七層塔、皇陵、村莊田園，船上享用順化宮廷料理、傳統音樂表演，悠閒愉快半日遊。',
    tags: ['遊船', '河流', '音樂', '悠閒'],
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=85'],
    duration_minutes: 180,
    display_order: 6,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《天姥寺》- 香江邊的古塔',
    name_en: 'Thien Mu Pagoda',
    category: '歷史文化',
    description: '建於1601年的《天姥寺》矗立香江畔，七層八角福緣塔高21公尺是順化象徵。古鐘、石碑、菩提樹寧靜莊嚴，1963年僧人自焚抗議的汽車仍保存寺內，見證越南歷史。',
    tags: ['寺廟', '古塔', '歷史', '江景'],
    images: ['https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&q=85'],
    duration_minutes: 90,
    display_order: 7,
    is_active: true
  },
  {
    id: randomUUID(),
    city_id: 'hue',
    country_id: 'vietnam',
    name: '《順化宮廷料理》- 皇帝的餐桌',
    name_en: 'Royal Cuisine Experience',
    category: '體驗活動',
    description: '《順化宮廷料理》源自阮朝御膳，講究色香味形意。蝦餅、越式粽子、班戟煎餅、宮廷湯品，擺盤精緻宛如藝術品，搭配傳統音樂表演，體驗越南最高級飲食文化。',
    tags: ['美食', '宮廷', '體驗', '文化'],
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=85'],
    duration_minutes: 120,
    display_order: 8,
    is_active: true
  }
];

async function main() {
  console.log('🚀 開始擴充越南其他城市景點（公司主力市場深化）...\n');
  console.log('目標：峴港、會安、芽莊、下龍灣、富國島、順化 各 8 個景點\n');

  let success = 0;
  let failed = 0;

  for (const attraction of attractions) {
    try {
      const { error } = await supabase
        .from('attractions')
        .insert(attraction);

      if (error) throw error;

      console.log(`✅ ${attraction.name} (${attraction.city_id})`);
      success++;
    } catch (error) {
      console.error(`❌ ${attraction.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 完成統計:`);
  console.log(`✅ 成功: ${success} 個`);
  console.log(`❌ 失敗: ${failed} 個`);
  console.log(`\n🎉 越南其他城市景點擴充完成！`);
  console.log(`📈 預計新增: 30 個景點`);
  console.log(`🇻🇳 越南總景點數將達: ~65 個`);
}

main().catch(console.error);
