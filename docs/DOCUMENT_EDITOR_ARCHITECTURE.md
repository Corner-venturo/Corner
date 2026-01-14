# 文件編輯器架構設計

> **核心原則**：像 Photoshop/Illustrator 一樣，載入要等、編輯本地化、儲存建版本
> **適用範圍**：手冊編輯器、行程表編輯器、未來 Venturo Studio

---

## 設計哲學

### 從「即時同步」到「文件編輯」

```
❌ 舊思維（Web App 即時同步）
   每次操作 → setState → re-render → 同步資料庫
   問題：複雜、race condition、網路卡頓影響體驗

✅ 新思維（傳統軟體文件編輯）
   載入完整資料 → 本地編輯 → 儲存時建立版本
   優點：簡單、穩定、可離線編輯、版本可回溯
```

### 用戶預期

用戶打開 PS/AI/Word 時：
- 預期要等一下載入
- 編輯時流暢（因為是本地操作）
- 儲存時再等一下
- 可以看到版本歷史

---

## 資料流架構

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌──────────────┐    ┌─────────────┐       │
│   │  載入   │ → │   編輯器     │ → │    儲存     │       │
│   │ Loading │    │ (Fabric.js) │    │ Save/Export │       │
│   └─────────┘    └──────────────┘    └─────────────┘       │
│        ↑              ↑ ↓                   ↓               │
│        │         純本地操作            導出 JSON            │
│        │         不觸發 React          建立版本             │
│        │                                    ↓               │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              DocumentStore (Zustand)                 │  │
│   │  - currentDocument: { id, name, type, data }        │  │
│   │  - versions: Version[]                              │  │
│   │  - isDirty: boolean                                 │  │
│   │  - isLoading: boolean                               │  │
│   └─────────────────────────────────────────────────────┘  │
│                            ↑ ↓                              │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                        Supabase                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   brochure_documents          brochure_versions             │
│   ┌──────────────────┐       ┌────────────────────┐        │
│   │ id               │       │ id                 │        │
│   │ tour_id          │       │ document_id        │        │
│   │ name             │       │ version_number     │        │
│   │ type (front/back)│       │ data (JSONB)       │        │
│   │ current_version  │───→   │ thumbnail_url      │        │
│   │ created_at       │       │ created_at         │        │
│   │ updated_at       │       │ created_by         │        │
│   └──────────────────┘       └────────────────────┘        │
│                                                             │
│   itinerary_documents         itinerary_versions            │
│   ┌──────────────────┐       ┌────────────────────┐        │
│   │ id               │       │ id                 │        │
│   │ tour_id          │       │ document_id        │        │
│   │ name             │       │ version_number     │        │
│   │ current_version  │───→   │ data (JSONB)       │        │
│   │ created_at       │       │ thumbnail_url      │        │
│   │ updated_at       │       │ created_at         │        │
│   └──────────────────┘       │ created_by         │        │
│                              └────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心流程

### 1. 載入流程

```typescript
// 完整載入，允許等待
async function loadDocument(documentId: string) {
  setLoading(true)
  setLoadingStage('載入文件資料...')

  // 1. 取得文件 + 最新版本
  const doc = await fetchDocument(documentId)
  const version = await fetchVersion(doc.current_version)

  setLoadingStage('預載入圖片...')

  // 2. 預載入所有圖片（關鍵！避免渲染時閃爍）
  const imageUrls = extractImageUrls(version.data)
  await preloadImages(imageUrls)

  setLoadingStage('渲染畫布...')

  // 3. 一次性渲染到 canvas（不是增量）
  await canvas.loadFromJSON(version.data)
  canvas.renderAll()

  setLoading(false)
  setIsDirty(false)
}
```

### 2. 編輯流程

```typescript
// 純本地操作，不觸發 React state
// Fabric.js 自己管理 canvas 狀態

// 只追蹤「是否有修改」
canvas.on('object:modified', () => {
  setIsDirty(true)  // 唯一需要的 state 更新
})

canvas.on('object:added', () => {
  setIsDirty(true)
})

canvas.on('object:removed', () => {
  setIsDirty(true)
})

// 不需要：
// - 維護 elements[] state
// - 增量渲染邏輯
// - 複雜的 ref 追蹤
```

### 3. 儲存流程

```typescript
async function saveDocument() {
  if (!isDirty) return

  setSaving(true)

  // 1. 從 canvas 導出完整 JSON
  const canvasData = canvas.toJSON([
    'id', 'name', 'selectable', 'locked',
    'elementType', 'customData'  // 自定義屬性
  ])

  // 2. 生成縮圖
  const thumbnail = canvas.toDataURL({
    format: 'jpeg',
    quality: 0.5,
    multiplier: 0.3
  })

  // 3. 上傳縮圖
  const thumbnailUrl = await uploadThumbnail(thumbnail)

  // 4. 建立新版本
  const newVersion = await createVersion({
    document_id: documentId,
    data: canvasData,
    thumbnail_url: thumbnailUrl
  })

  // 5. 更新文件的 current_version
  await updateDocument(documentId, {
    current_version: newVersion.id
  })

  setSaving(false)
  setIsDirty(false)
}
```

### 4. 自動儲存（可選）

```typescript
// 每 5 分鐘自動儲存（如果有修改）
useEffect(() => {
  const interval = setInterval(() => {
    if (isDirty) {
      saveDocument()
    }
  }, 5 * 60 * 1000)

  return () => clearInterval(interval)
}, [isDirty])

// 離開頁面時提醒
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = '有未儲存的變更，確定要離開嗎？'
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

---

## 版本管理

### 版本列表 UI

```
┌─────────────────────────────────────┐
│ 版本歷史                        [x] │
├─────────────────────────────────────┤
│ ┌─────┐ 版本 5 (目前)              │
│ │ 縮圖 │ 2026-01-14 15:30          │
│ └─────┘ William                     │
├─────────────────────────────────────┤
│ ┌─────┐ 版本 4                [恢復]│
│ │ 縮圖 │ 2026-01-14 14:20          │
│ └─────┘ William                     │
├─────────────────────────────────────┤
│ ┌─────┐ 版本 3                [恢復]│
│ │ 縮圖 │ 2026-01-14 10:15          │
│ └─────┘ William                     │
└─────────────────────────────────────┘
```

### 恢復版本

```typescript
async function restoreVersion(versionId: string) {
  // 1. 取得舊版本資料
  const oldVersion = await fetchVersion(versionId)

  // 2. 建立新版本（基於舊版本）
  const newVersion = await createVersion({
    document_id: documentId,
    data: oldVersion.data,
    thumbnail_url: oldVersion.thumbnail_url,
    restored_from: versionId  // 標記來源
  })

  // 3. 更新文件
  await updateDocument(documentId, {
    current_version: newVersion.id
  })

  // 4. 重新載入
  await loadDocument(documentId)
}
```

---

## 模板系統

### 套用模板

```typescript
async function applyTemplate(templateId: string) {
  setLoading(true)
  setLoadingStage('載入模板...')

  // 1. 取得模板
  const template = await fetchTemplate(templateId)

  setLoadingStage('預載入資源...')

  // 2. 預載入所有資源
  await preloadImages(extractImageUrls(template.data))

  setLoadingStage('套用模板...')

  // 3. 清空 canvas
  canvas.clear()

  // 4. 載入模板
  await canvas.loadFromJSON(template.data)

  // 5. 替換佔位符（可選）
  if (tourData) {
    replacePlaceholders(canvas, tourData)
  }

  canvas.renderAll()

  setLoading(false)
  setIsDirty(true)  // 標記為有修改（因為套用了模板）
}
```

### 儲存為模板

```typescript
async function saveAsTemplate(name: string, category: string) {
  // 1. 導出 canvas（移除特定資料，保留結構）
  const templateData = canvas.toJSON()

  // 清理特定資料，保留佔位符
  cleanTemplateData(templateData)

  // 2. 生成縮圖
  const thumbnail = canvas.toDataURL({ format: 'jpeg', quality: 0.7 })
  const thumbnailUrl = await uploadThumbnail(thumbnail)

  // 3. 建立模板
  await createTemplate({
    name,
    category,
    data: templateData,
    thumbnail_url: thumbnailUrl
  })
}
```

---

## 簡化後的組件結構

### Before (複雜)

```
brochure/page.tsx (4600+ 行)
├── 大量 useState 管理 elements
├── 複雜的增量渲染邏輯
├── useCanvasEditor (500+ 行)
├── 各種 ref 追蹤狀態
└── state 同步問題
```

### After (簡單)

```
brochure/
├── page.tsx (主頁面，~500 行)
│   ├── 載入/儲存邏輯
│   ├── 工具列
│   └── 側邊欄
│
├── components/
│   ├── BrochureCanvas.tsx (Canvas 容器)
│   ├── LoadingOverlay.tsx (載入畫面)
│   ├── VersionHistory.tsx (版本歷史)
│   └── TemplateSelector.tsx (模板選擇)
│
├── hooks/
│   ├── useBrochureEditor.ts (簡化版，~200 行)
│   │   ├── loadDocument()
│   │   ├── saveDocument()
│   │   ├── isDirty
│   │   └── canvas 事件綁定
│   │
│   └── useVersionHistory.ts
│
└── lib/
    ├── canvas-utils.ts (Fabric.js 工具)
    └── template-utils.ts (模板工具)
```

---

## 資料庫 Migration

```sql
-- 手冊文件表
CREATE TABLE brochure_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'front', 'back', 'full'
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

-- 手冊版本表
CREATE TABLE brochure_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES brochure_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL, -- Fabric.js canvas JSON
  thumbnail_url TEXT,
  restored_from UUID REFERENCES brochure_versions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,

  UNIQUE(document_id, version_number)
);

-- 添加外鍵
ALTER TABLE brochure_documents
ADD CONSTRAINT fk_current_version
FOREIGN KEY (current_version_id) REFERENCES brochure_versions(id);

-- 自動遞增版本號
CREATE OR REPLACE FUNCTION increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number := COALESCE(
    (SELECT MAX(version_number) + 1
     FROM brochure_versions
     WHERE document_id = NEW.document_id),
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_version_number
BEFORE INSERT ON brochure_versions
FOR EACH ROW
EXECUTE FUNCTION increment_version_number();

-- 行程表也一樣
CREATE TABLE itinerary_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE itinerary_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES itinerary_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,

  UNIQUE(document_id, version_number)
);
```

---

## 實作順序

### Phase 1: 基礎架構
1. [ ] 建立資料庫表格
2. [ ] 建立 DocumentStore
3. [ ] 實作載入流程（含 Loading UI）

### Phase 2: 編輯器簡化
4. [ ] 移除複雜的 state 管理
5. [ ] 改為純 Fabric.js 操作
6. [ ] 只追蹤 isDirty

### Phase 3: 版本系統
7. [ ] 實作儲存流程
8. [ ] 實作版本歷史 UI
9. [ ] 實作版本恢復

### Phase 4: 模板系統
10. [ ] 模板套用流程
11. [ ] 儲存為模板
12. [ ] 模板庫管理

---

*最後更新: 2026-01-14*
