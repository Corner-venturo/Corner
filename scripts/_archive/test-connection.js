#!/usr/bin/env node

/**
 * Supabase Connection Test
 * 測試不同的連線配置
 */

const { Client } = require('pg')

const password = process.env.SUPABASE_DB_PASSWORD || ''

// 測試配置 1: Pooler (Transaction Mode) - No SSL
const config1 = {
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pfqvdacxowpgfamuvnsn',
  password: password,
  ssl: false,
}

// 測試配置 2: Direct Connection - No SSL
const config2 = {
  host: 'db.pfqvdacxowpgfamuvnsn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: false,
}

// 測試配置 3: Pooler with simple username - No SSL
const config3 = {
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: false,
}

async function testConnection(config, name) {
  console.log(`\n🔧 測試配置: ${name}`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   User: ${config.user}`)

  const client = new Client(config)

  try {
    await client.connect()
    console.log(`✅ ${name} 連線成功！`)

    // 測試簡單查詢
    const result = await client.query('SELECT version();')
    console.log(`   PostgreSQL版本: ${result.rows[0].version.substring(0, 50)}...`)

    await client.end()
    return true
  } catch (error) {
    console.error(`❌ ${name} 連線失敗:`)
    console.error(`   錯誤: ${error.message}`)
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
    return false
  }
}

async function runTests() {
  console.log('🚀 開始測試 Supabase 連線配置...\n')

  if (!password) {
    console.error('❌ 錯誤: 請設定 SUPABASE_DB_PASSWORD 環境變數')
    process.exit(1)
  }

  const tests = [
    { config: config1, name: 'Pooler (Transaction Mode)' },
    { config: config2, name: 'Direct Connection' },
    { config: config3, name: 'Pooler (Simple Username)' },
  ]

  let successConfig = null

  for (const test of tests) {
    const success = await testConnection(test.config, test.name)
    if (success && !successConfig) {
      successConfig = test
    }
  }

  console.log('\n' + '='.repeat(60))

  if (successConfig) {
    console.log(`\n✅ 找到可用的連線配置: ${successConfig.name}`)
    console.log('\n📝 建議使用以下配置:')
    console.log(JSON.stringify(successConfig.config, null, 2))
    console.log('\n🎉 可以開始執行 migration 了！')
  } else {
    console.log('\n❌ 所有配置都失敗')
    console.log('\n💡 可能的原因:')
    console.log('   1. 密碼錯誤')
    console.log('   2. IP 白名單未設定')
    console.log('   3. 資料庫連線功能未啟用')
    console.log('\n📋 請檢查 Supabase Dashboard:')
    console.log('   Settings → Database → Connection String')
  }
}

runTests()
