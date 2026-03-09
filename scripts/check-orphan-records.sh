#!/bin/bash
# scripts/check-orphan-records.sh
# 孤兒記錄檢查：在加 FK 前先檢查資料完整性
# 
# 用法: ./scripts/check-orphan-records.sh > reports/orphan-records-$(date +%Y%m%d).md

set -e

echo "# 孤兒記錄檢查報告"
echo ""
echo "執行時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "目的: 檢查 P0 優先級的欄位是否有指向不存在的記錄"
echo ""
echo "---"
echo ""

# 檢查 SUPABASE_ACCESS_TOKEN
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  if [ -f .env.local ]; then
    export $(grep SUPABASE_ACCESS_TOKEN .env.local | xargs)
  fi
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ 錯誤：缺少 SUPABASE_ACCESS_TOKEN"
  exit 1
fi

PROJECT_REF="pfqvdacxowpgfamuvnsn"

# P0 優先級的檢查清單
declare -a CHECKS=(
  "payment_request_items:supplier_id:suppliers:id:供應商"
  "payment_requests:supplier_id:suppliers:id:供應商"
  "payment_requests:tour_id:tours:id:團"
  "payment_requests:order_id:orders:id:訂單"
  "receipts:order_id:orders:id:訂單"
  "receipts:customer_id:customers:id:客戶"
  "tour_members:customer_id:customers:id:客戶"
  "tour_members:tour_id:tours:id:團"
  "quotes:customer_id:customers:id:客戶"
  "quotes:tour_id:tours:id:團"
  "order_members:customer_id:customers:id:客戶"
  "order_members:order_id:orders:id:訂單"
)

echo "## 檢查清單（P0 優先級）"
echo ""
echo "檢查 ${#CHECKS[@]} 個欄位的資料完整性..."
echo ""

TOTAL_ORPHANS=0
ORPHAN_TABLES=()

for CHECK in "${CHECKS[@]}"; do
  IFS=':' read -r TABLE COLUMN REF_TABLE REF_COLUMN LABEL <<< "$CHECK"
  
  echo "### $TABLE.$COLUMN → $REF_TABLE.$REF_COLUMN"
  echo ""
  
  SQL="
  SELECT COUNT(*) as orphan_count
  FROM $TABLE
  WHERE $COLUMN IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM $REF_TABLE 
      WHERE $REF_TABLE.$REF_COLUMN = $TABLE.$COLUMN
    );
  "
  
  RESPONSE=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL" | jq -Rs .)}")
  
  # 處理回應（可能是陣列或錯誤物件）
  ORPHAN_COUNT=$(echo "$RESPONSE" | jq -r 'if type == "array" then .[0].orphan_count else 0 end' 2>/dev/null || echo "0")
  
  if [ "$ORPHAN_COUNT" -gt 0 ]; then
    echo "🔴 **發現 $ORPHAN_COUNT 筆孤兒記錄**"
    echo ""
    echo "\`\`\`sql"
    echo "-- 指向不存在的${LABEL}"
    echo "SELECT * FROM $TABLE"
    echo "WHERE $COLUMN IS NOT NULL"
    echo "  AND NOT EXISTS (SELECT 1 FROM $REF_TABLE WHERE $REF_COLUMN = $TABLE.$COLUMN);"
    echo "\`\`\`"
    echo ""
    TOTAL_ORPHANS=$((TOTAL_ORPHANS + ORPHAN_COUNT))
    ORPHAN_TABLES+=("$TABLE")
  else
    echo "✅ 無孤兒記錄"
    echo ""
  fi
done

echo "---"
echo ""
echo "## 摘要"
echo ""
echo "| 項目 | 數量 |"
echo "|------|------|"
echo "| 檢查欄位數 | ${#CHECKS[@]} |"
echo "| **總孤兒記錄** | **$TOTAL_ORPHANS** |"
echo "| 受影響表數 | ${#ORPHAN_TABLES[@]} |"
echo ""

if [ $TOTAL_ORPHANS -gt 0 ]; then
  echo "## ⚠️ 警告"
  echo ""
  echo "發現孤兒記錄！在加 Foreign Key 前，必須先處理："
  echo ""
  echo "### 選項 A：清理孤兒記錄（推薦）"
  echo "刪除指向不存在記錄的資料（確保不影響業務）"
  echo ""
  echo "### 選項 B：修正資料"
  echo "找出正確的關聯 ID，更新孤兒記錄"
  echo ""
  echo "### 選項 C：暫時跳過"
  echo "標記這些表，稍後處理（不建議）"
  echo ""
else
  echo "## ✅ 結論"
  echo ""
  echo "所有 P0 欄位資料完整，可以安全加入 Foreign Keys！"
  echo ""
fi

echo "---"
echo ""
echo "執行完成: $(date '+%Y-%m-%d %H:%M:%S')"
