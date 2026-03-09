#!/bin/bash
# scripts/health-check-fk.sh
# Foreign Key 健檢：掃描所有缺少 FK 的欄位
# 
# 用法: ./scripts/health-check-fk.sh > reports/fk-health-check-$(date +%Y%m%d).md

set -e

echo "# Foreign Key 健檢報告"
echo ""
echo "執行時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "資料庫: Venturo ERP (pfqvdacxowpgfamuvnsn)"
echo ""
echo "---"
echo ""

# 檢查 SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  if [ -f .env.local ]; then
    export $(grep SUPABASE_ACCESS_TOKEN .env.local | xargs)
  fi
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ 錯誤：缺少 SUPABASE_ACCESS_TOKEN"
  exit 1
fi

PROJECT_REF="pfqvdacxowpgfamuvnsn"

echo "## 1. 掃描所有 *_id 欄位"
echo ""

# 執行 SQL 查詢：找出所有 _id 結尾的欄位
SQL_QUERY="
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  CASE 
    WHEN c.column_name = 'id' THEN 'PRIMARY_KEY'
    WHEN c.column_name LIKE '%_id' THEN 'POTENTIAL_FK'
    ELSE 'OTHER'
  END as column_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND (c.column_name LIKE '%_id' OR c.column_name = 'id')
  AND c.data_type IN ('uuid', 'integer', 'bigint', 'text')
ORDER BY t.table_name, c.column_name;
"

RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_QUERY" | jq -Rs .)}")

# 儲存結果到暫存檔
echo "$RESPONSE" > /tmp/fk-check-columns.json

COLUMN_COUNT=$(echo "$RESPONSE" | jq 'length')
echo "找到 $COLUMN_COUNT 個 *_id 欄位"
echo ""

echo "## 2. 檢查現有 Foreign Keys"
echo ""

SQL_FK_QUERY="
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
"

FK_RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_FK_QUERY" | jq -Rs .)}")

echo "$FK_RESPONSE" > /tmp/fk-check-existing.json

FK_COUNT=$(echo "$FK_RESPONSE" | jq 'length')
echo "找到 $FK_COUNT 個現有 Foreign Keys"
echo ""

echo "## 3. 分析缺失的 Foreign Keys"
echo ""
echo "正在比對..."
echo ""

# 用 Node.js 分析差異
node --input-type=module <<'EOFJS'
import fs from 'fs';

const columns = JSON.parse(fs.readFileSync('/tmp/fk-check-columns.json', 'utf-8'));
const fks = JSON.parse(fs.readFileSync('/tmp/fk-check-existing.json', 'utf-8'));

// 建立已有 FK 的 map
const existingFKs = new Set();
fks.forEach(fk => {
  existingFKs.add(`${fk.table_name}.${fk.column_name}`);
});

// 找出可能缺失的 FK
const potentialMissing = [];
const ignorePatterns = [
  'created_by',
  'updated_by',
  'deleted_by',
  'approved_by',
  'confirmed_by',
  'workspace_id', // 通常有 FK 但可能例外
];

columns.forEach(col => {
  if (col.column_name === 'id') return; // 跳過主鍵
  if (!col.column_name.endsWith('_id')) return; // 只檢查 _id 欄位
  
  const key = `${col.table_name}.${col.column_name}`;
  
  // 檢查是否在忽略清單
  const shouldIgnore = ignorePatterns.some(pattern => 
    col.column_name === pattern || col.column_name.endsWith(`_${pattern}`)
  );
  
  if (!existingFKs.has(key) && !shouldIgnore) {
    potentialMissing.push(col);
  }
});

console.log(`### 🔴 可能缺失的 Foreign Keys: ${potentialMissing.length} 個`);
console.log('');
console.log('| 表名 | 欄位 | 資料型態 | 可能指向 |');
console.log('|------|------|----------|----------|');

potentialMissing.forEach(col => {
  // 猜測目標表（移除 _id 並轉複數）
  let targetTable = col.column_name.replace(/_id$/, '');
  if (!targetTable.endsWith('s')) {
    targetTable += 's';
  }
  
  console.log(`| ${col.table_name} | ${col.column_name} | ${col.data_type} | ${targetTable}? |`);
});

console.log('');
console.log('---');
console.log('');

// 統計
console.log('## 4. 統計摘要');
console.log('');
console.log('| 項目 | 數量 |');
console.log('|------|------|');
console.log(`| 總表數 | ${new Set(columns.map(c => c.table_name)).size} |`);
console.log(`| 總 *_id 欄位 | ${columns.filter(c => c.column_name.endsWith('_id')).length} |`);
console.log(`| 現有 FK | ${fks.length} |`);
console.log(`| **可能缺失 FK** | **${potentialMissing.length}** |`);
console.log('');

EOFJS

echo ""
echo "## 5. 下一步建議"
echo ""
echo "1. 人工審查上述缺失的 FK 清單"
echo "2. 確認哪些欄位真的需要 FK 約束"
echo "3. 建立 migration 檔案批次加入 FK"
echo "4. 執行前先檢查是否有孤兒記錄"
echo ""
echo "---"
echo ""
echo "執行完成: $(date '+%Y-%m-%d %H:%M:%S')"
