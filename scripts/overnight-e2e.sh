#!/bin/bash
# Venturo ERP - 整晚 E2E 測試腳本
# 使用方式: ./scripts/overnight-e2e.sh

set -e

PROJECT_DIR="/Users/williamchien/Projects/venturo-erp"
LOG_DIR="$PROJECT_DIR/test-results/overnight"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/overnight-$TIMESTAMP.log"

# 建立目錄
mkdir -p "$LOG_DIR"

echo "========================================" | tee "$LOG_FILE"
echo "  Venturo ERP - 整晚 E2E 測試" | tee -a "$LOG_FILE"
echo "  開始時間: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

cd "$PROJECT_DIR"

# 確保 dev server 在跑
echo "檢查 dev server..." | tee -a "$LOG_FILE"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "啟動 dev server..." | tee -a "$LOG_FILE"
    npm run dev &
    DEV_PID=$!
    sleep 30  # 等待 server 啟動
fi

# 測試檔案列表（按順序慢慢跑）
TESTS=(
    "auth.spec.ts"
    "tours.full.spec.ts"
    "tours-create.full.spec.ts"
    "orders.full.spec.ts"
    "orders-create.full.spec.ts"
    "payments.full.spec.ts"
    "payments-create.full.spec.ts"
    "customers-lifecycle.spec.ts"
    "visas-crud.spec.ts"
    "calendar-page.spec.ts"
    "quotes-page.spec.ts"
    "other-pages.spec.ts"
)

TOTAL=${#TESTS[@]}
PASSED=0
FAILED=0

for i in "${!TESTS[@]}"; do
    TEST="${TESTS[$i]}"
    CURRENT=$((i + 1))

    echo "" | tee -a "$LOG_FILE"
    echo "----------------------------------------" | tee -a "$LOG_FILE"
    echo "[$CURRENT/$TOTAL] 測試: $TEST" | tee -a "$LOG_FILE"
    echo "時間: $(date '+%H:%M:%S')" | tee -a "$LOG_FILE"
    echo "----------------------------------------" | tee -a "$LOG_FILE"

    # 使用 slow config 跑單一測試
    if npx playwright test "$TEST" --config=playwright.slow.config.ts --headed 2>&1 | tee -a "$LOG_FILE"; then
        echo "✅ 通過: $TEST" | tee -a "$LOG_FILE"
        PASSED=$((PASSED + 1))
    else
        echo "❌ 失敗: $TEST" | tee -a "$LOG_FILE"
        FAILED=$((FAILED + 1))
    fi

    # 每個測試之間休息 5 分鐘（慢慢來）
    if [ $CURRENT -lt $TOTAL ]; then
        echo "" | tee -a "$LOG_FILE"
        echo "休息 5 分鐘後繼續下一個測試..." | tee -a "$LOG_FILE"
        sleep 300
    fi
done

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "  測試完成！" | tee -a "$LOG_FILE"
echo "  結束時間: $(date)" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"
echo "  總共: $TOTAL 個測試" | tee -a "$LOG_FILE"
echo "  通過: $PASSED" | tee -a "$LOG_FILE"
echo "  失敗: $FAILED" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"
echo "  Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "  錄影: $PROJECT_DIR/test-results/" | tee -a "$LOG_FILE"
echo "  報告: npx playwright show-report" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# macOS 通知
osascript -e 'display notification "E2E 測試完成！通過: '"$PASSED"', 失敗: '"$FAILED"'" with title "Venturo QA"' 2>/dev/null || true

# 如果有失敗，開啟報告
if [ $FAILED -gt 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "有測試失敗，開啟報告..." | tee -a "$LOG_FILE"
    npx playwright show-report
fi
