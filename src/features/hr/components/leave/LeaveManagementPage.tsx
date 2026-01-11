/**
 * 請假管理頁面
 * 整合假別設定、請假申請、假別餘額
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Settings,
  FileText,
  Users,
  Plus,
  Check,
  X,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { DateCell, StatusCell, ActionCell } from '@/components/table-cells'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DIALOG_SIZES } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import {
  useLeaveTypes,
  type LeaveType,
  type LeaveTypeInput,
} from '../../hooks/useLeaveTypes'
import {
  useLeaveRequests,
  type LeaveRequest,
  type LeaveRequestStatus,
} from '../../hooks/useLeaveRequests'

// 狀態標籤
const STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: '待審核',
  approved: '已核准',
  rejected: '已駁回',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<LeaveRequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

type TabType = 'requests' | 'types' | 'balances'

export function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('requests')
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [editingType, setEditingType] = useState<LeaveType | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Hooks
  const {
    loading: typesLoading,
    leaveTypes,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    initializeDefaultTypes,
  } = useLeaveTypes()

  const {
    loading: requestsLoading,
    requests,
    fetchRequests,
    approveRequest,
    rejectRequest,
  } = useLeaveRequests()

  // 載入資料
  useEffect(() => {
    fetchLeaveTypes()
    fetchRequests()
  }, [fetchLeaveTypes, fetchRequests])

  // 假別類型表格欄位
  const typeColumns: Column<LeaveType>[] = [
    {
      key: 'code',
      label: '代碼',
      width: '100px',
      render: (_, row) => (
        <span className="font-mono text-morandi-gold">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: '假別名稱',
      width: '150px',
      render: (_, row) => (
        <span className="font-medium text-morandi-primary">{row.name}</span>
      ),
    },
    {
      key: 'days_per_year',
      label: '年度配額',
      width: '100px',
      render: (_, row) => (
        <span className="text-morandi-secondary">
          {row.days_per_year !== null ? `${row.days_per_year} 天` : '無限制'}
        </span>
      ),
    },
    {
      key: 'is_paid',
      label: '給薪',
      width: '80px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          row.is_paid !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.is_paid !== false ? '是' : '否'}
        </span>
      ),
    },
    {
      key: 'requires_proof',
      label: '需證明',
      width: '80px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          row.requires_proof === true ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {row.requires_proof === true ? '是' : '否'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      width: '80px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          row.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {row.is_active !== false ? '啟用' : '停用'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '80px',
      render: (_, row) => (
        <ActionCell
          actions={[
            {
              icon: Edit2,
              label: '編輯',
              onClick: () => {
                setEditingType(row)
                setShowTypeDialog(true)
              },
            },
            {
              icon: Trash2,
              label: '刪除',
              onClick: () => handleDeleteType(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  // 請假申請表格欄位
  const requestColumns: Column<LeaveRequest>[] = [
    {
      key: 'employee_name',
      label: '員工',
      width: '120px',
      render: (_, row) => (
        <span className="font-medium text-morandi-primary">{row.employee_name}</span>
      ),
    },
    {
      key: 'leave_type_name',
      label: '假別',
      width: '100px',
      render: (_, row) => (
        <span className="text-morandi-secondary">{row.leave_type_name}</span>
      ),
    },
    {
      key: 'start_date',
      label: '開始日期',
      width: '120px',
      render: (_, row) => <DateCell date={row.start_date} />,
    },
    {
      key: 'end_date',
      label: '結束日期',
      width: '120px',
      render: (_, row) => <DateCell date={row.end_date} />,
    },
    {
      key: 'days',
      label: '天數',
      width: '80px',
      render: (_, row) => (
        <span className="font-mono text-morandi-primary">{row.days} 天</span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '100px',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[row.status]}`}>
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '申請時間',
      width: '120px',
      render: (_, row) => <DateCell date={row.created_at} />,
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (_, row) => {
        if (row.status !== 'pending') return null
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(row)}
              className="gap-1 bg-morandi-green hover:bg-morandi-green/90 text-white"
            >
              <Check size={14} />
              核准
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRejectingRequest(row)
                setRejectReason('')
                setRejectDialogOpen(true)
              }}
              className="gap-1 text-morandi-red border-morandi-red hover:bg-morandi-red hover:text-white"
            >
              <X size={14} />
              駁回
            </Button>
          </div>
        )
      },
    },
  ]

  // 初始化預設假別
  const handleInitializeTypes = async () => {
    const confirmed = await confirm('確定要初始化預設假別類型嗎？', {
      title: '初始化假別',
      type: 'info',
    })
    if (!confirmed) return

    const success = await initializeDefaultTypes()
    if (success) {
      await alert('已成功初始化預設假別類型', 'success')
    }
  }

  // 刪除假別類型
  const handleDeleteType = async (type: LeaveType) => {
    const confirmed = await confirm(`確定要刪除「${type.name}」假別嗎？`, {
      title: '刪除假別',
      type: 'warning',
    })
    if (!confirmed) return

    const success = await deleteLeaveType(type.id)
    if (success) {
      await alert('假別已刪除', 'success')
    }
  }

  // 核准請假
  const handleApprove = async (request: LeaveRequest) => {
    const confirmed = await confirm(
      `確定要核准「${request.employee_name}」的請假申請嗎？\n\n假別：${request.leave_type_name}\n期間：${request.start_date} ~ ${request.end_date}\n天數：${request.days} 天`,
      {
        title: '核准請假',
        type: 'info',
      }
    )
    if (!confirmed) return

    const success = await approveRequest(request.id)
    if (success) {
      await alert('已核准請假申請', 'success')
    }
  }

  // 駁回請假
  const handleReject = async () => {
    if (!rejectingRequest) return
    if (!rejectReason.trim()) {
      await alert('請填寫駁回原因', 'error')
      return
    }

    const success = await rejectRequest(rejectingRequest.id, rejectReason)
    if (success) {
      await alert('已駁回請假申請', 'success')
      setRejectDialogOpen(false)
      setRejectingRequest(null)
      setRejectReason('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="請假管理"
        icon={Calendar}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '人資', href: '/hr' },
          { label: '請假管理', href: '/hr/leave' },
        ]}
      />

      {/* 頁籤 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
            className={activeTab === 'requests' ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white' : ''}
          >
            <FileText size={16} className="mr-2" />
            請假申請
          </Button>
          <Button
            variant={activeTab === 'types' ? 'default' : 'outline'}
            onClick={() => setActiveTab('types')}
            className={activeTab === 'types' ? 'bg-morandi-gold hover:bg-morandi-gold-hover text-white' : ''}
          >
            <Settings size={16} className="mr-2" />
            假別設定
          </Button>
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'types' && (
          <div className="space-y-4">
            {leaveTypes.length === 0 && !typesLoading && (
              <div className="bg-morandi-gold/10 border border-morandi-gold/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-morandi-gold">
                  <AlertCircle size={16} />
                  <span>尚未設定假別類型，建議初始化預設假別</span>
                </div>
                <Button
                  onClick={handleInitializeTypes}
                  className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  <Plus size={16} />
                  初始化預設假別
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="font-medium text-morandi-primary">假別類型</h3>
              <Button
                onClick={() => {
                  setEditingType(null)
                  setShowTypeDialog(true)
                }}
                className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plus size={16} />
                新增假別
              </Button>
            </div>

            <EnhancedTable
              data={leaveTypes}
              columns={typeColumns}
              loading={typesLoading}
            />
          </div>
        )}

        {activeTab === 'requests' && (
          <EnhancedTable
            data={requests}
            columns={requestColumns}
            loading={requestsLoading}
          />
        )}

        {requests.length === 0 && activeTab === 'requests' && !requestsLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">尚無請假申請</p>
          </div>
        )}
      </div>

      {/* 假別類型編輯 Dialog */}
      <LeaveTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        editingType={editingType}
        onSave={async (input) => {
          if (editingType) {
            const success = await updateLeaveType(editingType.id, input)
            if (success) {
              setShowTypeDialog(false)
              setEditingType(null)
            }
            return success
          } else {
            const success = await createLeaveType(input)
            if (success) {
              setShowTypeDialog(false)
            }
            return success
          }
        }}
      />

      {/* 駁回原因 Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className={DIALOG_SIZES.sm}>
          <DialogHeader>
            <DialogTitle>駁回請假申請</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>駁回原因</Label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold resize-none"
                rows={3}
                placeholder="請輸入駁回原因..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                <X size={16} className="mr-2" />
                取消
              </Button>
              <Button
                onClick={handleReject}
                className="bg-morandi-red hover:bg-morandi-red/90 text-white"
              >
                <X size={16} className="mr-2" />
                確認駁回
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 假別類型編輯 Dialog
function LeaveTypeDialog({
  open,
  onOpenChange,
  editingType,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingType: LeaveType | null
  onSave: (input: LeaveTypeInput) => Promise<boolean>
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [daysPerYear, setDaysPerYear] = useState<string>('')
  const [isPaid, setIsPaid] = useState(true)
  const [requiresProof, setRequiresProof] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingType) {
      setName(editingType.name)
      setCode(editingType.code)
      setDaysPerYear(editingType.days_per_year?.toString() || '')
      setIsPaid(editingType.is_paid !== false)
      setRequiresProof(editingType.requires_proof === true)
      setIsActive(editingType.is_active !== false)
    } else {
      setName('')
      setCode('')
      setDaysPerYear('')
      setIsPaid(true)
      setRequiresProof(false)
      setIsActive(true)
    }
  }, [editingType, open])

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) {
      await alert('請填寫假別名稱和代碼', 'error')
      return
    }

    setSaving(true)
    const success = await onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      days_per_year: daysPerYear ? parseFloat(daysPerYear) : null,
      is_paid: isPaid,
      requires_proof: requiresProof,
      is_active: isActive,
    })
    setSaving(false)

    if (success) {
      await alert(editingType ? '假別已更新' : '假別已新增', 'success')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SIZES.md}>
        <DialogHeader>
          <DialogTitle>{editingType ? '編輯假別' : '新增假別'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>假別名稱</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：特休"
                className="mt-1"
              />
            </div>
            <div>
              <Label required>代碼</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="如：ANNUAL"
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label>年度配額（天）</Label>
            <Input
              type="number"
              value={daysPerYear}
              onChange={(e) => setDaysPerYear(e.target.value)}
              placeholder="留空表示無限制"
              className="mt-1"
              min={0}
              step={0.5}
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold"
              />
              <span className="text-sm text-morandi-primary">給薪假</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresProof}
                onChange={(e) => setRequiresProof(e.target.checked)}
                className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold"
              />
              <span className="text-sm text-morandi-primary">需要證明文件</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border text-morandi-gold focus:ring-morandi-gold"
              />
              <span className="text-sm text-morandi-primary">啟用</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} className="mr-2" />
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              <Check size={16} className="mr-2" />
              {editingType ? '更新' : '新增'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
