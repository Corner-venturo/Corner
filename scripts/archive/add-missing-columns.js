#!/usr/bin/env node

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

async function addMissingColumns() {
  console.log('🔧 新增缺少的欄位...\n')

  const client = new Client(connectionConfig)

  try {
    await client.connect()

    const columns = [
      {
        table: 'quotes',
        column: 'number_of_people',
        definition: 'INTEGER DEFAULT 0',
        update:
          'UPDATE quotes SET number_of_people = COALESCE(adult_count, 0) + COALESCE(child_count, 0) + COALESCE(infant_count, 0)',
      },
      {
        table: 'quotes',
        column: 'customer_id',
        definition: 'TEXT',
      },
      {
        table: 'quotes',
        column: 'is_active',
        definition: 'BOOLEAN DEFAULT TRUE',
      },
      {
        table: 'employees',
        column: 'email',
        definition: 'TEXT',
      },
      {
        table: 'members',
        column: 'name_en',
        definition: 'TEXT',
        update:
          'UPDATE members SET name_en = english_name WHERE name_en IS NULL AND english_name IS NOT NULL',
      },
      {
        table: 'tours',
        column: 'current_participants',
        definition: 'INTEGER DEFAULT 0',
      },
      {
        table: 'orders',
        column: 'order_number',
        definition: 'TEXT',
        update:
          "UPDATE orders SET order_number = code WHERE order_number IS NULL OR order_number = ''",
      },
    ]

    for (const col of columns) {
      console.log(`\n📋 ${col.table}.${col.column}`)

      try {
        // 檢查欄位是否存在
        const checkResult = await client.query(
          `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
        `,
          [col.table, col.column]
        )

        if (checkResult.rows.length > 0) {
          console.log(`   ⚠️  欄位已存在`)
          continue
        }

        // 新增欄位
        await client.query(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.definition}`)
        console.log(`   ✅ 欄位新增成功`)

        // 執行更新（如果有）
        if (col.update) {
          await client.query(col.update)
          console.log(`   ✅ 資料更新完成`)
        }
      } catch (error) {
        console.log(`   ❌ 錯誤: ${error.message}`)
      }
    }

    console.log('\n\n' + '='.repeat(60))
    console.log('✅ 完成！\n')

    // 驗證
    console.log('🔍 驗證 quotes 表欄位...\n')
    const verifyResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name IN ('number_of_people', 'customer_id', 'is_active')
      ORDER BY column_name
    `)

    verifyResult.rows.forEach(row => {
      console.log(`   ✅ ${row.column_name}`)
    })

    if (verifyResult.rows.length === 3) {
      console.log('\n🎉 所有必要欄位都已存在！可以重新整理頁面了！')
    } else {
      console.log('\n⚠️  還有欄位缺少，請檢查上方錯誤訊息')
    }
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message)
  } finally {
    await client.end()
  }
}

addMissingColumns()
