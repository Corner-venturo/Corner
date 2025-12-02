import https from 'https'

const SUPABASE_ACCESS_TOKEN = 'sbp_94746ae5e9ecc9d270d27006ba5ed1d0da0bbaf0'
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn'

const SQL = `
BEGIN;

ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.todos.updated_by IS 'Last user who updated this todo';

UPDATE public.todos
SET updated_by = created_by
WHERE updated_by IS NULL;

COMMIT;
`

async function executeSQL() {
  console.log('🔄 正在執行 SQL...\n')

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

  return new Promise((resolve, reject) => {
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
          resolve(data)
        } else {
          console.error('❌ SQL 執行失敗')
          console.error('回應:', data)

          if (res.statusCode === 404) {
            console.log('\n⚠️ Management API 端點不存在，請手動執行:')
            console.log('前往: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new')
            console.log('\n執行以下 SQL:\n')
            console.log(SQL)
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.log('\n⚠️ 認證失敗，Access Token 可能已過期')
            console.log('請前往: https://supabase.com/dashboard/account/tokens')
            console.log('產生新的 Personal Access Token 並更新 CLAUDE.md')
          }

          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ 請求錯誤:', error.message)
      console.log('\n⚠️ 網路連線失敗，請手動執行:')
      console.log('前往: https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new')
      console.log('\n執行以下 SQL:\n')
      console.log(SQL)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

executeSQL()
  .then(() => {
    console.log('\n🎉 Migration 完成！')
    console.log('請執行 node check-rls-status.js 驗證結果')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 執行失敗:', error.message)
    process.exit(1)
  })
