#!/usr/bin/env node

/**
 * 修正 Supabase Schema
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function fixSchema() {
  console.log('🔧 開始修正 Supabase Schema...\n');

  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('✅ 連接成功！\n');

    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, 'fix-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 分割語句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10);

    console.log(`📋 找到 ${statements.length} 個修正語句\n`);
    console.log('⚙️  執行中...\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ') + '...';

      process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}\r`);

      try {
        await client.query(statement);
        process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ✅\n`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('column') && error.message.includes('already exists')) {
          process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ⚠️  已存在\n`);
          skippedCount++;
        } else {
          process.stdout.write(`\n   ❌ 錯誤: ${error.message}\n`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Schema 修正完成！\n');
    console.log('📊 結果：');
    console.log(`   ✅ 成功: ${successCount} 個語句`);
    console.log(`   ⚠️  跳過: ${skippedCount} 個語句（已存在）`);
    console.log(`   ❌ 失敗: ${errorCount} 個語句`);

    if (errorCount === 0) {
      console.log('\n🎉 所有修正都成功執行！');
      console.log('\n📋 已新增/修正的欄位：');
      console.log('   ✅ quotes.number_of_people');
      console.log('   ✅ quotes.customer_id, name, group_size, version...');
      console.log('   ✅ employees.email, avatar, is_active...');
      console.log('   ✅ members.name_en, id_number, passport_expiry...');
      console.log('   ✅ tours.current_participants, is_active');
      console.log('   ✅ orders.order_number, member_count...');
      console.log('\n🔥 現在可以重新整理頁面測試了！');
    } else {
      console.log('\n⚠️  部分修正失敗，請檢查錯誤訊息。');
    }

  } catch (error) {
    console.error('\n❌ 執行失敗:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixSchema();
