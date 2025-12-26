'use client'

import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import {
  FolderTree,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Component,
  Database,
  Code,
  Route,
  FileCode
} from 'lucide-react'

// 檔案項目 (名稱 + 說明)
interface FileItem {
  name: string
  desc: string
}

// 專案結構資料 - 每個檔案都有說明
const projectStructure = {
  features: {
    label: 'Features (功能模組)',
    desc: '各功能的主要邏輯，包含頁面、hooks、services',
    icon: Layers,
    items: {
      'tours': {
        label: '行程管理',
        desc: '行程的建立、編輯、列表顯示',
        children: {
          'components': [
            { name: 'ToursPage.tsx', desc: '行程列表頁面，顯示所有行程' },
            { name: 'TourForm.tsx', desc: '行程表單，新增/編輯行程資料' },
            { name: 'TourExpandedView.tsx', desc: '行程展開檢視，顯示詳細資訊' },
            { name: 'CreateTourSourceDialog.tsx', desc: '建立行程來源選擇對話框' },
          ],
          'components/sections': [
            { name: 'HeroSection.tsx', desc: '行程封面區塊（主視覺）' },
            { name: 'ItinerarySection.tsx', desc: '每日行程區塊' },
            { name: 'PriceSection.tsx', desc: '價格區塊' },
          ],
          'hooks': [
            { name: 'useTours.ts', desc: '行程資料的讀取與狀態管理' },
            { name: 'useTourOperations.ts', desc: '行程操作（新增、修改、刪除）' },
          ],
          'services': [
            { name: 'tour.service.ts', desc: '行程相關的 API 呼叫' },
          ],
          '': [
            { name: 'types.ts', desc: '行程相關的 TypeScript 型別定義' },
          ],
        }
      },
      'quotes': {
        label: '報價單',
        desc: '報價單的建立與管理',
        children: {
          'components': [
            { name: 'QuotesPage.tsx', desc: '報價單列表頁面' },
            { name: 'QuoteForm.tsx', desc: '報價單表單' },
            { name: 'QuoteExpandedView.tsx', desc: '報價單展開檢視' },
          ],
          'hooks': [
            { name: 'useQuotes.ts', desc: '報價單資料管理' },
          ],
          'services': [
            { name: 'quote.service.ts', desc: '報價單 API' },
          ],
        }
      },
      'calendar': {
        label: '行事曆',
        desc: '團控行事曆，顯示行程時間',
        children: {
          'components': [
            { name: 'CalendarView.tsx', desc: '行事曆主畫面' },
            { name: 'EventDialog.tsx', desc: '事件編輯對話框' },
          ],
          'hooks': [
            { name: 'useCalendar.ts', desc: '行事曆資料管理' },
          ],
        }
      },
      'payments': {
        label: '收款管理',
        desc: '客戶收款記錄與追蹤',
        children: {
          'hooks': [
            { name: 'usePayments.ts', desc: '收款資料管理' },
          ],
          'services': [
            { name: 'payment.service.ts', desc: '收款 API' },
          ],
        }
      },
      'disbursement': {
        label: '撥款管理',
        desc: '對供應商的付款作業',
        children: {
          'components': [
            { name: 'DisbursementPage.tsx', desc: '撥款列表頁面' },
          ],
          'hooks': [
            { name: 'useDisbursement.ts', desc: '撥款資料管理' },
          ],
        }
      },
      'attractions': {
        label: '景點庫',
        desc: '景點資料的維護與搜尋',
        children: {
          'components': [
            { name: 'AttractionsPage.tsx', desc: '景點列表頁面' },
            { name: 'AttractionDialog.tsx', desc: '景點編輯對話框' },
          ],
          'hooks': [
            { name: 'useAttractions.ts', desc: '景點資料管理' },
          ],
        }
      },
      'suppliers': {
        label: '供應商',
        desc: '供應商資料管理',
        children: {
          'components': [
            { name: 'SuppliersPage.tsx', desc: '供應商列表頁面' },
          ],
        }
      },
      'chat': {
        label: '聊天室',
        desc: '團隊內部溝通',
        children: {
          'components': [
            { name: 'ChatPanel.tsx', desc: '聊天面板' },
          ],
          'hooks': [
            { name: 'useChat.ts', desc: '聊天訊息管理' },
          ],
        }
      },
      'timebox': {
        label: '時間盒',
        desc: '工作時間管理工具',
        children: {
          'components': [
            { name: 'TimeboxPage.tsx', desc: '時間盒主頁面' },
          ],
          'hooks': [
            { name: 'useTimebox.ts', desc: '時間盒資料管理' },
          ],
        }
      },
      'esims': {
        label: 'eSIM',
        desc: 'eSIM 卡管理',
        children: {
          'components': [
            { name: 'EsimsPage.tsx', desc: 'eSIM 列表頁面' },
          ],
        }
      },
      'tour-leaders': {
        label: '領隊管理',
        desc: '領隊資料與派遣',
        children: {
          'components': [
            { name: 'TourLeadersPage.tsx', desc: '領隊列表頁面' },
          ],
        }
      },
      'visas': {
        label: '簽證',
        desc: '簽證申請追蹤',
        children: {
          'constants': [
            { name: 'visa-types.ts', desc: '簽證類型常數定義' },
          ],
        }
      },
      'erp-accounting': {
        label: 'ERP 會計',
        desc: '會計傳票與帳務',
        children: {
          'components': [
            { name: 'VouchersPage.tsx', desc: '傳票列表頁面' },
          ],
          'hooks': [
            { name: 'useAccounting.ts', desc: '會計資料管理' },
          ],
        }
      },
      'dashboard': {
        label: '儀表板',
        desc: '首頁統計與快捷功能',
        children: {
          'components': [
            { name: 'DashboardWidgets.tsx', desc: '儀表板小工具' },
          ],
          'hooks': [
            { name: 'useDashboard.ts', desc: '儀表板資料' },
          ],
        }
      },
    }
  },
  components: {
    label: 'Components (共用組件)',
    desc: '可重複使用的 UI 組件',
    icon: Component,
    items: {
      'tours': {
        label: '行程 Tab 組件',
        desc: '行程詳情頁的各個分頁',
        children: {
          '': [
            { name: 'tour-members.tsx', desc: '團員名單 Tab' },
            { name: 'tour-orders.tsx', desc: '訂單列表 Tab' },
            { name: 'tour-costs.tsx', desc: '成本明細 Tab' },
            { name: 'tour-payments.tsx', desc: '收款記錄 Tab' },
            { name: 'tour-operations.tsx', desc: '作業進度 Tab' },
            { name: 'tour-documents.tsx', desc: '相關文件 Tab' },
          ],
        }
      },
      'tour-preview': {
        label: '行程預覽',
        desc: '行程表的預覽樣式',
        children: {
          '': [
            { name: 'AttractionCard.tsx', desc: '景點卡片（預覽用）' },
            { name: 'JapaneseActivityCard.tsx', desc: '日式風格活動卡片' },
            { name: 'DaySchedule.tsx', desc: '每日行程時間表' },
          ],
        }
      },
      'editor/tour-form': {
        label: '行程表編輯器',
        desc: '建立/編輯行程表的核心編輯器',
        children: {
          'sections/daily-itinerary': [
            { name: 'DailyItinerary.tsx', desc: '每日行程編輯區塊' },
          ],
          'hooks': [
            { name: 'useTourForm.ts', desc: '行程表單狀態管理' },
          ],
          'components': [
            { name: 'FlightEditor.tsx', desc: '航班編輯器' },
            { name: 'HotelEditor.tsx', desc: '飯店編輯器' },
          ],
        }
      },
      'ui': {
        label: 'UI 基礎組件',
        desc: 'Button、Input 等基礎 UI',
        children: {
          '': [
            { name: 'button.tsx', desc: '按鈕組件' },
            { name: 'input.tsx', desc: '輸入框組件' },
            { name: 'dialog.tsx', desc: '對話框組件' },
            { name: 'tabs.tsx', desc: '分頁切換組件' },
            { name: 'card.tsx', desc: '卡片容器組件' },
          ],
          'enhanced-table': [
            { name: 'index.tsx', desc: '增強版表格（排序、篩選、分頁）' },
          ],
        }
      },
      'layout': {
        label: '版面組件',
        desc: '頁面結構與導航',
        children: {
          '': [
            { name: 'responsive-header.tsx', desc: '響應式頁面標題列' },
            { name: 'list-page-layout.tsx', desc: '列表頁面的統一版面' },
            { name: 'sidebar.tsx', desc: '側邊欄導航' },
          ],
        }
      },
      'table-cells': {
        label: '表格單元格',
        desc: '表格中常用的單元格樣式',
        children: {
          '': [
            { name: 'DateCell', desc: '日期顯示格式' },
            { name: 'StatusCell', desc: '狀態標籤（如：已確認、待處理）' },
            { name: 'ActionCell', desc: '操作按鈕（編輯、刪除）' },
            { name: 'AmountCell', desc: '金額顯示格式' },
          ],
        }
      },
      'orders': {
        label: '訂單組件',
        desc: '訂單相關的顯示與操作',
        children: {
          '': [
            { name: 'order-list.tsx', desc: '訂單列表' },
            { name: 'order-detail.tsx', desc: '訂單詳情' },
          ],
        }
      },
      'customers': {
        label: '客戶組件',
        desc: '客戶資料管理',
        children: {
          '': [
            { name: 'customer-list.tsx', desc: '客戶列表' },
            { name: 'customer-form.tsx', desc: '客戶資料表單' },
          ],
        }
      },
      'members': {
        label: '團員組件',
        desc: '團員資料與護照',
        children: {
          '': [
            { name: 'member-list.tsx', desc: '團員名單列表' },
            { name: 'member-form.tsx', desc: '團員資料表單' },
          ],
        }
      },
      'finance': {
        label: '財務組件',
        desc: '收款、發票相關',
        children: {
          '': [
            { name: 'payment-list.tsx', desc: '收款記錄列表' },
            { name: 'invoice-form.tsx', desc: '發票表單' },
          ],
        }
      },
      'workspace': {
        label: '工作區',
        desc: '團隊協作空間',
        children: {
          'channel-sidebar': [
            { name: 'index.tsx', desc: '頻道列表側邊欄' },
          ],
          'chat': [
            { name: 'ChatMessage.tsx', desc: '聊天訊息顯示' },
          ],
          'canvas': [
            { name: 'Canvas.tsx', desc: '協作畫布' },
          ],
        }
      },
      'dialog': {
        label: '對話框',
        desc: '各種彈出對話框',
        children: {
          '': [
            { name: 'confirm-dialog.tsx', desc: '確認對話框（是/否）' },
            { name: 'form-dialog.tsx', desc: '表單對話框' },
          ],
        }
      },
      'todos': {
        label: '待辦事項',
        desc: '任務管理',
        children: {
          'todo-expanded-view': [
            { name: 'index.tsx', desc: '待辦事項展開檢視' },
          ],
          'quick-actions': [
            { name: 'index.tsx', desc: '快速操作按鈕' },
          ],
        }
      },
    }
  },
  stores: {
    label: 'Stores (狀態管理)',
    desc: 'Zustand 狀態管理，資料的讀取與快取',
    icon: Database,
    items: {
      'core': {
        label: '核心',
        desc: 'Store 的基礎建構',
        children: {
          '': [
            { name: 'create-store.ts', desc: 'Store 工廠函數（自動處理 CRUD）' },
            { name: 'types.ts', desc: 'Store 通用型別定義' },
          ],
        }
      },
      'workspace': {
        label: '工作區相關',
        desc: '團隊協作相關的狀態',
        children: {
          '': [
            { name: 'workspace-store.ts', desc: '工作區基本資訊' },
            { name: 'channel-store.ts', desc: '頻道資料' },
            { name: 'chat-store.ts', desc: '聊天訊息' },
            { name: 'canvas-store.ts', desc: '畫布內容' },
            { name: 'members-store.ts', desc: '成員資料' },
          ],
        }
      },
      '(root)': {
        label: '業務 Stores',
        desc: '各業務模組的狀態管理',
        children: {
          '': [
            { name: 'tour-store.ts', desc: '行程資料' },
            { name: 'order-store.ts', desc: '訂單資料' },
            { name: 'customer-store.ts', desc: '客戶資料' },
            { name: 'payment-store.ts', desc: '收款資料' },
            { name: 'quote-store.ts', desc: '報價單資料' },
            { name: 'confirmation-store.ts', desc: '確認書資料' },
            { name: 'auth-store.ts', desc: '登入狀態與使用者資訊' },
            { name: 'theme-store.ts', desc: '主題設定（深色/淺色）' },
          ],
        }
      },
    }
  },
  hooks: {
    label: 'Hooks (自訂 Hooks)',
    desc: '可重複使用的 React Hooks',
    icon: Code,
    items: {
      '(通用)': {
        label: '通用 Hooks',
        desc: '各頁面共用的功能',
        children: {
          '': [
            { name: 'useDialog.ts', desc: '對話框開關控制' },
            { name: 'useListPageState.ts', desc: '列表頁狀態（搜尋、篩選、分頁）' },
            { name: 'useCrudOperations.ts', desc: '新增/修改/刪除操作' },
            { name: 'useConfirmDialog.ts', desc: '確認對話框控制' },
            { name: 'usePermissions.ts', desc: '權限檢查' },
            { name: 'useRequireAuth.ts', desc: '登入驗證' },
            { name: 'useTodos.ts', desc: '待辦事項操作' },
            { name: 'useImageEditor.ts', desc: '圖片編輯（裁切、旋轉）' },
            { name: 'useOcrRecognition.ts', desc: 'OCR 文字辨識' },
          ],
        }
      },
      'cloud': {
        label: '雲端 Hooks',
        desc: 'Supabase 雲端操作',
        children: {
          '': [
            { name: 'createCloudHook.ts', desc: '雲端 Hook 工廠' },
            { name: 'cloud-hooks.ts', desc: '各資料表的雲端 Hook' },
          ],
        }
      },
    }
  },
  routes: {
    label: 'App Routes (頁面路由)',
    desc: '網站的各個頁面網址',
    icon: Route,
    items: {
      'tours': {
        label: '行程',
        desc: '行程相關頁面',
        children: {
          '': [
            { name: '/tours', desc: '行程列表頁' },
            { name: '/tours/[id]', desc: '行程詳情頁（含團員、成本等 Tab）' },
          ],
        }
      },
      'orders': {
        label: '訂單',
        desc: '訂單相關頁面',
        children: {
          '': [
            { name: '/orders', desc: '訂單列表頁' },
            { name: '/orders/[id]', desc: '訂單詳情頁' },
            { name: '/orders/[id]/members', desc: '訂單團員頁' },
            { name: '/orders/[id]/payment', desc: '訂單付款頁' },
          ],
        }
      },
      'quotes': {
        label: '報價',
        desc: '報價單相關頁面',
        children: {
          '': [
            { name: '/quotes', desc: '報價單列表頁' },
            { name: '/quotes/[id]', desc: '報價單詳情頁' },
          ],
        }
      },
      'contracts': {
        label: '合約',
        desc: '合約相關頁面',
        children: {
          '': [
            { name: '/contracts', desc: '合約列表頁' },
            { name: '/contracts/[id]', desc: '合約詳情頁' },
          ],
        }
      },
      'finance': {
        label: '財務',
        desc: '財務相關頁面',
        children: {
          '': [
            { name: '/finance', desc: '財務總覽' },
            { name: '/finance/payments', desc: '收款管理' },
            { name: '/finance/treasury', desc: '出納作業' },
            { name: '/finance/travel-invoice', desc: '代轉發票' },
            { name: '/finance/requests', desc: '請款單' },
          ],
        }
      },
      'database': {
        label: '資料庫',
        desc: '基礎資料維護',
        children: {
          '': [
            { name: '/database', desc: '資料庫總覽' },
            { name: '/database/attractions', desc: '景點庫' },
            { name: '/database/suppliers', desc: '供應商' },
            { name: '/database/tour-leaders', desc: '領隊' },
          ],
        }
      },
      'settings': {
        label: '設定',
        desc: '系統設定頁面',
        children: {
          '': [
            { name: '/settings', desc: '設定主頁' },
            { name: '/settings/permissions', desc: '權限管理' },
            { name: '/settings/workspaces', desc: '工作區管理' },
          ],
        }
      },
      'others': {
        label: '其他',
        desc: '其他功能頁面',
        children: {
          '': [
            { name: '/customers', desc: '客戶管理' },
            { name: '/calendar', desc: '團控行事曆' },
            { name: '/timebox', desc: '時間盒' },
            { name: '/todos', desc: '待辦事項' },
            { name: '/visas', desc: '簽證管理' },
            { name: '/esims', desc: 'eSIM 管理' },
            { name: '/hr', desc: '人事管理' },
            { name: '/workspace', desc: '協作空間' },
          ],
        }
      },
    }
  },
}

// 複製功能
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
      title="複製路徑"
    >
      {copied ? (
        <Check className="h-3 w-3 text-status-success" />
      ) : (
        <Copy className="h-3 w-3 text-morandi-muted" />
      )}
    </button>
  )
}

// 可展開的資料夾
function FolderItem({
  name,
  label,
  desc,
  path,
  children
}: {
  name: string
  label?: string
  desc?: string
  path: string
  children: Record<string, FileItem[]>
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="ml-4">
      <div
        className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted rounded px-2 group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-morandi-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-morandi-muted flex-shrink-0" />
        )}
        <FolderTree className="h-4 w-4 text-morandi-gold flex-shrink-0" />
        <span className="font-medium text-sm">{name}</span>
        {label && <span className="text-xs text-morandi-secondary">- {label}</span>}
        <CopyButton text={path} />
      </div>

      {/* 資料夾說明 */}
      {desc && !expanded && (
        <p className="ml-10 text-xs text-morandi-muted -mt-1 mb-1">{desc}</p>
      )}

      {expanded && (
        <div className="ml-6 border-l-2 border-border pl-2">
          {Object.entries(children).map(([subPath, files]) => (
            <div key={subPath || 'root'}>
              {subPath && subPath !== '' && (
                <div className="flex items-center gap-2 py-1 px-2 group mt-2">
                  <FolderTree className="h-3 w-3 text-morandi-gold" />
                  <span className="text-xs font-medium text-morandi-secondary">{subPath}/</span>
                  <CopyButton text={`${path}/${subPath}`} />
                </div>
              )}
              {files && files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-start gap-2 py-1.5 px-2 ml-2 group hover:bg-muted rounded"
                >
                  <FileCode className="h-3 w-3 text-status-info mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{file.name}</span>
                      <CopyButton text={`${path}${subPath ? '/' + subPath : ''}/${file.name.split(' ')[0]}`} />
                    </div>
                    <p className="text-xs text-morandi-secondary">{file.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 主要區塊
function Section({
  id,
  data
}: {
  id: string
  data: {
    label: string
    desc: string
    icon: React.ElementType
    items: Record<string, { label: string; desc: string; children: Record<string, FileItem[]> }>
  }
}) {
  const [expanded, setExpanded] = useState(true)
  const Icon = data.icon
  const basePath = id === 'routes' ? 'src/app/(main)' : `src/${id}`

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted border-b"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-morandi-muted" />
        ) : (
          <ChevronRight className="h-5 w-5 text-morandi-muted" />
        )}
        <Icon className="h-5 w-5 text-status-info" />
        <div className="flex-1">
          <span className="font-semibold">{data.label}</span>
          <p className="text-xs text-morandi-secondary">{data.desc}</p>
        </div>
        <span className="text-xs text-morandi-muted">{basePath}/</span>
      </div>

      {expanded && (
        <div className="p-2">
          {Object.entries(data.items).map(([name, folder]) => (
            <FolderItem
              key={name}
              name={name || '(root)'}
              label={folder.label}
              desc={folder.desc}
              path={name && !name.startsWith('(') ? `${basePath}/${name}` : basePath}
              children={folder.children}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DevMapPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="開發者地圖"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '開發者地圖', href: '/dev-map' },
        ]}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {/* 說明 */}
          <div className="bg-status-info-bg border border-status-info/30 rounded-lg p-4 text-sm">
            <p className="font-medium text-morandi-primary mb-2">📖 使用說明</p>
            <ul className="text-status-info space-y-1">
              <li>• 每個項目都有<strong>功能說明</strong>，幫助你理解它是做什麼的</li>
              <li>• 點擊資料夾可展開查看內容</li>
              <li>• 滑鼠移到項目上會顯示複製按鈕</li>
              <li>• 複製路徑後告訴 Claude：「幫我看 <code className="bg-status-info-bg px-1 rounded">路徑</code>」</li>
            </ul>
          </div>

          {/* 結構列表 */}
          {Object.entries(projectStructure).map(([key, data]) => (
            <Section key={key} id={key} data={data} />
          ))}

          {/* 快速參考 */}
          <div className="bg-muted border rounded-lg p-4">
            <p className="font-medium mb-3">🚀 常用路徑快速複製</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                { path: 'src/features/tours/components', desc: '行程組件' },
                { path: 'src/features/tours/hooks', desc: '行程 Hooks' },
                { path: 'src/components/tours', desc: '行程 Tab 組件' },
                { path: 'src/components/ui', desc: 'UI 基礎組件' },
                { path: 'src/components/layout', desc: '版面組件' },
                { path: 'src/stores', desc: '狀態管理' },
                { path: 'src/hooks', desc: '通用 Hooks' },
                { path: 'src/types', desc: '型別定義' },
              ].map((item) => (
                <div
                  key={item.path}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded border group hover:border-status-info/30"
                >
                  <div>
                    <code className="text-xs text-morandi-primary">{item.path}</code>
                    <p className="text-xs text-morandi-muted">{item.desc}</p>
                  </div>
                  <CopyButton text={item.path} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
