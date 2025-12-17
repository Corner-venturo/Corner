// 土耳其景點優化腳本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

const turkeyAttractions = [
  // 伊斯坦堡
  {
    name: '聖索菲亞大教堂',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '19:00' },
    tags: ['世界遺產', '清真寺', '拜占庭', '歷史', '必去'],
    notes: '1500年歷史的建築奇蹟，先後作為教堂、清真寺，現為博物館後又改回清真寺。巨大圓頂和馬賽克壁畫令人驚嘆。是伊斯坦堡最重要的地標。2020年改回清真寺後免費入場。\n\n旅遊提示：作為清真寺需脫鞋入內，女性需戴頭巾'
  },
  {
    name: '藍色清真寺',
    duration_minutes: 60,
    opening_hours: { open: '08:30', close: '18:30', note: '祈禱時間不開放' },
    tags: ['清真寺', '藍色瓷磚', '六座宣禮塔', '地標', '伊斯坦堡'],
    notes: '因內部2萬多片藍色伊茲尼克瓷磚得名，是土耳其最著名的清真寺。有六座宣禮塔（全世界僅此一座）。建於1616年，與聖索菲亞大教堂隔廣場相望。免費入場。\n\n旅遊提示：祈禱時間（約30分鐘）不開放觀光客'
  },
  {
    name: '托普卡匹皇宮',
    duration_minutes: 180,
    opening_hours: { open: '09:00', close: '18:00', note: '週二休館' },
    tags: ['皇宮', '鄂圖曼', '後宮', '珍寶', '世界遺產'],
    notes: '鄂圖曼帝國蘇丹的皇宮，居住了400年。有後宮、珍寶館、先知遺物等展區。可俯瞰博斯普魯斯海峽。後宮需另購票。是了解鄂圖曼帝國輝煌的最佳去處。\n\n旅遊提示：建議留2-3小時，後宮和珍寶館必看'
  },
  {
    name: '地下水宮殿',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '18:30' },
    tags: ['地下', '拜占庭', '水池', '梅杜莎', '神秘'],
    notes: '拜占庭時期建造的地下蓄水池，有336根石柱支撐。兩根倒置的梅杜莎頭像最神秘。燈光配古典音樂營造出魔幻氛圍。是伊斯坦堡最獨特的景點之一。\n\n旅遊提示：可租語音導覽了解歷史'
  },
  {
    name: '大巴扎',
    duration_minutes: 120,
    opening_hours: { open: '08:30', close: '19:00', note: '週日休息' },
    tags: ['市集', '購物', '殺價', '傳統', '伊斯坦堡'],
    notes: '世界最大最古老的室內市集之一，有4000多家店舖。可買到地毯、珠寶、皮件、香料、燈飾等。殺價是必須的文化。容易迷路但很有趣。\n\n旅遊提示：開價通常是底價的2-3倍，大膽殺價'
  },
  {
    name: '香料市場',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '19:30' },
    tags: ['市集', '香料', '土耳其軟糖', '購物', '伊斯坦堡'],
    notes: '又稱埃及市集，專賣香料、茶葉、土耳其軟糖、乾果等。比大巴扎小巧但更集中。是買土耳其伴手禮的好地方。周邊有許多在地餐廳。\n\n旅遊提示：土耳其軟糖和藏紅花是最受歡迎的伴手禮'
  },
  {
    name: '博斯普魯斯海峽遊船',
    duration_minutes: 120,
    opening_hours: { open: '10:00', close: '18:00' },
    tags: ['遊船', '海峽', '跨洲', '風景', '必做'],
    notes: '搭船遊覽分隔歐亞兩洲的海峽，是伊斯坦堡必做體驗。沿途可看到宮殿、清真寺、城堡、豪宅。有短程（1.5小時）和長程（6小時）選擇。\n\n旅遊提示：短程遊船最熱門，可在艾米諾努碼頭搭乘'
  },
  {
    name: '博斯普魯斯海峽晚宴',
    duration_minutes: 180,
    opening_hours: { open: '19:00', close: '23:00' },
    tags: ['晚宴', '遊船', '夜景', '表演', '浪漫'],
    notes: '搭船遊覽海峽同時享用晚餐和表演。可欣賞伊斯坦堡壯觀夜景，船上有肚皮舞和土耳其音樂表演。是非常浪漫的體驗。\n\n旅遊提示：建議預訂含表演和無限暢飲的套裝'
  },
  {
    name: '加拉達塔',
    duration_minutes: 45,
    opening_hours: { open: '09:00', close: '22:00' },
    tags: ['地標', '觀景台', '360度', '夜景', '伊斯坦堡'],
    notes: '14世紀熱那亞人建造的石塔，高67公尺。觀景台可360度俯瞰伊斯坦堡老城和金角灣。傍晚和夜晚景色最美。是新城區的地標。\n\n旅遊提示：日落時分上塔可同時看日景和夜景'
  },
  {
    name: '多爾瑪巴赫切宮',
    duration_minutes: 120,
    opening_hours: { open: '09:00', close: '16:00', note: '週一休館' },
    tags: ['皇宮', '歐式', '豪華', '水晶', '博斯普魯斯'],
    notes: '19世紀鄂圖曼帝國的歐式宮殿，是世界最奢華的宮殿之一。有4.5噸重的水晶吊燈。面對博斯普魯斯海峽。凱末爾在此去世。\n\n旅遊提示：只能跟團參觀，有英文導覽團'
  },
  {
    name: '蘇萊曼清真寺',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '18:00', note: '祈禱時間不開放' },
    tags: ['清真寺', '鄂圖曼', '建築師錫南', '免費', '伊斯坦堡'],
    notes: '鄂圖曼帝國最偉大建築師錫南的傑作，為蘇萊曼大帝所建。比藍色清真寺更宏偉但遊客較少。可俯瞰金角灣。內部簡潔優雅。\n\n旅遊提示：建議與藍色清真寺比較兩種不同風格'
  },
  {
    name: '塔克西姆廣場',
    duration_minutes: 30,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['廣場', '地標', '新城區', '紀念碑', '交通樞紐'],
    notes: '伊斯坦堡新城區的中心廣場，有共和國紀念碑。是獨立大街的起點。經常舉辦活動和慶典。是新城區的交通樞紐和集合地點。\n\n旅遊提示：可以從這裡開始逛獨立大街'
  },
  {
    name: '獨立大街',
    duration_minutes: 90,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['步行街', '購物', '餐廳', '百年電車', '熱鬧'],
    notes: '伊斯坦堡最熱鬧的步行街，1.4公里長。有商店、餐廳、咖啡廳、百年歷史的紅色電車。周邊有許多酒吧和夜店。每天有超過300萬人流。\n\n旅遊提示：跟百年紅色電車合照是經典畫面'
  },
  {
    name: '卡德柯伊',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['亞洲區', '文青', '美食', '市集', '在地'],
    notes: '伊斯坦堡亞洲區的文青聚集地，有咖啡廳、古著店、唱片行。著名的鯖魚三明治和甜點店。可體驗與歐洲區不同的氛圍。渡輪可達。\n\n旅遊提示：搭渡輪從歐洲到亞洲很有趣'
  },
  {
    name: '皮埃爾洛蒂山',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '23:00' },
    tags: ['觀景', '咖啡廳', '金角灣', '纜車', '日落'],
    notes: '以法國作家命名的山丘咖啡廳區，可俯瞰金角灣。搭纜車上山輕鬆。傍晚看日落配土耳其茶非常愜意。是觀賞金角灣的最佳地點。\n\n旅遊提示：傍晚來喝茶看日落最棒'
  },
  {
    name: '土耳其浴體驗',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '22:00' },
    tags: ['浴場', '體驗', '傳統', 'Hamam', '放鬆'],
    notes: 'Hamam是土耳其傳統浴場，體驗蒸氣浴、搓澡、泡沫按摩。有數百年歷史的浴場可體驗。是土耳其文化的重要部分。Çemberlitaş浴場最有名。\n\n旅遊提示：男女分開，需自備內褲'
  },
  {
    name: '旋轉舞表演',
    duration_minutes: 60,
    opening_hours: { open: '19:00', close: '20:00' },
    tags: ['表演', '蘇菲派', '神秘', '文化', '宗教'],
    notes: '蘇菲派神秘主義的宗教儀式，舞者以旋轉進入冥想狀態。白色長袍旋轉如陀螺非常優美。伊斯坦堡有多處表演地點。是獨特的文化體驗。\n\n旅遊提示：這是宗教儀式，需保持安靜尊重'
  },
  {
    name: '伊斯坦堡美食之旅',
    duration_minutes: 240,
    opening_hours: { open: '10:00', close: '14:00' },
    tags: ['美食', '導覽', '在地', '體驗', '小吃'],
    notes: '跟著當地導遊探索伊斯坦堡美食。品嚐烤肉串、土耳其披薩、軟糖、茶等。了解土耳其飲食文化。有各種主題的美食導覽團可選。\n\n旅遊提示：空腹參加，會吃很多東西'
  },
  {
    name: '土耳其料理課',
    duration_minutes: 300,
    opening_hours: { open: '10:00', close: '15:00' },
    tags: ['烹飪', '體驗', '文化', '美食', '學習'],
    notes: '學做道地土耳其料理的體驗課程。通常包含市場採購、學做4-5道菜。可學做烤肉串、土耳其餃子、土耳其軟糖等。是深度文化體驗。\n\n旅遊提示：Cooking Alaturka是著名的料理學校'
  },
  // 卡帕多奇亞
  {
    name: '熱氣球之旅',
    duration_minutes: 180,
    opening_hours: { open: '05:00', close: '08:00' },
    tags: ['熱氣球', '日出', '必做', '夢幻', '卡帕多奇亞'],
    notes: '卡帕多奇亞最著名的體驗，日出時乘坐熱氣球俯瞰奇岩怪石。數十個彩色熱氣球同時升空的畫面夢幻。是許多人此生必做的體驗。約1小時飛行時間。\n\n旅遊提示：建議預訂兩天以應對天氣取消，約150-200歐元'
  },
  {
    name: '格雷梅露天博物館',
    duration_minutes: 120,
    opening_hours: { open: '08:00', close: '19:00' },
    tags: ['世界遺產', '洞穴教堂', '濕壁畫', '基督教', '卡帕多奇亞'],
    notes: '世界遺產，有30多座岩石教堂，保存千年的拜占庭濕壁畫。黑暗教堂（需另付費）壁畫保存最完整。是了解早期基督教歷史的重要遺址。\n\n旅遊提示：黑暗教堂額外收費但非常值得'
  },
  {
    name: '德林庫尤地下城',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '19:00' },
    tags: ['地下城', '歷史', '躲避', '迷宮', '卡帕多奇亞'],
    notes: '世界最大最深的地下城市之一，深達85公尺，有8層。古代基督徒為躲避迫害而建，可容納2萬人居住。有教堂、廚房、酒窖、通風井。\n\n旅遊提示：有些通道很窄，有幽閉恐懼症者注意'
  },
  {
    name: '凱馬克利地下城',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '19:00' },
    tags: ['地下城', '最大', '歷史', '基督徒', '卡帕多奇亞'],
    notes: '卡帕多奇亞最寬敞的地下城，規模比德林庫尤大。有完整的生活設施，包括教堂、學校、馬廄。地下通道可連接德林庫尤。\n\n旅遊提示：可選一個地下城參觀即可'
  },
  {
    name: '烏奇沙城堡',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '20:00' },
    tags: ['城堡', '岩石', '觀景', '日落', '卡帕多奇亞'],
    notes: '60公尺高的巨大岩石城堡，是古代的避難所和瞭望台。可攀登到頂端俯瞰卡帕多奇亞全景。日落時分景色最美。是經典明信片場景。\n\n旅遊提示：日落時分來看風景最美'
  },
  {
    name: '洞穴飯店',
    duration_minutes: 720,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['住宿', '洞穴', '獨特', '體驗', '卡帕多奇亞'],
    notes: '住在真正的岩石洞穴中是卡帕多奇亞的獨特體驗。有從平價到奢華各種選擇。許多飯店有露台可看熱氣球。是非常特別的住宿經驗。\n\n旅遊提示：Museum Hotel和Argos最高級，需提前預訂'
  },
  {
    name: '玫瑰谷',
    duration_minutes: 120,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['健行', '日落', '奇岩', '粉紅色', '卡帕多奇亞'],
    notes: '以玫瑰色岩石命名的山谷，有多條健行步道。日落時岩石呈現夢幻粉紅色。有古老的岩石教堂可探索。是卡帕多奇亞最美的山谷之一。\n\n旅遊提示：日落前1小時出發剛好看夕陽'
  },
  {
    name: '愛情谷',
    duration_minutes: 60,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['奇岩', '蘑菇岩', '拍照', '健行', '卡帕多奇亞'],
    notes: '以獨特的蘑菇狀和柱狀岩石聞名，形狀獨特有趣。是卡帕多奇亞最常入鏡的景點。有短距離步道可走到岩石間。非常適合拍照。\n\n旅遊提示：早上光線最好，可與鴿子谷一起參觀'
  },
  {
    name: '鴿子谷',
    duration_minutes: 45,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['岩石', '鴿子洞', '拍照', '惡魔之眼', '卡帕多奇亞'],
    notes: '因岩壁上眾多鴿子洞得名，古人以鴿糞作肥料。有觀景台可俯瞰山谷和遠方的烏奇沙城堡。掛滿惡魔之眼的樹是著名拍照點。\n\n旅遊提示：可買惡魔之眼紀念品當伴手禮'
  },
  {
    name: '帕夏巴',
    duration_minutes: 45,
    opening_hours: { open: '00:00', close: '24:00' },
    tags: ['奇岩', '仙人煙囪', '蘑菇岩', '地標', '卡帕多奇亞'],
    notes: '又稱僧侶谷，有最典型的「仙人煙囪」岩石。多頭蘑菇形狀的岩石非常壯觀。是卡帕多奇亞的代表性景觀。免費參觀。\n\n旅遊提示：清晨和傍晚光線最適合拍照'
  },
  {
    name: '阿瓦諾斯',
    duration_minutes: 90,
    opening_hours: { open: '09:00', close: '18:00' },
    tags: ['陶藝', '小鎮', '河流', '手工藝', '卡帕多奇亞'],
    notes: '以紅陶藝術聞名的小鎮，有2000年製陶傳統。可參觀工作坊看師傅製陶。紅土來自流經鎮上的紅河。可購買陶器當紀念品。\n\n旅遊提示：可以體驗自己做陶器'
  },
  {
    name: '陶藝工作坊',
    duration_minutes: 60,
    opening_hours: { open: '09:00', close: '17:00' },
    tags: ['體驗', '陶藝', 'DIY', '手作', '卡帕多奇亞'],
    notes: '在阿瓦諾斯體驗傳統土耳其陶藝。師傅示範後可親自嘗試拉坯。做好的作品可帶回家。是很有趣的動手體驗。\n\n旅遊提示：約30-60分鐘，適合所有年齡'
  },
  {
    name: '洞穴酒莊品酒',
    duration_minutes: 90,
    opening_hours: { open: '10:00', close: '18:00' },
    tags: ['品酒', '洞穴', '葡萄酒', '體驗', '卡帕多奇亞'],
    notes: '卡帕多奇亞是土耳其主要葡萄酒產區，有數千年釀酒歷史。可在洞穴酒窖品嚐當地葡萄酒。Turasan和Kocabag是著名酒莊。\n\n旅遊提示：土耳其紅酒品質不錯且價格實惠'
  },
  {
    name: '土耳其之夜',
    duration_minutes: 180,
    opening_hours: { open: '19:00', close: '23:00' },
    tags: ['表演', '晚宴', '民俗舞蹈', '肚皮舞', '卡帕多奇亞'],
    notes: '在洞穴餐廳享用晚餐觀賞表演。有民俗舞蹈、肚皮舞、旋轉舞等。通常含無限暢飲。是體驗土耳其文化的有趣夜晚。\n\n旅遊提示：有些會邀請觀眾上台一起跳舞'
  },
  // 棉堡
  {
    name: '棉堡石灰華梯田',
    duration_minutes: 180,
    opening_hours: { open: '06:30', close: '21:00' },
    tags: ['世界遺產', '石灰華', '溫泉', '白色梯田', '必去'],
    notes: '世界自然遺產，白色石灰華層層疊疊如棉花城堡。可赤腳走在溫泉水流過的梯田上。水溫約35度，礦物質豐富。是土耳其最獨特的自然景觀。\n\n旅遊提示：必須赤腳進入，石頭較滑要小心'
  },
  {
    name: '克麗奧帕特拉溫泉池',
    duration_minutes: 60,
    opening_hours: { open: '08:00', close: '19:00' },
    tags: ['溫泉', '游泳', '古羅馬', '遺跡', '棉堡'],
    notes: '傳說埃及豔后曾在此沐浴的古老溫泉池。水中有沉沒的古羅馬石柱遺跡。水溫約36度，富含礦物質。可帶泳衣下水游泳。需另購票。\n\n旅遊提示：帶泳衣，可以體驗在古蹟中游泳的感覺'
  },
  {
    name: '希拉波利斯古城',
    duration_minutes: 90,
    opening_hours: { open: '08:00', close: '20:00' },
    tags: ['古城', '羅馬遺跡', '劇場', '墓地', '世界遺產'],
    notes: '棉堡旁的古羅馬城市遺跡，與棉堡共同列為世界遺產。有保存完好的劇場、浴場、城門和大型墓地。可了解古羅馬人如何利用這裡的溫泉。\n\n旅遊提示：棉堡門票含希拉波利斯，建議都參觀'
  }
];

// 更新函數
async function updateAttractions() {
  console.log('========================================');
  console.log('土耳其景點優化工具');
  console.log('========================================');
  console.log('\n🔄 正在更新土耳其景點深度資料...');

  let successCount = 0;

  for (const attraction of turkeyAttractions) {
    const updateData = {
      duration_minutes: attraction.duration_minutes,
      opening_hours: attraction.opening_hours,
      tags: attraction.tags,
      notes: attraction.notes
    };

    const { error } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('country_id', 'turkey')
      .ilike('name', attraction.name);

    if (error) {
      console.log(`  ❌ ${attraction.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${attraction.name}`);
      successCount++;
    }
  }

  console.log(`\n📊 更新統計: ${successCount} 筆`);
  console.log('\n✅ 土耳其優化完成！');
}

updateAttractions();
