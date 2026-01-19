#!/bin/bash
# Venturo E2E 測試環境設定腳本
# 執行一次即可完成所有設定

echo "🔧 設定 Venturo E2E 測試環境..."

# 加入快捷指令到 zshrc（如果還沒有的話）
if ! grep -q "alias vtest=" ~/.zshrc 2>/dev/null; then
  echo '
# Venturo 測試指令
alias vtest="cd ~/Projects/venturo-erp && npm run test:e2e:headed"
alias vsmoke="cd ~/Projects/venturo-erp && npm run test:e2e:smoke"
alias vui="cd ~/Projects/venturo-erp && npm run test:e2e:ui"
alias vreport="cd ~/Projects/venturo-erp && npm run test:e2e -- --reporter=html && open playwright-report/index.html"
alias vfull="cd ~/Projects/venturo-erp && npm run test:e2e:full"
alias vorders="cd ~/Projects/venturo-erp && npm run test:e2e:full:orders"
alias vpay="cd ~/Projects/venturo-erp && npm run test:e2e:full:payments"
alias vtours="cd ~/Projects/venturo-erp && npm run test:e2e:full:tours"
alias vdev="cd ~/Projects/venturo-erp && npm run dev"
' >> ~/.zshrc
  echo "✅ 已加入快捷指令到 ~/.zshrc"
else
  echo "✅ 快捷指令已存在"
fi

# 載入設定
source ~/.zshrc

echo ""
echo "🎉 設定完成！可用指令："
echo ""
echo "  vtest    - 看瀏覽器跑測試（快速）"
echo "  vsmoke   - 快速煙霧測試"
echo "  vui      - 開 Playwright UI"
echo "  vreport  - 跑測試並開報告"
echo "  vfull    - 完整功能測試（慢速，每步都看清楚）"
echo "  vorders  - 只測訂單管理（完整）"
echo "  vpay     - 只測收款管理（完整）"
echo "  vtours   - 只測旅遊團管理（完整）"
echo "  vdev     - 啟動開發伺服器"
echo ""
echo "現在執行 vtest 開始測試..."
echo ""

# 直接執行測試
cd ~/Projects/venturo-erp && npm run test:e2e:headed
