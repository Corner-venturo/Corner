'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EditorContainer } from '../components/EditorContainer'
import { PreviewContainer } from '../components/PreviewContainer'
import { Button } from '@/components/ui/button'
import { useConfirmationStore } from '@/stores/confirmation-store'
import { useUserStore } from '@/stores/user-store'
import type {
  ConfirmationFormData,
  ConfirmationType,
  Confirmation,
} from '@/types/confirmation.types'
import { toast } from 'sonner'

export default function EditConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const confirmations = useConfirmationStore(state => state.items)
  const updateItem = useConfirmationStore(state => state.updateItem)
  const fetchAll = useConfirmationStore(state => state.fetchAll)
  const currentUser = useUserStore(state => state.user)

  const [formData, setFormData] = useState<ConfirmationFormData>({
    type: 'flight',
    booking_number: '',
    confirmation_number: '',
    data: {},
    status: 'draft',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfirmation = async () => {
      await fetchAll()
      setIsLoading(false)
    }
    loadConfirmation()
  }, [fetchAll])

  useEffect(() => {
    if (!isLoading) {
      const confirmation = confirmations.find(c => c.id === id)
      if (confirmation) {
        setFormData({
          type: confirmation.type,
          booking_number: confirmation.booking_number,
          confirmation_number: confirmation.confirmation_number,
          data: confirmation.data,
          status: confirmation.status,
          notes: confirmation.notes,
        })
      } else {
        toast.error('找不到確認單')
        router.push('/confirmations/list')
      }
    }
  }, [id, confirmations, isLoading, router])

  const handleTypeChange = (type: ConfirmationType) => {
    setFormData({
      ...formData,
      type,
      data: {}, // 重置資料
    })
  }

  const handleSave = async () => {
    if (!currentUser?.id) {
      toast.error('請先登入')
      return
    }

    if (!formData.booking_number) {
      toast.error('請填寫訂單編號')
      return
    }

    setIsSaving(true)
    try {
      await updateItem(id, {
        type: formData.type,
        booking_number: formData.booking_number,
        confirmation_number: formData.confirmation_number,
        data: formData.data,
        status: formData.status,
        notes: formData.notes,
        updated_by: currentUser.id,
      } as Partial<Confirmation>)

      toast.success('確認單已更新')
      router.push('/confirmations/list')
    } catch (error) {
      console.error('更新失敗:', error)
      toast.error('更新失敗')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 頁面頂部 */}
      <ResponsiveHeader
        title="編輯確認單"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '確認單管理', href: '/confirmations/list' },
          { label: '編輯確認單', href: '#' },
        ]}
        showBackButton={true}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/confirmations/list')}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '儲存中...' : '更新確認單'}
            </Button>
          </div>
        }
      />

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          <EditorContainer
            formData={formData}
            onFormDataChange={setFormData}
            onTypeChange={handleTypeChange}
          />
          <PreviewContainer formData={formData} />
        </div>
      </div>
    </div>
  )
}
