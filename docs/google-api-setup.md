# Google API 設定指南 - Trip.com 機票訂單同步

## 需要啟用的 API

1. **Gmail API** - 讀取郵件和下載附件
2. **Google Sheets API** - 寫入機票訂單資料

## 設定步驟

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案：「Venturo ERP - Trip.com Sync」
3. 記錄專案 ID

### 2. 啟用 API

在 Google Cloud Console 中：

1. 導航到「API 和服務」→「程式庫」
2. 搜尋並啟用：
   - Gmail API
   - Google Sheets API

### 3. 建立 OAuth 2.0 認證

1. 導航到「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 應用程式類型：「桌面應用程式」
4. 名稱：「Trip.com Parser」
5. 下載 JSON 檔案，儲存為：`~/Projects/venturo-erp/.credentials/google-oauth.json`

### 4. 建立服務帳號（用於 Google Sheets）

1. 導航到「API 和服務」→「憑證」
2. 點擊「建立憑證」→「服務帳號」
3. 名稱：「Venturo ERP Service」
4. 授予角色：「編輯者」
5. 建立金鑰（JSON 格式）
6. 下載並儲存為：`~/Projects/venturo-erp/.credentials/service-account.json`
7. **記錄服務帳號 email**（格式：`venturo-erp@project-id.iam.gserviceaccount.com`）

### 5. 初次 OAuth 認證（Gmail）

執行以下腳本進行初次認證：

```bash
cd ~/Projects/venturo-erp
python3 scripts/google-auth-init.py
```

這會開啟瀏覽器要求授權，完成後會產生：

- `~/Projects/venturo-erp/.credentials/google-token.json`

### 6. 建立 Google Sheet 並授權

1. 執行建立 Sheet 的腳本：

   ```bash
   python3 scripts/create-trip-sheet.py
   ```

2. 這會建立「Trip.com 機票訂單」Sheet 並自動授權給服務帳號

## 檔案結構

```
~/Projects/venturo-erp/.credentials/
├── google-oauth.json       # OAuth 2.0 用戶端設定
├── google-token.json       # Gmail API access token（自動產生）
└── service-account.json    # 服務帳號金鑰（用於 Sheets API）
```

## 安全注意事項

✅ `.credentials/` 目錄已加入 `.gitignore`
✅ 不要將認證檔案上傳到 GitHub
✅ 服務帳號金鑰應妥善保管

## 測試

```bash
# 測試 Gmail API
python3 scripts/test-gmail-api.py

# 測試 Sheets API
python3 scripts/test-sheets-api.py
```

---

**建立時間**: 2026-03-07  
**用途**: Trip.com 機票訂單自動同步系統
