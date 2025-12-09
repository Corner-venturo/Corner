'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { FileSignature, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTourStore } from '@/stores'
import { ContractTemplate } from '@/types/tour.types'
import { alert } from '@/lib/ui/alert-dialog'

const CONTRACT_TEMPLATES = [
  { value: 'template_a' as ContractTemplate, label: '範本 A' },
  { value: 'template_b' as ContractTemplate, label: '範本 B' },
  { value: 'template_c' as ContractTemplate, label: '範本 C' },
  { value: 'template_d' as ContractTemplate, label: '範本 D' },
]

export default function CreateContractPage() {
  const router = useRouter()
  const params = useParams()
  const tourId = params.id as string
  const { items: tours, update: updateTour } = useTourStore()
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | ''>('')
  const [contractContent, setContractContent] = useState('')
  const [saving, setSaving] = useState(false)

  const tour = tours.find(t => t.id === tourId)

  useEffect(() => {
    // 如果已有合約，導向編輯頁面
    if (tour && tour.contract_template) {
      router.push(`/contracts/${tourId}`)
    }
  }, [tour, tourId, router])

  const handleSave = async () => {
    if (!selectedTemplate) {
      await alert('請選擇合約範本', 'warning')
      return
    }

    setSaving(true)
    try {
      await updateTour(tourId, {
        contract_template: selectedTemplate,
        contract_content: contractContent,
        contract_created_at: new Date().toISOString(),
      })

      await alert('合約建立成功!', 'success')
      router.push(`/contracts/${tourId}`)
    } catch (error) {
      await alert('儲存合約失敗，請稍後再試', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!tour) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-morandi-secondary">找不到旅遊團資料</div>
      </div>
    )
  }

  // 如果已有合約，顯示載入中
  if (tour.contract_template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="建立合約"
        icon={FileSignature}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '合約管理', href: '/contracts' },
          { label: '建立合約', href: `/contracts/${tourId}/create` },
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 旅遊團資訊 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">旅遊團資訊</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-morandi-secondary">團號</div>
                <div className="text-morandi-primary font-medium">{tour.code}</div>
              </div>
              <div>
                <div className="text-sm text-morandi-secondary">團名</div>
                <div className="text-morandi-primary font-medium">{tour.name}</div>
              </div>
              <div>
                <div className="text-sm text-morandi-secondary">出發日期</div>
                <div className="text-morandi-primary font-medium">
                  {new Date(tour.departure_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-morandi-secondary">目的地</div>
                <div className="text-morandi-primary font-medium">{tour.location}</div>
              </div>
            </div>
          </div>

          {/* 選擇範本 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">選擇合約範本</h2>
            <div className="grid grid-cols-2 gap-4">
              {CONTRACT_TEMPLATES.map(template => (
                <button
                  key={template.value}
                  onClick={() => setSelectedTemplate(template.value)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedTemplate === template.value
                      ? 'border-morandi-gold bg-morandi-gold/10'
                      : 'border-gray-200 hover:border-morandi-gold/50'
                  }`}
                >
                  <div className="text-center">
                    <FileSignature className="mx-auto mb-2" size={32} />
                    <div className="font-medium text-morandi-primary">{template.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 合約內容編輯器 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">合約內容</h2>
            <textarea
              value={contractContent}
              onChange={e => setContractContent(e.target.value)}
              placeholder="請輸入合約內容..."
              className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 resize-none"
            />
            <div className="mt-2 text-sm text-morandi-secondary">
              提示：合約內容可以在建立後繼續編輯
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !selectedTemplate}>
              <Save size={16} className="mr-2" />
              {saving ? '儲存中...' : '儲存合約'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
