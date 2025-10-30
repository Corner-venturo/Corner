# 電子書動畫系統 - 故障排除指南

## 常見錯誤與解決方案

### ❌ WebSocket 連接錯誤

**錯誤訊息**:
```
WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr' failed
```

**原因**:
- Next.js 熱模塊重載 (HMR) 的 WebSocket 連接問題
- 通常由防火牆、VPN 或網絡配置引起

**影響**:
- ⚠️ 警告級別，不影響應用功能
- 只影響開發時的熱重載（需手動刷新頁面）

**解決方案**:
1. **忽略警告**（推薦）- 不影響生產環境
2. **檢查防火牆** - 確保允許 localhost:3000
3. **使用硬刷新** - Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
4. **已應用的修復** - `next.config.ts` 中加入 webpack watchOptions

---

### ❌ Chrome 擴展錯誤

**錯誤訊息**:
```
workspace:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

**原因**:
- 瀏覽器擴展（如 Grammarly、LastPass、廣告攔截器等）引起
- **與我們的代碼無關**

**影響**:
- ❌ 無影響，可安全忽略

**解決方案**:
1. **使用無痕模式測試**:
   ```
   Chrome: Cmd+Shift+N (Mac) 或 Ctrl+Shift+N (Windows)
   ```

2. **禁用擴展測試**:
   - 打開 `chrome://extensions/`
   - 逐個禁用擴展並測試
   - 常見問題擴展：
     * Grammarly
     * 廣告攔截器 (AdBlock, uBlock)
     * 密碼管理器 (LastPass, 1Password)

3. **生產環境無影響** - 部署後不會出現此錯誤

---

### ❌ 動畫卡頓或不流暢

**原因**:
- 瀏覽器性能不足
- 開發者工具開啟（降低性能）
- 過多標籤頁或擴展

**解決方案**:
1. 使用 Chrome 或 Edge 瀏覽器
2. 關閉開發者工具
3. 關閉不必要的標籤頁
4. 禁用不必要的擴展

---

### ⚠️ Workspace Root 警告

**錯誤訊息**:
```
Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles...
```

**原因**:
- 父目錄和專案目錄都有 `package-lock.json`

**影響**:
- ⚠️ 警告級別，不影響功能

**解決方案**:
1. **忽略警告**（推薦）- 不影響開發和部署
2. **刪除父目錄的 lockfile**:
   ```bash
   rm /Users/william/package-lock.json
   ```
3. **或在 `next.config.ts` 設置**（可能影響 build）:
   ```typescript
   outputFileTracingRoot: process.cwd()
   ```

---

## 驗證電子書功能

### 測試清單

訪問 http://localhost:3000/ebook 並檢查：

- [ ] 封面正確顯示
- [ ] 浪花動畫正常播放
- [ ] 點擊封面能打開書本
- [ ] 右頁翻轉動畫流暢（1.4s）
- [ ] 攤開後能瀏覽內容
- [ ] 左右頁導航正常
- [ ] 點擊「結束閱讀」能收合
- [ ] 收合動畫流暢（1.2s）
- [ ] 結束畫面顯示正確
- [ ] 點擊「重新開始」回到封面

### 瀏覽器兼容性

| 瀏覽器 | 版本 | 狀態 |
|--------|------|------|
| Chrome | 90+ | ✅ 完全支援 |
| Edge | 90+ | ✅ 完全支援 |
| Safari | 14+ | ✅ 完全支援 |
| Firefox | 88+ | ✅ 完全支援 |

---

## 開發模式 vs 生產模式

### 開發模式 (npm run dev)
- ⚠️ 可能出現 WebSocket 警告
- ⚠️ 可能出現擴展錯誤
- ✅ HMR 熱重載
- ✅ 詳細錯誤訊息

### 生產模式 (npm run build && npm start)
- ✅ 無 WebSocket 警告
- ✅ 無擴展錯誤（大部分情況）
- ✅ 最佳性能
- ⚠️ 錯誤訊息較少

---

## 性能優化建議

### 如果動畫卡頓

1. **檢查 CPU 使用率**:
   - Mac: Activity Monitor
   - Windows: Task Manager

2. **降低動畫複雜度**（可選）:
   編輯 `src/app/ebook/components/WavePattern.tsx`:
   ```tsx
   // 減少浪花粒子數量
   {[...Array(6)].map((_, i) => ( // 原本 12 個，改為 6 個
   ```

3. **關閉開發模式的額外檢查**:
   ```bash
   NODE_ENV=production npm run build
   npm start
   ```

---

## 聯繫支援

如果上述方法都無法解決問題，請提供以下信息：

1. **瀏覽器版本**: 在地址欄輸入 `chrome://version/`
2. **錯誤截圖**: 打開開發者工具 (F12) → Console 標籤
3. **操作步驟**: 描述如何重現問題
4. **系統信息**: 作業系統和版本

---

**最後更新**: 2025-10-29
**文檔版本**: v1.0.0
