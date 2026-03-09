# Trip.com 機票訂單自動同步系統

## 快速開始

這個系統每 6 小時自動從 William 的 Gmail 抓取 Trip.com 機票訂單，解析 PDF，寫入 Google Sheet。

### 系統狀態

- ✅ PDF 解析器已完成（100% 成功率，24 筆測試）
- ✅ Google Sheet 建立腳本已完成
- ✅ n8n Workflow 設計已完成
- ⏳ 等待部署（需要 Google API 認證）

---

## 文件索引

### 1. [部署指引](trip-sync-deployment-guide.md) ← **從這裡開始**

完整的部署步驟，包括：

- Google API 設定
- Google Sheet 建立
- n8n 安裝與設定
- 測試與驗證

### 2. [Google API 設定](google-api-setup.md)

如何設定 Gmail API 和 Google Sheets API，包括：

- OAuth 2.0 認證
- 服務帳號建立
- 初次認證流程

### 3. [n8n Workflow 設計](n8n-trip-flight-workflow.md)

Workflow 的詳細架構，包括：

- 節點設定說明
- 資料流範例
- 錯誤處理機制
- 進階功能

### 4. [Parser 研究報告](trip-flight-final-report.md)

PDF 解析的技術細節，包括：

- 解析流程
- 資料結構
- 性能優化
- 欄位覆蓋率統計

---

## 核心腳本

### `scripts/trip-flight-parser-n8n.py`

n8n 專用解析器，支援：

- `--pdf-base64 <data>` - 接收 base64 PDF（n8n 模式）
- `--message-id <id>` - 解析單一郵件（測試模式）

### `scripts/create-trip-sheet.py`

建立 Google Sheet「Trip.com 機票訂單」，並自動：

- 設定欄位標題和說明
- 格式化標題行
- 授權給服務帳號

### `scripts/test-trip-sync.py`

測試整個系統，驗證：

- Google Sheet 已建立
- Gmail API 可用
- Parser 可正確解析最新郵件

---

## 快速部署（TL;DR）

```bash
# 1. 設定 Google API（需手動在 Google Cloud Console 操作）
#    參考: docs/google-api-setup.md

# 2. 初次認證
cd ~/Projects/venturo-erp
python3 scripts/google-auth-init.py

# 3. 建立 Google Sheet
python3 scripts/create-trip-sheet.py

# 4. 測試系統
python3 scripts/test-trip-sync.py

# 5. 安裝 n8n
docker run -d --name n8n -p 5678:5678 n8nio/n8n

# 6. 匯入 workflow
# 在 http://localhost:5678 匯入 n8n-workflows/trip-flight-sync.json

# 7. 設定 credentials（Gmail OAuth2, Sheets OAuth2, Telegram Bot）

# 8. 啟用 workflow
```

---

## 系統架構

```
┌──────────────┐
│ Gmail        │  每 6 小時檢查新郵件
│ (Trip.com)   │  subject: 機票訂單確認郵件
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ n8n          │  下載 PDF 附件
│ Workflow     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Python       │  解析 PDF（訂單、航班、旅客）
│ Parser       │
└──────┬───────┘
       │
       ├──── 成功 ────▶ ┌──────────────┐
       │                │ Google Sheet │  寫入訂單資料
       │                └──────────────┘
       │
       └──── 失敗 ────▶ ┌──────────────┐
                        │ Telegram Bot │  發送錯誤通知
                        └──────────────┘
```

---

## Google Sheet 欄位

| 欄位名稱       | 說明     | 範例                 |
| -------------- | -------- | -------------------- |
| order_no       | 訂單編號 | 1658108575539696     |
| route          | 航線     | 台北 - 東京          |
| flight_no      | 航班號   | GK014                |
| pnr            | 訂位代號 | TRYPQA               |
| departure_date | 出發日期 | 2026-01-25           |
| departure_time | 出發時間 | 12:50                |
| airline        | 航空公司 | 捷星日本航空         |
| passengers     | 旅客姓名 | LIN/CHUNGTSO         |
| ticket_no      | 機票號碼 | 189-6506931183       |
| status         | 狀態     | 已確認               |
| sync_time      | 同步時間 | 2026-03-07T02:30:00Z |

---

## 執行頻率

**Cron 排程**: `0 */6 * * *`

每天執行 4 次：

- 00:00
- 06:00
- 12:00
- 18:00

---

## 錯誤通知

所有錯誤都會發送到 Telegram `@VENTURO_NEW_BOT`：

```
🚨 Trip.com 訂單同步失敗

訂單: 1658108575539696
郵件 ID: 18d4a8c7f2e1b3a9
錯誤: PDF 解析失敗 - 找不到 PNR
時間: 2026-03-07 14:30:00
```

---

## 故障排除

### 常見問題

1. **Gmail API 403 Forbidden**
   - 重新認證：`python3 scripts/google-auth-init.py`

2. **PDF 解析失敗**
   - 測試單一郵件：`python3 scripts/trip-flight-parser-n8n.py --message-id <ID>`
   - 查看錯誤訊息，調整正則表達式

3. **Google Sheets 寫入失敗**
   - 確認 Spreadsheet ID 正確
   - 確認服務帳號有寫入權限

詳細排除步驟請參考 [部署指引](trip-sync-deployment-guide.md#故障排除)

---

## 未來優化

### P0 (本週)

- [ ] 完成 Google API 認證設定
- [ ] 建立 Google Sheet
- [ ] 部署 n8n workflow
- [ ] 測試自動同步（至少 5 筆郵件）

### P1 (本月)

- [ ] 多航段優化（每個航段寫一行）
- [ ] 重複訂單檢查
- [ ] 訂單狀態更新（取消通知）

### P2 (未來)

- [ ] 整合 Venturo ERP（透過 Supabase）
- [ ] 整合飯店訂單
- [ ] 統一的 Trip.com 訂單管理介面

---

## 相關資源

- **Parser 原始版本**: `scripts/trip-flight-parser-final.py`
- **測試資料**: 24 筆訂單（2024-12-15 ~ 2026-01-22）
- **成功率**: 100% (24/24)
- **核心欄位覆蓋率**: 100%

---

**系統版本**: 1.0  
**完成日期**: 2026-03-07  
**開發者**: Yuzuki 🌙  
**狀態**: ✅ 核心功能完成，等待部署
