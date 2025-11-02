/**
 * ConfirmationsPage - 確認單列表頁面
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { FileCheck, FileText, CheckCircle, Send, XCircle } from 'lucide-react'
import { ConfirmationsList } from './ConfirmationsList'
import { useConfirmationStore } from '@/stores/confirmation-store'
import { useUserStore } from '@/stores/user-store'
import { useRealtimeForConfirmations } from '@/hooks/use-realtime-hooks'

// 狀態篩選器
const STATUS_FILTERS = [
  { value: 'all', label: '全部', icon: FileCheck },
  { value: 'draft', label: '草稿', icon: FileText },
  { value: 'confirmed', label: '已確認', icon: CheckCircle },
  { value: 'sent', label: '已寄出', icon: Send },
  { value: 'cancelled', label: '已取消', icon: XCircle },
]

export const ConfirmationsPage: React.FC = () => {
  // ✅ Realtime 訂閱
  useRealtimeForConfirmations()

  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const confirmations = useConfirmationStore((state) => state.items)
  const createItem = useConfirmationStore((state) => state.createItem)
  const deleteItem = useConfirmationStore((state) => state.deleteItem)
  const currentWorkspace = useUserStore((state) => state.currentWorkspace)
  const currentUser = useUserStore((state) => state.user)

  // 過濾確認單
  const filteredConfirmations = confirmations.filter((conf) => {
    const matchesSearch =
      conf.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || conf.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAdd = async () => {
    if (!currentWorkspace?.id || !currentUser?.id) {
      alert('請先登入')
      return
    }

    // 直接創建一個空白確認單並跳轉
    try {
      const newConf = await createItem({
        workspace_id: currentWorkspace.id,
        type: 'flight', // 預設航班，可在編輯頁修改
        booking_number: '',
        data: {},
        status: 'draft',
        created_by: currentUser.id,
        updated_by: currentUser.id,
      })
      router.push(`/confirmations/${newConf.id}`)
    } catch (error) {
      console.error('建立失敗:', error)
      alert('建立失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除這個確認單嗎？')) {
      await deleteItem(id)
    }
  }

  const handleConfirmationClick = (id: string) => {
    router.push(`/confirmations/${id}`)
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="確認單管理"
        icon={FileCheck}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '確認單管理', href: '/confirmations' },
        ]}
        tabs={STATUS_FILTERS.map((f) => ({
          value: f.value,
          label: f.label,
          icon: f.icon,
        }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋訂單編號或確認單號碼..."
        onAdd={handleAdd}
        addLabel="新增確認單"
      />

      <div className="flex-1 overflow-auto">
        <ConfirmationsList
          confirmations={filteredConfirmations}
          searchTerm={searchTerm}
          onConfirmationClick={handleConfirmationClick}
          onEdit={handleConfirmationClick}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
