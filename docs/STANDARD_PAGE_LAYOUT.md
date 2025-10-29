# StandardPageLayout 使用指南

> 統一的頁面佈局組件，確保所有頁面都遵循相同的結構規範

## 📐 設計原則

所有頁面必須使用 `StandardPageLayout`，除非有特殊設計需求（如行程設計內頁）。

### 標準結構

```tsx
<div className="h-full flex flex-col">
  <ResponsiveHeader />        // 固定在上方
  <div className="flex-1">    // 自動填滿剩餘空間
    {children}
  </div>
</div>
```

## 🎯 使用場景

### 場景 1: 列表頁面（最常見）

適用於：旅遊團管理、合約管理、客戶管理等

```tsx
import { StandardPageLayout } from '@/components/layout/standard-page-layout';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { MapPin } from 'lucide-react';

export default function ToursPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  return (
    <StandardPageLayout
      title="旅遊團管理"
      icon={MapPin}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '旅遊團管理', href: '/tours' }
      ]}
      showSearch
      searchTerm={search}
      onSearchChange={setSearch}
      searchPlaceholder="搜尋旅遊團..."
      tabs={[
        { value: 'all', label: '全部' },
        { value: 'active', label: '進行中' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onAdd={() => setShowDialog(true)}
      addLabel="新增旅遊團"
    >
      <EnhancedTable {...} />
    </StandardPageLayout>
  );
}
```

**特點**：
- `contentOverflow="auto"`（預設）：內容可滾動
- `contentPadding={true}`（預設）：無需設定，內容自動有適當間距

---

### 場景 2: 工作空間類型（完全填滿）

適用於：工作空間、聊天室等需要完全填滿的頁面

```tsx
import { StandardPageLayout } from '@/components/layout/standard-page-layout';
import { ChannelChat } from '@/components/workspace/ChannelChat';

export default function WorkspacePage() {
  return (
    <StandardPageLayout
      title="工作空間"
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '工作空間', href: '/workspace' }
      ]}
      contentOverflow="hidden"
      contentPadding={false}
    >
      <ChannelChat />
    </StandardPageLayout>
  );
}
```

**特點**：
- `contentOverflow="hidden"`：由子組件處理滾動
- `contentPadding={false}`：內容完全填滿，無 padding

---

### 場景 3: 自訂 Header 內容（時間箱）

適用於：需要在 Header 下方加入週選擇器、過濾器等

```tsx
import { StandardPageLayout } from '@/components/layout/standard-page-layout';
import { StatisticsPanel } from './components/statistics-panel';
import { WeekView } from './components/week-view';
import { Clock, Package2, Calendar } from 'lucide-react';

export default function TimeboxPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeInterval, setTimeInterval] = useState<30 | 60>(60);

  return (
    <StandardPageLayout
      title="時間箱管理"
      icon={Clock}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '箱型時間', href: '/timebox' }
      ]}
      actions={(
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowBoxManager(true)}>
            <Package2 className="h-4 w-4" />
            管理箱子
          </Button>
        </div>
      )}
      headerChildren={(
        <div className="flex items-center gap-6">
          {/* 週選擇器 */}
          <WeekSelector
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />

          {/* 時間間隔切換 */}
          <TimeIntervalToggle
            value={timeInterval}
            onChange={setTimeInterval}
          />
        </div>
      )}
      contentOverflow="hidden"
    >
      <div className="flex-1 overflow-hidden flex flex-col gap-6">
        <StatisticsPanel />
        <div className="flex-1 overflow-hidden">
          <div className="h-full border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            <WeekView
              selectedWeek={selectedWeek}
              timeInterval={timeInterval}
            />
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
```

**特點**：
- `actions`：Header 右側自訂按鈕
- `headerChildren`：Header 下方的自訂內容
- `contentOverflow="hidden"`：內層自行處理滾動

---

## ⚙️ Props 說明

### 必填 Props

| Prop | 類型 | 說明 |
|------|------|------|
| `title` | `string` | 頁面標題 |
| `children` | `ReactNode` | 頁面內容 |

### Header 相關

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `icon` | `LucideIcon` | - | 頁面圖示 |
| `breadcrumb` | `BreadcrumbItem[]` | - | 麵包屑導航 |
| `showSearch` | `boolean` | `false` | 是否顯示搜尋框 |
| `searchTerm` | `string` | - | 搜尋文字 |
| `onSearchChange` | `(value: string) => void` | - | 搜尋變更回調 |
| `searchPlaceholder` | `string` | - | 搜尋框佔位符 |
| `tabs` | `TabItem[]` | - | 狀態 Tab 配置 |
| `activeTab` | `string` | - | 當前啟用的 Tab |
| `onTabChange` | `(tab: string) => void` | - | Tab 變更回調 |
| `actions` | `ReactNode` | - | Header 右側自訂操作 |
| `onAdd` | `() => void` | - | 新增按鈕點擊事件 |
| `addLabel` | `string` | - | 新增按鈕文字 |
| `headerChildren` | `ReactNode` | - | Header 下方的自訂內容 |

### 內容配置

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `contentOverflow` | `'auto' \| 'hidden'` | `'auto'` | 內容區域的滾動行為 |
| `contentPadding` | `boolean` | `true` | 內容區域是否需要 padding |
| `className` | `string` | - | 自訂外層 className |

---

## 🚫 何時不使用

以下情況可以不使用 `StandardPageLayout`：

1. **特殊設計的完整頁面**
   - 行程設計編輯器（`/itinerary/new`）
   - 登入頁面（`/login`）

2. **嵌套的子頁面或對話框內容**
   - Dialog 內的表單
   - Tabs 內的子內容

3. **自訂的完全控制頁面**
   - 需要完全自訂佈局結構的特殊頁面

---

## 📝 遷移指南

### 從舊模式遷移

**舊寫法**：
```tsx
export default function MyPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="我的頁面"
        showSearch
        searchTerm={search}
        onSearchChange={setSearch}
      />
      <div className="flex-1 overflow-auto">
        {/* 內容 */}
      </div>
    </div>
  );
}
```

**新寫法**：
```tsx
import { StandardPageLayout } from '@/components/layout/standard-page-layout';

export default function MyPage() {
  return (
    <StandardPageLayout
      title="我的頁面"
      showSearch
      searchTerm={search}
      onSearchChange={setSearch}
    >
      {/* 內容 */}
    </StandardPageLayout>
  );
}
```

---

## ✅ 優點

1. **統一規範**：所有頁面遵循相同結構
2. **減少重複**：不需要每次都寫 `h-full flex flex-col`
3. **易於維護**：統一修改佈局只需改一個地方
4. **類型安全**：完整的 TypeScript 類型定義
5. **靈活性**：支援多種使用場景

---

## 🎨 設計一致性

使用 `StandardPageLayout` 確保：
- ✅ Header 高度一致
- ✅ 內容區域行為一致
- ✅ 響應式佈局一致
- ✅ 視覺效果一致

---

**注意**：已有使用 `ListPageLayout` 的頁面（合約管理、人資管理）可以繼續使用，因為 `ListPageLayout` 內部已遵循相同的結構規範。
