# Venturo 完整的 Realtime + 離線同步邏輯

> **日期**: 2025-10-30
> **狀態**: 邏輯統整

---

## 🎯 核心概念

### 1️⃣ Realtime 訂閱觸發時機

```
原則：只有「正在看」的頁面才訂閱 Realtime

✅ 正確流程：
1. 同事新增行事曆
2. 你還沒去看行事曆頁面 → 沒有訂閱 → 什麼都不會發生 ✅
3. 你打開行事曆頁面 → 觸發訂閱 → 立即下載同事新增的資料 ✅
4. 你離開行事曆頁面 → 取消訂閱 ✅

❌ 錯誤流程（目前 Phase 4 的問題）：
1. 你登入系統
2. 所有 50 個表格立即訂閱 ❌
3. 同事新增行事曆 → 你收到推送（即使你沒在看） ❌
4. 浪費連線數 ❌
```

**結論**：
- ✅ 按需訂閱（進入頁面才訂閱）
- ✅ 離開頁面就取消訂閱
- ✅ 連線數 = 當前開啟的頁面數（通常 1-3 個）
- ✅ 不會超標

---

### 2️⃣ 權限系統（角色卡）的即時更新

```
情境：威廉新增了雅萍的權限

Case A - 雅萍正在線上：
1. 威廉更新 雅萍的角色 → Supabase
2. Realtime 推送 → 雅萍的瀏覽器
3. 雅萍立即看到新功能 ✅

Case B - 雅萍離線：
1. 威廉更新 雅萍的角色 → Supabase
2. 雅萍離線 → 沒收到推送
3. 雅萍下次登入 → 載入最新角色 → 看到新功能 ✅
```

**實作**：
```typescript
// 登入時檢查角色
async function login() {
  const { data: user } = await supabase.auth.getUser();

  // 從 Supabase 載入最新角色
  const { data: role } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 訂閱角色變更
  realtimeManager.subscribe({
    table: 'user_roles',
    filter: `user_id=eq.${user.id}`,
    handlers: {
      onUpdate: (newRole) => {
        // 即時更新權限
        updateUserPermissions(newRole);
        alert('你的權限已更新！');
      }
    }
  });
}
```

---

### 3️⃣ 離線優先策略

```
登入流程：

Step 1: 載入本地資料（0.1 秒）
├─ 從 IndexedDB 讀取快取
└─ 立即顯示畫面 ✅

Step 2: 檢查遠端更新（背景執行）
├─ 比對 updated_at 時間戳
├─ 只下載有變更的資料
└─ 靜默更新畫面 ✅

Step 3: 訂閱 Realtime（進入頁面時）
├─ 進入行事曆頁面 → 訂閱 calendar_events
├─ 離開行事曆頁面 → 取消訂閱
└─ 持續保持即時 ✅
```

**優點**：
- ✅ 快速啟動（本地優先）
- ✅ 自動同步（背景更新）
- ✅ 省流量（只下載變更）
- ✅ 防衝突（時間戳決定）

---

## 📊 完整流程圖

### 情境 A：線上協作

```
威廉（公司電腦）                      雅萍（家裡電腦）
────────────────────────────────────────────────────────
1. 打開「行事曆」頁面
   ↓
2. 觸發 Realtime 訂閱 calendar_events
   ↓
3. 新增行事曆「團隊會議」
   ↓
4. 存入 Supabase
   ↓ (WebSocket)
   ↓─────────────────────────→  5. 收到 Realtime 推送
                                    ↓
                                 6. 如果正在看行事曆
                                    → 立即顯示 ✅

                                 7. 如果沒在看行事曆
                                    → 什麼都不會發生 ✅
                                    （因為沒訂閱）
```

---

### 情境 B：離線後上線

```
雅萍（家裡電腦 - 離線）
────────────────────────────────
1. 離線狀態
   ↓
2. 新增行事曆「個人待辦」
   ↓
3. 存入 IndexedDB（本地）
   ↓
4. 標記為 _needs_sync: true

   （網路恢復）

5. 背景上傳到 Supabase ✅
   ↓
6. 標記為 _needs_sync: false
   ↓
7. 同步完成 ✅
```

---

### 情境 C：衝突解決

```
威廉（公司）                          雅萍（家裡）
────────────────────────────────────────────────────────
1. 編輯行事曆 ID=123
   「團隊會議」
   updated_at: 10:00:00

2. 存入 Supabase                   3. 編輯同一筆 ID=123
   ↓                                  「部門會議」
                                      updated_at: 10:00:05
                                      ↓
                                   4. 存入 Supabase

   ↓─────── Realtime ────────────→ 5. 收到威廉的更新
                                      (10:00:00)

   6. 比較時間戳：
      - 威廉: 10:00:00
      - 雅萍: 10:00:05 ✅ 較新

   7. 保留雅萍的版本 ✅

   8. 威廉收到 Realtime 推送
      → 更新為「部門會議」✅
```

**策略**：`LastWrite` - 最後寫入者獲勝（根據 updated_at）

---

## 🔧 技術實作

### 1. 按需訂閱（On-Demand Subscription）

```typescript
// src/hooks/useRealtimeForCalendar.ts
export function useRealtimeForCalendar() {
  useEffect(() => {
    // 進入頁面：訂閱
    const subscriptionId = realtimeManager.subscribe({
      table: 'calendar_events',
      handlers: {
        onInsert: (event) => {
          // 新增事件
          calendarStore.setState(state => ({
            items: [...state.items, event]
          }));
        },
        onUpdate: (event) => {
          // 更新事件
          calendarStore.setState(state => ({
            items: state.items.map(e =>
              e.id === event.id ? event : e
            )
          }));
        },
        onDelete: (oldEvent) => {
          // 刪除事件
          calendarStore.setState(state => ({
            items: state.items.filter(e => e.id !== oldEvent.id)
          }));
        }
      }
    });

    // 離開頁面：取消訂閱
    return () => {
      realtimeManager.unsubscribe(subscriptionId);
    };
  }, []);
}

// 在頁面中使用
function CalendarPage() {
  useRealtimeForCalendar(); // ← 只有這個頁面才訂閱

  const events = useCalendarStore(state => state.items);
  // ...
}
```

---

### 2. 離線優先載入

```typescript
// src/stores/calendar-store.ts
export const useCalendarStore = create((set, get) => ({
  items: [],
  loading: false,

  // 離線優先載入
  fetchAll: async () => {
    set({ loading: true });

    // Step 1: 立即載入本地快取
    const cachedEvents = await indexedDB.getAll('calendar_events');
    set({ items: cachedEvents, loading: false });

    // Step 2: 背景同步 Supabase
    if (navigator.onLine) {
      const { data: remoteEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .gt('updated_at', getLastSyncTime()); // 只下載變更

      if (remoteEvents.length > 0) {
        // 合併資料
        const merged = mergeWithLocal(cachedEvents, remoteEvents);

        // 更新快取
        await indexedDB.batchPut('calendar_events', merged);

        // 更新狀態
        set({ items: merged });
      }
    }
  }
}));
```

---

### 3. 權限即時更新

```typescript
// src/stores/auth-store.ts
export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,

  login: async (credentials) => {
    // 登入
    const { data: user } = await supabase.auth.signInWithPassword(credentials);

    // 載入角色
    const { data: role } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    set({ user, role });

    // 訂閱角色變更（永久訂閱，不取消）
    realtimeManager.subscribe({
      table: 'user_roles',
      filter: `user_id=eq.${user.id}`,
      subscriptionId: 'user-role-subscription',
      handlers: {
        onUpdate: (newRole) => {
          set({ role: newRole });

          // 通知使用者
          toast.success('你的權限已更新！');

          // 重新載入頁面（刷新 UI）
          setTimeout(() => window.location.reload(), 2000);
        }
      }
    });
  },

  logout: async () => {
    // 取消所有訂閱
    realtimeManager.unsubscribeAll();

    // 登出
    await supabase.auth.signOut();

    set({ user: null, role: null });
  }
}));
```

---

## 📈 連線數估算

### 情境 A：單一使用者

```
使用者行為：
├─ 登入 → 訂閱 user_roles（1 個連線）
├─ 進入工作空間 → 訂閱 channels（1 個連線）
├─ 進入頻道聊天 → 訂閱 messages（1 個連線）
└─ 進入行事曆 → 訂閱 calendar_events（1 個連線）

總計：4 個連線
```

### 情境 B：20 位員工 × 2 裝置

```
最糟情況（所有人同時開 4 個頁面）：
20 × 2 × 4 = 160 個連線

免費上限：200 個連線
占用率：80% ✅
```

### 情境 C：實際使用

```
平均每人開啟頁面：2-3 個
實際連線數：20 × 2 × 2.5 = 100 個連線

免費上限：200 個連線
占用率：50% ✅
```

**結論**：✅ 不會超標

---

## ✅ 核心原則總結

### 1. Realtime 訂閱原則

```
✅ DO（該做的）：
- 進入頁面才訂閱
- 離開頁面就取消訂閱
- 只訂閱當前需要的表格
- 永久訂閱系統表格（user_roles, workspaces）

❌ DON'T（不該做的）：
- 登入時訂閱所有表格
- 永遠不取消訂閱
- 訂閱不相關的表格
- 重複訂閱同一個表格
```

### 2. 離線優先原則

```
✅ DO（該做的）：
- 優先讀取 IndexedDB
- 背景同步 Supabase
- 只下載變更的資料
- 用時間戳解決衝突

❌ DON'T（不該做的）：
- 每次都從 Supabase 載入
- 下載所有資料
- 忽略離線變更
- 不處理衝突
```

### 3. 權限管理原則

```
✅ DO（該做的）：
- 登入時載入最新角色
- 訂閱角色變更（永久）
- 即時更新 UI
- 通知使用者

❌ DON'T（不該做的）：
- 快取過時的權限
- 不訂閱角色變更
- 要求使用者重新登入
```

---

## 🎯 最終流程總結

```
1. 登入
   ├─ 載入本地快取（快速顯示）
   ├─ 從 Supabase 載入最新角色 ✅
   └─ 訂閱角色變更（永久）✅

2. 進入頁面
   ├─ 優先顯示本地資料
   ├─ 背景同步 Supabase
   └─ 訂閱當前頁面的表格 ✅

3. 離開頁面
   └─ 取消訂閱 ✅

4. 離線操作
   ├─ 存入 IndexedDB
   ├─ 標記 _needs_sync
   └─ 網路恢復時上傳 ✅

5. 收到 Realtime 推送
   ├─ 如果正在看該頁面 → 立即更新 ✅
   └─ 如果沒在看 → 什麼都不做 ✅

6. 衝突處理
   ├─ 比較 updated_at
   └─ 保留最新的版本 ✅
```

---

## 📋 需要實作的改動

### Phase 4.1: 改為按需訂閱

1. ❌ ~~移除 create-store-new.ts 的自動訂閱~~ ← 保留，但改為手動觸發
2. ✅ 為每個表格建立 `useRealtimeFor[Table]()` Hook
3. ✅ 在各頁面加入對應的 Hook
4. ✅ 永久訂閱系統表格（user_roles, workspaces）

### Phase 4.2: 完善離線優先

1. ✅ 優先載入 IndexedDB
2. ✅ 背景同步 Supabase（只下載變更）
3. ✅ 時間戳衝突解決
4. ✅ 防重複機制

### Phase 4.3: 權限即時更新

1. ✅ 登入時載入最新角色
2. ✅ 訂閱角色變更
3. ✅ 即時通知使用者
4. ✅ 自動刷新 UI

---

**準備開始實作了嗎？** 🚀
