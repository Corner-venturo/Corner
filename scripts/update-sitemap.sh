#!/bin/bash
# scripts/update-sitemap.sh
# 自動更新網站地圖（SITEMAP.md）
# 用法: ./scripts/update-sitemap.sh

set -e

PROJECT_ROOT=$(pwd)
APP_DIR="$PROJECT_ROOT/src/app/(main)"
SITEMAP_FILE="$HOME/.openclaw/workspace-matthew/company/SITEMAP.md"

echo "🔍 掃描路由中..."

# 取得所有路由
ROUTES=$(find "$APP_DIR" -type f -name "page.tsx" | sed "s|$APP_DIR||g" | sed 's|/page.tsx||g' | sort)
ROUTE_COUNT=$(echo "$ROUTES" | wc -l | tr -d ' ')

echo "✅ 找到 $ROUTE_COUNT 個路由"
echo ""

# 顯示路由列表
echo "📋 路由列表："
echo "$ROUTES" | while read -r route; do
  if [ -z "$route" ]; then
    echo "  - /"
  else
    echo "  - $route"
  fi
done

echo ""
echo "💡 提示："
echo "  1. 請手動更新 $SITEMAP_FILE"
echo "  2. 或者使用此列表更新向量庫："
echo ""
echo "cd ~/.openclaw/workspace-matthew"
echo 'python3 shared-memory/mem0-store.py --text "路由總數：'$ROUTE_COUNT' 個（2026-03-13）" --metadata '"'"'{"category":"sitemap"}'"'"

echo ""
echo "✅ 掃描完成！"
