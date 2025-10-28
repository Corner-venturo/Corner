#!/bin/bash

echo "🔐 請提供 Supabase 資料庫密碼"
echo "   (可在 Supabase Dashboard → Settings → Database → Database Password 找到)"
echo ""
read -sp "Database Password: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ 未提供密碼"
    exit 1
fi

echo "🔄 執行 migration..."

npx supabase db push \
  --db-url "postgresql://postgres.pfqvdacxowpgfamuvnsn:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  --include-all

if [ $? -eq 0 ]; then
    echo "✅ Migration 執行成功！"
else
    echo "❌ Migration 執行失敗"
    echo ""
    echo "📋 請手動執行:"
    echo "1. 前往 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new"
    echo "2. 複製貼上: supabase/migrations/20251025_create_tours_table.sql"
    echo "3. 點擊 Run"
fi
