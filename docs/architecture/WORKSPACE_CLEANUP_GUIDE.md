# 工作空間頻道清理指南

## 📋 問題說明

之前的工作空間出現以下問題：

1. **重複的夥伴頻道**：同一個員工有多個重複的私訊頻道
2. **排版錯位**：成員側邊欄打開時會擠壓訊息列表
3. **自動建立邏輯錯誤**：系統持續建立重複頻道

## ✅ 已完成的修正

### 1. 修正自動建立頻道邏輯

**檔案**：`src/hooks/use-auto-create-team-channel.ts`

**修正內容**：

- 更嚴格的頻道名稱檢查（完全匹配）
- 先過濾出夥伴群組中的現有頻道
- 避免重複建立同名頻道
- 添加更清楚的日誌訊息

### 2. 修正排版問題

**檔案**：

- `src/components/workspace/ChannelChat.tsx`
- `src/components/workspace/chat/MemberSidebar.tsx`

**修正內容**：

- MemberSidebar 改用絕對定位（absolute positioning）
- 使用滑動動畫顯示/隱藏成員側邊欄
- MessageList 不再被擠壓，保持固定寬度
- 添加陰影效果，提升視覺層次

### 3. 建立清理工具

建立了兩個清理工具來處理現有的重複頻道：

#### 工具 1：瀏覽器清理工具（推薦使用）

**檔案**：`public/cleanup-channels.html`

**使用步驟**：

1. 啟動開發服務器：

   ```bash
   npm run dev
   ```

2. 在瀏覽器中打開：

   ```
   http://localhost:3000/cleanup-channels.html
   ```

3. 點擊「📊 分析重複頻道」按鈕

4. 查看分析報告，確認要刪除的頻道

5. 點擊「🗑️ 清理重複頻道」按鈕

6. 重新整理工作空間頁面 (F5)

**功能特點**：

- ✅ 自動掃描「夥伴」群組中的所有頻道
- ✅ 找出同名的重複頻道
- ✅ 保留最早建立的頻道
- ✅ 只刪除沒有訊息的空頻道
- ✅ 提供詳細的分析報告和統計數據
- ✅ 美觀的界面設計

#### 工具 2：TypeScript 清理腳本

**檔案**：`scripts/cleanup-duplicate-channels.ts`

這是一個自動化腳本，功能與瀏覽器工具相同，但需要在 Node.js 環境中執行。

## 🎯 清理流程

### 第一次清理（推薦）

1. **使用瀏覽器工具清理**：

   ```bash
   npm run dev
   ```

   然後訪問：`http://localhost:3000/cleanup-channels.html`

2. **分析重複頻道**：
   - 點擊「分析重複頻道」
   - 查看有多少重複頻道
   - 確認哪些可以安全刪除

3. **執行清理**：
   - 點擊「清理重複頻道」
   - 確認刪除操作
   - 等待清理完成

4. **驗證結果**：
   - 重新整理工作空間頁面
   - 確認重複頻道已被移除
   - 每個員工只保留一個頻道

### 驗證修正效果

1. **檢查頻道列表**：
   - 進入工作空間頁面
   - 展開「夥伴」群組
   - 確認每個員工只有一個頻道

2. **測試成員側邊欄**：
   - 點擊右上角的「成員」按鈕
   - 側邊欄應該從右側滑出
   - 訊息列表不應該被擠壓
   - 關閉側邊欄後應該順暢滑回

3. **測試訊息功能**：
   - 發送訊息
   - 確認訊息正常顯示
   - 排版沒有錯位

## 🔍 診斷工具

如果清理後仍有問題，可以使用以下方法診斷：

### 檢查 IndexedDB

在瀏覽器開發者工具中：

1. 打開 DevTools (F12)
2. 切換到 Application 標籤
3. 展開 IndexedDB > venturo-workspace-db
4. 查看 channels 表格
5. 檢查是否還有重複的頻道

### 查看控制台日誌

打開瀏覽器控制台 (F12 > Console)，查找：

- `ℹ️ 頻道已存在，跳過: XXX` - 表示正確避免了重複建立
- `🔨 建立與 XXX 的頻道...` - 正在建立新頻道
- `✅ 建立頻道成功: XXX` - 頻道建立成功

## 📊 預期結果

清理完成後：

- ✅ 每個員工在「夥伴」群組中只有一個頻道
- ✅ 成員側邊欄打開時不會擠壓訊息列表
- ✅ 訊息顯示正常，沒有排版錯位
- ✅ 不會再自動建立重複頻道

## 🚨 注意事項

1. **有訊息的頻道不會被自動刪除**
   - 如果重複頻道中有訊息，清理工具會跳過
   - 需要手動處理這些頻道

2. **建議在清理前備份**
   - 雖然工具只刪除空頻道，但建議先備份
   - 可以導出 IndexedDB 資料

3. **清理後需重新整理**
   - 清理完成後務必重新整理頁面
   - 讓 UI 重新載入最新資料

## 📝 技術細節

### 修正的核心邏輯

**之前的問題**：

```typescript
// ❌ 問題：檢查條件太寬鬆，可能重複建立
const existingChannel = channels.find(
  ch =>
    ch.group_id === teamGroup!.id &&
    (ch.name === (employee.display_name || employee.name) ||
      ch.name === employee.name ||
      ch.name === employee.display_name)
)
```

**修正後**：

```typescript
// ✅ 修正：先過濾群組頻道，名稱完全匹配
const teamChannels = channels.filter(ch => ch.group_id === teamGroup!.id)
const employeeName = employee.display_name || employee.name
const existingChannel = teamChannels.find(ch => ch.name === employeeName)
```

### 排版修正

**之前**：

```tsx
// ❌ 問題：flex 容器中並排，會互相擠壓
<div className="flex-1 flex">
  <MessageList />
  <MemberSidebar isOpen={showMemberSidebar} />
</div>
```

**修正後**：

```tsx
// ✅ 修正：使用絕對定位，不影響主要內容
<div className="flex-1 flex relative">
  <div className="flex-1">
    <MessageList />
  </div>
  <MemberSidebar isOpen={showMemberSidebar} />
</div>

// MemberSidebar 使用絕對定位和滑動動畫
<div className={cn(
  "absolute right-0 top-0 bottom-0 w-64 transition-transform",
  isOpen ? "translate-x-0" : "translate-x-full"
)}>
```

## 🎉 完成！

所有修正已經完成，現在您可以：

1. 使用清理工具移除重複頻道
2. 享受正常的工作空間排版
3. 不用擔心頻道會繼續重複建立

如有任何問題，請查看控制台日誌或檢查 IndexedDB 資料。
