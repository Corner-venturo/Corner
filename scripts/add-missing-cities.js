// 新增缺少的日本城市
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingCities() {
  console.log('新增缺少的城市...\n');

  // 先取得日本的 country_id
  const { data: japan } = await supabase
    .from('countries')
    .select('id')
    .eq('name', '日本')
    .single();

  if (!japan) {
    console.log('找不到日本！');
    return;
  }

  const japanId = japan.id;
  console.log('日本 country_id:', japanId);

  // 取得韓國 country_id
  const { data: korea } = await supabase
    .from('countries')
    .select('id')
    .eq('name', '韓國')
    .single();

  const koreaId = korea?.id;
  console.log('韓國 country_id:', koreaId);

  const cities = [
    { id: crypto.randomUUID(), name: '本部町', country_id: japanId },
    { id: crypto.randomUUID(), name: '今歸仁村', country_id: japanId },
    { id: crypto.randomUUID(), name: '讀谷村', country_id: japanId },
    { id: crypto.randomUUID(), name: '河口湖', country_id: japanId },
    { id: crypto.randomUUID(), name: '濟州', country_id: koreaId },
  ];

  for (const city of cities) {
    const { error } = await supabase
      .from('cities')
      .insert(city);

    if (error) {
      if (error.code === '23505') {
        console.log(`⟳ 已存在: ${city.name}`);
      } else {
        console.log(`✗ 新增失敗: ${city.name} - ${error.message}`);
      }
    } else {
      console.log(`✓ 已新增: ${city.name}`);
    }
  }

  console.log('\n完成！');
}

addMissingCities();
