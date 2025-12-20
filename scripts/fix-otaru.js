const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

async function fix() {
  // 查看小樽的重複景點
  const { data: otaru } = await supabase
    .from('attractions')
    .select('id, name, city_id, notes')
    .eq('city_id', 'otaru')
    .or('name.ilike.%小樽運河%,name.ilike.%北一硝子%');

  console.log('小樽景點:');
  otaru.forEach(a => {
    const hasNotes = a.notes ? '有' : '無';
    console.log('  ', a.name, '| ID:', a.id.slice(0,8), '| notes:', hasNotes);
  });

  // 刪除重複的（保留沒有《》的）
  const toDelete = [];

  // 北一硝子館
  const kita1 = otaru.filter(a => a.name.includes('北一硝子'));
  if (kita1.length > 1) {
    const keep = kita1.find(a => a.name.indexOf('《') === -1) || kita1[0];
    kita1.filter(a => a.id !== keep.id).forEach(a => toDelete.push(a.id));
    console.log('\n保留:', keep.name);
  }

  // 小樽運河
  const otaruCanal = otaru.filter(a => a.name.includes('小樽運河'));
  if (otaruCanal.length > 1) {
    const keep = otaruCanal.find(a => a.name.indexOf('《') === -1) || otaruCanal[0];
    otaruCanal.filter(a => a.id !== keep.id).forEach(a => toDelete.push(a.id));
    console.log('保留:', keep.name);
  }

  if (toDelete.length > 0) {
    console.log('\n刪除:', toDelete.length, '筆');
    const { error } = await supabase.from('attractions').delete().in('id', toDelete);
    if (error) console.error('錯誤:', error.message);
    else console.log('✅ 刪除成功');
  }
}
fix();
