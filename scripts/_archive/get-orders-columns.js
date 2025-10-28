import pg from 'pg';
import { config } from 'dotenv';

config();

const { Client } = pg;

const client = new Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.pfqvdacxowpgfamuvnsn',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function getOrdersColumns() {
  try {
    await client.connect();
    console.log('✅ 已連接到 Supabase\n');

    // 查詢 orders 表的所有欄位
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    console.log('=== Orders 表欄位 ===\n');
    console.log('總共', result.rows.length, '個欄位：\n');

    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '可空' : '必填';
      const hasDefault = row.column_default ? `(預設: ${row.column_default})` : '';
      console.log(`${row.column_name.padEnd(30)} ${row.data_type.padEnd(20)} ${nullable} ${hasDefault}`);
    });

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await client.end();
  }
}

getOrdersColumns();
