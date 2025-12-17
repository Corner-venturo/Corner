const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data } = await supabase
    .from('attractions')
    .select('name, region_id')
    .eq('country_id', 'philippines')
    .order('region_id');

  console.log('菲律賓景點列表 (' + data.length + ' 筆):\n');

  let currentRegion = '';
  data.forEach(a => {
    if (a.region_id !== currentRegion) {
      currentRegion = a.region_id;
      console.log('\n【' + (currentRegion || '未分類') + '】');
    }
    console.log('  ' + a.name);
  });
}

main();
