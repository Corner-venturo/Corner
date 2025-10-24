# 顯化魔法功能設置說明

## 資料庫設置

### 方式一：使用 Supabase Dashboard (推薦)

1. 打開瀏覽器前往：https://pfqvdacxowpgfamuvnsn.supabase.co
2. 登入你的 Supabase 帳號
3. 點擊左側選單的 "SQL Editor"
4. 點擊 "New query"
5. 複製以下 SQL 內容並執行：

```sql
-- 參考檔案：src/lib/db/migrations/create_manifestation_entries.sql
```

6. 點擊 "Run" 執行 SQL

### 方式二：使用 Supabase CLI

如果你已安裝 Supabase CLI：

```bash
# 登入 Supabase
npx supabase login

# 執行 migration
npx supabase db push --db-url "postgresql://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"
```

### 方式三：手動執行 SQL 檔案

SQL 檔案位置：`src/lib/db/migrations/create_manifestation_entries.sql`

請將此檔案內容複製到 Supabase SQL Editor 執行。

## 已創建的檔案清單

### 1. 資料庫相關
- `src/lib/db/migrations/create_manifestation_entries.sql` - 資料庫 migration SQL

### 2. 類型定義
- `src/types/manifestation.ts` - TypeScript 類型定義

### 3. 數據檔案
- `src/data/manifestation-chapters.ts` - 15 章節完整內容

### 4. Store
- `src/stores/manifestation-store.ts` - Zustand 狀態管理

### 5. 元件
- `src/components/manifestation/BreathingExercise.tsx` - 呼吸練習元件
- `src/components/manifestation/ChapterList.tsx` - 章節列表元件
- `src/components/manifestation/ChapterContent.tsx` - 章節內容元件
- `src/components/manifestation/WishWall.tsx` - 願望之牆元件
- `src/components/manifestation/VisionBoard.tsx` - 願景板元件

### 6. 頁面
- `src/app/manifestation/layout.tsx` - 顯化魔法佈局
- `src/app/manifestation/page.tsx` - 顯化魔法主頁面

### 7. 側邊欄更新
- `src/components/layout/sidebar.tsx` - 已添加「顯化魔法」入口

## 功能說明

### 核心功能
1. **15 章節練習** - 完整的靈性成長課程
2. **呼吸儀式** - 首次進入時的引導動畫
3. **記錄系統** - 可儲存每章的練習記錄
4. **願望之牆** - 分享和查看他人的願望
5. **進度追蹤** - 自動記錄完成進度

### 權限設定
- 需要 `hr` 權限才能訪問
- 用戶只能查看和修改自己的記錄（RLS 已設置）

### 設計特色
- 使用 Morandi 色系（柔和、溫暖）
- 卡片式佈局
- 流暢的動畫效果
- 響應式設計

## 測試步驟

1. **執行資料庫 migration**
   - 按照上述方式之一執行 SQL

2. **啟動開發服務器**
   ```bash
   npm run dev
   ```

3. **訪問頁面**
   - 使用有 `hr` 權限的帳號登入
   - 點擊側邊欄的「顯化魔法」
   - 首次進入會看到呼吸練習動畫

4. **測試功能**
   - 選擇章節
   - 填寫練習表單
   - 儲存記錄
   - 標記章節完成
   - 查看願望之牆

## 注意事項

1. **資料庫表格**
   - 表格名稱：`manifestation_entries`
   - 已啟用 RLS (Row Level Security)
   - 自動更新時間戳記

2. **權限控制**
   - 使用現有的 `hr` 權限
   - 如需修改權限，請更新 `sidebar.tsx` 中的 `requiredPermission`

3. **本地儲存**
   - 呼吸練習完成狀態儲存在 localStorage
   - 可透過瀏覽器開發工具清除重置

## 可能的問題與解決

### 問題 1：無法看到「顯化魔法」入口
- 確認使用者有 `hr` 權限
- 檢查 `sidebar.tsx` 的權限設定

### 問題 2：資料無法儲存
- 確認資料庫表格已創建
- 檢查 Supabase 連線設定
- 查看瀏覽器 Console 錯誤訊息

### 問題 3：RLS 權限錯誤
- 確認已執行完整的 migration SQL
- 檢查 Supabase RLS 政策是否正確

## 後續可擴展功能

1. **願景板增強**
   - 支援上傳圖片
   - 拖曳調整位置
   - 匯出為圖片

2. **社群功能**
   - 願望點讚
   - 留言祝福
   - 進度分享

3. **提醒系統**
   - 每日練習提醒
   - 章節解鎖通知

4. **數據分析**
   - 個人成長曲線
   - 完成率統計
   - 感恩日記回顧
