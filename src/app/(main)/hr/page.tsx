'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUserStore, userStoreHelpers } from '@/stores/user-store'
import { useWorkspaceChannels } from '@/stores/workspace'
import {
  usePaymentRequests,
  createPaymentRequest as createPaymentRequestApi,
  createPaymentRequestItem,
  invalidatePaymentRequests,
} from '@/data'
import { Employee } from '@/stores/types'
import { EmployeeExpandedView } from '@/components/hr/employee-expanded-view'
import { AddEmployeeForm } from '@/components/hr/add-employee'
import { SalaryPaymentDialog, SalaryPaymentData } from '@/components/hr/salary-payment-dialog'
import { Users, Edit2, Trash2, UserX, DollarSign, Bot } from 'lucide-react'
import { getRoleConfig, type UserRole } from '@/lib/rbac-config'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import { ConfirmDialog } from '@/components/dialog/confirm-dialog'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { generateCompanyPaymentRequestCode } from '@/stores/utils/code-generator'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

// 員工分類 Tab 類型
type EmployeeTab = 'active' | 'terminated' | 'bot'

export default function HRPage() {
  const { items: users, fetchAll, update: updateUser, delete: deleteUser } = useUserStore()
  const { workspaces, loadWorkspaces: fetchWorkspaces } = useWorkspaceChannels()
  // 使用 @/data hooks（SWR 自動載入）
  const { items: paymentRequests } = usePaymentRequests()
  const currentUser = useAuthStore(state => state.user)
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSalaryPaymentDialogOpen, setIsSalaryPaymentDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<EmployeeTab>('active')
  const { confirm, confirmDialogProps } = useConfirmDialog()

  // 檢查是否為超級管理員
  const isSuperAdmin = useMemo(() => {
    return currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('admin')
  }, [currentUser?.roles])

  // 初始化時載入員工、工作空間資料（請款單由 SWR 自動載入）
  useEffect(() => {
    fetchAll()
    fetchWorkspaces()
  }, [])

  // 根據 Tab 過濾員工
  const filteredEmployees = useMemo(() => {
    return users.filter(emp => {
      const isBot = emp.employee_type === 'bot'
      const isTerminated = emp.status === 'terminated'

      switch (activeTab) {
        case 'active':
          // 在職：非機器人 且 非離職
          return !isBot && !isTerminated
        case 'terminated':
          // 離職：非機器人 且 已離職
          return !isBot && isTerminated
        case 'bot':
          // 機器人：只有超級管理員能看
          return isBot && isSuperAdmin
        default:
          return !isBot && !isTerminated
      }
    })
  }, [users, activeTab, isSuperAdmin])

  // Tab 選項（機器人 Tab 只有超級管理員能看）
  const tabOptions = useMemo(() => {
    const baseTabs: { value: EmployeeTab; label: string; count: number }[] = [
      { value: 'active', label: '在職', count: users.filter(e => e.employee_type !== 'bot' && e.status !== 'terminated').length },
      { value: 'terminated', label: '離職', count: users.filter(e => e.employee_type !== 'bot' && e.status === 'terminated').length },
    ]
    if (isSuperAdmin) {
      baseTabs.push({
        value: 'bot',
        label: '機器人',
        count: users.filter(e => e.employee_type === 'bot').length,
      })
    }
    return baseTabs
  }, [users, isSuperAdmin])

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
      probation: 'text-status-warning bg-status-warning-bg',
      leave: 'text-status-info bg-status-info-bg',
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
      toast.error('離職處理失敗，請稍後再試')
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
      toast.error('刪除員工失敗，請稍後再試')
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
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config?.color || 'text-morandi-secondary bg-muted border-border'}`}
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
    try {
      // 計算總金額
      const totalAmount = data.employee_salaries.reduce((sum, s) => sum + s.amount, 0)

      // 生成公司請款編號
      const code = generateCompanyPaymentRequestCode('SAL', data.request_date, paymentRequests)

      // 建立一張薪資請款單
      const newRequest = await createPaymentRequestApi({
        code,
        request_number: code,
        request_date: data.request_date,
        request_type: '薪資',
        request_category: 'company', // 公司請款
        expense_type: 'SAL', // 薪資
        amount: totalAmount,
        is_special_billing: data.is_special_billing,
        note: data.note || `${data.employee_salaries.length} 位員工薪資`,
        status: 'pending',
        created_by: currentUser?.id,
        created_by_name: currentUser?.display_name || currentUser?.chinese_name,
      })

      // 為每位員工建立請款項目
      if (newRequest?.id) {
        for (let i = 0; i < data.employee_salaries.length; i++) {
          const salary = data.employee_salaries[i]
          const itemNumber = `${code}-${String.fromCharCode(65 + i)}` // A, B, C...

          await createPaymentRequestItem({
            request_id: newRequest.id,
            item_number: itemNumber,
            category: '其他' as const,
            supplier_id: salary.employee_id,
            supplier_name: salary.employee_name,
            description: `${salary.employee_name} 薪資`,
            unit_price: salary.amount,
            quantity: 1,
            subtotal: salary.amount,
            sort_order: i,
          } as Parameters<typeof createPaymentRequestItem>[0])
        }
      }

      // SWR 快取失效，自動重新載入
      await invalidatePaymentRequests()
      toast.success(`已建立薪資請款單（${data.employee_salaries.length} 位員工，共 NT$ ${totalAmount.toLocaleString()}）`)
      logger.log('建立薪資請款成功：', data)
    } catch (error) {
      logger.error('建立薪資請款失敗：', error)
      toast.error('建立薪資請款失敗，請稍後再試')
    }
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
        data={filteredEmployees}
        columns={columns}
        searchFields={['display_name', 'employee_number', 'personal_info'] as (keyof Employee)[]}
        searchPlaceholder="搜尋員工..."
        onRowClick={handleEmployeeClick}
        renderActions={renderActions}
        bordered={true}
        beforeTable={
          <div className="px-6 py-3 border-b border-border/50">
            <div className="flex gap-1 bg-morandi-container/50 p-1 rounded-lg w-fit">
              {tabOptions.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === tab.value
                      ? 'bg-white text-morandi-primary shadow-sm'
                      : 'text-morandi-secondary hover:text-morandi-primary hover:bg-white/50'
                  }`}
                >
                  {tab.value === 'bot' && <Bot className="w-4 h-4" />}
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    activeTab === tab.value
                      ? 'bg-morandi-gold/20 text-morandi-gold'
                      : 'bg-morandi-container text-morandi-secondary'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        }
        headerActions={
          <div className="flex gap-3">
            <Button
              onClick={() => setIsSalaryPaymentDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center"
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
