/**
 * 建立使用者 LIAO00
 * 員工編號: LIAO00
 * 密碼: 83212711
 */

const bcrypt = require('bcryptjs')

async function generatePasswordHash() {
  const password = '83212711'
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  console.log('\n✅ 密碼 Hash 生成成功')
  console.log('密碼:', password)
  console.log('Hash:', hash)
  console.log('\n請將以下 SQL 貼到 Supabase SQL Editor 執行：\n')

  const sql = `
-- 新增工程師使用者 LIAO00
INSERT INTO public.employees (
  id,
  employee_number,
  display_name,
  chinese_name,
  email,
  password_hash,
  permissions,
  is_active,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'LIAO00',
  'LIAO00',
  'LIAO 工程師',
  'liao00@venturo.com',
  '${hash}',
  ARRAY['admin']::text[],
  true,
  'active',
  now(),
  now()
)
ON CONFLICT (employee_number) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = now();
`

  console.log(sql)
}

generatePasswordHash().catch(console.error)
