#!/usr/bin/env node
const https = require('https')
const fs = require('fs')

const SUPABASE_ACCESS_TOKEN = 'sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0'
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn'

// Read the migration file
const SQL = fs.readFileSync('./supabase/migrations/20251119090000_fix_missing_audit_fields.sql', 'utf8')

async function executeSQL() {
  console.log('🔄 正在執行 SQL...\n')

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

    const postData = JSON.stringify({ query: SQL })

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        console.log('狀態碼:', res.statusCode)

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SQL 執行成功！')
          console.log('回應:', data)
          console.log('\n🎉 Migration 完成！')
          resolve()
        } else {
          console.error('❌ SQL 執行失敗')
          console.error('狀態碼:', res.statusCode)
          console.error('錯誤:', data)
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ 請求錯誤:', error)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

executeSQL().catch(error => {
  console.error('執行失敗:', error.message)
  process.exit(1)
})
