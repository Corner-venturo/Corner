'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { useWorkspaceChannels } from '@/stores/workspace'
import { Employee } from '@/stores/types'
import { EmployeeExpandedView } from '@/components/hr/employee-expanded-view'
import { AddEmployeeForm } from '@/components/hr/add-employee'
import { SalaryPaymentDialog, SalaryPaymentData } from '@/components/hr/salary-payment-dialog'
import { Users, Edit2, Trash2, UserX, DollarSign } from 'lucide-react'
import { getRoleConfig, type UserRole } from '@/lib/rbac-config'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'

export default function HRPage() {
  const { items: users, fetchAll, update: updateUser, delete: deleteUser } = useUserStore()
  const { workspaces, loadWorkspaces: fetchWorkspaces } = useWorkspaceChannels()
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSalaryPaymentDialogOpen, setIsSalaryPaymentDialogOpen] = useState(false)
  const { confirm, confirmDialogProps } = useConfirmDialog()

  // 初始化時載入員工和工作空間資料（只執行一次）
  useEffect(() => {
    fetchAll()
    fetchWorkspaces()
     
  }, [])

  const getStatusLabel = (status: Employee['status']) => {
    const statusMap = {
      active: '在職',
      probation: '試用期',
      leave: '請假',
      terminated: '離職',
    }
    return statusMap[status]
  }

  const getStatusColor = (status: Employee['status']) => {
    const colorMap = {
      active: 'text-morandi-primary bg-morandi-container',
      probation: 'text-yellow-600 bg-yellow-50',
      leave: 'text-blue-600 bg-blue-50',
      terminated: 'text-morandi-red bg-morandi-red/10',
    }
    return colorMap[status]
  }

  const handleEmployeeClick = (employee: Employee) => {
    setExpandedEmployee(employee.id)
  }

  const handleTerminateEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    const confirmed = await confirm({
      type: 'warning',
      title: '辦理離職',
      message: `確定要將員工「${employee.display_name || employee.chinese_name || '未命名員工'}」辦理離職嗎？`,
      details: ['離職後將無法登入系統', '歷史記錄會被保留', '可以隨時修改狀態回復在職'],
      confirmLabel: '確認離職',
      cancelLabel: '取消',
    })

    if (!confirmed) {
      return
    }

    try {
      await updateUser(employee.id, { status: 'terminated' })
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null)
      }
    } catch (err) {
      // 靜默失敗，UI 層面已透過 store 狀態處理
    }
  }

  const handleDeleteEmployee = async (employee: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    const confirmed = await confirm({
      type: 'danger',
      title: '刪除員工',
      message: `確定要刪除員工「${employee.display_name || employee.chinese_name || '未命名員工'}」嗎？`,
      details: [
        '⚠️ 永久刪除員工所有資料',
        '⚠️ 移除所有歷史記錄',
        '⚠️ 此操作無法復原',
        '',
        '💡 建議使用「辦理離職」來保留歷史記錄',
      ],
      confirmLabel: '確認刪除',
      cancelLabel: '取消',
    })

    if (!confirmed) {
      return
    }

    try {
      await deleteUser(employee.id)
      if (expandedEmployee === employee.id) {
        setExpandedEmployee(null)
      }
    } catch (err) {
      // 靜默失敗，UI 層面已透過 store 狀態處理
    }
  }

  // 取得 workspace 名稱
  const getWorkspaceName = useCallback(
    (workspaceId: string | undefined) => {
      if (!workspaceId) return '未設定'
      const workspace = workspaces.find(w => w.id === workspaceId)
      return workspace ? workspace.name : '未知辦公室'
    },
    [workspaces]
  )

  // 定義表格欄位
  const columns: TableColumn<Employee>[] = useMemo(
    () => [
      {
        key: 'employee_number',
        label: '員工編號',
        sortable: true,
        render: (value) => <span className="font-mono text-sm">{String(value || '')}</span>,
      },
      {
        key: 'display_name',
        label: '姓名',
        sortable: true,
        render: (value, employee: Employee) => (
          <span className="font-medium">{String(value || employee.chinese_name || '未命名員工')}</span>
        ),
      },
      {
        key: 'workspace_id',
        label: '所屬辦公室',
        sortable: true,
        render: (_value, employee: Employee) => (
          <span className="text-sm font-medium text-morandi-primary">
            {getWorkspaceName(employee.workspace_id)}
          </span>
        ),
      },
      {
        key: 'job_info',
        label: '職位',
        sortable: false,
        render: (_value, employee: Employee) => (
          <span className="text-sm">{employee.job_info?.position || '未設定'}</span>
        ),
      },
      {
        key: 'roles',
        label: '身份角色',
        sortable: false,
        render: (_value, employee: Employee) => {
          const roles = employee.roles as UserRole[] | undefined
          if (!roles || roles.length === 0) {
            return <span className="text-morandi-muted text-sm">未設定</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map(role => {
                const config = getRoleConfig(role)
                return (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config?.color || 'text-gray-600 bg-gray-50 border-gray-200'}`}
                  >
                    {config?.label || role}
                  </span>
                )
              })}
            </div>
          )
        },
      },
      {
        key: 'personal_info',
        label: '聯絡方式',
        sortable: false,
        render: (_value, employee: Employee) => {
          const info = employee.personal_info as { phone?: string | string[]; email?: string } | null
          return (
            <div className="text-sm">
              <div>{Array.isArray(info?.phone) ? info.phone[0] : info?.phone || '未提供'}</div>
              <div className="text-morandi-muted text-xs truncate max-w-[200px]">
                {info?.email || '未提供'}
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: '狀態',
        sortable: true,
        render: (_value, employee: Employee) => (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(employee.status)}`}
          >
            {getStatusLabel(employee.status)}
          </span>
        ),
      },
      {
        key: 'hire_date',
        label: '入職日期',
        sortable: true,
        render: (_value, employee: Employee) => {
          if (!employee.job_info?.hire_date)
            return <span className="text-morandi-muted text-sm">未設定</span>
          return <DateCell date={employee.job_info.hire_date} />
        },
      },
    ],
    [getWorkspaceName]
  )

  const renderActions = useCallback(
    (employee: Employee) => (
      <ActionCell
        actions={[
          {
            icon: Edit2,
            label: '編輯',
            onClick: () => setExpandedEmployee(employee.id),
          },
          ...(employee.status !== 'terminated'
            ? [
                {
                  icon: UserX,
                  label: '辦理離職',
                  onClick: () => handleTerminateEmployee(employee),
                  variant: 'warning' as const,
                },
              ]
            : []),
          {
            icon: Trash2,
            label: '刪除',
            onClick: () => handleDeleteEmployee(employee),
            variant: 'danger' as const,
          },
        ]}
      />
    ),
    []
  )

  // Handle salary payment submission
  const handleSalaryPaymentSubmit = async (data: SalaryPaymentData) => {
    // TODO: 創建薪資請款單
    logger.log('建立薪資請款：', data)
    // 這裡之後要實作創建請款單的邏輯
  }

  return (
    <>
      <ListPageLayout
        title="人資管理"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '人資管理', href: '/hr' },
        ]}
        data={users}
        columns={columns}
        searchFields={['display_name', 'employee_number', 'personal_info'] as (keyof Employee)[]}
        searchPlaceholder="搜尋員工..."
        onRowClick={handleEmployeeClick}
        renderActions={renderActions}
        bordered={true}
        headerActions={
          <div className="flex gap-3">
            <Button
              onClick={() => setIsSalaryPaymentDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              薪資請款
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增員工
            </Button>
          </div>
        }
      />

      {/* 員工詳細資料展開視圖 */}
      {expandedEmployee && (
        <EmployeeExpandedView
          employee_id={expandedEmployee}
          onClose={() => setExpandedEmployee(null)}
        />
      )}

      {/* 新增員工對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增員工</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm
            onSubmit={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 薪資請款對話框 */}
      <SalaryPaymentDialog
        open={isSalaryPaymentDialogOpen}
        onOpenChange={setIsSalaryPaymentDialogOpen}
        employees={users}
        onSubmit={handleSalaryPaymentSubmit}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialogProps} />
    </>
  )
}
