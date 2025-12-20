// 檢查景點資料庫中重複或相似的名稱
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

// 計算兩個字串的相似度 (Levenshtein distance)
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }
  return dp[m][n];
}

// 計算相似度百分比
function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(str1, str2);
  return ((maxLen - distance) / maxLen * 100).toFixed(1);
}

// 正規化名稱（移除空格、括號內容等）
function normalize(name) {
  return name
    .replace(/\s+/g, '')           // 移除空格
    .replace(/（.*?）/g, '')        // 移除中文括號內容
    .replace(/\(.*?\)/g, '')        // 移除英文括號內容
    .replace(/[·・]/g, '')          // 移除中點
    .toLowerCase();
}

async function checkDuplicates() {
  console.log('🔍 景點資料重複檢查報告\n');
  console.log('=' .repeat(80) + '\n');

  // 取得所有景點
  const { data: attractions, error } = await supabase
    .from('attractions')
    .select('id, name, name_en, city_id, country_id, category, is_active')
    .order('country_id, city_id, name');

  if (error) {
    console.error('❌ 無法取得景點資料:', error);
    return;
  }

  console.log(`📊 總景點數: ${attractions.length} 筆\n`);

  // ===== 1. 完全相同名稱 =====
  console.log('=' .repeat(80));
  console.log('【1】完全相同名稱（同名景點）');
  console.log('=' .repeat(80) + '\n');

  const nameMap = new Map();
  attractions.forEach(a => {
    const key = a.name;
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(a);
  });

  let exactDuplicates = 0;
  const exactDuplicateList = [];
  nameMap.forEach((items, name) => {
    if (items.length > 1) {
      exactDuplicates++;
      exactDuplicateList.push({ name, items });
    }
  });

  if (exactDuplicateList.length === 0) {
    console.log('✅ 沒有完全相同名稱的景點\n');
  } else {
    console.log(`⚠️  發現 ${exactDuplicateList.length} 組完全相同名稱:\n`);
    exactDuplicateList.forEach(({ name, items }) => {
      console.log(`📍 「${name}」 (${items.length} 筆):`);
      items.forEach(item => {
        console.log(`   - ID: ${item.id.slice(0, 8)}... | 城市: ${item.city_id} | 國家: ${item.country_id} | 分類: ${item.category || '-'} | 啟用: ${item.is_active ? '是' : '否'}`);
      });
      console.log('');
    });
  }

  // ===== 2. 同城市內相似名稱 =====
  console.log('=' .repeat(80));
  console.log('【2】同城市內相似名稱（相似度 >= 70%）');
  console.log('=' .repeat(80) + '\n');

  const byCityMap = new Map();
  attractions.forEach(a => {
    const key = `${a.country_id}|${a.city_id}`;
    if (!byCityMap.has(key)) byCityMap.set(key, []);
    byCityMap.get(key).push(a);
  });

  let similarInCityCount = 0;
  const similarInCityList = [];

  byCityMap.forEach((cityAttractions, cityKey) => {
    const checked = new Set();
    for (let i = 0; i < cityAttractions.length; i++) {
      for (let j = i + 1; j < cityAttractions.length; j++) {
        const a = cityAttractions[i];
        const b = cityAttractions[j];
        const pairKey = [a.id, b.id].sort().join('|');
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const normA = normalize(a.name);
        const normB = normalize(b.name);

        // 跳過完全相同的（已在第1節處理）
        if (a.name === b.name) continue;

        const sim = parseFloat(similarity(normA, normB));

        // 相似度 >= 70% 或其中一個名稱包含另一個
        const contains = normA.includes(normB) || normB.includes(normA);

        if (sim >= 70 || (contains && Math.min(normA.length, normB.length) >= 2)) {
          similarInCityCount++;
          similarInCityList.push({
            cityKey,
            a,
            b,
            similarity: sim,
            contains
          });
        }
      }
    }
  });

  if (similarInCityList.length === 0) {
    console.log('✅ 同城市內沒有相似名稱的景點\n');
  } else {
    // 按相似度排序
    similarInCityList.sort((x, y) => y.similarity - x.similarity);

    console.log(`⚠️  發現 ${similarInCityList.length} 組相似名稱:\n`);
    similarInCityList.forEach(({ cityKey, a, b, similarity: sim, contains }) => {
      const [country, city] = cityKey.split('|');
      const tag = contains ? '【包含】' : '';
      console.log(`📍 ${country} > ${city} ${tag}`);
      console.log(`   「${a.name}」 vs 「${b.name}」 (相似度: ${sim}%)`);
      console.log(`   - ${a.name}: ID ${a.id.slice(0, 8)}... | 分類: ${a.category || '-'}`);
      console.log(`   - ${b.name}: ID ${b.id.slice(0, 8)}... | 分類: ${b.category || '-'}`);
      console.log('');
    });
  }

  // ===== 3. 跨城市相同名稱 =====
  console.log('=' .repeat(80));
  console.log('【3】跨城市相同名稱（不同城市但同名）');
  console.log('=' .repeat(80) + '\n');

  const crossCityDuplicates = [];
  nameMap.forEach((items, name) => {
    if (items.length > 1) {
      const cities = new Set(items.map(i => `${i.country_id}|${i.city_id}`));
      if (cities.size > 1) {
        crossCityDuplicates.push({ name, items });
      }
    }
  });

  if (crossCityDuplicates.length === 0) {
    console.log('✅ 沒有跨城市同名的景點\n');
  } else {
    console.log(`ℹ️  發現 ${crossCityDuplicates.length} 組跨城市同名（可能是正常的）:\n`);
    crossCityDuplicates.forEach(({ name, items }) => {
      console.log(`📍 「${name}」 出現在 ${items.length} 個地點:`);
      items.forEach(item => {
        console.log(`   - ${item.country_id} > ${item.city_id} | 分類: ${item.category || '-'}`);
      });
      console.log('');
    });
  }

  // ===== 4. 可能的錯誤資料（名稱太短或異常） =====
  console.log('=' .repeat(80));
  console.log('【4】可能有問題的資料');
  console.log('=' .repeat(80) + '\n');

  const shortNames = attractions.filter(a => a.name.length <= 2);
  const noCity = attractions.filter(a => !a.city_id);
  const noCountry = attractions.filter(a => !a.country_id);

  console.log(`📌 名稱過短 (<=2字): ${shortNames.length} 筆`);
  if (shortNames.length > 0 && shortNames.length <= 20) {
    shortNames.forEach(a => {
      console.log(`   - 「${a.name}」 @ ${a.country_id} > ${a.city_id}`);
    });
  }
  console.log('');

  console.log(`📌 缺少城市: ${noCity.length} 筆`);
  console.log(`📌 缺少國家: ${noCountry.length} 筆\n`);

  // ===== 總結 =====
  console.log('=' .repeat(80));
  console.log('【總結】');
  console.log('=' .repeat(80) + '\n');

  console.log(`📊 檢查統計:`);
  console.log(`   總景點數: ${attractions.length}`);
  console.log(`   完全同名組數: ${exactDuplicateList.length}`);
  console.log(`   同城市相似名稱: ${similarInCityList.length} 組`);
  console.log(`   跨城市同名: ${crossCityDuplicates.length} 組`);
  console.log(`   名稱過短: ${shortNames.length} 筆`);
  console.log(`   缺少城市/國家: ${noCity.length + noCountry.length} 筆`);

  const needsReview = exactDuplicateList.length + similarInCityList.length;
  if (needsReview > 0) {
    console.log(`\n⚠️  建議審查: ${needsReview} 組可能需要處理`);
  } else {
    console.log(`\n✅ 資料品質良好，無明顯重複`);
  }
}

checkDuplicates();
