#!/usr/bin/env node
import { readFileSync } from 'fs';
import pg from 'pg';

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ 請指定 migration 檔案');
  console.error('用法: node scripts/run-migration.mjs supabase/migrations/20260308224300_add_payment_request_items_fk.sql');
  process.exit(1);
}

// 從 Supabase Dashboard 取得的連線字串
// 格式: postgresql://postgres:[PASSWORD]@db.pfqvdacxowpgfamuvnsn.supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 缺少 DATABASE_URL 環境變數');
  console.error('請從 Supabase Dashboard > Project Settings > Database 取得連線字串');
  console.error('然後執行: DATABASE_URL="..." node scripts/run-migration.mjs ...');
  process.exit(1);
}

const sql = readFileSync(migrationFile, 'utf-8');

console.log('🔧 執行 migration:', migrationFile);
console.log('📝 SQL:\n', sql);

const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log('✅ 已連線到資料庫');
  
  const result = await client.query(sql);
  console.log('✅ Migration 執行成功！');
  console.log('📊 結果:', result);
} catch (error) {
  console.error('❌ 執行失敗:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
