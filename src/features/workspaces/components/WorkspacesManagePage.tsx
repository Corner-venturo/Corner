/**
 * WorkspacesManagePage - 公司管理頁面
 * 僅限 super_admin 存取
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { StatusCell, ActionCell, DateCell } from '@/components/table-cells'
import { Building2, Edit2, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { AddWorkspaceDialog } from './AddWorkspaceDialog'
import { AddAdminDialog } from './AddAdminDialog'
import type { WorkspaceWithDetails } from '../types'
import { WORKSPACE_TYPE_LABELS } from '../types'

export function WorkspacesManagePage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceWithDetails | null>(null)

  // 載入公司列表
  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true)
    try {
      // 取得所有 workspaces
      const { data: workspacesData, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, code, type, is_active, description, created_at, updated_at')
        .order('created_at', { ascending: true })

      if (wsError) throw wsError

      // 取得每個 workspace 的員工數量
      const { data: employeeCounts, error: empError } = await supabase
        .from('employees')
        .select('workspace_id')

      if (empError) throw empError

      // 計算員工數量
      const countMap = new Map<string, number>()
      employeeCounts?.forEach((emp) => {
        if (emp.workspace_id) {
          countMap.set(emp.workspace_id, (countMap.get(emp.workspace_id) || 0) + 1)
        }
      })

      // 合併資料
      const workspacesWithCount: WorkspaceWithDetails[] = (workspacesData || []).map((ws) => ({
        ...ws,
        employee_count: countMap.get(ws.id) || 0,
      }))

      setWorkspaces(workspacesWithCount)
    } catch (error) {
      logger.error('載入公司列表失敗:', error)
      await alert('載入公司列表失敗', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  // 過濾
  const filteredWorkspaces = workspaces.filter((ws) =>
    searchQuery
      ? ws.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.code?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  )

  // 刪除公司
  const handleDelete = useCallback(async (workspace: WorkspaceWithDetails) => {
    if (workspace.employee_count && workspace.employee_count > 0) {
      await alert(`無法刪除「${workspace.name}」，此公司還有 ${workspace.employee_count} 位員工`, 'error')
      return
    }

    const confirmed = await confirm(`確定要刪除公司「${workspace.name}」嗎？`, {
      title: '刪除公司',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id)

      if (error) throw error

      await alert('公司已刪除', 'success')
      fetchWorkspaces()
    } catch (error) {
      logger.error('刪除公司失敗:', error)
      await alert('刪除失敗', 'error')
    }
  }, [fetchWorkspaces])

  // 新增管理員
  const handleAddAdmin = useCallback((workspace: WorkspaceWithDetails) => {
    setSelectedWorkspace(workspace)
    setIsAddAdminDialogOpen(true)
  }, [])

  // 表格欄位
  const columns = [
    {
      key: 'name',
      label: '名稱',
      width: '200',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <div>
          <div className="font-medium text-morandi-primary">{row.name}</div>
          <div className="text-xs text-morandi-secondary">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: '類型',
      width: '120',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <span className="text-sm text-morandi-secondary">
          {row.type ? WORKSPACE_TYPE_LABELS[row.type as keyof typeof WORKSPACE_TYPE_LABELS] || row.type : '-'}
        </span>
      ),
    },
    {
      key: 'employee_count',
      label: '員工人數',
      width: '100',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <span className="text-sm text-morandi-primary">{row.employee_count || 0} 人</span>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      width: '100',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.is_active
            ? 'bg-status-success-bg text-morandi-green'
            : 'bg-status-error-bg text-morandi-red'
        }`}>
          {row.is_active ? '啟用' : '停用'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立時間',
      width: '150',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <DateCell date={row.created_at} format="short" />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '120',
      render: (_: unknown, row: WorkspaceWithDetails) => (
        <ActionCell
          actions={[
            {
              icon: UserPlus,
              label: '新增管理員',
              onClick: () => handleAddAdmin(row),
            },
            {
              icon: Trash2,
              label: '刪除',
              onClick: () => handleDelete(row),
              variant: 'danger' as const,
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="公司管理"
        icon={Building2}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '公司管理', href: '/database/workspaces' },
        ]}
        showSearch
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋公司名稱或代號..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增公司"
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={columns}
          data={filteredWorkspaces}
          isLoading={isLoading}
          emptyMessage="尚無公司資料"
        />
      </div>

      {/* 新增公司對話框 */}
      <AddWorkspaceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchWorkspaces}
      />

      {/* 新增管理員對話框 */}
      <AddAdminDialog
        open={isAddAdminDialogOpen}
        onOpenChange={setIsAddAdminDialogOpen}
        workspace={selectedWorkspace}
        onSuccess={fetchWorkspaces}
      />
    </div>
  )
}
