#!/bin/bash

# Supabase 連線資訊
SUPABASE_URL="https://pfqvdacxowpgfamuvnsn.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE"

echo "📝 讀取 SQL migration..."
SQL_FILE="/Users/william/Projects/venturo-new/supabase/migrations/20251025_create_tours_table.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 找不到 SQL 檔案: $SQL_FILE"
    exit 1
fi

echo "🔄 執行 SQL migration..."

# 使用 Supabase Management API
# 注意：這需要有正確的權限和 API endpoint
echo ""
echo "⚠️  請手動在 Supabase Dashboard 執行此 SQL："
echo "👉 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new"
echo ""
echo "或複製以下 SQL 到 SQL Editor："
echo "================================================"
cat "$SQL_FILE"
echo "================================================"
echo ""
echo "💡 提示：在 Supabase Dashboard → SQL Editor → 貼上 SQL → Run"
