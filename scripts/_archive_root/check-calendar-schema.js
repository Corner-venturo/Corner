const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('calendar_events 欄位:');
    Object.keys(data[0]).forEach(key => {
      console.log('  -', key);
    });
  } else {
    console.log('表格是空的，無法取得結構');
  }
  
  // 也檢查 todos
  const { data: todoData } = await supabase
    .from('todos')
    .select('*')
    .limit(1);
    
  if (todoData && todoData.length > 0) {
    console.log('\ntodos 欄位:');
    Object.keys(todoData[0]).forEach(key => {
      console.log('  -', key);
    });
  }
}

checkSchema();
