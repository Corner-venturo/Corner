'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { FileSignature, Save, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTourStore } from '@/stores'

const CONTRACT_TEMPLATE_LABELS = {
  template_a: '範本 A',
  template_b: '範本 B',
  template_c: '範本 C',
  template_d: '範本 D',
}

export default function ContractDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tourId = params.id as string
  const { items: tours, update: updateTour } = useTourStore()
  const [isEditing, setIsEditing] = useState(false)
  const [contractContent, setContractContent] = useState('')
  const [saving, setSaving] = useState(false)

  const tour = tours.find(t => t.id === tourId)

  useEffect(() => {
    // 如果沒有合約，導向建立頁面
    if (tour && !tour.contract_template) {
      router.push(`/contracts/${tourId}/create`)
    }

    // 載入合約內容
    if (tour?.contract_content) {
      setContractContent(tour.contract_content)
    }
  }, [tour, tourId, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTour(tourId, {
        contract_content: contractContent,
      })

      alert('合約更新成功!')
      setIsEditing(false)
    } catch (error) {
      alert('儲存合約失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // 取消編輯，恢復原內容
    if (tour?.contract_content) {
      setContractContent(tour.contract_content)
    }
    setIsEditing(false)
  }

  if (!tour) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-morandi-secondary">找不到旅遊團資料</div>
      </div>
    )
  }

  // 如果沒有合約，顯示載入中
  if (!tour.contract_template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        {...({
          title: '合約詳情',
          icon: FileSignature,
          breadcrumb: [
            { label: '首頁', href: '/' },
            { label: '合約管理', href: '/contracts' },
            { label: '合約詳情', href: `/contracts/${tourId}` },
          ],
        } as unknown)}
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

          {/* 合約資訊 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-morandi-primary">合約資訊</h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} className="mr-2" />
                  編輯
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-morandi-secondary">合約範本</div>
                <div className="text-morandi-primary font-medium">
                  {CONTRACT_TEMPLATE_LABELS[tour.contract_template]}
                </div>
              </div>
              <div>
                <div className="text-sm text-morandi-secondary">建立時間</div>
                <div className="text-morandi-primary font-medium">
                  {tour.contract_created_at
                    ? new Date(tour.contract_created_at).toLocaleString()
                    : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 合約內容 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-morandi-primary mb-4">合約內容</h2>
            {isEditing ? (
              <>
                <textarea
                  value={contractContent}
                  onChange={e => setContractContent(e.target.value)}
                  placeholder="請輸入合約內容..."
                  className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 resize-none"
                />
                <div className="mt-4 flex justify-end gap-4">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    取消
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save size={16} className="mr-2" />
                    {saving ? '儲存中...' : '儲存'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full min-h-96 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {contractContent || '尚無合約內容'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
