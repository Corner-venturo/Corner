const { Client } = require('pg');

async function fixMessages() {
  // Supabase connection string format
  const client = new Client({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.pfqvdacxowpgfamuvnsn',
    password: 'Ngy1126jojo!', // 需要從環境變數或配置取得
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('連接資料庫...');
    await client.connect();
    console.log('已連接！');

    // 取得 workspace ID
    const wsResult = await client.query(
      'SELECT id FROM public.workspaces ORDER BY created_at LIMIT 1'
    );

    if (wsResult.rows.length === 0) {
      console.error('找不到 workspace');
      return;
    }

    const workspaceId = wsResult.rows[0].id;
    console.log('使用 workspace:', workspaceId);

    // 新增 updated_at 欄位（如果不存在）
    console.log('檢查並新增 updated_at 欄位...');
    await client.query(`
      ALTER TABLE public.messages 
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
    `);

    // 更新 messages 的 workspace_id
    console.log('更新 messages 表格...');
    const updateResult = await client.query(`
      UPDATE public.messages 
      SET workspace_id = $1,
          updated_at = COALESCE(edited_at::timestamptz, created_at::timestamptz, now())
      WHERE workspace_id IS NULL
    `, [workspaceId]);

    console.log('');
    console.log('✅ 成功更新', updateResult.rowCount, '筆 messages');

  } catch (error) {
    console.error('錯誤:', error.message);
  } finally {
    await client.end();
  }
}

fixMessages();
