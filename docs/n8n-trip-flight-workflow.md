# n8n Workflow: Trip.com 機票訂單自動同步

## 概述

**目的**: 每 6 小時自動檢查 William 的 Gmail，下載 Trip.com 機票訂單 PDF，解析後寫入 Google Sheet

**執行頻率**: 每 6 小時（00:00, 06:00, 12:00, 18:00）

**技術棧**:
- Gmail API (搜尋+下載郵件)
- Python 腳本 (PDF 解析)
- Google Sheets API (寫入訂單)
- Telegram Bot (錯誤通知)

---

## Workflow 架構

```
┌─────────────────────┐
│  Cron Trigger       │  每 6 小時
│  0 */6 * * *        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Gmail Node         │  搜尋「Trip.com 機票訂單確認」
│  Search Messages    │  只取未處理的
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Loop Over Items    │  逐一處理每封郵件
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Gmail Node         │  下載 PDF 附件（行程單.pdf）
│  Get Attachment     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Execute Command    │  python3 trip-flight-parser-final.py
│  (Python Script)    │  輸入：PDF base64
└──────┬──────────────┘
       │
       ├──── 成功 ────────▶ ┌─────────────────────┐
       │                    │  Google Sheets Node │  寫入訂單資料
       │                    │  Append Row         │
       │                    └─────────────────────┘
       │
       └──── 失敗 ────────▶ ┌─────────────────────┐
                            │  Telegram Node      │  發送錯誤通知
                            │  @VENTURO_NEW_BOT   │
                            └─────────────────────┘
```

---

## 節點設定詳細說明

### 1. Cron Trigger

**節點類型**: Schedule Trigger

**設定**:
```json
{
  "mode": "cron",
  "cronExpression": "0 */6 * * *",
  "timezone": "Asia/Taipei"
}
```

**說明**: 每天的 00:00, 06:00, 12:00, 18:00 執行

---

### 2. Gmail Search (搜尋郵件)

**節點類型**: Gmail

**操作**: Search Messages

**設定**:
```json
{
  "resource": "message",
  "operation": "search",
  "query": "from:trip.com subject:機票訂單確認郵件 is:unread",
  "maxResults": 50,
  "includeSpamTrash": false
}
```

**說明**:
- 只搜尋未讀郵件，避免重複處理
- 限制 50 封，避免一次處理太多

---

### 3. Loop Over Messages

**節點類型**: Split In Batches

**設定**:
```json
{
  "batchSize": 1,
  "options": {}
}
```

**說明**: 逐一處理每封郵件，確保錯誤不會中斷整個流程

---

### 4. Gmail Get Attachment (下載 PDF)

**節點類型**: Gmail

**操作**: Get Attachment

**設定**:
```json
{
  "resource": "message",
  "operation": "getAttachment",
  "messageId": "={{ $json.id }}",
  "attachmentId": "={{ $json.attachments.find(a => a.filename.includes('行程單')).id }}",
  "download": true,
  "binaryProperty": "pdfData"
}
```

**說明**: 找到「行程單.pdf」並下載為 binary data

---

### 5. Execute Python Parser

**節點類型**: Execute Command

**設定**:
```json
{
  "command": "python3",
  "arguments": [
    "/Users/tokichin/Projects/venturo-erp/scripts/trip-flight-parser-final.py",
    "--pdf-base64",
    "={{ $binary.pdfData.data }}"
  ],
  "workingDirectory": "/Users/tokichin/Projects/venturo-erp/scripts"
}
```

**輸出**: JSON 格式的訂單資料

**錯誤處理**: 如果腳本返回非 0 exit code，觸發錯誤分支

---

### 6a. Google Sheets Append (寫入成功資料)

**節點類型**: Google Sheets

**操作**: Append Row

**設定**:
```json
{
  "resource": "sheet",
  "operation": "append",
  "documentId": "={{ $parameter.spreadsheetId }}",
  "sheetName": "訂單列表",
  "values": [
    "={{ $json.order_no }}",
    "={{ $json.route }}",
    "={{ $json.flight_no }}",
    "={{ $json.pnr }}",
    "={{ $json.departure_date }}",
    "={{ $json.departure_time }}",
    "={{ $json.airline }}",
    "={{ $json.passenger_names }}",
    "={{ $json.segments[0].ticket_no || '' }}",
    "已確認",
    "={{ $now.toISOString() }}"
  ],
  "options": {
    "valueInputMode": "USER_ENTERED"
  }
}
```

**說明**: 
- Spreadsheet ID 從設定檔讀取
- 多航段訂單：每個航段寫一行，或只寫第一航段

---

### 6b. Telegram Error Notification (失敗通知)

**節點類型**: Telegram

**操作**: Send Message

**設定**:
```json
{
  "resource": "message",
  "operation": "sendMessage",
  "chatId": "@VENTURO_NEW_BOT",
  "text": "🚨 Trip.com 訂單同步失敗\n\n訂單: {{ $json.order_no || '未知' }}\n郵件 ID: {{ $('Gmail Search').item.json.id }}\n錯誤: {{ $json.error }}",
  "parseMode": "Markdown"
}
```

---

### 7. Mark as Read (標記為已讀)

**節點類型**: Gmail

**操作**: Update Message

**設定**:
```json
{
  "resource": "message",
  "operation": "update",
  "messageId": "={{ $('Gmail Search').item.json.id }}",
  "addLabels": [],
  "removeLabels": ["UNREAD"]
}
```

**說明**: 無論成功或失敗，都標記為已讀，避免重複處理

---

## 資料流範例

### 輸入（Gmail 郵件）

```json
{
  "id": "18d4a8c7f2e1b3a9",
  "threadId": "18d4a8c7f2e1b3a9",
  "subject": "Trip.com 機票訂單確認郵件",
  "from": "no-reply@trip.com",
  "date": "2026-03-07T10:30:00Z",
  "attachments": [
    {
      "filename": "行程單.pdf",
      "mimeType": "application/pdf",
      "size": 245678,
      "attachmentId": "ANGjdJ..."
    }
  ]
}
```

### 中間（Python 解析輸出）

```json
{
  "order_no": "1658108575539696",
  "route": "台北 - 東京",
  "flight_no": "GK014",
  "pnr": "TRYPQA",
  "departure_date": "2026-01-25",
  "departure_time": "12:50",
  "airline": "捷星日本航空",
  "cabin_class": "經濟艙",
  "passenger_names": "LIN/CHUNGTSO",
  "segments": [
    {
      "route": "台北 - 東京",
      "flight_no": "GK014",
      "pnr": "TRYPQA",
      "ticket_no": "",
      "departure_date": "2026-01-25",
      "departure_time": "12:50",
      "airline": "捷星日本航空",
      "passengers": [
        {"name": "LIN/CHUNGTSO", "cabin": "經濟艙", "pnr": "TRYPQA"}
      ]
    }
  ]
}
```

### 輸出（Google Sheets 寫入）

| order_no | route | flight_no | pnr | departure_date | departure_time | airline | passengers | ticket_no | status | sync_time |
|----------|-------|-----------|-----|----------------|----------------|---------|------------|-----------|--------|-----------|
| 1658108575539696 | 台北 - 東京 | GK014 | TRYPQA | 2026-01-25 | 12:50 | 捷星日本航空 | LIN/CHUNGTSO | | 已確認 | 2026-03-07T02:30:00Z |

---

## 錯誤處理機制

### 1. PDF 下載失敗

**原因**: 郵件中沒有「行程單.pdf」附件

**處理**: 
- 記錄到錯誤 log
- 發送 Telegram 通知
- 標記郵件為已讀（但不寫入 Sheet）

### 2. Python 解析失敗

**原因**: PDF 格式變更、異常資料

**處理**:
- 捕捉 Python 腳本的 stderr
- 發送 Telegram 通知（包含錯誤訊息）
- 保留郵件為未讀（下次重試）

### 3. Google Sheets 寫入失敗

**原因**: API quota 超限、網路問題

**處理**:
- 重試 3 次（間隔 5 秒）
- 失敗後發送 Telegram 通知
- 將解析結果暫存到本地檔案

### 4. Gmail API Quota 超限

**原因**: 每日 API 請求上限（通常 1,000,000 次）

**處理**:
- 減少搜尋頻率（改為每 12 小時）
- 限制 maxResults 到 20
- 發送 Telegram 通知

---

## 測試計畫

### 手動測試

1. **建立測試 workflow**
   - 複製上述設定
   - 改為手動觸發（Manual Trigger）

2. **測試案例**

   **案例 1: 正常單程票**
   - 郵件: 包含完整行程單 PDF
   - 預期: 成功寫入 Google Sheet

   **案例 2: 往返票**
   - 郵件: 包含兩個航段
   - 預期: 兩行寫入 Sheet（或一行包含多航段資訊）

   **案例 3: 無附件**
   - 郵件: 不包含 PDF
   - 預期: 發送錯誤通知，不寫入 Sheet

   **案例 4: PDF 解析失敗**
   - 郵件: PDF 格式異常
   - 預期: 發送錯誤通知，郵件保持未讀

3. **驗證項目**
   - ✅ Google Sheet 有新資料
   - ✅ 欄位值正確（日期格式、旅客姓名等）
   - ✅ 郵件已標記為已讀
   - ✅ 錯誤時收到 Telegram 通知

### 自動化測試

使用 William 最新的 3 封 Trip.com 郵件：

```bash
# 執行測試腳本
python3 scripts/test-n8n-workflow.py --email-count 3
```

**驗證**:
- 3 封郵件全部處理完成
- Google Sheet 新增 3 行（或更多，如果有多航段）
- 無錯誤通知

---

## 部署步驟

### 1. 安裝 n8n

```bash
# 使用 Docker（推薦）
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e WEBHOOK_URL=http://localhost:5678/ \
  n8nio/n8n

# 或使用 npm
npm install -g n8n
```

### 2. 設定 n8n Credentials

1. 開啟 n8n UI: http://localhost:5678
2. Settings → Credentials → Add Credential

   **Gmail OAuth2**:
   - Client ID: 從 `google-oauth.json` 複製
   - Client Secret: 從 `google-oauth.json` 複製
   - Authorize 授權

   **Google Sheets OAuth2**:
   - 同上

   **Telegram Bot**:
   - Bot Token: 從 Telegram BotFather 取得
   - Chat ID: `@VENTURO_NEW_BOT`

### 3. 匯入 Workflow

1. 在 n8n UI 中點擊「Import from File」
2. 選擇 `n8n-workflows/trip-flight-sync.json`（需先匯出範本）
3. 檢查所有節點設定
4. 測試執行

### 4. 啟用 Workflow

1. 點擊「Activate」開關
2. 確認 Cron 排程正確
3. 檢查第一次執行的 log

---

## 監控與維護

### 日常檢查

- **每日**: 檢查 Google Sheet 是否有新訂單
- **每週**: 檢查 n8n execution log 有無錯誤
- **每月**: 檢查 Gmail API quota 使用量

### 告警

所有錯誤都會發送到 Telegram `@VENTURO_NEW_BOT`，格式：

```
🚨 Trip.com 訂單同步失敗

訂單: 1658108575539696
郵件 ID: 18d4a8c7f2e1b3a9
錯誤: PDF 解析失敗 - 找不到 PNR
時間: 2026-03-07 14:30:00

請手動檢查郵件
```

### 效能優化

- **如果郵件量大**: 改用 batch processing
- **如果 API quota 不足**: 減少搜尋頻率
- **如果解析慢**: 考慮用 Cloud Function 平行處理

---

## 進階功能（未來）

### 1. 多航段優化

目前只寫入第一航段，未來可改為：
- 每個航段寫一行，加上 `segment_index` 欄位
- 或使用 JSON 欄位儲存完整 segments 資料

### 2. 重複訂單檢查

在寫入前先查詢 Sheet，如果 `order_no` 已存在則跳過

### 3. 訂單狀態更新

定期檢查 Trip.com 郵件是否有取消通知，更新 Sheet 的 `status` 欄位

### 4. 整合 Venturo ERP

將 Google Sheet 資料透過 Supabase 同步到 ERP 系統

---

## 附錄

### A. Spreadsheet ID 取得方式

從 `~/.credentials/trip-sheet.json` 讀取：

```json
{
  "spreadsheet_id": "1A2B3C4D5E6F...",
  "spreadsheet_url": "https://docs.google.com/spreadsheets/d/...",
  "sheet_name": "訂單列表"
}
```

### B. Python 腳本修改建議

為了方便 n8n 呼叫，建議修改 `trip-flight-parser-final.py`：

```python
# 新增命令列參數模式
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--pdf-base64':
        # n8n 模式：接收 base64 PDF
        pdf_base64 = sys.argv[2]
        pdf_data = base64.b64decode(pdf_base64)
        result = parse_pdf(pdf_data)
        print(json.dumps(result, ensure_ascii=False))
    else:
        # 原始模式：從 Gmail 抓取
        main()
```

### C. n8n Workflow JSON 範本

完整的 n8n workflow JSON 檔案位於：
`~/Projects/venturo-erp/n8n-workflows/trip-flight-sync.json`

---

**文件版本**: 1.0  
**建立日期**: 2026-03-07  
**維護者**: Yuzuki 🌙  
**更新記錄**:
- 2026-03-07: 初版，完整設計文件
