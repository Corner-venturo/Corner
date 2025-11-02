# 🚀 Venturo 部署資訊

> **最後更新**: 2025-11-01
> **部署狀態**: ✅ 成功

---

## 🌐 部署網址

### Production URL
```
https://venturo-kh4agrenr-williamchiencorner-6530s-projects.vercel.app
```

### Vercel 專案資訊
- **專案 ID**: `prj_9o5acX0aYgWzSqSQfKmM0pAaw7xF`
- **組織 ID**: `team_7vLusknW8ZXhHYiLFq1ZRvEB`
- **專案名稱**: `venturo-new`
- **區域**: `hnd1` (Tokyo, Japan)

---

## 📦 最新部署

### 部署時間
2025-11-01 18:26 (GMT+8)

### 部署內容
```
fix: 修復行程新增時瀏覽器崩潰問題

核心修復：
1. processedData 使用 useMemo 穩定引用
2. useRegionData 移除不穩定的依賴項
3. CountriesSection 防止初始化循環
4. useTourScrollEffects 加強 setInterval 清理
```

### Commit Hash
`6a07816`

---

## 🔧 環境變數設定

已在 Vercel 設定以下環境變數：

```env
NEXT_PUBLIC_APP_NAME=Venturo ERP
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_SUPABASE=true
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_SKIP_AUTH=false
```

### Supabase 連接（已設定）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ 部署驗證

### HTTP 狀態檢查
```bash
$ curl -I https://venturo-kh4agrenr-williamchiencorner-6530s-projects.vercel.app

HTTP/2 401
server: Vercel
date: Sat, 01 Nov 2025 10:26:41 GMT
```

**狀態**: ✅ 正常（401 是預期的，需要登入）

### 建構狀態
- ✅ 建構成功
- ✅ 無錯誤
- ✅ 型別檢查通過

---

## 🔄 自動部署設定

### Git 整合
- **Repository**: `Corner-venturo/Corner`
- **分支**: `main`
- **自動部署**: ✅ 啟用

每次推送到 `main` 分支時，Vercel 會自動：
1. 檢測變更
2. 執行建構
3. 部署到生產環境

---

## 📊 部署資訊

### Framework
- **Next.js**: 15.5.4
- **React**: 19.1.0
- **TypeScript**: 5

### 建構設定
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### 效能指標
- **建構時間**: ~30 秒
- **部署時間**: ~5 秒
- **總時間**: ~35 秒

---

## 🔐 存取控制

目前網站需要登入才能存取（Vercel SSO）。

若要開放公開存取，需要在 Vercel 專案設定中調整 Authentication 設定。

---

## 📝 部署步驟（供參考）

### 1. 本地開發
```bash
npm run dev
```

### 2. 建構測試
```bash
npm run build
npm start
```

### 3. 部署到 Vercel
```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel 會自動偵測並部署。

### 4. 手動部署（可選）
```bash
vercel --yes
```

---

## 🐛 疑難排解

### 部署失敗
1. 檢查建構日誌：`vercel logs [URL]`
2. 確認環境變數設定正確
3. 本地測試：`npm run build`

### 網站無法存取
1. 檢查 HTTP 狀態碼
2. 確認 Supabase 連線
3. 檢查環境變數

### 自動部署沒觸發
1. 確認 GitHub 整合正常
2. 檢查 Vercel 專案設定
3. 手動觸發部署

---

## 📞 支援

- **Vercel Dashboard**: https://vercel.com/williamchiencorner-6530s-projects/venturo-new
- **專案設定**: https://vercel.com/williamchiencorner-6530s-projects/venturo-new/settings
- **部署日誌**: https://vercel.com/williamchiencorner-6530s-projects/venturo-new/deployments

---

**部署完成！** 🎉
