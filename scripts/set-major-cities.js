const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

// 各國主要城市對照表（根據旅遊業務常用城市）
const majorCities = {
  // 日本 - 各區域主要城市
  japan: [
    '札幌', '函館', // 北海道
    '仙台', '青森', // 東北
    '東京', '橫濱', '日光', '箱根', '河口湖', // 關東
    '名古屋', '金澤', '高山', '白川鄉', '富山', '松本', // 中部
    '大阪', '京都', '奈良', '神戶', '姬路', // 關西
    '廣島', '岡山', '倉敷', // 中國
    '高松', '松山', // 四國
    '福岡', '長崎', '熊本', '鹿兒島', '別府', '由布院', // 九州
    '那霸', '石垣島', '宮古島', // 沖繩
  ],

  // 韓國
  korea: ['首爾', '釜山', '濟州', '大邱', '慶州', '仁川'],

  // 泰國
  thailand: ['曼谷', '清邁', '普吉島', '芭達雅', '蘇美島', '喀比'],

  // 越南
  vietnam: ['胡志明市', '河內', '峴港', '會安', '下龍灣', '芽莊', '富國島'],

  // 中國
  china: ['北京', '上海', '廣州', '深圳', '杭州', '成都', '西安', '重慶', '昆明', '桂林', '麗江', '香港', '廈門', '三亞', '張家界', '九寨溝', '黃山'],

  // 菲律賓
  philippines: ['馬尼拉', '宿務', '長灘島', '巴拉望', '薄荷島'],

  // 印尼
  indonesia: ['峇里島', '雅加達', '日惹'],

  // 馬來西亞
  malaysia: ['吉隆坡', '檳城', '蘭卡威', '沙巴', '馬六甲'],

  // 新加坡
  singapore: ['新加坡'],

  // 土耳其
  turkey: ['伊斯坦堡', '卡帕多奇亞', '安塔利亞', '棉堡', '以弗所'],

  // 埃及
  egypt: ['開羅', '路克索', '亞斯文', '紅海', '吉薩'],

  // 法國
  france: ['巴黎', '尼斯', '坎城', '里昂', '馬賽', '史特拉斯堡', '波爾多', '亞維儂'],

  // 義大利
  italy: ['羅馬', '米蘭', '威尼斯', '佛羅倫斯', '拿坡里', '五漁村'],

  // 西班牙
  spain: ['巴塞隆納', '馬德里', '塞維亞', '格拉納達'],

  // 英國
  uk: ['倫敦', '愛丁堡', '牛津', '劍橋', '巴斯'],

  // 德國
  germany: ['柏林', '慕尼黑', '法蘭克福'],

  // 瑞士
  switzerland: ['蘇黎世', '琉森', '因特拉肯', '策馬特'],

  // 奧地利
  austria: ['維也納', '薩爾茨堡'],

  // 捷克
  czech: ['布拉格', 'CK小鎮'],

  // 荷蘭
  netherlands: ['阿姆斯特丹'],

  // 希臘
  greece: ['雅典', '聖托里尼', '米克諾斯'],

  // 葡萄牙
  portugal: ['里斯本', '波多'],

  // 澳洲
  australia: ['雪梨', '墨爾本', '黃金海岸'],

  // 紐西蘭
  new_zealand: ['奧克蘭', '皇后鎮', '基督城', '羅托魯瓦'],

  // 美國
  usa: ['紐約', '洛杉磯', '舊金山', '拉斯維加斯', '夏威夷'],

  // 加拿大
  canada: ['溫哥華', '多倫多'],

  // 沙烏地阿拉伯
  saudi_arabia: ['利雅德', '吉達', '麥加', '麥地那'],

  // 北歐
  iceland: ['雷克雅維克'],
  norway: ['奧斯陸', '卑爾根'],
  sweden: ['斯德哥爾摩'],
  finland: ['赫爾辛基'],
  denmark: ['哥本哈根'],
  croatia: ['杜布羅夫尼克'],
};

async function setMajorCities() {
  console.log('【設定各國主要城市】\n');

  let totalUpdated = 0;

  for (const [countryId, cityNames] of Object.entries(majorCities)) {
    // 取得該國所有城市
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name')
      .eq('country_id', countryId);

    if (!cities || cities.length === 0) {
      console.log(countryId + ': 無城市資料');
      continue;
    }

    // 找出需要設為主要的城市
    const majorCityIds = cities
      .filter(c => cityNames.includes(c.name))
      .map(c => c.id);

    if (majorCityIds.length === 0) {
      console.log(countryId + ': 無匹配城市');
      continue;
    }

    // 批量更新
    const { error } = await supabase
      .from('cities')
      .update({ is_major: true })
      .in('id', majorCityIds);

    if (error) {
      console.log(countryId + ': 更新失敗 - ' + error.message);
    } else {
      console.log(countryId + ': 設定 ' + majorCityIds.length + ' 個主要城市');
      totalUpdated += majorCityIds.length;
    }
  }

  console.log('\n【完成】共更新 ' + totalUpdated + ' 個城市');
}

setMajorCities();
