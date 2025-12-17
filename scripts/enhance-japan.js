const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

// 日本景點深度資料
const japanData = {
  // 東京地區
  '上野動物園': { notes: '日本最古老動物園，大熊貓香香曾吸引無數遊客，園區內還有爬蟲館和不忍池畔自然散步道。', duration_minutes: 180, lat: 35.7164, lng: 139.7713, ticket: '成人 600日圓' },
  '明治神宮': { notes: '東京市中心的神聖綠洲，走過神宮橋、穿越 10 萬棵樹木形成的參道，感受都會中的寧靜。', duration_minutes: 90, lat: 35.6764, lng: 139.6993, ticket: '免費參觀' },
  '淺草寺': { notes: '東京最古老寺廟，雷門大燈籠是經典地標，仲見世通商店街可體驗傳統日式小吃與紀念品。', duration_minutes: 90, lat: 35.7148, lng: 139.7967, ticket: '免費參觀' },
  '東京晴空塔': { notes: '世界第二高塔，350 公尺天望甲板可俯瞰整個東京，晴天能遠眺富士山。', duration_minutes: 120, lat: 35.7101, lng: 139.8107, ticket: '展望台 2,100日圓起' },
  '澀谷': { notes: '年輕人文化聖地，十字路口是全球最繁忙行人穿越道，一次綠燈可有 3000 人同時通過。', duration_minutes: 120, lat: 35.6595, lng: 139.7004, ticket: '免費' },
  '原宿': { notes: '日本潮流發源地，竹下通匯集各種時尚小店，裏原宿則是潮人秘密基地。', duration_minutes: 120, lat: 35.6702, lng: 139.7027, ticket: '免費' },
  '銀座久兵衛': { notes: '米其林三星壽司殿堂，創業於 1935 年，是日本頂級江戶前壽司代表。', duration_minutes: 90, lat: 35.6717, lng: 139.7642, ticket: '約 30,000日圓/人' },
  '築地外市場美食街': { notes: '保留築地精神的場外市場，百餘間店舖供應新鮮海鮮丼、玉子燒等經典美食。', duration_minutes: 120, lat: 35.6654, lng: 139.7707, ticket: '免費入場' },
  'teamLab Borderless': { notes: '世界首座無界數位藝術美術館，光影互動裝置讓人沉浸於夢幻藝術空間。', duration_minutes: 180, lat: 35.6264, lng: 139.7836, ticket: '3,200日圓' },
  'teamLab Planets': { notes: '赤腳體驗的沉浸式數位藝術館，踏入水中感受光影與身體的互動。', duration_minutes: 120, lat: 35.6505, lng: 139.7890, ticket: '3,200日圓' },

  // 京都地區
  '清水寺': { notes: '懸空舞台是日本建築奇蹟，春櫻秋楓時節景色絕美，是京都必訪的世界遺產。', duration_minutes: 120, lat: 34.9949, lng: 135.7850, ticket: '400日圓' },
  '金閣寺': { notes: '金箔覆蓋的舍利殿倒映於鏡湖池中，是日本最具代表性的禪宗建築之一。', duration_minutes: 60, lat: 35.0394, lng: 135.7292, ticket: '500日圓' },
  '伏見稻荷大社': { notes: '千本鳥居綿延山間，朱紅色隧道長達 4 公里，是日本最神秘的參拜體驗。', duration_minutes: 150, lat: 34.9671, lng: 135.7727, ticket: '免費參觀' },
  '嵐山竹林': { notes: '高聳竹林形成夢幻綠色隧道，風吹竹葉沙沙聲被選為「日本音風景百選」。', duration_minutes: 60, lat: 35.0173, lng: 135.6712, ticket: '免費' },
  '祇園花見小路': { notes: '最能感受古都風情的花街，石板路兩側是傳統町家，偶遇藝妓令人驚喜。', duration_minutes: 60, lat: 34.9991, lng: 135.7754, ticket: '免費' },
  '龍安寺': { notes: '枯山水庭園的最高傑作，15 顆石頭的配置據說無論從哪個角度都無法一次看全。', duration_minutes: 60, lat: 35.0345, lng: 135.7182, ticket: '600日圓' },
  '銀閣寺': { notes: '與金閣寺齊名卻風格迥異，展現日本侘寂美學的極致，銀沙灘庭園令人沉思。', duration_minutes: 60, lat: 35.0270, lng: 135.7982, ticket: '500日圓' },
  '天龍寺': { notes: '嵐山最重要的禪寺，曹源池庭園以嵐山為借景，是日本庭園藝術的典範。', duration_minutes: 60, lat: 35.0155, lng: 135.6742, ticket: '500日圓' },

  // 大阪地區
  '大阪城': { notes: '豐臣秀吉築城之作，天守閣金碧輝煌，護城河畔是賞櫻名所。', duration_minutes: 120, lat: 34.6873, lng: 135.5262, ticket: '600日圓' },
  '道頓堀': { notes: '大阪美食一條街，巨型招牌林立，格力高跑步人和蟹道樂螃蟹是必拍景點。', duration_minutes: 120, lat: 34.6687, lng: 135.5012, ticket: '免費' },
  '心齋橋': { notes: '大阪最熱鬧的購物區，600 公尺拱廊商店街從高級品牌到平價美妝應有盡有。', duration_minutes: 180, lat: 34.6715, lng: 135.5007, ticket: '免費' },
  '通天閣': { notes: '新世界的復古地標，展望台上的幸運神比利肯可帶來好運，周邊串炸店林立。', duration_minutes: 60, lat: 34.6525, lng: 135.5063, ticket: '900日圓' },
  '黑門市場': { notes: '大阪的廚房，170 餘間店舖販售新鮮海產與和牛，現買現吃最過癮。', duration_minutes: 120, lat: 34.6634, lng: 135.5069, ticket: '免費入場' },
  '日本環球影城': { notes: '擁有獨家哈利波特魔法世界和超級任天堂世界，刺激遊樂設施讓人尖叫連連。', duration_minutes: 480, lat: 34.6654, lng: 135.4323, ticket: '8,600日圓起' },
  '海遊館': { notes: '世界最大級水族館之一，中央巨型水槽飼養鯨鯊，環狀參觀動線彷彿海底散步。', duration_minutes: 180, lat: 34.6545, lng: 135.4284, ticket: '2,700日圓' },

  // 奈良地區
  '奈良公園': { notes: '超過 1000 頭野生鹿自由漫步，購買鹿仙貝餵食是最療癒的體驗。', duration_minutes: 120, lat: 34.6851, lng: 135.8430, ticket: '免費（鹿仙貝 200日圓）' },
  '東大寺': { notes: '世界最大木造建築，盧舍那大佛高達 15 公尺，穿過大佛鼻孔柱洞據說能帶來好運。', duration_minutes: 90, lat: 34.6890, lng: 135.8398, ticket: '600日圓' },
  '春日大社': { notes: '世界遺產神社，參道兩側近 3000 座石燈籠與青苔形成神秘氛圍。', duration_minutes: 60, lat: 34.6817, lng: 135.8499, ticket: '本殿參拜 500日圓' },

  // 北海道地區
  '小樽運河': { notes: '浪漫復古水道，石造倉庫群改建成餐廳與商店，黃昏點燈後更顯夢幻。', duration_minutes: 90, lat: 43.1978, lng: 140.9944, ticket: '免費' },
  '富田農場': { notes: '北海道最著名薰衣草花田，7 月紫色花海與彩虹花田織成壯觀畫面。', duration_minutes: 90, lat: 43.4203, lng: 142.3822, ticket: '免費' },
  '函館山夜景': { notes: '與香港、那不勒斯並稱世界三大夜景，從山頂俯瞰扇形海岸線燈火璀璨。', duration_minutes: 90, lat: 41.7575, lng: 140.7057, ticket: '纜車來回 1,500日圓' },
  '登別溫泉': { notes: '北海道首屈一指的溫泉鄉，地獄谷硫磺噴氣奇景令人震撼，11 種泉質各具療效。', duration_minutes: 180, lat: 42.4583, lng: 141.1461, ticket: '溫泉旅館另計' },
  '白色戀人公園': { notes: '北海道名產「白色戀人」主題樂園，可參觀餅乾產線並手作專屬巧克力。', duration_minutes: 120, lat: 43.0815, lng: 141.2674, ticket: '800日圓' },
  '狸小路商店街': { notes: '札幌最熱鬧的拱廊商店街，200 多間店舖從藥妝到美食一應俱全。', duration_minutes: 120, lat: 43.0572, lng: 141.3503, ticket: '免費' },
  '大通公園': { notes: '札幌的綠色心臟，冬季雪祭、夏季啤酒節都在此舉行，四季皆有慶典。', duration_minutes: 60, lat: 43.0604, lng: 141.3545, ticket: '免費' },
  '藻岩山纜車': { notes: '札幌夜景勝地，山頂「幸福之鐘」是情侶必訪聖地。', duration_minutes: 90, lat: 43.0224, lng: 141.3227, ticket: '纜車來回 2,100日圓' },
  '青池': { notes: '神秘的鈷藍色湖水因含鋁而呈現夢幻色澤，Apple 曾選為桌布而聲名大噪。', duration_minutes: 60, lat: 43.4949, lng: 142.6047, ticket: '免費' },
  '四季彩之丘': { notes: '美瑛丘陵上的花田，彩虹般的花海與起伏地形構成絕美風景明信片。', duration_minutes: 60, lat: 43.5323, lng: 142.4509, ticket: '免費（旺季停車費 500日圓）' },

  // 沖繩地區
  '沖繩美麗海水族館': { notes: '擁有世界最大壓克力觀景窗，鯨鯊與鬼蝠魟悠游其中，黑潮之海令人讚嘆。', duration_minutes: 180, lat: 26.6947, lng: 127.8778, ticket: '2,180日圓' },
  '首里城': { notes: '琉球王國的象徵，2019 年火災後正在重建，展現琉球獨特的赤紅建築之美。', duration_minutes: 90, lat: 26.2170, lng: 127.7195, ticket: '400日圓' },
  '國際通': { notes: '那霸最熱鬧的購物街，1.6 公里長的「奇蹟一哩」匯集土產店與居酒屋。', duration_minutes: 120, lat: 26.2159, lng: 127.6902, ticket: '免費' },
  '古宇利大橋': { notes: '沖繩最美的跨海大橋，全長近 2 公里，兩側碧藍海水美得令人屏息。', duration_minutes: 60, lat: 26.6901, lng: 128.0261, ticket: '免費' },
  '萬座毛': { notes: '斷崖絕壁上的大象鼻岩是沖繩代表景觀，夕陽西下時最為壯觀。', duration_minutes: 30, lat: 26.5047, lng: 127.8526, ticket: '100日圓' },
  '川平灣': { notes: '石垣島最美海灣，米其林三星景點，乘坐玻璃船欣賞珊瑚礁與熱帶魚。', duration_minutes: 90, lat: 24.4585, lng: 124.1452, ticket: '玻璃船 1,000日圓' },
  '竹富島': { notes: '保留傳統琉球村落風貌，乘水牛車穿梭珊瑚石牆小徑，時光彷彿靜止。', duration_minutes: 180, lat: 24.3267, lng: 124.0848, ticket: '渡輪來回約 1,500日圓' },

  // 廣島地區
  '嚴島神社': { notes: '海上大鳥居是日本三景之一，漲潮時神社宛如漂浮海上，退潮可走近觸摸。', duration_minutes: 120, lat: 34.2961, lng: 132.3198, ticket: '300日圓' },
  '原爆圓頂館': { notes: '廣島和平的象徵，這座建築奇蹟般存留，提醒世人戰爭的殘酷與和平的可貴。', duration_minutes: 60, lat: 34.3955, lng: 132.4536, ticket: '免費' },

  // 金澤地區
  '兼六園': { notes: '日本三名園之首，冬季雪吊是經典景觀，霞之池映照四季不同風情。', duration_minutes: 90, lat: 36.5624, lng: 136.6627, ticket: '320日圓' },
  '東茶屋街': { notes: '江戶時代花街風情完整保留，木格子窗町家改建成咖啡館與金箔店。', duration_minutes: 60, lat: 36.5717, lng: 136.6673, ticket: '免費' },
  '金澤21世紀美術館': { notes: '圓形玻璃建築本身就是藝術品，萊安德羅游泳池是必拍互動裝置。', duration_minutes: 90, lat: 36.5609, lng: 136.6574, ticket: '展覽區 450日圓' },

  // 福岡地區
  '太宰府天滿宮': { notes: '學問之神菅原道真的總本社，參道梅枝餅飄香，考季時擠滿祈願學子。', duration_minutes: 90, lat: 33.5190, lng: 130.5348, ticket: '免費' },
  '中洲屋台': { notes: '日本最大屋台街，河畔一字排開的小攤販售博多拉麵與內臟鍋，夜生活必體驗。', duration_minutes: 120, lat: 33.5914, lng: 130.4053, ticket: '免費入場' },
  '櫛田神社': { notes: '博多總鎮守，山笠祭發源地，境內保存著高達 10 公尺的巨型山笠。', duration_minutes: 45, lat: 33.5911, lng: 130.4111, ticket: '免費' },
  '博多運河城': { notes: '九州最大複合商業設施，運河貫穿其中，定時水舞秀精彩絕倫。', duration_minutes: 180, lat: 33.5895, lng: 130.4114, ticket: '免費' },

  // 長崎地區
  '稻佐山夜景': { notes: '與摩納哥、香港並稱世界新三大夜景，千萬美元的璀璨港灣盡收眼底。', duration_minutes: 90, lat: 32.7536, lng: 129.8563, ticket: '纜車來回 1,250日圓' },
  '哥拉巴園': { notes: '日本最古老木造洋館群，見證長崎作為國際港口的繁華歷史。', duration_minutes: 90, lat: 32.7316, lng: 129.8633, ticket: '620日圓' },
  '眼鏡橋': { notes: '日本最古老石拱橋，橋與水中倒影合成眼鏡形狀，河畔找愛心石是約會樂趣。', duration_minutes: 30, lat: 32.7502, lng: 129.8825, ticket: '免費' },
  '軍艦島': { notes: '世界遺產廢墟之島，曾是世界人口密度最高的地方，如今是攝影愛好者聖地。', duration_minutes: 180, lat: 32.6282, lng: 129.7383, ticket: '上陸費 310日圓＋船費約 3,000日圓' },

  // 熊本地區
  '熊本城': { notes: '日本三大名城之一，獨特的武者返石垣令敵人望而生畏，2016 年震後持續修復中。', duration_minutes: 90, lat: 32.8062, lng: 130.7058, ticket: '800日圓' },
  '阿蘇火山': { notes: '世界最大級破火山口，中岳火口冒著硫磺煙霧，草千里的壯闊草原讓人心曠神怡。', duration_minutes: 180, lat: 32.8842, lng: 131.1040, ticket: '火口見學 500日圓' },
  '黑川溫泉': { notes: '日本最受歡迎的秘境溫泉鄉，購買入湯手形可體驗三處風情各異的露天風呂。', duration_minutes: 180, lat: 33.0970, lng: 131.2114, ticket: '入湯手形 1,300日圓' },

  // 鹿兒島地區
  '櫻島': { notes: '世界少數還在活動的火山，與鹿兒島市隔海相望，渡輪上可近距離感受火山魄力。', duration_minutes: 180, lat: 31.5859, lng: 130.6570, ticket: '渡輪 200日圓' },
  '仙巖園': { notes: '島津家大名庭園，以櫻島為借景的「借景庭園」典範，園內尚古集成館展示薩摩歷史。', duration_minutes: 120, lat: 31.6170, lng: 130.5756, ticket: '1,000日圓' },

  // 高山地區
  '高山古街': { notes: '飛驒小京都的江戶風情老街，木造町家林立，清晨朝市是體驗在地生活的好機會。', duration_minutes: 120, lat: 36.1408, lng: 137.2550, ticket: '免費' },
  '白川鄉合掌村': { notes: '世界遺產童話村，茅草合掌造建築冬季點燈時宛如薑餅屋，一年一度的夢幻景象。', duration_minutes: 180, lat: 36.2579, lng: 136.9066, ticket: '展望台 400日圓' },

  // 日光地區
  '東照宮': { notes: '德川家康長眠之地，金碧輝煌的陽明門與「非禮勿視」三猿雕刻是必看重點。', duration_minutes: 120, lat: 36.7580, lng: 139.5986, ticket: '1,300日圓' },
  '華嚴瀑布': { notes: '日本三大名瀑之一，從 97 公尺高處傾瀉而下，搭乘電梯到瀑布正下方感受震撼。', duration_minutes: 60, lat: 36.7388, lng: 139.4993, ticket: '觀瀑台 570日圓' },

  // 箱根地區
  '大涌谷': { notes: '箱根最具代表的火山景觀，硫磺蒸氣瀰漫，黑玉子據說每吃一顆延壽七年。', duration_minutes: 60, lat: 35.2437, lng: 139.0217, ticket: '免費（纜車另計）' },
  '箱根海盜船': { notes: '蘆之湖上的觀光遊船，湖光山色中遠眺富士山，仿古海盜船造型吸睛。', duration_minutes: 60, lat: 35.2025, lng: 139.0234, ticket: '單程 1,200日圓' },

  // 鎌倉地區
  '鎌倉大佛': { notes: '高達 13 公尺的青銅阿彌陀佛，歷經 800 年風霜，可入內參觀佛像內部。', duration_minutes: 45, lat: 35.3168, lng: 139.5359, ticket: '300日圓' },
  '鶴岡八幡宮': { notes: '鎌倉最重要的神社，源賴朝創建鎌倉幕府時的守護神社，參道櫻花隧道絕美。', duration_minutes: 60, lat: 35.3257, lng: 139.5565, ticket: '免費' },

  // 名古屋地區
  '名古屋城': { notes: '德川御三家筆頭的居城，天守閣上金鯱閃閃發光，本丸御殿復原工程極盡豪華。', duration_minutes: 120, lat: 35.1856, lng: 136.8994, ticket: '500日圓' },
  '熱田神宮': { notes: '供奉三神器之一草薙劍，創建已有 1900 年歷史，是名古屋最神聖的聖地。', duration_minutes: 60, lat: 35.1278, lng: 136.9088, ticket: '免費' },

  // 高級餐廳
  'Narisawa': { notes: '東京米其林三星名店，主廚成澤由浩以「里山料理」概念詮釋日本風土。', duration_minutes: 180, lat: 35.6692, lng: 139.7259, ticket: '午餐約 25,000日圓起' },
  'Quintessence': { notes: '東京米其林三星法餐，岸田周三主廚的料理精準細膩，展現法式料理的極致。', duration_minutes: 180, lat: 35.6581, lng: 139.6992, ticket: '午餐約 20,000日圓起' },
  '菊乃井 本店': { notes: '京都懷石料理的最高殿堂，村田吉弘傳承三代的精緻料理藝術。', duration_minutes: 180, lat: 35.0028, lng: 135.7828, ticket: '午餐約 25,000日圓起' },
  '瓢亭': { notes: '創業 400 年的京都老舖，瓢亭玉子是傳奇朝粥的靈魂，被譽為早餐界的米其林。', duration_minutes: 120, lat: 35.0112, lng: 135.7847, ticket: '朝粥約 6,500日圓' },
};

async function enhance() {
  console.log('開始優化日本景點資料...');

  let updated = 0;
  let notFound = 0;

  for (const [name, data] of Object.entries(japanData)) {
    // 先移除《》括號再查詢
    const cleanName = name.replace(/[《》]/g, '');

    const { data: existing, error: findErr } = await supabase
      .from('attractions')
      .select('id, name')
      .eq('country_id', 'japan')
      .or(`name.eq.${name},name.eq.${cleanName},name.ilike.%${cleanName}%`)
      .limit(1);

    if (findErr) {
      console.log('查詢錯誤:', name, findErr.message);
      continue;
    }

    if (!existing || existing.length === 0) {
      // console.log('找不到:', name);
      notFound++;
      continue;
    }

    const updateData = {
      notes: data.notes,
      duration_minutes: data.duration_minutes,
    };

    // 只有有座標時才更新
    if (data.lat && data.lng) {
      updateData.latitude = data.lat;
      updateData.longitude = data.lng;
    }

    // 只有有門票資訊時才更新
    if (data.ticket) {
      updateData.ticket_price = data.ticket;
    }

    const { error: updateErr } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('id', existing[0].id);

    if (updateErr) {
      console.log('更新錯誤:', name, updateErr.message);
    } else {
      updated++;
      console.log('✅', existing[0].name);
    }
  }

  console.log(`\n完成！更新 ${updated} 筆，找不到 ${notFound} 筆`);
}

enhance();
