'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { MapPin, Star, Sparkles, Globe } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAttractionsDialog } from '../hooks/useAttractionsDialog'
import { Combobox } from '@/components/ui/combobox'
import { supabase } from '@/lib/supabase/client'
import type { Country } from '@/stores/region-store'

// Lazy load tabs - 只有切換到該 tab 才載入組件
const RegionsTab = lazy(() => import('./tabs/RegionsTab'))
const AttractionsTab = lazy(() => import('./tabs/AttractionsTab'))
const MichelinRestaurantsTab = lazy(() => import('./tabs/MichelinRestaurantsTab'))
const PremiumExperiencesTab = lazy(() => import('./tabs/PremiumExperiencesTab'))

// ============================================
// 資料庫管理主頁面（含景點、米其林、體驗）
// ============================================

export default function DatabaseManagementPage() {
  const [activeTab, setActiveTab] = useState('regions')
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['regions']))

  // 景點分頁的狀態
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('')
  const { openAdd } = useAttractionsDialog()

  // 地區資料 - 只載入國家列表
  const [countries, setCountries] = useState<Country[]>([])

  // 只載入國家列表（不載入地區和城市）
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const { data, error } = await supabase.from('countries').select('*').order('display_order')

        if (error) {
          logger.error('Error loading countries:', error)
          return
        }

        if (data) {
          logger.log('Loaded countries:', data.length)
          setCountries(data as Country[])
        }
      } catch (err) {
        logger.error('Exception loading countries:', err)
      }
    }
    loadCountries().catch(err => logger.error('載入國家失敗:', err))
  }, [])

  // 當切換 tab 時，標記該 tab 已載入
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setLoadedTabs(prev => new Set(prev).add(tab))
  }

  // 清除篩選
  const clearFilters = () => {
    setSelectedCountry('')
    setSelectedCategory('all')
  }

  const hasActiveFilters = selectedCountry || selectedCategory !== 'all'

  // ===== 測試拖放區 =====
  const [testDragOver, setTestDragOver] = useState(false)
  const [testDropResult, setTestDropResult] = useState('')

  const handleTestDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTestDragOver(true)
    console.log('[TEST] dragover', e.dataTransfer.types)
  }, [])

  const handleTestDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setTestDragOver(false)
  }, [])

  const handleTestDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTestDragOver(false)

    const types = Array.from(e.dataTransfer.types)
    const files = e.dataTransfer.files
    const html = e.dataTransfer.getData('text/html')
    const uriList = e.dataTransfer.getData('text/uri-list')
    const plainText = e.dataTransfer.getData('text/plain')

    console.log('[TEST] drop!', { types, filesCount: files.length, html, uriList, plainText })

    // 優先從 HTML 解析 img src
    let imageUrl = ''
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/)
      if (match && match[1]) {
        imageUrl = match[1]
        console.log('[TEST] 從 HTML 找到圖片:', imageUrl)
      }
    }

    // 如果 HTML 沒有，用 uri-list
    if (!imageUrl && uriList) {
      imageUrl = uriList.split('\n')[0] // 取第一個 URL
      console.log('[TEST] 從 uri-list 找到:', imageUrl)
    }

    if (!imageUrl) {
      setTestDropResult('找不到圖片 URL')
      return
    }

    setTestDropResult(`正在下載: ${imageUrl.substring(0, 50)}...`)

    try {
      // 透過後端 API 下載圖片
      const response = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      })

      if (response.ok) {
        const blob = await response.blob()
        setTestDropResult(`✅ 成功！圖片大小: ${(blob.size / 1024).toFixed(1)} KB`)
      } else {
        const error = await response.text()
        setTestDropResult(`❌ 下載失敗: ${error}`)
      }
    } catch (err) {
      setTestDropResult(`❌ 錯誤: ${err}`)
    }
  }, [])
  // ===== 測試拖放區結束 =====

  // 分類選項
  const categoryOptions = [
    { value: '景點', label: '景點' },
    { value: '餐廳', label: '餐廳' },
    { value: '住宿', label: '住宿' },
    { value: '購物', label: '購物' },
    { value: '交通', label: '交通' },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="旅遊資料庫"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '旅遊資料庫', href: '/database/attractions' },
        ]}
        tabs={[
          { value: 'regions', label: '國家/區域', icon: Globe },
          { value: 'attractions', label: '景點活動', icon: MapPin },
          { value: 'michelin', label: '米其林餐廳', icon: Star },
          { value: 'experiences', label: '頂級體驗', icon: Sparkles },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showSearch={activeTab === 'attractions'}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋景點名稱..."
        filters={
          activeTab !== 'regions' ? (
            <>
              {/* 國家篩選 - 景點相關 tab 共用 */}
              <Combobox
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={[
                  { value: '', label: '所有國家' },
                  ...countries.map(country => ({
                    value: country.id,
                    label: `${country.emoji} ${country.name}`,
                  })),
                ]}
                placeholder="選擇國家..."
                emptyMessage="找不到符合的國家"
                showSearchIcon={true}
                showClearButton={true}
              />
              {/* 分類篩選 - 只在景點活動顯示 */}
              {activeTab === 'attractions' && (
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary bg-background text-morandi-primary min-w-[120px]"
                >
                  <option value="all">全部分類</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : undefined
        }
        showClearFilters={activeTab !== 'regions' && Boolean(hasActiveFilters)}
        onClearFilters={clearFilters}
        onAdd={activeTab === 'attractions' ? openAdd : undefined}
        addLabel="新增景點"
      />

      {/* ===== 測試拖放區（請拖曳圖片到這裡測試）===== */}
      <div
        onDragOver={handleTestDragOver}
        onDragLeave={handleTestDragLeave}
        onDrop={handleTestDrop}
        className={`m-4 p-8 border-4 border-dashed rounded-xl text-center transition-all ${
          testDragOver
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-300 bg-gray-50 text-gray-500'
        }`}
      >
        <div className="text-xl font-bold mb-2">🧪 測試拖放區</div>
        <div>從瀏覽器拖曳圖片到這裡測試</div>
        {testDropResult && (
          <div className="mt-2 text-sm bg-white p-2 rounded">
            結果: {testDropResult}
          </div>
        )}
      </div>
      {/* ===== 測試拖放區結束 ===== */}

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          {/* 分頁內容 - 只載入已訪問過的 tab */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="regions" className="h-full mt-0 data-[state=inactive]:hidden">
              {loadedTabs.has('regions') && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">載入中...</div>
                  }
                >
                  <RegionsTab />
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="attractions" className="h-full mt-0 data-[state=inactive]:hidden">
              {loadedTabs.has('attractions') && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">載入中...</div>
                  }
                >
                  <AttractionsTab
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedCountry={selectedCountry}
                    openAdd={openAdd}
                  />
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="michelin" className="h-full mt-0 data-[state=inactive]:hidden">
              {loadedTabs.has('michelin') && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">載入中...</div>
                  }
                >
                  <MichelinRestaurantsTab selectedCountry={selectedCountry} />
                </Suspense>
              )}
            </TabsContent>

            <TabsContent value="experiences" className="h-full mt-0 data-[state=inactive]:hidden">
              {loadedTabs.has('experiences') && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">載入中...</div>
                  }
                >
                  <PremiumExperiencesTab selectedCountry={selectedCountry} />
                </Suspense>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
