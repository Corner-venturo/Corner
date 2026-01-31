/**
 * 移除 online_trips 表的 FK 約束
 * 
 * 使用方式：
 * 1. 在 Supabase Dashboard → Settings → Database → Connection string 找到 URI
 * 2. 執行：DATABASE_URL="你的連線字串" node scripts/drop-fk.js
 * 
 * 或者直接在 Supabase Dashboard → SQL Editor 執行：
 * ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_tour_id_fkey;
 * ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_itinerary_id_fkey;
 */

const { Client } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('❌ 請設定 DATABASE_URL 環境變數');
    console.log('');
    console.log('或者直接在 Supabase Dashboard → SQL Editor 執行：');
    console.log('');
    console.log('ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_tour_id_fkey;');
    console.log('ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_itinerary_id_fkey;');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ 已連接到資料庫');

    await client.query('ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_tour_id_fkey');
    console.log('✅ 移除 online_trips_erp_tour_id_fkey');

    await client.query('ALTER TABLE online_trips DROP CONSTRAINT IF EXISTS online_trips_erp_itinerary_id_fkey');
    console.log('✅ 移除 online_trips_erp_itinerary_id_fkey');

    console.log('');
    console.log('🎉 完成！FK 約束已移除');
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await client.end();
  }
}

main();
