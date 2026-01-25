#!/bin/bash
# Venturo ERP - 無限循環 E2E 測試
# 整晚不斷跑，發現錯誤就記錄
# 使用方式: ./scripts/endless-e2e.sh
# 停止方式: Ctrl+C

set -e

PROJECT_DIR="/Users/williamchien/Projects/venturo-erp"
LOG_DIR="$PROJECT_DIR/test-results/endless"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SESSION_LOG="$LOG_DIR/session-$TIMESTAMP.log"
ISSUES_FILE="$LOG_DIR/issues-$TIMESTAMP.md"

mkdir -p "$LOG_DIR"

# 初始化問題檔案
cat > "$ISSUES_FILE" << 'EOF'
# E2E 測試發現的問題

> 自動產生，每次發現問題會追加

---

EOF

echo "========================================" | tee "$SESSION_LOG"
echo "  Venturo ERP - 無限循環 E2E 測試" | tee -a "$SESSION_LOG"
echo "  開始時間: $(date)" | tee -a "$SESSION_LOG"
echo "  按 Ctrl+C 停止" | tee -a "$SESSION_LOG"
echo "========================================" | tee -a "$SESSION_LOG"

cd "$PROJECT_DIR"

# 確保 dev server 在跑
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "請先在另一個終端機執行: npm run dev" | tee -a "$SESSION_LOG"
    exit 1
fi

ROUND=0
TOTAL_PASSED=0
TOTAL_FAILED=0

# 捕捉 Ctrl+C
trap 'echo ""; echo "收到停止信號，結束測試..."; echo "總輪數: $ROUND, 通過: $TOTAL_PASSED, 失敗: $TOTAL_FAILED"; exit 0' INT

while true; do
    ROUND=$((ROUND + 1))

    echo "" | tee -a "$SESSION_LOG"
    echo "╔════════════════════════════════════════╗" | tee -a "$SESSION_LOG"
    echo "║  第 $ROUND 輪測試開始                         ║" | tee -a "$SESSION_LOG"
    echo "║  時間: $(date '+%Y-%m-%d %H:%M:%S')              ║" | tee -a "$SESSION_LOG"
    echo "╚════════════════════════════════════════╝" | tee -a "$SESSION_LOG"

    # 跑所有 full 測試（慢速模式）
    if npx playwright test --config=playwright.slow.config.ts 2>&1 | tee -a "$SESSION_LOG"; then
        echo "" | tee -a "$SESSION_LOG"
        echo "✅ 第 $ROUND 輪全部通過" | tee -a "$SESSION_LOG"
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
    else
        echo "" | tee -a "$SESSION_LOG"
        echo "❌ 第 $ROUND 輪有測試失敗" | tee -a "$SESSION_LOG"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))

        # 記錄到問題檔案
        echo "" >> "$ISSUES_FILE"
        echo "## 第 $ROUND 輪 - $(date '+%Y-%m-%d %H:%M:%S')" >> "$ISSUES_FILE"
        echo "" >> "$ISSUES_FILE"
        echo "有測試失敗，請查看報告：" >> "$ISSUES_FILE"
        echo "\`\`\`" >> "$ISSUES_FILE"
        echo "npx playwright show-report" >> "$ISSUES_FILE"
        echo "\`\`\`" >> "$ISSUES_FILE"
        echo "" >> "$ISSUES_FILE"

        # 發送通知
        osascript -e 'display notification "第 '"$ROUND"' 輪有測試失敗！" with title "Venturo E2E"' 2>/dev/null || true
    fi

    echo "" | tee -a "$SESSION_LOG"
    echo "累計: 通過 $TOTAL_PASSED 輪, 失敗 $TOTAL_FAILED 輪" | tee -a "$SESSION_LOG"

    # 休息 10 分鐘後繼續下一輪
    echo "" | tee -a "$SESSION_LOG"
    echo "休息 10 分鐘後開始第 $((ROUND + 1)) 輪..." | tee -a "$SESSION_LOG"
    echo "按 Ctrl+C 停止" | tee -a "$SESSION_LOG"
    sleep 600
done
