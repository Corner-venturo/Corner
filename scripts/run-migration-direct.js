#!/usr/bin/env node
/**
 * 使用 pg 套件直接連線 PostgreSQL 執行 migration
 */

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

// 讀取環境變數
require('dotenv').config({ path: '.env.local' })

// Supabase 連線資訊
const connectionString = `postgresql://postgres.pfqvdacxowpgfamuvnsn:${process.env.SUPABASE_DB_PASSWORD || 'Ww0919283038'}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`

console.log('🔗 連接 Supabase PostgreSQL...\n')

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // 接受自簽證書
      checkServerIdentity: () => undefined, // 跳過 hostname 驗證
    },
  })

  try {
    await client.connect()
    console.log('✅ 連線成功！\n')

    // 讀取 migration SQL
    const migrationPath = path.join(
      __dirname,
      '../supabase/migrations/20251117122000_update_payment_requests_structure.sql'
    )
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📋 執行 migration...\n')

    // 直接執行完整 SQL（包含 BEGIN/COMMIT）
    await client.query(sql)

    console.log('\n' + '='.repeat(50))
    console.log('🎉 Migration 執行完成！')
    console.log('='.repeat(50))
    console.log('\n✅ payment_requests 表已更新')
    console.log('✅ payment_request_items 表已更新')
    console.log('✅ 自動觸發器已建立')
    console.log('✅ 索引已建立\n')
  } catch (error) {
    console.error('\n❌ 執行失敗：', error.message)
    console.error('\n詳細錯誤：', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
