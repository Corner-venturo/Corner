const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTodoUpdate() {
  // 先取得一個 todo
  const { data: todos, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  if (!todos || todos.length === 0) {
    console.log('No todos found');
    return;
  }

  const todo = todos[0];
  console.log('Testing update on todo:', todo.id);
  console.log('Current title:', todo.title);

  // 嘗試更新（只傳 title, priority, deadline）
  const testUpdates = {
    title: `測試更新 - ${new Date().toISOString()}`,
    priority: 4,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  console.log('Sending updates:', testUpdates);

  const { data, error } = await supabase
    .from('todos')
    .update(testUpdates)
    .eq('id', todo.id)
    .select();

  if (error) {
    console.error('❌ Update error:', error);
  } else {
    console.log('✅ Update successful:', data);
  }
}

testTodoUpdate();
