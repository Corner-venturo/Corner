import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = 'kH6j4/UXg-+hGu@';
const PROJECT_REF = 'pfqvdacxowpgfamuvnsn';

// 嘗試不同的連接配置
const configs = [
  {
    name: 'Direct Connection (db.xxx.supabase.co)',
    config: {
      host: `db.${PROJECT_REF}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Pooler (aws pooler)',
    config: {
      host: 'aws-0-ap-southeast-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'Pooler (direct project)',
    config: {
      host: `${PROJECT_REF}.pooler.supabase.com`,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    }
  }
];

for (const { name, config } of configs) {
  console.log(`\n測試 ${name}...`);
  const client = new Client(config);

  try {
    await client.connect();
    console.log(`✅ ${name} 連接成功！`);

    const result = await client.query('SELECT version()');
    console.log(`PostgreSQL 版本: ${result.rows[0].version.substring(0, 50)}...`);

    await client.end();

    console.log(`\n🎉 找到可用的連接配置！`);
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('User:', config.user);

    process.exit(0);
  } catch (error) {
    console.log(`❌ 失敗: ${error.message}`);
    try { await client.end(); } catch {}
  }
}

console.log('\n❌ 所有連接方式都失敗');
process.exit(1);
