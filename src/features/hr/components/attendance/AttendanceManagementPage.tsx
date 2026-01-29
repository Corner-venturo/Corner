/**
 * 出勤紀錄管理頁面
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  LogIn,
  LogOut,
} from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { EnhancedTable, type Column } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell } from '@/components/table-cells'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DIALOG_SIZES } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { formatDate } from '@/lib/utils/format-date'
import {
  useAttendanceRecords,
  type AttendanceRecord,
  type AttendanceStatus,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '../../hooks/useAttendanceRecords'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface Employee {
  id: string
  name: string
}

export function AttendanceManagementPage() {
  const user = useAuthStore(state => state.user)
  const {
    loading,
    records,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    calculateSummary,
  } = useAttendanceRecords()

  // 篩選
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1)
    return formatDate(date)
  })
  const [endDate, setEndDate] = useState<string>(() => formatDate(new Date()))
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  // 員工列表
  const [employees, setEmployees] = useState<Employee[]>([])

  // Dialog
  const [showDialog, setShowDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)

  // 表單
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formClockIn, setFormClockIn] = useState('')
  const [formClockOut, setFormClockOut] = useState('')
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('present')
  const [formNotes, setFormNotes] = useState('')

  // 載入員工
  useEffect(() => {
    async function loadEmployees() {
      if (!user?.workspace_id) return

      const { data } = await supabase
        .from('employees')
        .select('id, chinese_name, display_name')
        .eq('workspace_id', user.workspace_id)
        .eq('is_active', true)
        .order('employee_number', { ascending: true })

      if (data) {
        setEmployees(data.map(e => ({
          id: e.id,
          name: e.display_name || e.chinese_name || '未知',
        })))
      }
    }

    loadEmployees()
  }, [user?.workspace_id])

  // 載入紀錄
  useEffect(() => {
    fetchRecords({
      start_date: startDate,
      end_date: endDate,
      employee_id: selectedEmployeeId || undefined,
    })
  }, [fetchRecords, startDate, endDate, selectedEmployeeId])

  // 計算統計
  const summary = calculateSummary(records, selectedEmployeeId || undefined)

  // 表格欄位
  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      label: '日期',
      width: '120px',
      render: (_, row) => <DateCell date={row.date} />,
    },
    {
      key: 'employee_name',
      label: '員工',
      width: '120px',
      render: (_, row) => (
        <span className="font-medium text-morandi-primary">{row.employee_name}</span>
      ),
    },
    {
      key: 'clock_in',
      label: '上班時間',
      width: '100px',
      render: (_, row) => (
        <span className="font-mono text-morandi-secondary">
          {row.clock_in || '-'}
        </span>
      ),
    },
    {
      key: 'clock_out',
      label: '下班時間',
      width: '100px',
      render: (_, row) => (
        <span className="font-mono text-morandi-secondary">
          {row.clock_out || '-'}
        </span>
      ),
    },
    {
      key: 'work_hours',
      label: '工時',
      width: '80px',
      render: (_, row) => (
        <span className="font-mono text-morandi-primary">
          {row.work_hours !== null ? `${row.work_hours.toFixed(1)} h` : '-'}
        </span>
      ),
    },
    {
      key: 'overtime_hours',
      label: '加班',
      width: '80px',
      render: (_, row) => (
        <span className={`font-mono ${row.overtime_hours && row.overtime_hours > 0 ? 'text-morandi-gold' : 'text-morandi-muted'}`}>
          {row.overtime_hours !== null && row.overtime_hours > 0 ? `${row.overtime_hours.toFixed(1)} h` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      width: '80px',
      render: (_, row) => row.status ? (
        <span className={`px-2 py-0.5 rounded text-xs ${ATTENDANCE_STATUS_COLORS[row.status]}`}>
          {ATTENDANCE_STATUS_LABELS[row.status]}
        </span>
      ) : (
        <span className="text-morandi-muted">-</span>
      ),
    },
    {
      key: 'notes',
      label: '備註',
      width: '150px',
      render: (_, row) => (
        <span className="text-sm text-morandi-secondary truncate">
          {row.notes || '-'}
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
              onClick: () => handleEdit(row),
            },
            {
              icon: Trash2,
              label: '刪除',
              onClick: () => handleDelete(row),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ]

  // 開啟新增 Dialog
  const handleAdd = () => {
    setEditingRecord(null)
    setFormEmployeeId('')
    setFormDate(formatDate(new Date()))
    setFormClockIn('')
    setFormClockOut('')
    setFormStatus('present')
    setFormNotes('')
    setShowDialog(true)
  }

  // 開啟編輯 Dialog
  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setFormEmployeeId(record.employee_id)
    setFormDate(record.date)
    setFormClockIn(record.clock_in || '')
    setFormClockOut(record.clock_out || '')
    setFormStatus(record.status || 'present')
    setFormNotes(record.notes || '')
    setShowDialog(true)
  }

  // 刪除
  const handleDelete = async (record: AttendanceRecord) => {
    const confirmed = await confirm(
      `確定要刪除 ${record.employee_name} 於 ${record.date} 的出勤紀錄嗎？`,
      {
        title: '刪除出勤紀錄',
        type: 'warning',
      }
    )
    if (!confirmed) return

    const success = await deleteRecord(record.id)
    if (success) {
      await alert('出勤紀錄已刪除', 'success')
    }
  }

  // 儲存
  const handleSave = async () => {
    if (!formEmployeeId || !formDate) {
      await alert('請選擇員工和日期', 'error')
      return
    }

    const input = {
      employee_id: formEmployeeId,
      date: formDate,
      clock_in: formClockIn || null,
      clock_out: formClockOut || null,
      status: formStatus,
      notes: formNotes || null,
    }

    let success: boolean
    if (editingRecord) {
      success = await updateRecord(editingRecord.id, input)
    } else {
      success = await createRecord(input)
    }

    if (success) {
      await alert(editingRecord ? '出勤紀錄已更新' : '出勤紀錄已新增', 'success')
      setShowDialog(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="出勤紀錄"
        icon={Clock}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '人資', href: '/hr' },
          { label: '出勤紀錄', href: '/hr/attendance' },
        ]}
        actions={
          <Button
            onClick={handleAdd}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} />
            新增紀錄
          </Button>
        }
      />

      {/* 篩選區 */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-morandi-secondary" />
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="開始日期"
            />
            <span className="text-morandi-secondary">至</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="結束日期"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-morandi-secondary" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
            >
              <option value="">全部員工</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 統計區 */}
      <div className="p-4 bg-morandi-container/30 border-b border-border">
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">總天數</div>
            <div className="text-xl font-bold text-morandi-primary">{summary.total_days}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">正常</div>
            <div className="text-xl font-bold text-green-600">{summary.present_days}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">遲到</div>
            <div className="text-xl font-bold text-yellow-600">{summary.late_days}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">缺勤</div>
            <div className="text-xl font-bold text-red-600">{summary.absent_days}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">總工時</div>
            <div className="text-xl font-bold text-morandi-primary">{summary.total_work_hours.toFixed(1)} h</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-morandi-secondary">總加班</div>
            <div className="text-xl font-bold text-morandi-gold">{summary.total_overtime_hours.toFixed(1)} h</div>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto p-4">
        <EnhancedTable
          data={records}
          columns={columns}
          loading={loading}
        />

        {records.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock size={48} className="text-morandi-muted mb-4" />
            <p className="text-morandi-secondary">尚無出勤紀錄</p>
          </div>
        )}
      </div>

      {/* 編輯 Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent level={1} className={DIALOG_SIZES.md}>
          <DialogHeader>
            <DialogTitle>{editingRecord ? '編輯出勤紀錄' : '新增出勤紀錄'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>員工</Label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
                  disabled={!!editingRecord}
                >
                  <option value="">選擇員工</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>日期</Label>
                <DatePicker
                  value={formDate}
                  onChange={setFormDate}
                  placeholder="選擇日期"
                  className="mt-1 w-full"
                  disabled={!!editingRecord}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>上班時間</Label>
                <Input
                  type="time"
                  value={formClockIn}
                  onChange={(e) => setFormClockIn(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>下班時間</Label>
                <Input
                  type="time"
                  value={formClockOut}
                  onChange={(e) => setFormClockOut(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>狀態</Label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-morandi-gold"
              >
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>備註</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="備註說明"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                <X size={16} className="mr-2" />
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Check size={16} className="mr-2" />
                {editingRecord ? '更新' : '新增'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
