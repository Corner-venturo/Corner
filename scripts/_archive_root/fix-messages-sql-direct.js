const https = require('https');

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fixMessages() {
  try {
    console.log('嘗試透過 REST API 執行 SQL...');
    
    const sql = `
      BEGIN;
      
      ALTER TABLE public.messages 
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      
      UPDATE public.messages 
      SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1),
          updated_at = COALESCE(edited_at::timestamptz, created_at::timestamptz, now())
      WHERE workspace_id IS NULL;
      
      COMMIT;
    `;

    await executeSQL(sql);
    console.log('✅ 成功執行 SQL');
    
  } catch (error) {
    console.log('❌ REST API 方式失敗:', error.message);
    console.log('');
    console.log('請手動在 Supabase SQL Editor 執行以下 SQL:');
    console.log('');
    console.log('---');
    console.log('BEGIN;');
    console.log('');
    console.log('ALTER TABLE public.messages');
    console.log('ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();');
    console.log('');
    console.log('UPDATE public.messages');
    console.log('SET workspace_id = (SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1),');
    console.log('    updated_at = COALESCE(edited_at::timestamptz, created_at::timestamptz, now())');
    console.log('WHERE workspace_id IS NULL;');
    console.log('');
    console.log('COMMIT;');
    console.log('---');
  }
}

fixMessages();
