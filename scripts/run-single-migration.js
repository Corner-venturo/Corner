#!/usr/bin/env node
/**
 * 執行單一 migration 檔案
 * 用法: node scripts/run-single-migration.js <migration_file>
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const SUPABASE_ACCESS_TOKEN = 'sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0'
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn'

async function executeSQL(sql, description = 'SQL') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }

    const postData = JSON.stringify({ query: sql })

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ ${description} 執行成功`)
          resolve({ success: true, data })
        } else {
          console.error(`❌ ${description} 執行失敗 (${res.statusCode})`)
          console.error('Error:', data)
          reject(new Error(data))
        }
      })
    })

    req.on('error', (e) => {
      console.error(`❌ 請求錯誤:`, e.message)
      reject(e)
    })

    req.write(postData)
    req.end()
  })
}

async function main() {
  const migrationFile = process.argv[2]
  if (!migrationFile) {
    console.log('用法: node scripts/run-single-migration.js <migration_file>')
    console.log('例如: node scripts/run-single-migration.js 20251226000000_add_traveler_tables.sql')
    process.exit(1)
  }

  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ 找不到 migration 檔案: ${migrationPath}`)
    process.exit(1)
  }

  console.log(`🔄 執行 migration: ${migrationFile}`)

  const sql = fs.readFileSync(migrationPath, 'utf8')

  try {
    await executeSQL(sql, migrationFile)

    // 記錄到 _migrations 表
    const recordSql = `
      INSERT INTO _migrations (name, executed_at)
      VALUES ('${migrationFile}', NOW())
      ON CONFLICT (name) DO NOTHING;
    `
    await executeSQL(recordSql, '記錄 migration')

    console.log(`\n✅ Migration 執行完成!`)
  } catch (error) {
    console.error(`\n❌ Migration 執行失敗:`, error.message)
    process.exit(1)
  }
}

main()
