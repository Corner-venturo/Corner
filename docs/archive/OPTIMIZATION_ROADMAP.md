# 🚀 Venturo v4.0 - 優化路線圖

> **目標**：在離線架構完成後，進一步提升系統品質、效能和開發體驗

---

## 📋 優化分類

### 🔧 A. 開發體驗優化 (DX - Developer Experience)

#### A1. TypeScript 錯誤修復 ⭐⭐⭐
**現況**：約 400+ 個 TypeScript 錯誤
**影響**：編譯器警告、IDE 提示不準確
**優化項目**：
- [ ] 修復所有型別錯誤
- [ ] 啟用嚴格模式 (`strict: true`)
- [ ] 移除 `any` 型別
- [ ] 完善介面定義

**優先級**：🔴 高
**預估時間**：2-3 天
**效益**：
- ✅ 更好的 IDE 提示
- ✅ 減少執行時錯誤
- ✅ 提升程式碼品質

---

#### A2. ESLint + Prettier 設定 ⭐⭐
**現況**：缺少統一的程式碼風格
**優化項目**：
- [ ] 設定 ESLint 規則
- [ ] 設定 Prettier 格式化
- [ ] Git pre-commit hook
- [ ] VSCode 自動格式化

**優先級**：🟡 中
**預估時間**：半天
**效益**：
- ✅ 統一程式碼風格
- ✅ 自動修復簡單錯誤
- ✅ 團隊協作更順暢

**實作範例**：
```bash
# 安裝依賴
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D husky lint-staged

# .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn"
  }
}

# .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

---

#### A3. 開發工具改善 ⭐
**優化項目**：
- [ ] 設定 VS Code 推薦擴充套件
- [ ] 建立 `.vscode/settings.json`
- [ ] 設定除錯配置
- [ ] 建立程式碼片段

**檔案範例**：
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}

// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

### ⚡ B. 效能優化 (Performance)

#### B1. 打包優化 ⭐⭐⭐
**現況**：未針對生產環境優化
**優化項目**：
- [ ] 分析打包大小 (`npm run build -- --analyze`)
- [ ] Code Splitting 優化
- [ ] Tree Shaking 檢查
- [ ] 移除未使用的依賴

**工具**：
```bash
# 安裝分析工具
npm install -D @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... 其他配置
})

# 執行分析
ANALYZE=true npm run build
```

**優先級**：🔴 高
**預估時間**：1 天
**效益**：
- ✅ 減少打包大小
- ✅ 加快載入速度
- ✅ 降低流量成本

---

#### B2. 圖片優化 ⭐⭐
**優化項目**：
- [ ] 使用 Next.js Image 組件
- [ ] WebP 格式轉換
- [ ] Lazy Loading
- [ ] CDN 整合

**範例**：
```tsx
// 改前
<img src="/logo.png" alt="Logo" />

// 改後
import Image from 'next/image'
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  loading="lazy"
/>
```

---

#### B3. 資料庫查詢優化 ⭐⭐
**優化項目**：
- [ ] IndexedDB 索引優化
- [ ] 查詢結果快取
- [ ] 分頁載入
- [ ] 虛擬滾動 (Virtual Scrolling)

**範例**：
```typescript
// 分頁查詢
async function getToursPaginated(page: number, limit: number) {
  const offset = page * limit
  const all = await offlineManager.getAll('tours')
  return all.slice(offset, offset + limit)
}

// 虛擬滾動（大量資料）
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

### 🔐 C. 安全性與穩定性

#### C1. 錯誤邊界 (Error Boundaries) ⭐⭐⭐
**現況**：錯誤會導致整個應用崩潰
**優化項目**：
- [ ] 全域錯誤邊界
- [ ] 頁面級錯誤邊界
- [ ] 錯誤日誌收集
- [ ] 友善錯誤提示

**實作**：
```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-container">
      <h2>發生錯誤</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重試</button>
    </div>
  )
}
```

**優先級**：🔴 高
**預估時間**：1 天

---

#### C2. 資料驗證 ⭐⭐
**優化項目**：
- [ ] Zod Schema 驗證
- [ ] 表單驗證強化
- [ ] API 輸入驗證
- [ ] 資料清理（Sanitization）

**範例**：
```typescript
import { z } from 'zod'

const TourSchema = z.object({
  code: z.string().min(1, '團號不能為空'),
  name: z.string().min(1, '團名不能為空'),
  startDate: z.string().datetime(),
  adultCount: z.number().int().min(0),
  // ...
})

type Tour = z.infer<typeof TourSchema>
```

---

#### C3. 環境變數管理 ⭐
**優化項目**：
- [ ] 使用 `.env.example` 範本
- [ ] 敏感資料不進 Git
- [ ] 環境變數型別定義
- [ ] 驗證必要變數

**範例**：
```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

---

### 📊 D. 監控與分析

#### D1. 效能監控 ⭐⭐
**優化項目**：
- [ ] Vercel Analytics
- [ ] Web Vitals 追蹤
- [ ] 載入時間監控
- [ ] 使用者行為分析

**實作**：
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

#### D2. 錯誤追蹤 ⭐⭐
**優化項目**：
- [ ] Sentry 整合
- [ ] 前端錯誤收集
- [ ] 同步失敗追蹤
- [ ] 效能瓶頸分析

**範例**：
```bash
npm install @sentry/nextjs

# sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

#### D3. 日誌系統 ⭐
**優化項目**：
- [ ] 結構化日誌
- [ ] 日誌等級管理
- [ ] 開發/生產分離
- [ ] 日誌搜尋功能

**範例**：
```typescript
// lib/logger.ts
export const logger = {
  debug: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${msg}`, data)
    }
  },
  info: (msg: string, data?: any) => {
    console.info(`[INFO] ${msg}`, data)
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error)
    // 發送到 Sentry
  }
}
```

---

### 🧪 E. 測試

#### E1. 單元測試 ⭐⭐⭐
**現況**：無測試覆蓋
**優化項目**：
- [ ] Jest + React Testing Library
- [ ] 核心功能測試
- [ ] 離線管理器測試
- [ ] Hook 測試

**範例**：
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom

# offline-manager.test.ts
import { getOfflineManager } from './offline-manager'

describe('OfflineManager', () => {
  it('should create tour data', async () => {
    const manager = getOfflineManager()
    const tour = await manager.create('tours', {
      code: 'TEST001',
      name: 'Test Tour'
    })
    expect(tour.id).toBeDefined()
    expect(tour.synced).toBe(false)
  })
})
```

**優先級**：🟡 中
**預估時間**：2-3 天

---

#### E2. E2E 測試 ⭐⭐
**優化項目**：
- [ ] Playwright 整合
- [ ] 關鍵流程測試
- [ ] 離線模式測試
- [ ] CI/CD 整合

**範例**：
```bash
npm install -D @playwright/test

# tests/e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test('offline mode works', async ({ page, context }) => {
  await context.setOffline(true)
  await page.goto('/test-offline')
  await page.click('button:has-text("開始測試")')
  await expect(page.locator('text=已連線')).toBeVisible()
})
```

---

### 📱 F. PWA 與移動端

#### F1. PWA 功能 ⭐⭐⭐
**優化項目**：
- [ ] Service Worker
- [ ] 安裝到桌面
- [ ] 推播通知
- [ ] 背景同步

**實作**：
```bash
npm install next-pwa

# next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // ... 其他配置
})
```

**優先級**：🔴 高（已有離線基礎）
**預估時間**：1-2 天

---

#### F2. 響應式優化 ⭐⭐
**優化項目**：
- [ ] 移動端 UI 調整
- [ ] 觸控手勢支援
- [ ] 平板模式優化
- [ ] 橫豎屏適配

---

### 🎨 G. UI/UX 改善

#### G1. 載入狀態 ⭐⭐
**優化項目**：
- [ ] Skeleton 載入畫面
- [ ] 進度條
- [ ] 樂觀 UI 更新
- [ ] 平滑過渡動畫

**範例**：
```tsx
// components/skeleton.tsx
export function TourCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
    </div>
  )
}
```

---

#### G2. 無障礙改善 (A11y) ⭐⭐
**優化項目**：
- [ ] ARIA 屬性
- [ ] 鍵盤導航
- [ ] 螢幕閱讀器支援
- [ ] 色彩對比檢查

**工具**：
```bash
npm install -D @axe-core/react
npm install -D eslint-plugin-jsx-a11y
```

---

#### G3. 主題系統完善 ⭐
**優化項目**：
- [ ] 深色模式完整支援
- [ ] 主題切換動畫
- [ ] 自訂主題色
- [ ] 系統主題同步

---

### 🔄 H. CI/CD 與部署

#### H1. GitHub Actions ⭐⭐⭐
**優化項目**：
- [ ] 自動化測試
- [ ] 自動化部署
- [ ] 程式碼品質檢查
- [ ] 自動版本標籤

**範例**：
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**優先級**：🔴 高
**預估時間**：1 天

---

#### H2. 環境分離 ⭐⭐
**優化項目**：
- [ ] dev / staging / production
- [ ] 環境變數管理
- [ ] 預覽部署
- [ ] 回滾機制

---

### 📚 I. 文檔與協作

#### I1. API 文檔 ⭐⭐
**優化項目**：
- [ ] TypeDoc 自動生成
- [ ] Storybook 組件文檔
- [ ] API 使用範例
- [ ] 常見問題 FAQ

**範例**：
```bash
npm install -D typedoc

# typedoc.json
{
  "entryPoints": ["./src/lib"],
  "out": "docs/api"
}
```

---

#### I2. 貢獻指南 ⭐
**優化項目**：
- [ ] CONTRIBUTING.md
- [ ] Code Review 指南
- [ ] Git 提交規範
- [ ] 分支策略

---

### 🗑️ J. 程式碼清理

#### J1. 移除冗餘程式碼 ⭐⭐⭐
**優化項目**：
- [ ] 刪除 `sync-manager.ts`（已被取代）
- [ ] 移除未使用的依賴
- [ ] 清理註解掉的程式碼
- [ ] 統一命名規範

**優先級**：🟡 中
**預估時間**：半天

---

#### J2. 重構機會 ⭐⭐
**優化項目**：
- [ ] 抽取共用邏輯
- [ ] 減少重複程式碼
- [ ] 改善命名
- [ ] 簡化複雜函數

---

## 🎯 建議的優先順序

### 第一階段 - 立即執行（1-2 週）
1. ⭐⭐⭐ TypeScript 錯誤修復
2. ⭐⭐⭐ 錯誤邊界設定
3. ⭐⭐⭐ 打包優化
4. ⭐⭐⭐ PWA 功能
5. ⭐⭐⭐ GitHub Actions CI/CD

### 第二階段 - 重要優化（2-4 週）
6. ⭐⭐ ESLint + Prettier
7. ⭐⭐ 資料驗證
8. ⭐⭐ 效能監控
9. ⭐⭐ 圖片優化
10. ⭐⭐ 載入狀態改善

### 第三階段 - 長期改善（1-2 月）
11. ⭐⭐ 單元測試
12. ⭐⭐ E2E 測試
13. ⭐⭐ API 文檔
14. ⭐ 無障礙改善
15. ⭐ 日誌系統

---

## 💡 快速勝利 (Quick Wins)

這些可以在 1-2 小時內完成，立即見效：

1. **移除舊檔案** - 刪除 `sync-manager.ts`
2. **環境變數範本** - 建立 `.env.example`
3. **VSCode 設定** - 統一編輯器配置
4. **Git 忽略檔案** - 完善 `.gitignore`
5. **README 更新** - 加入安裝說明

---

## 📊 效益評估

| 優化項目 | 開發時間 | 效益 | ROI |
|---------|---------|-----|-----|
| TypeScript 修復 | 2-3 天 | 高 | ⭐⭐⭐ |
| PWA 功能 | 1-2 天 | 高 | ⭐⭐⭐ |
| CI/CD | 1 天 | 高 | ⭐⭐⭐ |
| 錯誤邊界 | 1 天 | 高 | ⭐⭐⭐ |
| 打包優化 | 1 天 | 中 | ⭐⭐ |
| ESLint/Prettier | 半天 | 中 | ⭐⭐ |
| 效能監控 | 半天 | 中 | ⭐⭐ |
| 單元測試 | 2-3 天 | 中 | ⭐⭐ |

---

**總結**：建議先從「第一階段 - 立即執行」開始，這些優化能快速提升系統品質和穩定性！

**文檔版本**：v1.0
**建立日期**：2025-01-05
