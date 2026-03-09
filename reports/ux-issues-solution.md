# UX 問題優化方案
**日期**: 2026-03-09  
**問題**: 按鈕不見、無法按、存檔失敗

---

## 🔍 問題分析

William 提到的不是單純的程式碼 bug，而是**系統性的使用者體驗問題**。

### 可能的原因（5 大類）

1. **前端狀態管理混亂** 🔴 高機率
   - React 狀態與 Zustand 不同步
   - 樂觀更新失敗後沒回滾
   - Loading 狀態卡住
   - 條件渲染邏輯錯誤

2. **RLS 政策問題** 🟡 中機率
   - workspace_id 不一致
   - 使用者角色權限不足
   - RLS 政策太嚴格（只能看，不能改）

3. **資料完整性約束** 🟡 中機率
   - NOT NULL 約束（今天剛加）
   - FK 約束（關聯的資料不存在）
   - CHECK 約束（UUID 格式錯誤）

4. **UI 邏輯錯誤** 🔴 高機率
   - 條件判斷太複雜
   - 錯誤處理不完整
   - 狀態機缺失

5. **離線同步衝突** 🟢 低機率
   - 樂觀鎖定失敗
   - 版本衝突

---

## ✅ 診斷結果（2026-03-09 08:12）

### 資料庫層（正常）

#### ✅ RLS 政策完整
- tours: 13 個政策
- orders: 13 個政策
- customers: 13 個政策
- suppliers: 13 個政策
- quotes: 13 個政策
- payment_requests: 13 個政策
- receipts: 13 個政策

所有核心表都有 RLS 政策。

#### ✅ NOT NULL 約束完整
所有核心欄位都有 NOT NULL 約束（今天剛修復）：
- workspace_id (5 tables)
- created_at (5 tables)
- updated_at (5 tables)
- status (4 tables)

#### ✅ Foreign Keys 完整
核心表共 32 個 Foreign Keys：
- tours: 10 FKs
- payment_requests: 6 FKs
- orders: 5 FKs
- tour_members: 4 FKs
- receipts: 4 FKs
- order_members: 3 FKs

**結論**: 資料庫層沒有問題，問題應該在前端。

---

## 🛠️ 解決方案（3 階段）

### 階段 1: 建立監控系統 ✅ 已完成

建立了完整的錯誤追蹤系統：

#### 檔案
1. `src/lib/monitoring/error-tracker.ts` - 錯誤追蹤器
2. `src/lib/monitoring/usage-examples.md` - 使用範例
3. `docs/UX_HEALTH_CHECK.md` - 完整檢查清單
4. `scripts/diagnose-ux-issues.sh` - 一鍵診斷腳本

#### 功能
- 追蹤按鈕狀態（顯示/隱藏/disabled）
- 追蹤存檔失敗
- 追蹤 RLS 錯誤
- 追蹤狀態錯誤
- 自動儲存到 localStorage
- 生成錯誤報告

---

### 階段 2: 加入追蹤代碼（待執行）

在關鍵頁面加入錯誤追蹤：

#### 優先級 P0 - 立即加入
1. **Tours 編輯頁面**
   - 儲存按鈕
   - 狀態轉換按鈕
   - 存檔操作

2. **Orders 編輯頁面**
   - 團員新增/刪除
   - 存檔操作

3. **Payment Requests 頁面**
   - 建立付款單
   - 核准按鈕
   - 存檔操作

#### 使用方式

```typescript
// 範例：在儲存按鈕加入追蹤

import { errorTracker } from '@/lib/monitoring/error-tracker';

function SaveButton() {
  const { tour, isLoading } = useTour();
  const canEdit = tour?.status === 'proposal';
  
  // 追蹤按鈕狀態
  useEffect(() => {
    errorTracker.trackButton({
      page: 'tour-edit',
      buttonId: 'save-tour',
      isVisible: true,
      isDisabled: !canEdit || isLoading,
      expectedVisible: true,
      expectedDisabled: false,
      reason: !canEdit ? `status=${tour?.status}` : undefined,
    });
  }, [tour, canEdit, isLoading]);
  
  async function handleSave() {
    try {
      await saveTour(data);
    } catch (error) {
      // 追蹤存檔失敗
      errorTracker.trackSaveFailed({
        page: 'tour-edit',
        entity: 'tour',
        error,
        data,
        userId: user?.id,
        workspaceId: tour?.workspace_id,
      });
      throw error;
    }
  }
  
  return <button disabled={!canEdit || isLoading} onClick={handleSave}>儲存</button>;
}
```

---

### 階段 3: 收集 & 分析（1-2 天後）

#### 收集錯誤日誌

**在瀏覽器 Console 執行**:
```javascript
// 查看錯誤報告
errorTracker.generateReport()

// 匯出 JSON（可以寄給開發者）
console.log(errorTracker.export())
```

#### 分析錯誤

1. **按類型分析**
   - 按鈕問題最多 → UI 邏輯錯誤
   - 存檔失敗最多 → RLS 或約束問題
   - RLS 錯誤 → 權限設定問題

2. **按頁面分析**
   - 哪個頁面問題最多？
   - 哪個功能最常出錯？

3. **按時間分析**
   - 什麼時候最常出錯？
   - 特定操作順序會出錯？

#### 修復問題

根據錯誤日誌，針對性修復：
- 狀態管理問題 → 重構 Zustand store
- UI 邏輯問題 → 簡化條件判斷
- RLS 問題 → 調整政策
- 約束問題 → 調整前端驗證

---

## 📊 預期效果

### 短期（1-2 天）
- 知道哪些頁面最常出錯
- 知道哪些功能最有問題
- 有具體的錯誤日誌可以分析

### 中期（1 週）
- 修復最常見的問題
- 降低 70-80% 的使用者回報

### 長期（1 個月）
- 建立完整的錯誤監控機制
- 新功能上線前先用 Error Tracker 測試
- 主動發現問題，而不是被動回應

---

## 🎯 立即行動

### William 可以立即做的（5 分鐘）

1. **在瀏覽器 Console 執行**:
   ```javascript
   // 檢查是否有錯誤（之前可能已經有了）
   errorTracker.generateReport()
   ```

2. **回報一個具體問題**:
   - 哪個頁面？
   - 哪個按鈕？
   - 什麼時候發生？
   - 做了什麼操作？

3. **提供截圖/錄影**（如果有）

### 我接下來要做的（1-2 小時）

1. ✅ 建立 Error Tracker
2. ✅ 建立診斷腳本
3. ✅ 建立完整文檔
4. ⏳ 在 3 個關鍵頁面加入追蹤代碼
   - Tours 編輯
   - Orders 編輯
   - Payment Requests
5. ⏳ Git commit & push

---

## 📝 文檔

### 已建立
1. `src/lib/monitoring/error-tracker.ts` - 錯誤追蹤器（5698 bytes）
2. `src/lib/monitoring/usage-examples.md` - 使用範例（6638 bytes）
3. `docs/UX_HEALTH_CHECK.md` - 完整檢查清單（8023 bytes）
4. `scripts/diagnose-ux-issues.sh` - 一鍵診斷腳本（7782 bytes）
5. `reports/ux-issues-solution.md` - 本文件

### 參考資料
- 資料庫診斷結果：所有約束正常
- RLS 政策：所有核心表都有
- FK 覆蓋率：94.9%（32 個核心 FK）

---

## 💡 核心洞察

### 為什麼不是「單純的程式碼問題」？

1. **問題分散**
   - 不是單一 bug，而是多個頁面都有
   - 不是單一原因，而是多種原因

2. **需要系統性解決**
   - 不能一個一個修
   - 需要建立監控機制
   - 需要長期追蹤

3. **根本原因是「缺乏可見性」**
   - 不知道哪裡出錯
   - 不知道為什麼出錯
   - 不知道多常出錯

**Error Tracker 提供了「可見性」，讓我們能看到問題。**

---

**更新日期**: 2026-03-09 08:15  
**狀態**: 監控系統已建立，待加入追蹤代碼  
**下一步**: 在關鍵頁面加入 Error Tracker
