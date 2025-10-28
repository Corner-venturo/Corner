#!/usr/bin/env node

/**
 * 檢查 Supabase 現有表
 */

const { Client } = require('pg');

const connectionConfig = {
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pfqvdacxowpgfamuvnsn',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkTables() {
  console.log('🔍 檢查 Supabase 現有表...\n');

  const client = new Client(connectionConfig);

  try {
    await client.connect();

    // 查詢所有表
    const result = await client.query(`
      SELECT
        table_name,
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✅ 找到 ${result.rows.length} 個表：\n`);

    for (const row of result.rows) {
      console.log(`   📋 ${row.table_name} (${row.column_count} 欄位)`);
    }

    console.log('\n🔍 檢查 quotes 表的欄位：\n');

    const quotesColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'quotes'
      ORDER BY ordinal_position;
    `);

    if (quotesColumns.rows.length > 0) {
      console.log('   quotes 表欄位：');
      quotesColumns.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ quotes 表不存在');
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
