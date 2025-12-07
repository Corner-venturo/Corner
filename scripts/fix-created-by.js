const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
);

const WILLIAM_ID = '35880209-77eb-4827-84e3-c4e2bc013825';

async function updateCreatedBy() {
  // 找出所有沒有 created_by 的行程
  const { data: itineraries, error: fetchError } = await supabase
    .from('itineraries')
    .select('id, title')
    .is('created_by', null);

  if (fetchError) {
    console.error('Fetch error:', fetchError.message);
    return;
  }

  console.log(`Found ${itineraries?.length || 0} itineraries without created_by`);

  if (!itineraries || itineraries.length === 0) {
    console.log('No updates needed');
    return;
  }

  // 更新這些行程的 created_by
  const { data, error } = await supabase
    .from('itineraries')
    .update({ created_by: WILLIAM_ID })
    .is('created_by', null)
    .select('id, title');

  if (error) {
    console.error('Update error:', error.message);
    return;
  }

  console.log(`Updated ${data?.length || 0} itineraries:`);
  data?.forEach(item => console.log(`- ${item.title}`));
}

updateCreatedBy();
