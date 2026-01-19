#!/bin/bash
# Venturo E2E 自動測試腳本
# 雙擊此檔案即可執行測試

cd ~/Projects/venturo-erp

echo "🚀 啟動 Venturo E2E 測試..."
echo ""

# 確保 dev server 在跑
if ! lsof -i:3000 > /dev/null 2>&1; then
  echo "📦 啟動 Dev Server..."
  npm run dev &
  sleep 10
fi

echo "🧪 開始執行測試..."
npm run test:e2e:headed

echo ""
echo "✅ 測試完成！按 Enter 關閉視窗..."
read
