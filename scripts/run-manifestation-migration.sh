#!/bin/bash

# 顯化魔法資料庫 Migration 執行腳本

echo "================================"
echo "顯化魔法 - 資料庫設置"
echo "================================"
echo ""

SQL_FILE="src/lib/db/migrations/create_manifestation_entries.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 錯誤：找不到 SQL 檔案"
    echo "   檔案位置：$SQL_FILE"
    exit 1
fi

echo "📄 SQL 檔案已找到"
echo ""
echo "請選擇執行方式："
echo ""
echo "1. 顯示 SQL 內容（複製到 Supabase Dashboard）"
echo "2. 使用 curl 直接執行（需要 Service Role Key）"
echo "3. 取消"
echo ""
read -p "請輸入選項 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "========================================="
        echo "請複製以下 SQL 內容："
        echo "========================================="
        echo ""
        cat "$SQL_FILE"
        echo ""
        echo "========================================="
        echo "執行步驟："
        echo "1. 前往 https://pfqvdacxowpgfamuvnsn.supabase.co"
        echo "2. 點擊左側 'SQL Editor'"
        echo "3. 點擊 'New query'"
        echo "4. 貼上以上 SQL 內容"
        echo "5. 點擊 'Run' 執行"
        echo "========================================="
        ;;
    2)
        # 載入環境變數
        if [ -f .env.local ]; then
            export $(cat .env.local | grep -v '^#' | xargs)
        fi

        if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            echo "❌ 錯誤：找不到 SUPABASE_SERVICE_ROLE_KEY"
            echo "   請確認 .env.local 檔案中有設定此變數"
            exit 1
        fi

        echo ""
        echo "⚠️  注意：此方式需要 Supabase Service Role Key"
        echo "   這是一個高權限操作"
        echo ""
        read -p "確定要繼續嗎？(y/n): " confirm

        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo ""
            echo "🚀 開始執行 SQL..."

            # 讀取 SQL 內容
            SQL_CONTENT=$(cat "$SQL_FILE")

            # 執行 SQL
            curl -X POST \
                "https://pfqvdacxowpgfamuvnsn.supabase.co/rest/v1/rpc/exec_sql" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Content-Type: application/json" \
                -d "{\"query\": $(jq -Rs . <<< "$SQL_CONTENT")}"

            echo ""
            echo "✅ SQL 執行完成"
        else
            echo "已取消"
        fi
        ;;
    3)
        echo "已取消"
        exit 0
        ;;
    *)
        echo "❌ 無效的選項"
        exit 1
        ;;
esac

echo ""
echo "完成！"
