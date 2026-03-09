#!/bin/bash
# scripts/run-migration.sh
# 用法: ./scripts/run-migration.sh supabase/migrations/xxx.sql
# 
# 執行 Supabase migration 使用 Management API
# 需要：SUPABASE_ACCESS_TOKEN 在 .env.local 或環境變數

set -e

SQL_FILE=$1

if [ -z "$SQL_FILE" ]; then
  echo "❌ 錯誤：請指定 migration 檔案"
  echo "用法: ./scripts/run-migration.sh supabase/migrations/xxx.sql"
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ 錯誤：檔案不存在 - $SQL_FILE"
  exit 1
fi

# 從 .env.local 讀取 SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  if [ -f .env.local ]; then
    export $(grep SUPABASE_ACCESS_TOKEN .env.local | xargs)
  fi
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ 錯誤：缺少 SUPABASE_ACCESS_TOKEN"
  echo "請在 .env.local 設定或執行: SUPABASE_ACCESS_TOKEN=xxx ./scripts/run-migration.sh ..."
  exit 1
fi

PROJECT_REF="pfqvdacxowpgfamuvnsn"

echo "🔧 執行 migration: $SQL_FILE"
echo ""

# 讀取 SQL 內容
QUERY=$(cat "$SQL_FILE")

# 執行 API 請求
RESPONSE=$(curl -s -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$QUERY" | jq -Rs .)}")

echo "📊 回應:"
echo "$RESPONSE" | jq .

# 檢查是否成功（返回空陣列 [] 表示成功）
if echo "$RESPONSE" | jq -e '. == []' > /dev/null 2>&1; then
  echo ""
  echo "✅ Migration 執行成功！"
  exit 0
elif echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
  echo ""
  echo "❌ Migration 失敗："
  echo "$RESPONSE" | jq -r '.message'
  exit 1
else
  echo ""
  echo "⚠️  無法判斷執行結果，請檢查回應"
  exit 1
fi
