#!/bin/bash

echo "========================================="
echo "🔍 步驟一：檢查殘留的舊命名..."
echo "========================================="
# -l 只列出有匹配的檔名
files_with_old_names=$(rg -i -l "(createdat|author_id|creator_user_id|tourid|orderid|paymentdate|itemname|quoteid|changenote|receiptid|memberid|processedby)" src/)
if [ -z "$files_with_old_names" ]; then
  echo "✅ 命名一致性檢查通過！未發現殘留的舊命名。"
else
  echo "⚠️ 注意：在以下檔案中發現了殘留的舊命名："
  echo "$files_with_old_names"
fi
echo ""

echo "========================================="
echo "🔍 步驟二：分析 'any' 型別使用情況..."
echo "========================================="
# --glob 只搜尋 ts/tsx 檔案, -w 全詞匹配
files_with_any=$(rg -l --glob="**/*.{ts,tsx}" -w "any" src/)
if [ -z "$files_with_any" ]; then
  echo "✅ 'any' 型別檢查通過！"
else
  count=$(echo "$files_with_any" | wc -l | xargs)
  echo "⚠️ 注意：在 $count 個檔案中發現了 'any' 型別。清單如下："
  echo "$files_with_any"
fi
echo ""

echo "========================================="
echo "🔍 步驟三：列出最大的 10 個 React 元件..."
echo "========================================="
echo "（行數, 檔案路徑）"
find src -name "*.tsx" -exec wc -l {} + | sort -rn | head -n 10
echo ""

echo "========================================="
echo "🔍 步驟四：執行 TypeScript 類型檢查..."
echo "========================================="
npm run type-check
if [ $? -eq 0 ]; then
  echo "✅ TypeScript 類型檢查通過！"
else
  echo "❌ TypeScript 類型檢查失敗，請修復上述錯誤。"
fi
echo ""

echo "========================================="
echo "🔍 步驟五：執行測試..."
echo "========================================="
npm test -- --run
if [ $? -eq 0 ]; then
  echo "✅ 所有測試通過！"
else
  echo "❌ 部分測試失敗，請修復上述錯誤。"
fi
echo ""

echo "========================================="
echo "✅ 健康檢查完畢。"
echo "========================================="
