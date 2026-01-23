# Venturo 系統架構檢查報告

> **檢查日期**: 2025-11-17
> **檢查範圍**: 資料存取層架構一致性
> **問題發現**: 頻道成員功能使用 API Route，與其他功能不一致

---

## 📊 現況概覽

### 系統規模
- **總 API Routes**: 7 個
- **總 Stores**: 38 個
- **使用 createStore**: 16 個
- **員工規模**: < 20 人

### 架構聲明（README.md）
- ✅ **即時同步** - 多裝置即時資料同步
- ✅ **快取優先** - 使用 IndexedDB 快取加速載入
- ❓ **離線優先** - 未明確說明（已決定先不做）

---

## 🔍 問題分析

### 問題 1：唯一的 Admin Client 使用

**發現**：
- 7 個 API routes 中，只有 1 個使用 `getSupabaseAdminClient()`
- 該 API: `/api/workspaces/[workspaceId]/channels/[channelId]/members`

**影響**：
- ❌ 需要 `SUPABASE_SERVICE_ROLE_KEY` 環境變數
- ❌ `.env.example` 沒有此變數，導致 clone 後無法使用
- ❌ 家裡可用、公司不可用（環境不一致）

**使用此 API 的組件**：
- `src/components/workspace/chat/MemberSidebar.tsx`
- `src/stores/workspace/members-store.ts`

---

### 問題 2：資料存取方式不一致

#### 一致的做法（16 個 Store）：
```typescript
// ✅ 行事曆、代辦事項、旅遊團、訂單等
const useCalendarEventStore = createStore('calendar_events', ...)
const useTodoStore = createStore('todos', ...)
const useTourStore = createStore('tours', 'T')
const useOrderStore = createStore('orders', 'O')
```

**特點**：
- 直接用 Supabase Client（ANON_KEY）
- 自動 IndexedDB 快取
- 支援離線（如果啟用）
- 不需要 SERVICE_ROLE_KEY

#### 不一致的做法（1 個 Store）：
```typescript
// ❌ 頻道成員
const useMembersStore = () => {
  // 透過 API route（需要 Admin Client）
  const members = await fetchChannelMembers(workspaceId, channelId)
}
```

**特點**：
- 透過 API route
- 需要 `SUPABASE_SERVICE_ROLE_KEY`
- 無法離線
- 增加請求延遲

---

### 問題 3：已有對應的 Store 但未使用

**存在但未使用**：
```typescript
// src/stores/workspace/channel-member-store.ts
export const useChannelMemberStore = createStore<ChannelMemberBase & BaseEntity>(
  'channel_members',
  undefined,
  true
)
```

**註解說明**：
```typescript
/**
 * 注意：
 * - 實際使用時通常透過 API endpoint 查詢（包含 profile 資訊）
 * - 這個 Store 主要用於快取和離線支援
 */
```

**分析**：
- Store 已建立，但組件選擇用 API
- 原因：需要 JOIN employees 表格取得 profile
- 但其他功能也有 JOIN 需求，都是前端處理

---

## 📋 其他 API Routes 分析

| API Route | 用途 | 需要 Admin Client | 理由 |
|-----------|------|-------------------|------|
| `/api/linkpay` | 第三方金流 | ❌ | 外部服務整合 |
| `/api/auth/sync-password` | 密碼同步 | ❌ | 認證相關 |
| `/api/health` | 健康檢查 | ❌ | 系統監控 |
| `/api/log-error` | 錯誤記錄 | ❌ | 日誌收集 |
| `/api/itineraries/[id]` | 行程查詢 | ❌ | 資料查詢 |
| `/api/workspaces/.../members` | 頻道成員 | ✅ | **唯一異常** |

---

## 🎯 建議方案

### 方案 A：統一使用 Store（建議）

**優點**：
- ✅ 架構一致（與其他 16 個 Store 相同）
- ✅ 不需要 `SERVICE_ROLE_KEY`
- ✅ 部署簡單（只需 ANON_KEY）
- ✅ 支援離線（如果未來要做）
- ✅ 減少 API 請求（節省成本）

**缺點**：
- ❌ 前端需要 JOIN（多幾行程式碼）

**實作**：
```typescript
// src/components/workspace/chat/MemberSidebar.tsx
const { items: channelMembers } = useChannelMemberStore()
const { items: employees } = useUserStore()

const membersWithProfile = useMemo(() =>
  channelMembers
    .filter(m => m.channel_id === selectedChannel?.id)
    .map(member => ({
      ...member,
      profile: employees.find(emp => emp.id === member.employee_id)
    })),
  [channelMembers, employees, selectedChannel?.id]
)
```

---

### 方案 B：保留 API Route（不建議）

**優點**：
- ✅ 後端 JOIN（SQL 優化）

**缺點**：
- ❌ 需要 `SERVICE_ROLE_KEY`（環境設定複雜）
- ❌ 架構不一致（唯一特例）
- ❌ 無法離線
- ❌ API 請求成本

**需要做**：
1. 在 `.env.example` 加上 `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
2. 文檔說明環境變數設定
3. 每個環境都要設定

---

## 💡 決策考量

### 如果「先不做離線」：
- 兩個方案都可以
- 但方案 A 仍然較好（環境簡單、成本低）

### 如果未來要做離線：
- 必須選方案 A
- API Route 無法離線使用

### 20 人規模：
- 前端 JOIN 完全沒問題
- 資料量極小（< 100 個 channel_members 記錄）
- 記憶體操作毫秒級

---

## 🚨 其他發現的問題

### 1. IndexedDB 使用策略不明確

**問題**：
- README 說「快取優先」
- 但架構是「FastIn（本地先寫）」
- 實際運作？

**建議**：
- 釐清策略：快取優先 vs 離線優先
- 更新文檔說明

### 2. 環境變數文檔不完整

**缺失**：
- `.env.example` 沒有 `SUPABASE_SERVICE_ROLE_KEY`
- README 沒有說明如何取得 Supabase 金鑰

**建議**：
- 補充環境變數取得方式
- 或移除需要 SERVICE_ROLE_KEY 的功能

### 3. Realtime 訂閱策略

**現況**：
- 按需訂閱（進入頁面才訂閱）✅
- 但 channel_members 沒有使用

**建議**：
- 如果改用 Store，記得加上 Realtime hook

---

## 📝 行動建議

### 短期（立即執行）

1. **修正頻道成員功能**
   - 改用 `useChannelMemberStore` + `useUserStore`
   - 移除 API route（或保留但不使用）
   - 加上 Realtime 訂閱

2. **更新環境變數文檔**
   - `.env.example` 加註解說明
   - README 補充 Supabase 設定步驟

### 中期（優化）

3. **統一架構策略**
   - 確定：快取優先 vs 離線優先
   - 更新 README 說明
   - 文檔化決策

4. **清理未使用的程式碼**
   - 如果不用 API route，移除相關程式碼
   - 如果不用 members-store，移除它

### 長期（監控）

5. **架構守護**
   - 新功能統一使用 createStore
   - Code Review 檢查一致性

---

## 結論

**核心問題**：頻道成員功能是唯一使用 API Route + Admin Client 的功能，導致：
- 環境設定不一致
- 架構不統一
- 部署複雜化

**建議解法**：改用 Store + 前端 JOIN（與其他功能一致）

**影響評估**：
- 修改範圍：1 個組件
- 風險：低（有 Store 可用）
- 工時：< 1 小時

**優先級**：⭐⭐⭐ 高（影響開發體驗）
