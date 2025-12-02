#!/usr/bin/env node
import https from 'https'

const SUPABASE_ACCESS_TOKEN = 'sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0'
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn'

const SQL = `
BEGIN;

-- payment_requests 表格：新增 updated_by
ALTER TABLE public.payment_requests
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.payment_requests.updated_by IS 'Last user who updated this payment request';

UPDATE public.payment_requests
SET updated_by = created_by
WHERE updated_by IS NULL;

COMMIT;
`

async function executeSQL() {
  console.log('🔄 正在執行 payment_requests migration...\n')

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
          console.log('✅ updated_by 欄位新增成功！')
          console.log('\n🎉 payment_requests 表格已修復！')
          resolve()
        } else {
          console.error('❌ SQL 執行失敗')
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
