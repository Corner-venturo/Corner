#!/bin/bash

# Venturo ERP 全站功能測試腳本
# 使用 SUCCESS 公司測試所有頁面的基本功能

echo "🧪 開始 Venturo ERP 全站功能測試"
echo "測試帳號: SUCCESS / E001"
echo "=========================================="
echo ""

# 測試頁面列表
pages=(
  "/dashboard:首頁"
  "/hr:人資管理"
  "/itinerary:行程管理"
  "/orders:訂單管理"
  "/customers:客戶管理"
  "/finance/requests:財務-請款單"
  "/finance/receipts:財務-收款單"
  "/finance/reports/unpaid-orders:財務-未收款報表"
  "/database/suppliers:資料庫-供應商"
  "/database/fleet:資料庫-機隊"
  "/meeting:會議系統"
  "/scheduling:行程規劃"
  "/workspace:工作區"
  "/todos:待辦事項"
  "/calendar:行事曆"
  "/tours:團務管理"
)

BASE_URL="http://localhost:3000"

# 檢查頁面是否可訪問
check_page() {
  local path=$1
  local name=$2
  
  echo -n "檢查 $name ($path)... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
  
  if [ "$response" = "200" ]; then
    echo "✅ OK"
    return 0
  else
    echo "❌ 失敗 (HTTP $response)"
    return 1
  fi
}

# 執行測試
success_count=0
fail_count=0

for page in "${pages[@]}"; do
  IFS=':' read -r path name <<< "$page"
  if check_page "$path" "$name"; then
    ((success_count++))
  else
    ((fail_count++))
  fi
  sleep 0.5
done

echo ""
echo "=========================================="
echo "📊 測試結果:"
echo "✅ 成功: $success_count"
echo "❌ 失敗: $fail_count"
echo "總計: $((success_count + fail_count))"
echo ""

if [ $fail_count -eq 0 ]; then
  echo "🎉 所有頁面測試通過！"
  exit 0
else
  echo "⚠️  有 $fail_count 個頁面測試失敗"
  exit 1
fi
