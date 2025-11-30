'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect, lazy, Suspense } from 'react'
import { MapPin, Star, Sparkles } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAttractionsDialog } from '../hooks/useAttractionsDialog'
import { Combobox } from '@/components/ui/combobox'
import { supabase } from '@/lib/supabase/client'
import type { Country } from '@/stores/region-store'

// Lazy load tabs - 只有切換到該 tab 才載入組件
const AttractionsTab = lazy(() => import('./tabs/AttractionsTab'))
const MichelinRestaurantsTab = lazy(() => import('./tabs/MichelinRestaurantsTab'))
const PremiumExperiencesTab = lazy(() => import('./tabs/PremiumExperiencesTab'))

// ============================================
// 資料庫管理主頁面（含景點、米其林、體驗）
// ============================================

export default function DatabaseManagementPage() {
  const [activeTab, setActiveTab] = useState('attractions')
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['attractions']))

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
          <>
            {/* 國家篩選 - 三個 tab 共用 */}
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
        }
        showClearFilters={Boolean(hasActiveFilters)}
        onClearFilters={clearFilters}
        onAdd={activeTab === 'attractions' ? openAdd : undefined}
        addLabel="新增景點"
      />

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          {/* 分頁內容 - 只載入已訪問過的 tab */}
          <div className="flex-1 overflow-hidden">
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
