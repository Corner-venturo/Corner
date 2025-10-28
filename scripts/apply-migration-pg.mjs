import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase PostgreSQL connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
const connectionString = 'postgresql://postgres.pfqvdacxowpgfamuvnsn:kbJdYHtXOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 連接到 Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ 連接成功！\n');

    // 讀取 migration 檔案
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251026040000_create_user_data_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration 檔案載入成功\n');
    console.log('🚀 開始執行 migration...\n');

    // 直接執行整個 migration SQL（PostgreSQL 支援一次執行多個語句）
    const result = await client.query(migrationSQL);

    console.log('✅ Migration 執行成功！\n');
    console.log('📊 建立的表格：');
    console.log('  ✓ user_preferences');
    console.log('  ✓ notes');
    console.log('  ✓ manifestation_records\n');

    // 驗證表格是否存在
    console.log('🔍 驗證表格...\n');
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user_preferences', 'notes', 'manifestation_records')
      ORDER BY table_name;
    `);

    if (rows.length === 3) {
      console.log('✅ 所有表格驗證成功：');
      rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    } else {
      console.log(`⚠️  只找到 ${rows.length}/3 個表格`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration 完成！跨裝置同步功能已啟用！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration 執行失敗：');
    console.error(error.message);
    if (error.detail) {
      console.error('詳細資訊：', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 資料庫連接已關閉');
  }
}

applyMigration();
