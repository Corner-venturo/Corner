# 🚀 Venturo 部署指南

## 📋 部署前準備

### 1. 確認建置成功

```bash
npm run build
```

### 2. 確認 Git 狀態

```bash
git status
git add .
git commit -m "chore: 準備部署到 Vercel"
git push origin main
```

---

## 🌐 Vercel 部署步驟

### 方法一：透過 Vercel CLI（推薦）

#### 1. 安裝 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登入 Vercel

```bash
vercel login
```

#### 3. 部署專案

```bash
# 首次部署（會進入設定精靈）
vercel

# 後續部署到生產環境
vercel --prod
```

#### 4. 設定環境變數

```bash
# 設定 JWT 密鑰（必須）
vercel env add JWT_SECRET

# 當提示時輸入：
# Environment: Production
# Value: [生成一個強密碼，至少 32 字元]
```

#### 5. 生成強密碼範例（可用於 JWT_SECRET）

```bash
# macOS/Linux
openssl rand -base64 32

# 或者使用線上工具：
# https://1password.com/password-generator/
```

---

### 方法二：透過 Vercel 網站（適合初學者）

#### 1. 前往 Vercel 官網

https://vercel.com

#### 2. 註冊/登入帳號

- 建議使用 GitHub 帳號登入
- 這樣可以自動連結你的 Git 儲存庫

#### 3. 匯入專案

1. 點選「Add New Project」
2. 選擇「Import Git Repository」
3. 找到你的 `Corner-venturo/Corner` 儲存庫
4. 點選「Import」

#### 4. 配置專案

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 5. 設定環境變數

在「Environment Variables」區塊新增：

**必填變數：**

```
JWT_SECRET = [生成的強密碼，至少 32 字元]
```

**已自動讀取的變數（來自 .env.production）：**

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_DEBUG_MODE`
- `NEXT_PUBLIC_ENABLE_SUPABASE`
- `NEXT_PUBLIC_ENABLE_DEVTOOLS`
- `NEXT_PUBLIC_DEV_MODE`
- `NEXT_PUBLIC_SKIP_AUTH`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 6. 部署

點選「Deploy」按鈕，等待建置完成（約 2-5 分鐘）

#### 7. 取得網址

部署完成後，Vercel 會給你一個網址：

```
https://your-project-name.vercel.app
```

#### 8. 設定自訂網域（選用）

1. 前往專案設定 → Domains
2. 新增你的網域名稱
3. 依照指示設定 DNS 記錄

---

## ⚙️ 部署後設定

### 1. 更新 APP_URL

部署完成後，更新 `.env.production`：

```bash
NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app
```

然後推送更新：

```bash
git add .env.production
git commit -m "chore: 更新生產環境網址"
git push origin main
```

### 2. 驗證部署

訪問你的網站，檢查：

- ✅ 頁面正常載入
- ✅ 登入功能正常
- ✅ Supabase 連線正常
- ✅ 資料同步正常

### 3. 監控與日誌

Vercel 提供即時日誌：

- 前往專案 → Deployments
- 點選任一部署 → View Function Logs

---

## 🔧 常見問題排解

### Q1: 建置失敗 "Type error"

**解決方法：**

```bash
# 本地修正 TypeScript 錯誤
npm run type-check

# 或暫時在 next.config.ts 關閉類型檢查
typescript: {
  ignoreBuildErrors: true,
}
```

### Q2: 環境變數讀取不到

**解決方法：**

- 確認變數名稱有 `NEXT_PUBLIC_` 前綴（客戶端變數）
- 伺服器端變數不需要前綴，但要在 Vercel 後台設定
- 修改環境變數後需要重新部署

### Q3: Supabase 連線失敗

**檢查清單：**

- ✅ `NEXT_PUBLIC_SUPABASE_URL` 正確
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正確
- ✅ Supabase 專案未暫停（免費版會自動暫停）
- ✅ Row Level Security (RLS) 政策正確設定

### Q4: 部署後頁面 404

**解決方法：**

- 確認 `app/` 目錄結構正確
- 檢查 `vercel.json` 中的 `outputDirectory` 設定
- 確認建置時沒有錯誤

### Q5: "Module not found" 錯誤

**解決方法：**

```bash
# 清除快取重新建置
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

## 📊 Vercel 免費額度

Vercel 個人版（免費）提供：

- ✅ 無限制的專案數量
- ✅ 無限制的部署次數
- ✅ 100 GB 頻寬/月
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 自動預覽環境（每次 Git Push）

**注意事項：**

- 超過免費額度會收費
- 建議監控使用量：https://vercel.com/dashboard/usage

---

## 🎯 自動部署設定

Vercel 預設會自動部署：

- ✅ `main` 分支 Push → 生產環境
- ✅ 其他分支 Push → 預覽環境
- ✅ Pull Request → 預覽環境 + 留言連結

**關閉自動部署：**

1. 前往專案設定 → Git
2. 關閉「Production Branch」或「Preview Branches」

---

## 📝 部署檢查清單

部署前確認：

- [ ] ✅ 本地建置成功（`npm run build`）
- [ ] ✅ 環境變數已準備（`.env.production`）
- [ ] ✅ JWT_SECRET 已設定（Vercel 後台）
- [ ] ✅ Git 已推送到 GitHub
- [ ] ✅ Supabase 專案正常運作
- [ ] ✅ 沒有敏感資料在 Git 中

部署後確認：

- [ ] ✅ 網站可訪問
- [ ] ✅ 登入功能正常
- [ ] ✅ 資料同步正常
- [ ] ✅ 離線模式正常
- [ ] ✅ 無 Console 錯誤

---

## 🔗 相關資源

- Vercel 官方文件：https://vercel.com/docs
- Next.js 部署指南：https://nextjs.org/docs/deployment
- Supabase 文件：https://supabase.com/docs
- Venturo 專案文件：`docs/VENTURO_5.0_MANUAL.md`

---

**最後更新**：2025-01-21
**維護者**：William Chien
