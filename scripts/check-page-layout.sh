#!/bin/bash

# 檢查所有頁面是否符合佈局規範
# 使用方式: ./scripts/check-page-layout.sh

echo "🔍 檢查頁面佈局規範..."
echo ""

ISSUES_FOUND=0

# 尋找所有 page.tsx 檔案
find src/app -name "page.tsx" -type f | while read file; do
  # 跳過 layout.tsx
  if [[ "$file" == *"layout.tsx"* ]]; then
    continue
  fi

  # 檢查是否有 h-full flex flex-col
  if ! grep -q "h-full flex flex-col" "$file"; then
    echo "❌ $file"
    echo "   缺少: h-full flex flex-col"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi

  # 檢查是否有 flex-1
  if ! grep -q "flex-1" "$file"; then
    echo "⚠️  $file"
    echo "   缺少: flex-1 (內容區)"
    echo ""
  fi
done

if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ 所有頁面佈局正確"
else
  echo "❌ 發現 $ISSUES_FOUND 個問題"
  echo ""
  echo "📖 請參考: docs/VENTURO_5.0_MANUAL.md - UI 開發規範"
fi
