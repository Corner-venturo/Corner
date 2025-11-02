'use client'

import { MapPin } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'

// 超級簡化的測試頁面 - 完全不載入任何資料
export default function AttractionsTestPage() {
  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="景點管理 (測試版)"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '景點管理測試', href: '/database/attractions-test' },
        ]}
      />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-border p-8">
            <h2 className="text-2xl font-semibold mb-4">測試頁面載入成功 ✅</h2>

            <div className="space-y-4">
              <p className="text-morandi-secondary">
                如果你看到這個頁面，表示基本的頁面架構沒有問題。
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold text-blue-900 mb-2">測試項目：</h3>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>✅ ResponsiveHeader 組件正常</li>
                  <li>✅ 基本路由正常</li>
                  <li>✅ 無資料載入</li>
                  <li>✅ 無 store 使用</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">下一步測試：</h3>
                <ol className="list-decimal list-inside space-y-1 text-yellow-800">
                  <li>加入硬編碼的假資料（3-5 筆）</li>
                  <li>測試列表渲染</li>
                  <li>逐步加入真實資料載入</li>
                  <li>找出崩潰的臨界點</li>
                </ol>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">硬編碼測試資料：</h3>
                <div className="space-y-2">
                  {[
                    { id: '1', name: '測試景點 1', category: '景點' },
                    { id: '2', name: '測試景點 2', category: '餐廳' },
                    { id: '3', name: '測試景點 3', category: '住宿' },
                  ].map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white border rounded hover:bg-gray-50"
                    >
                      <MapPin size={20} className="text-morandi-gold" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-morandi-secondary">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
