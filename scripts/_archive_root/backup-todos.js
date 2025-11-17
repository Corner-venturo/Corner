#!/usr/bin/env node

/**
 * 備份待辦事項資料
 * 使用 Supabase REST API 匯出所有 todos 資料
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('錯誤：請設定 NEXT_PUBLIC_SUPABASE_ANON_KEY 環境變數');
  process.exit(1);
}

function fetchData(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `backup_todos_${timestamp}.json`;

  try {
    console.log('正在從 Supabase 下載待辦事項資料...');

    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    };

    const todos = await fetchData(`${SUPABASE_URL}/rest/v1/todos?select=*`, headers);

    const backupData = {
      backup_time: new Date().toISOString(),
      table: 'todos',
      count: todos.length,
      data: todos
    };

    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

    console.log(`✅ 備份完成！`);
    console.log(`   檔案：${filename}`);
    console.log(`   筆數：${todos.length} 筆待辦事項`);

  } catch (error) {
    console.error('❌ 備份失敗：', error.message);
    process.exit(1);
  }
}

backup();
