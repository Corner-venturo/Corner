#!/usr/bin/env node

/**
 * 自動為 schemas.ts 中的業務表加入同步索引
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/lib/db/schemas.ts');

// 需要加入同步索引的表
const syncableTables = [
  'orders',
  'members',
  'customers',
  'payments',
  'quotes',
  'quote_items',
  'payment_requests',
  'disbursement_orders',
  'receipt_orders',
  'todos',
  'visas',
  'suppliers',
];

// 同步索引註解
const syncIndexes = `      // Offline-First 同步欄位 (v12)
      { name: 'sync_status', keyPath: 'sync_status', unique: false },
      { name: 'temp_code', keyPath: 'temp_code', unique: false },
      { name: 'synced_at', keyPath: 'synced_at', unique: false },`;

let content = fs.readFileSync(schemaPath, 'utf-8');
let modified = false;

syncableTables.forEach(table => {
  // 找到表定義
  const tablePattern = new RegExp(
    `(\\/\\/ ${table.replace('_', ' ')}.*?表[\\s\\S]*?name: '${table}',[\\s\\S]*?indexes: \\[[\\s\\S]*?)\\n(\\s*?)\\],`,
    'i'
  );

  const match = content.match(tablePattern);

  if (match && !match[0].includes('Offline-First 同步欄位')) {
    console.log(`✅ 為 ${table} 加入同步索引`);
    content = content.replace(
      tablePattern,
      `$1\n${syncIndexes}\n$2],`
    );
    modified = true;
  } else if (match) {
    console.log(`⏭️  ${table} 已有同步索引，跳過`);
  } else {
    console.log(`⚠️  找不到 ${table} 表定義`);
  }
});

if (modified) {
  fs.writeFileSync(schemaPath, content, 'utf-8');
  console.log('\n✅ Schema 更新完成');
} else {
  console.log('\n⏭️  無需更新');
}
