# IndexedDB 同步測試計畫

**測試目標**: 驗證 Supabase ↔ IndexedDB 的資料同步機制
**測試日期**: 2025-10-15
**測試環境**: Chrome DevTools

---

## 📋 測試準備

### 1. 清空 IndexedDB

```javascript
// 在瀏覽器 Console 執行
indexedDB.deleteDatabase('VenturoOfflineDB')
console.log('✅ IndexedDB 已清空')
```

### 2. 開啟開發者工具

- 按 F12 打開 DevTools
- 切換到 Application 標籤
- 展開 IndexedDB > VenturoOfflineDB

---

## 🧪 測試案例

### 測試 1: 資料讀取後快取驗證

**目的**: 驗證從 Supabase 讀取的資料是否同步到 IndexedDB

**步驟**:

1. 訪問 http://localhost:3000/test-phase2
2. 點擊「讀取資料」按鈕
3. 等待讀取完成
4. 檢查 IndexedDB 中的資料

**驗證方式**:

```javascript
// 在 Console 執行
;(async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('VenturoOfflineDB', 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  const transaction = db.transaction('tours', 'readonly')
  const store = transaction.objectStore('tours')
  const request = store.getAll()

  request.onsuccess = () => {
    console.log('📊 IndexedDB 中的 Tours:', request.result.length, '筆')
    console.log(request.result)
  }
})()
```

**預期結果**:

- ✅ IndexedDB 中應該有資料
- ✅ 資料數量與 Supabase 一致
- ✅ 資料內容正確

---

### 測試 2: 資料建立後快取驗證

**目的**: 驗證建立資料後 IndexedDB 快取更新

**步驟**:

1. 記錄 IndexedDB 中 tours 的數量
2. 點擊「建立資料」按鈕
3. 等待建立完成
4. 再次檢查 IndexedDB 中的資料

**驗證方式**:

```javascript
// 建立前
;(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })
  const tx = db.transaction('tours', 'readonly')
  const count = await new Promise(resolve => {
    const req = tx.objectStore('tours').count()
    req.onsuccess = () => resolve(req.result)
  })
  console.log('📊 建立前 Tours 數量:', count)
})()

// 點擊「建立資料」

// 等待 2 秒後檢查
setTimeout(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })
  const tx = db.transaction('tours', 'readonly')
  const count = await new Promise(resolve => {
    const req = tx.objectStore('tours').count()
    req.onsuccess = () => resolve(req.result)
  })
  console.log('📊 建立後 Tours 數量:', count)
}, 2000)
```

**預期結果**:

- ✅ IndexedDB 中資料數量增加
- ✅ 新建立的資料出現在 IndexedDB
- ✅ 資料內容與 Supabase 一致

---

### 測試 3: 資料更新後快取驗證

**目的**: 驗證更新資料後 IndexedDB 快取同步

**步驟**:

1. 點擊「更新資料」按鈕
2. 等待更新完成
3. 檢查 IndexedDB 中的資料是否更新

**驗證方式**:

```javascript
// 找出第一筆 tour
;(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })
  const tx = db.transaction('tours', 'readonly')
  const tours = await new Promise(resolve => {
    const req = tx.objectStore('tours').getAll()
    req.onsuccess = () => resolve(req.result)
  })

  if (tours.length > 0) {
    const firstTour = tours[0]
    console.log('📊 更新前狀態:', firstTour.status)
    console.log('參加人數:', firstTour.current_participants)
  }
})()

// 點擊「更新資料」

// 等待 2 秒後檢查
setTimeout(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })
  const tx = db.transaction('tours', 'readonly')
  const tours = await new Promise(resolve => {
    const req = tx.objectStore('tours').getAll()
    req.onsuccess = () => resolve(req.result)
  })

  if (tours.length > 0) {
    const firstTour = tours[0]
    console.log('📊 更新後狀態:', firstTour.status)
    console.log('參加人數:', firstTour.current_participants)
  }
}, 2000)
```

**預期結果**:

- ✅ IndexedDB 中的資料已更新
- ✅ 狀態改為「進行中」
- ✅ 參加人數更新

---

### 測試 4: 資料刪除後快取驗證

**目的**: 驗證刪除資料後 IndexedDB 快取同步

**步驟**:

1. 記錄 IndexedDB 資料數量
2. 點擊「刪除資料」按鈕
3. 檢查 IndexedDB 資料是否刪除

**驗證方式**:

```javascript
// 刪除前
;(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })

  const getTx = table => db.transaction(table, 'readonly')

  const counts = {
    tours: await new Promise(r => {
      const req = getTx('tours').objectStore('tours').count()
      req.onsuccess = () => r(req.result)
    }),
    orders: await new Promise(r => {
      const req = getTx('orders').objectStore('orders').count()
      req.onsuccess = () => r(req.result)
    }),
    quotes: await new Promise(r => {
      const req = getTx('quotes').objectStore('quotes').count()
      req.onsuccess = () => r(req.result)
    }),
  }

  console.log('📊 刪除前:', counts)
})()

// 點擊「刪除資料」

// 等待 2 秒後檢查
setTimeout(async () => {
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })

  const getTx = table => db.transaction(table, 'readonly')

  const counts = {
    tours: await new Promise(r => {
      const req = getTx('tours').objectStore('tours').count()
      req.onsuccess = () => r(req.result)
    }),
    orders: await new Promise(r => {
      const req = getTx('orders').objectStore('orders').count()
      req.onsuccess = () => r(req.result)
    }),
    quotes: await new Promise(r => {
      const req = getTx('quotes').objectStore('quotes').count()
      req.onsuccess = () => r(req.result)
    }),
  }

  console.log('📊 刪除後:', counts)
}, 2000)
```

**預期結果**:

- ✅ IndexedDB 中資料已刪除
- ✅ 資料數量減少
- ✅ 與 Supabase 狀態一致

---

## 🔍 進階測試

### 測試 5: 離線模式測試

**目的**: 驗證 Supabase 不可用時的降級機制

**步驟**:

1. 開啟 DevTools > Network 標籤
2. 啟用「Offline」模式
3. 嘗試建立資料
4. 檢查 IndexedDB 是否有資料

**預期結果**:

- ✅ 應顯示離線模式警告
- ✅ 資料應存入 IndexedDB
- ✅ Console 應顯示降級訊息

---

### 測試 6: 快取一致性測試

**目的**: 驗證 Supabase 和 IndexedDB 的資料一致性

**驗證方式**:

```javascript
// 比對 Supabase 和 IndexedDB 的資料
;(async () => {
  // 1. 從 Supabase 讀取
  const { createClient } = await import('/node_modules/@supabase/supabase-js/dist/module/index.js')
  const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')

  const { data: supabaseData } = await supabase
    .from('tours')
    .select('*')
    .order('created_at', { ascending: true })

  // 2. 從 IndexedDB 讀取
  const db = await new Promise(resolve => {
    const req = indexedDB.open('VenturoOfflineDB', 1)
    req.onsuccess = () => resolve(req.result)
  })

  const indexedDBData = await new Promise(resolve => {
    const tx = db.transaction('tours', 'readonly')
    const req = tx.objectStore('tours').getAll()
    req.onsuccess = () => resolve(req.result)
  })

  // 3. 比對
  console.log('📊 Supabase 資料數:', supabaseData.length)
  console.log('📊 IndexedDB 資料數:', indexedDBData.length)

  if (supabaseData.length === indexedDBData.length) {
    console.log('✅ 資料數量一致')
  } else {
    console.log('❌ 資料數量不一致')
  }

  // 4. 檢查內容
  const supabaseIds = new Set(supabaseData.map(t => t.id))
  const indexedDBIds = new Set(indexedDBData.map(t => t.id))

  const onlyInSupabase = [...supabaseIds].filter(id => !indexedDBIds.has(id))
  const onlyInIndexedDB = [...indexedDBIds].filter(id => !supabaseIds.has(id))

  if (onlyInSupabase.length === 0 && onlyInIndexedDB.length === 0) {
    console.log('✅ 資料 ID 完全一致')
  } else {
    console.log('❌ 發現不一致')
    if (onlyInSupabase.length > 0) {
      console.log('只在 Supabase:', onlyInSupabase)
    }
    if (onlyInIndexedDB.length > 0) {
      console.log('只在 IndexedDB:', onlyInIndexedDB)
    }
  }
})()
```

**預期結果**:

- ✅ 資料數量一致
- ✅ 資料 ID 一致
- ✅ 資料內容一致

---

## 📊 測試記錄表

| 測試案例      | 執行時間 | 結果 | 備註 |
| ------------- | -------- | ---- | ---- |
| 1. 讀取後快取 |          |      |      |
| 2. 建立後快取 |          |      |      |
| 3. 更新後快取 |          |      |      |
| 4. 刪除後快取 |          |      |      |
| 5. 離線模式   |          |      |      |
| 6. 一致性檢查 |          |      |      |

---

## 🎯 通過標準

- ✅ 所有測試案例通過
- ✅ 無資料遺失
- ✅ 同步延遲 < 2 秒
- ✅ 離線模式正常運作
- ✅ Supabase ↔ IndexedDB 資料一致

---

**測試執行者**: \***\*\_\_\_\*\***
**測試日期**: \***\*\_\_\_\*\***
**測試結果**: ⬜ 通過 / ⬜ 失敗
**備註**: ******\*\*******\_\_\_******\*\*******
