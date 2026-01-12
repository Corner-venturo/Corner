/**
 * ConfirmationsPage - 確認單列表頁面
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { FileCheck, FileText, CheckCircle, Send, XCircle } from 'lucide-react'
import { ConfirmationsList } from './ConfirmationsList'
import { useConfirmations, createConfirmation, deleteConfirmation } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'
import { confirm, alert } from '@/lib/ui/alert-dialog'

// 狀態篩選器
const STATUS_FILTERS = [
  { value: 'all', label: '全部', icon: FileCheck },
  { value: 'draft', label: '草稿', icon: FileText },
  { value: 'confirmed', label: '已確認', icon: CheckCircle },
  { value: 'sent', label: '已寄出', icon: Send },
  { value: 'cancelled', label: '已取消', icon: XCircle },
]

export const ConfirmationsPage: React.FC = () => {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { items: confirmations } = useConfirmations()

  // 過濾確認單
  const filteredConfirmations = confirmations.filter(conf => {
    const matchesSearch =
      conf.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conf.confirmation_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || conf.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAdd = async () => {
    const auth = useRequireAuthSync()

    if (!auth.isAuthenticated) {
      auth.showLoginRequired()
      return
    }

    if (!auth.workspaceId) {
      auth.showWorkspaceMissing()
      return
    }

    logger.log('✅ 準備建立確認單:', { userId: auth.user!.id, workspaceId: auth.workspaceId })

    // 直接創建一個空白確認單並跳轉
    try {
      const newConf = await createConfirmation({
        workspace_id: auth.workspaceId,
        type: 'flight', // 預設航班，可在編輯頁修改
        booking_number: '',
        data: {
          passengers: [],
          segments: [],
          baggage: [],
          importantNotes: [],
        }, // Minimal flight data structure
        status: 'draft',
        created_by: auth.user!.id,
        updated_by: auth.user!.id,
      })
      router.push(`/confirmations/${newConf.id}`)
    } catch (error) {
      logger.error('建立失敗:', error)
      await alert('建立失敗', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('確定要刪除這個確認單嗎？', {
      title: '刪除確認單',
      type: 'warning',
    })
    if (confirmed) {
      await deleteConfirmation(id)
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
        tabs={STATUS_FILTERS.map(f => ({
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
