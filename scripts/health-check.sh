#!/bin/bash

echo "========================================="
echo "🔍 步驟一：檢查資料庫欄位命名..."
echo "========================================="
# 檢查 Supabase 查詢中欄位名稱使用 camelCase 的情況
# 正確: .eq('created_at', value)
# 錯誤: .eq('createdAt', value)
# 注意：只檢查引號內的欄位名，不檢查變數
files_with_db_naming_issues=$(grep -r -n -E "\.(eq|neq|gt|gte|lt|lte|like|ilike)\(['\"][a-z]+[A-Z][a-zA-Z]*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20)
if [ -z "$files_with_db_naming_issues" ]; then
  echo "✅ 資料庫欄位命名檢查通過！"
else
  echo "⚠️ 注意：以下位置資料庫欄位使用了 camelCase（應改為 snake_case）："
  echo "$files_with_db_naming_issues"
fi
echo ""

echo "========================================="
echo "🔍 步驟二：分析 'any' 型別使用情況..."
echo "========================================="
# 搜尋 ts/tsx 檔案中的 any 型別
files_with_any=$(grep -r -l -w "any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)
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
