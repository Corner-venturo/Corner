/**
 * 補充景點經緯度
 * 使用 Nominatim (OpenStreetMap) 免費地理編碼服務
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

// 國家名稱對照
const COUNTRY_NAMES = {
  japan: 'Japan',
  china: 'China',
  korea: 'South Korea',
  thailand: 'Thailand',
  vietnam: 'Vietnam',
  philippines: 'Philippines',
  malaysia: 'Malaysia',
  indonesia: 'Indonesia',
  singapore: 'Singapore',
  egypt: 'Egypt',
  turkey: 'Turkey',
  france: 'France',
  uk: 'United Kingdom',
  usa: 'United States',
  italy: 'Italy',
  spain: 'Spain',
  saudi_arabia: 'Saudi Arabia',
  new_zealand: 'New Zealand',
  taiwan: 'Taiwan',
};

// 城市名稱對照（常見的）
const CITY_NAMES = {
  tokyo: 'Tokyo',
  osaka: 'Osaka',
  kyoto: 'Kyoto',
  fukuoka: 'Fukuoka',
  sapporo: 'Sapporo',
  naha: 'Naha',
  okinawa: 'Okinawa',
  beijing: 'Beijing',
  shanghai: 'Shanghai',
  guangzhou: 'Guangzhou',
  seoul: 'Seoul',
  busan: 'Busan',
  bangkok: 'Bangkok',
  'chiang-mai': 'Chiang Mai',
  phuket: 'Phuket',
  hanoi: 'Hanoi',
  'ho-chi-minh': 'Ho Chi Minh City',
  'da-nang': 'Da Nang',
  manila: 'Manila',
  cebu: 'Cebu',
  'kuala-lumpur': 'Kuala Lumpur',
  bali: 'Bali',
  cairo: 'Cairo',
  paris: 'Paris',
  london: 'London',
};

// 延遲函數
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 使用 Nominatim 查詢經緯度
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Venturo-ERP/1.0 (contact@venturo.com)'
      }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocode error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🌍 補充景點經緯度\n');
  console.log('='.repeat(60) + '\n');

  // 取得缺少經緯度的景點
  const { data: missing } = await supabase
    .from('attractions')
    .select('id, name, name_en, city_id, country_id')
    .is('latitude', null)
    .order('country_id, city_id')
    .limit(1000);

  console.log(`📊 缺少經緯度: ${missing.length} 筆\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < missing.length; i++) {
    const attraction = missing[i];
    const countryName = COUNTRY_NAMES[attraction.country_id] || attraction.country_id;
    const cityName = CITY_NAMES[attraction.city_id] || attraction.city_id;

    // 優先使用英文名稱
    const name = attraction.name_en || attraction.name;

    // 構建查詢字串
    const queries = [
      `${name}, ${cityName}, ${countryName}`,
      `${name}, ${countryName}`,
      `${cityName}, ${countryName}`,
    ];

    let coords = null;

    for (const query of queries) {
      coords = await geocode(query);
      if (coords) break;
      await delay(1100); // Nominatim 限制 1 req/sec
    }

    if (coords) {
      // 更新資料庫
      const { error } = await supabase
        .from('attractions')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', attraction.id);

      if (error) {
        console.log(`❌ [${i+1}/${missing.length}] ${attraction.name} - 更新失敗`);
        failed++;
      } else {
        console.log(`✅ [${i+1}/${missing.length}] ${attraction.name} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        success++;
      }
    } else {
      console.log(`⚠️  [${i+1}/${missing.length}] ${attraction.name} - 找不到座標`);
      skipped++;
    }

    // 每 50 筆顯示進度
    if ((i + 1) % 50 === 0) {
      console.log(`\n📈 進度: ${i+1}/${missing.length} (${((i+1)/missing.length*100).toFixed(1)}%)\n`);
    }

    await delay(1100); // 遵守速率限制
  }

  console.log('\n' + '='.repeat(60));
  console.log('【完成】');
  console.log('='.repeat(60) + '\n');

  console.log(`✅ 成功: ${success} 筆`);
  console.log(`⚠️  找不到: ${skipped} 筆`);
  console.log(`❌ 失敗: ${failed} 筆`);

  // 最終統計
  const { count: stillMissing } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .is('latitude', null);

  console.log(`\n📊 剩餘缺少經緯度: ${stillMissing} 筆`);
}

main().catch(console.error);
