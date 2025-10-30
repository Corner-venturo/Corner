'use client'

import { useRouter } from 'next/navigation'
import { MapPin, MapIcon, Calculator, Building2 } from 'lucide-react'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const databaseModules = [
  {
    id: 'regions',
    title: '地區管理',
    description: '管理旅遊目的地和相關設定',
    icon: MapPin,
    href: '/database/regions',
    color: 'bg-blue-500',
    count: 3,
  },
  {
    id: 'activities',
    title: '活動門票',
    description: '管理景點門票和活動價格',
    icon: MapIcon,
    href: '/database/activities',
    color: 'bg-purple-500',
    count: 18,
  },
  {
    id: 'attractions',
    title: '景點管理',
    description: '管理各地區的旅遊景點資訊',
    icon: MapIcon,
    href: '/database/attractions',
    color: 'bg-rose-500',
    count: 0,
  },
  {
    id: 'suppliers',
    title: '供應商管理',
    description: '管理合作供應商和價格清單',
    icon: Building2,
    href: '/database/suppliers',
    color: 'bg-indigo-500',
    count: 12,
  },
]

export default function DatabasePage() {
  const router = useRouter()

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="資料庫管理"
        onAdd={() => {
          /* 批次匯入邏輯 */
        }}
        addLabel="批次匯入"
      />

      <div className="flex-1 overflow-auto pb-6">
        {/* 概覽卡片 */}
        <div className="mb-8 bg-gradient-to-r from-morandi-gold/10 to-morandi-primary/10 rounded-lg border border-morandi-gold/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium text-morandi-primary mb-2">資料庫統計</h2>
              <p className="text-morandi-secondary text-sm">
                管理報價系統的所有資料內容，確保資料一致性和準確性
              </p>
            </div>
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-primary">59</div>
                <div className="text-xs text-morandi-secondary">總項目數</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-gold">3</div>
                <div className="text-xs text-morandi-secondary">覆蓋地區</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-morandi-green">24hr</div>
                <div className="text-xs text-morandi-secondary">上次更新</div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能模組卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {databaseModules.map(module => {
            const Icon = module.icon
            return (
              <div
                key={module.id}
                onClick={() => router.push(module.href)}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-morandi-gold/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      module.color
                    )}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-morandi-primary">{module.count}</div>
                    <div className="text-xs text-morandi-secondary">項目</div>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-morandi-primary mb-2">{module.title}</h3>
                <p className="text-sm text-morandi-secondary">{module.description}</p>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-morandi-gold hover:bg-morandi-gold/10"
                  >
                    進入管理
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 快速操作區域 */}
        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-medium text-morandi-primary mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 text-left flex flex-col items-start"
              onClick={() => router.push('/database/regions')}
            >
              <div className="font-medium text-morandi-primary">新增地區</div>
              <div className="text-sm text-morandi-secondary mt-1">快速添加新的旅遊目的地</div>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 text-left flex flex-col items-start"
              onClick={() => router.push('/database/activities')}
            >
              <div className="font-medium text-morandi-primary">更新門票價格</div>
              <div className="text-sm text-morandi-secondary mt-1">同步最新的景點門票價格</div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
