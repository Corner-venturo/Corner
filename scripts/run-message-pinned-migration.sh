#!/bin/bash

# 訊息置頂功能 - 資料庫設置腳本

echo "================================"
echo "訊息置頂功能 - 資料庫升級"
echo "================================"
echo ""

SQL_FILE="supabase/migrations/20250124_add_message_pinned.sql"

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
echo "2. 取消"
echo ""
read -p "請輸入選項 (1-2): " choice

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
        echo "1. 前往 Supabase Dashboard"
        echo "2. 點擊左側 'SQL Editor'"
        echo "3. 點擊 'New query'"
        echo "4. 貼上以上 SQL 內容"
        echo "5. 點擊 'Run' 執行"
        echo "========================================="
        ;;
    2)
        echo "已取消"
        exit 0
        ;;
    *)
        echo "無效的選項"
        exit 1
        ;;
esac
