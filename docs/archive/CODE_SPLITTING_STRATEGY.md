# Code Splitting 策略

> **更新日期**: 2025-10-26
> **目標**: 減少 Initial Load 時間，提升使用者體驗

---

## 📊 當前狀況分析

### 最大頁面 (需優化)

| 頁面              | Size    | First Load | 優先級    |
| ----------------- | ------- | ---------- | --------- |
| `/templates/[id]` | 299 kB  | 583 kB     | 🔴 HIGH   |
| `/workspace`      | 161 kB  | 512 kB     | 🔴 HIGH   |
| `/calendar`       | 83.3 kB | 434 kB     | 🟡 MEDIUM |
| `/tours`          | 39.2 kB | 458 kB     | 🟡 MEDIUM |

### Shared Chunks

```
First Load JS shared by all: 102 kB
├── chunks/1255-18d7473ac3413ee6.js     45.5 kB
├── chunks/4bd1b696-100b9d70ed4e49c1.js  54.2 kB
└── other shared chunks                   2.11 kB
```

---

## 🎯 優化策略

### 1. Dynamic Import (最優先)

#### templates/[id] - 299 kB

**問題**: Editor 組件過大，包含 TipTap、Handsontable 等重型庫

**解決方案**: 動態載入編輯器

```tsx
// Before
import { TourEditorCanvas } from '@/components/editor/TourEditorCanvas'

export default function TemplatePage() {
  return <TourEditorCanvas />
}

// After
import dynamic from 'next/dynamic'

const TourEditorCanvas = dynamic(() => import('@/components/editor/TourEditorCanvas'), {
  loading: () => <EditorLoadingSkeleton />,
  ssr: false, // Editor 不需要 SSR
})

export default function TemplatePage() {
  return <TourEditorCanvas />
}
```

**預期改善**: 299 kB → ~50 kB (-83%)

---

#### workspace - 161 kB

**問題**: 包含多個 Chat、Canvas、QuickTools 組件

**解決方案**: 按 Tab 動態載入

```tsx
// Before
import { ChannelChat } from './ChannelChat'
import { PersonalCanvas } from './PersonalCanvas'
import { QuickTools } from './QuickTools'

// After
import dynamic from 'next/dynamic'

const ChannelChat = dynamic(() => import('./ChannelChat'), {
  loading: () => <ChatSkeleton />,
})

const PersonalCanvas = dynamic(() => import('./PersonalCanvas'), {
  loading: () => <CanvasSkeleton />,
})

const QuickTools = dynamic(() => import('./QuickTools'), {
  loading: () => <ToolsSkeleton />,
})

// 只載入當前 active 的 tab
{
  activeTab === 'chat' && <ChannelChat />
}
{
  activeTab === 'canvas' && <PersonalCanvas />
}
{
  activeTab === 'tools' && <QuickTools />
}
```

**預期改善**: 161 kB → ~80 kB (-50%)

---

#### calendar - 83.3 kB

**問題**: FullCalendar 庫很大

**解決方案**: 動態載入 Calendar

```tsx
// After
const Calendar = dynamic(() => import('@fullcalendar/react').then(mod => mod.Calendar), {
  ssr: false,
})
```

**預期改善**: 83.3 kB → ~15 kB (-82%)

---

### 2. Route-based Splitting (自動)

Next.js 已自動 split routes，但可以優化共享代碼：

#### 優化 Shared Chunks

**目標**: 減少 shared chunks 從 102 kB → 80 kB

**方法**:

1. 移除未使用的依賴
2. Tree-shaking 優化
3. 重型庫按需載入

```tsx
// ❌ 錯誤：整個 lodash
import _ from 'lodash'

// ✅ 正確：只載入需要的
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
```

---

### 3. Component-level Splitting

#### 大型 Modal/Dialog

```tsx
// Dialog 只在需要時載入
const CreateTourDialog = dynamic(() => import('@/components/tours/CreateTourDialog'), {
  ssr: false,
})

function ToursPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>新增旅遊</Button>
      {showDialog && <CreateTourDialog />}
    </>
  )
}
```

#### 圖表組件

```tsx
const Charts = dynamic(() => import('recharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
```

---

### 4. Vendor Splitting 策略

#### next.config.ts 配置

```typescript
export default {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // React 核心
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-core',
              priority: 10,
            },
            // UI 庫
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              name: 'ui-libs',
              priority: 9,
            },
            // Editor 相關
            editor: {
              test: /[\\/]node_modules[\\/](@tiptap|handsontable)[\\/]/,
              name: 'editor-libs',
              priority: 8,
            },
            // Calendar
            calendar: {
              test: /[\\/]node_modules[\\/](@fullcalendar)[\\/]/,
              name: 'calendar-libs',
              priority: 8,
            },
            // 通用 vendor
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 5,
            },
          },
        },
      }
    }
    return config
  },
}
```

---

## 🚀 實作優先序

### Phase 1: 緊急優化 (本週)

1. ✅ **templates/[id]** - Dynamic import TourEditorCanvas
2. ✅ **workspace** - Tab-based lazy loading
3. ✅ **calendar** - Dynamic FullCalendar

**預期改善**:

- templates: 299 kB → 50 kB
- workspace: 161 kB → 80 kB
- calendar: 83.3 kB → 15 kB

### Phase 2: 系統優化 (下週)

4. ⏳ **Vendor splitting** - 配置 webpack
5. ⏳ **Tree-shaking** - 移除未使用代碼
6. ⏳ **Component splitting** - Modal/Dialog 動態載入

### Phase 3: 深度優化 (2週後)

7. ⏳ **Prefetching** - 預載重要頁面
8. ⏳ **Bundle analysis** - 定期分析
9. ⏳ **Performance monitoring** - 自動追蹤

---

## 📏 成功指標

### 目標 (Phase 1 完成後)

| 指標            | Current | Target   | 改善     |
| --------------- | ------- | -------- | -------- |
| 最大頁面        | 583 kB  | < 250 kB | **-57%** |
| 平均 First Load | ~350 kB | < 250 kB | **-29%** |
| Shared Chunks   | 102 kB  | < 80 kB  | **-22%** |

### 監控方式

```bash
# 建置並分析
ANALYZE=true npm run build

# Lighthouse CI
npm run lighthouse

# Bundle size tracking
npm run build | grep "First Load JS"
```

---

## 🛠️ 工具

### 1. Bundle Analyzer

```bash
ANALYZE=true npm run build
# 會開啟視覺化分析介面
```

### 2. Next.js Bundle Size

```bash
npm run build | grep -A 60 "Route (app)"
```

### 3. Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

---

## 📝 最佳實踐

### DO ✅

```tsx
// 1. 使用 dynamic import for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});

// 2. 按需載入
{showModal && <Modal />}

// 3. Tree-shakable imports
import { debounce } from 'lodash-es';

// 4. 路由預載 (重要頁面)
<Link href="/tours" prefetch={true}>
```

### DON'T ❌

```tsx
// 1. 不要載入整個庫
import _ from 'lodash' // ❌
import * as Icons from 'lucide-react' // ❌

// 2. 不要總是 render heavy components
;<FullCalendar /> // 即使隱藏也載入

// 3. 不要同步載入大型組件
import { TourEditor } from './TourEditor' // 299 kB!

// 4. 不要過度 split
// 每個組件都 dynamic() 會造成更多請求
```

---

## 📊 監控與追蹤

### package.json scripts

```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "build:stats": "npm run build -- --profile --json > build-stats.json",
    "lighthouse": "npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

**最後更新**: 2025-10-26
**負責人**: Development Team
**下次檢視**: 每週檢查 bundle size
