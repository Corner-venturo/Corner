#!/usr/bin/env node

/**
 * 詳細檢查表結構
 */

const { Client } = require('pg')

const connectionConfig = {
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pfqvdacxowpgfamuvnsn',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false,
  },
}

async function checkSchema() {
  console.log('🔍 詳細檢查關鍵表結構...\n')

  const client = new Client(connectionConfig)

  try {
    await client.connect()

    const tablesToCheck = ['employees', 'tours', 'orders', 'members', 'quotes', 'payments']

    for (const tableName of tablesToCheck) {
      console.log(`\n📋 ${tableName} 表：`)
      console.log('='.repeat(60))

      const result = await client.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `,
        [tableName]
      )

      if (result.rows.length === 0) {
        console.log('   ❌ 表不存在')
        continue
      }

      result.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '可選' : '必填'
        const defaultVal = col.column_default
          ? ` [預設: ${col.column_default.substring(0, 30)}]`
          : ''
        console.log(
          `   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`
        )
      })
    }

    // 檢查 quotes 表是否有我們需要的欄位
    console.log('\n\n🔍 檢查 quotes 表是否有前端需要的欄位：')
    console.log('='.repeat(60))

    const quotesCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'quotes';
    `)

    const quotesColumns = quotesCheck.rows.map(r => r.column_name)
    const requiredColumns = [
      'id',
      'code',
      'customer_name',
      'destination',
      'start_date',
      'end_date',
      'days',
      'nights',
      'number_of_people',
      'total_amount',
      'status',
      'created_at',
      'updated_at',
    ]

    console.log('\n   前端需要的欄位檢查：')
    requiredColumns.forEach(col => {
      const exists = quotesColumns.includes(col)
      console.log(`   ${exists ? '✅' : '❌'} ${col}`)
    })

    // 檢查缺少的欄位
    const missingColumns = requiredColumns.filter(col => !quotesColumns.includes(col))
    if (missingColumns.length > 0) {
      console.log(`\n   ⚠️  缺少的欄位: ${missingColumns.join(', ')}`)
    } else {
      console.log('\n   ✅ 所有必要欄位都存在！')
    }

    // 檢查額外的欄位
    const extraColumns = quotesColumns.filter(col => !requiredColumns.includes(col))
    if (extraColumns.length > 0) {
      console.log(`\n   ℹ️  額外的欄位: ${extraColumns.join(', ')}`)
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message)
  } finally {
    await client.end()
  }
}

checkSchema()
