# Trip.com 機票訂單自動同步 - 部署指引

## 系統概述

**目的**: 自動從 William Gmail 抓取 Trip.com 機票訂單郵件，解析 PDF，寫入 Google Sheet

**組件**:

1. Gmail API (搜尋+下載郵件)
2. Python Parser (PDF 解析)
3. Google Sheets API (寫入訂單)
4. n8n Workflow (自動化流程)
5. Telegram Bot (錯誤通知)

**執行頻率**: 每 6 小時（00:00, 06:00, 12:00, 18:00）

---

## 前置準備

### 1. 系統需求

- Python 3.8+ (已安裝 PyPDF2)
- Docker (用於 n8n) 或 npm (用於 n8n)
- Google Cloud 專案（Gmail API + Sheets API 已啟用）
- Telegram Bot (用於錯誤通知)

### 2. 檔案檢查清單

確認以下檔案存在：

```bash
cd ~/Projects/venturo-erp

# ✅ 核心腳本
ls scripts/trip-flight-parser-final.py
ls scripts/trip-flight-parser-n8n.py
ls scripts/create-trip-sheet.py
ls scripts/test-trip-sync.py

# ✅ 文件
ls docs/google-api-setup.md
ls docs/n8n-trip-flight-workflow.md
ls docs/trip-sync-deployment-guide.md

# ✅ n8n workflow
ls n8n-workflows/trip-flight-sync.json
```

---

## 部署步驟

### Step 1: Google API 設定

#### 1.1 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案：「Venturo ERP - Trip.com Sync」
3. 啟用 API:
   - Gmail API
   - Google Sheets API
   - Google Drive API (用於分享 Sheet)

#### 1.2 建立 OAuth 2.0 認證

1. 導航到「API 和服務」→「憑證」
2. 建立 OAuth 用戶端 ID:
   - 應用程式類型：桌面應用程式
   - 名稱：Trip.com Parser
3. 下載 JSON，儲存為：`~/Projects/venturo-erp/.credentials/google-oauth.json`

#### 1.3 建立服務帳號

1. 導航到「API 和服務」→「憑證」
2. 建立服務帳號:
   - 名稱：Venturo ERP Service
   - 角色：編輯者
3. 建立金鑰（JSON）
4. 下載並儲存為：`~/Projects/venturo-erp/.credentials/service-account.json`
5. **記錄服務帳號 email**（稍後授權 Google Sheet 會用到）

#### 1.4 初次 OAuth 認證

```bash
cd ~/Projects/venturo-erp

# 執行初次認證（會開啟瀏覽器）
python3 scripts/google-auth-init.py
```

這會產生：`~/Projects/venturo-erp/.credentials/google-token.json`

---

### Step 2: 建立 Google Sheet

```bash
cd ~/Projects/venturo-erp

# 執行建立腳本
python3 scripts/create-trip-sheet.py
```

**輸出範例**:

```
✅ Google Sheet 已建立
   ID: 1A2B3C4D5E6F...
   URL: https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F...

✅ 已授權給服務帳號: venturo-erp@project-id.iam.gserviceaccount.com
```

**記錄 Spreadsheet ID**，稍後設定 n8n 會用到。

---

### Step 3: 測試系統

```bash
cd ~/Projects/venturo-erp

# 執行測試腳本
python3 scripts/test-trip-sync.py
```

**預期輸出**:

```
✅ Google Sheet 已建立
✅ Access token 已取得
✅ 找到 3 封郵件
✅ 成功: 3/3

🎉 測試通過！系統可以部署
```

如果有失敗項目，請檢查錯誤訊息並修正。

---

### Step 4: 安裝 n8n

#### 選項 A: 使用 Docker（推薦）

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e WEBHOOK_URL=http://localhost:5678/ \
  n8nio/n8n
```

#### 選項 B: 使用 npm

```bash
npm install -g n8n

# 啟動
n8n start
```

開啟瀏覽器：http://localhost:5678

---

### Step 5: 設定 n8n Credentials

#### 5.1 Gmail OAuth2

1. 在 n8n UI 中，點擊 Settings → Credentials
2. 點擊「Add Credential」
3. 選擇「Gmail OAuth2 API」
4. 填入：
   - **Client ID**: 從 `google-oauth.json` 複製 `client_id`
   - **Client Secret**: 從 `google-oauth.json` 複製 `client_secret`
5. 點擊「Connect my account」授權
6. 儲存

#### 5.2 Google Sheets OAuth2

1. 同上，選擇「Google Sheets OAuth2 API」
2. 填入相同的 Client ID 和 Client Secret
3. 授權並儲存

#### 5.3 Telegram Bot

1. 如果還沒有 Bot，先建立：
   - 在 Telegram 中找 @BotFather
   - 執行 `/newbot`
   - 取得 Bot Token

2. 在 n8n 中新增 Telegram Credential:
   - Access Token: 貼上 Bot Token
   - 儲存

---

### Step 6: 匯入 Workflow

1. 在 n8n UI 中，點擊「Import from File」
2. 選擇：`~/Projects/venturo-erp/n8n-workflows/trip-flight-sync.json`
3. 匯入後會看到完整的 workflow 流程圖

---

### Step 7: 設定 Workflow

#### 7.1 更新 Spreadsheet ID

1. 找到「Google Sheets - Append Row」節點
2. 點擊編輯
3. 在 Document ID 欄位，填入 Step 2 記錄的 Spreadsheet ID
4. 儲存

#### 7.2 設定 Credentials

確認所有節點都已連接正確的 credentials:

- Gmail 節點 → Gmail OAuth2
- Google Sheets 節點 → Google Sheets OAuth2
- Telegram 節點 → Telegram Bot

#### 7.3 更新 Python 腳本路徑

1. 找到「Parse PDF」節點（Execute Command）
2. 確認路徑：`/Users/tokichin/Projects/venturo-erp/scripts/trip-flight-parser-n8n.py`
3. 如果路徑不同，請修改

---

### Step 8: 測試 Workflow

#### 8.1 手動測試

1. 在 n8n UI 中，點擊 workflow 上方的「Execute Workflow」
2. 觀察每個節點的執行結果
3. 檢查 Google Sheet 是否有新資料

#### 8.2 驗證項目

- ✅ Gmail 節點成功搜尋到郵件
- ✅ PDF 附件成功下載
- ✅ Python 解析成功（無錯誤）
- ✅ Google Sheet 新增了訂單資料
- ✅ 郵件已標記為已讀

#### 8.3 測試錯誤處理

1. 手動建立一封沒有 PDF 附件的測試郵件
2. 執行 workflow
3. 確認收到 Telegram 錯誤通知

---

### Step 9: 啟用自動執行

1. 在 n8n UI 中，點擊 workflow 右上角的「Active」開關
2. 確認狀態變為綠色（Active）
3. 檢查 Cron 排程：每 6 小時執行一次

---

## 驗證與監控

### 第一次自動執行

等待第一次 Cron 觸發（下一個 00:00, 06:00, 12:00, 或 18:00）

檢查：

1. n8n Executions 頁面有新的執行記錄
2. Google Sheet 有新訂單
3. 沒有錯誤通知

### 日常監控

- **每日**: 查看 Google Sheet 是否有新訂單
- **每週**: 檢查 n8n execution log 有無錯誤
- **每月**: 檢查 Gmail API quota 使用量

### 告警機制

所有錯誤都會發送到 Telegram `@VENTURO_NEW_BOT`:

```
🚨 Trip.com 訂單同步失敗

訂單: 1658108575539696
郵件 ID: 18d4a8c7f2e1b3a9
錯誤: PDF 解析失敗 - 找不到 PNR
時間: 2026-03-07 14:30:00
```

---

## 故障排除

### 問題 1: Gmail API 403 Forbidden

**原因**: OAuth token 過期或權限不足

**解決**:

```bash
# 重新認證
python3 scripts/google-auth-init.py
```

### 問題 2: Python 解析失敗

**原因**: PDF 格式變更

**解決**:

1. 取得失敗的郵件 ID
2. 手動測試：
   ```bash
   python3 scripts/trip-flight-parser-n8n.py --message-id <ID>
   ```
3. 查看錯誤訊息，調整正則表達式

### 問題 3: Google Sheets 寫入失敗

**原因**: Spreadsheet ID 錯誤或權限不足

**解決**:

1. 確認 Spreadsheet ID 正確
2. 確認服務帳號有寫入權限
3. 手動分享 Sheet 給服務帳號 email

### 問題 4: n8n workflow 未執行

**原因**: Cron 排程錯誤或 workflow 未啟用

**解決**:

1. 確認 workflow 狀態為 Active（綠色）
2. 檢查 Cron 表達式：`0 */6 * * *`
3. 查看 n8n log:
   ```bash
   docker logs n8n
   ```

---

## 維護計畫

### 每月檢查

1. **API Quota**
   - Gmail API: 1,000,000 次/天（應該足夠）
   - Sheets API: 500 次/100 秒（應該足夠）

2. **資料品質**
   - 檢查 Google Sheet 有無異常訂單
   - 確認欄位值正確（日期、航班號等）

3. **系統更新**
   - 更新 n8n 到最新版本
   - 更新 Python 依賴（PyPDF2）

### 季度優化

1. **效能優化**
   - 如果郵件量大，考慮改用 batch processing
   - 如果解析慢，考慮用 Cloud Function

2. **功能擴充**
   - 多航段優化（每個航段寫一行）
   - 重複訂單檢查
   - 訂單狀態更新（取消通知）

---

## 附錄

### A. 檔案結構

```
~/Projects/venturo-erp/
├── .credentials/
│   ├── google-oauth.json          # OAuth 2.0 設定
│   ├── google-token.json          # Gmail access token
│   ├── service-account.json       # 服務帳號金鑰
│   └── trip-sheet.json            # Google Sheet 資訊
├── scripts/
│   ├── trip-flight-parser-final.py    # 原始批次解析器
│   ├── trip-flight-parser-n8n.py      # n8n 專用解析器
│   ├── create-trip-sheet.py           # 建立 Google Sheet
│   └── test-trip-sync.py              # 測試腳本
├── docs/
│   ├── google-api-setup.md            # Google API 設定指南
│   ├── n8n-trip-flight-workflow.md   # Workflow 設計文件
│   ├── trip-sync-deployment-guide.md # 本文件
│   └── trip-flight-final-report.md   # Parser 研究報告
└── n8n-workflows/
    └── trip-flight-sync.json          # n8n workflow JSON
```

### B. 相關文件

- [Google API 設定指南](google-api-setup.md)
- [n8n Workflow 設計文件](n8n-trip-flight-workflow.md)
- [Parser 研究報告](trip-flight-final-report.md)

### C. 支援

如有問題，請檢查：

1. n8n execution log
2. Python 腳本輸出（`--message-id` 模式）
3. Telegram 錯誤通知

---

**文件版本**: 1.0  
**建立日期**: 2026-03-07  
**維護者**: Yuzuki 🌙
