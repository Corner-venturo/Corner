/* eslint-disable */
// 快速測試 regions 資料讀取
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfqvdacxowpgfamuvnsn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MjgxMzksImV4cCI6MjA0NTQwNDEzOX0.fhXYmzbMVkYmjGaARmzwAyYQZ7z_Epm54TJMl8WYpTY'
);

async function testRegionsData() {
  console.log('\n🔍 測試地區資料讀取...\n');

  // 測試 countries
  const { data: countries, error: countriesError } = await supabase
    .from('countries')
    .select('*')
    .limit(5);

  if (countriesError) {
    console.log('❌ Countries 讀取失敗:', countriesError.message);
  } else {
    console.log(`✅ Countries: ${countries.length} 筆`);
    if (countries.length > 0) {
      console.log('   範例:', countries[0].name);
    }
  }

  // 測試 regions
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('*')
    .limit(5);

  if (regionsError) {
    console.log('❌ Regions 讀取失敗:', regionsError.message);
  } else {
    console.log(`✅ Regions: ${regions.length} 筆`);
  }

  // 測試 cities
  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('*')
    .limit(5);

  if (citiesError) {
    console.log('❌ Cities 讀取失敗:', citiesError.message);
  } else {
    console.log(`✅ Cities: ${cities.length} 筆`);
  }

  console.log('\n');
}

testRegionsData().catch(console.error);
