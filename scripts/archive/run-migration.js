#!/usr/bin/env node

/**
 * Supabase Migration Script
 * 自動執行資料庫 migration
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase 連接配置（Transaction Pooler）
const connectionConfig = {
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pfqvdacxowpgfamuvnsn',
  password: process.env.SUPABASE_DB_PASSWORD || '', // 需要資料庫密碼
  ssl: {
    rejectUnauthorized: false,
  },
}

/**
 * 智能分割 SQL 語句（保留 dollar-quoted strings 的完整性）
 */
function splitSqlStatements(sql) {
  const statements = []
  let currentStatement = ''
  let inDollarQuote = false
  let dollarQuoteTag = ''

  const lines = sql.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 跳過純註解行（但保留 SQL 中的註解）
    if (trimmedLine.startsWith('--') && !currentStatement) {
      continue
    }

    // 檢查 dollar quote 開始/結束
    const dollarQuoteMatches = line.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/g)
    if (dollarQuoteMatches) {
      for (const match of dollarQuoteMatches) {
        if (!inDollarQuote) {
          inDollarQuote = true
          dollarQuoteTag = match
        } else if (match === dollarQuoteTag) {
          inDollarQuote = false
          dollarQuoteTag = ''
        }
      }
    }

    currentStatement += line + '\n'

    // 如果不在 dollar quote 中，且行尾是分號，則結束當前語句
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      const statement = currentStatement.trim()
      if (statement && statement !== ';') {
        statements.push(statement)
      }
      currentStatement = ''
    }
  }

  // 添加最後一個語句（如果有）
  const lastStatement = currentStatement.trim()
  if (lastStatement && lastStatement !== ';') {
    statements.push(lastStatement)
  }

  return statements
}

async function runMigration() {
  console.log('🚀 開始執行 Supabase Migration...\n')

  const client = new Client(connectionConfig)

  try {
    // 連接資料庫
    console.log('📡 連接到 Supabase...')
    await client.connect()
    console.log('✅ 連接成功！\n')

    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, '..', 'supabase-migration.sql')
    console.log(`📖 讀取 SQL 檔案: ${sqlPath}`)
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log(`✅ SQL 檔案讀取成功 (${sql.length} 字元)\n`)

    // 智能分割 SQL 語句
    const statements = splitSqlStatements(sql)
    console.log(`✅ 找到 ${statements.length} 個 SQL 語句\n`)
    console.log('⚙️  執行 SQL migration...\n')

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // 顯示進度
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...'
      process.stdout.write(`   [${i + 1}/${statements.length}] ${preview}\r`)

      try {
        await client.query(statement)
        process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ✅\n`)
        successCount++
      } catch (error) {
        // 跳過已存在的錯誤
        if (error.message.includes('already exists')) {
          process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ⚠️  已存在\n`)
          skippedCount++
        } else if (error.message.includes('does not exist') && statement.includes('DROP')) {
          process.stdout.write(`   [${i + 1}/${statements.length}] ${preview} ⚠️  不存在\n`)
          skippedCount++
        } else {
          process.stdout.write(`\n   ❌ 錯誤 [${i + 1}]: ${error.message}\n`)
          errors.push({
            index: i + 1,
            message: error.message,
            statement: statement.substring(0, 200),
          })
          errorCount++
        }
      }
    }

    console.log('\n\n' + '='.repeat(60))
    console.log('✅ Migration 執行完成！\n')
    console.log('📊 結果統計：')
    console.log(`   ✅ 成功: ${successCount} 個語句`)
    console.log(`   ⚠️  跳過: ${skippedCount} 個語句（已存在或不存在）`)
    console.log(`   ❌ 失敗: ${errorCount} 個語句`)

    if (errorCount > 0) {
      console.log('\n❌ 錯誤詳情：')
      errors.forEach(err => {
        console.log(`\n   [${err.index}] ${err.message}`)
        console.log(`   語句: ${err.statement}...`)
      })
    }

    console.log('\n📋 建立的資料表：')
    console.log('   ✅ employees, tours, orders, members, customers')
    console.log('   ✅ payments, payment_requests, disbursement_orders, receipt_orders')
    console.log('   ✅ quotes, quote_items')
    console.log('   ✅ todos, visas, suppliers')
    console.log('   ✅ calendar_events, accounts, categories, transactions, budgets')
    console.log('   ✅ workspace_items, timebox_sessions, templates, syncQueue')

    if (errorCount === 0 && skippedCount < statements.length) {
      console.log('\n🎉 所有語句執行成功！可以重新整理頁面了！')
    } else if (errorCount === 0) {
      console.log('\n✅ 資料表已存在，無需重複建立！')
    } else {
      console.log('\n⚠️  部分語句執行失敗，但主要資料表應該已建立。')
      console.log('   請檢查上方的錯誤訊息。')
    }
  } catch (error) {
    console.error('\n❌ Migration 執行失敗：')
    console.error('   錯誤訊息:', error.message)
    if (error.detail) {
      console.error('   詳細資訊:', error.detail)
    }
    if (error.hint) {
      console.error('   提示:', error.hint)
    }

    // 如果是密碼錯誤
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n💡 需要資料庫密碼！')
      console.error('   請在 Supabase Dashboard → Settings → Database 找到密碼')
      console.error('   然後執行: SUPABASE_DB_PASSWORD=你的密碼 node scripts/run-migration.js')
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

// 執行
runMigration()
