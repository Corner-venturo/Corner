'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useWorkspaceWidgets } from '@/stores/workspace-store'
import { useUserStore } from '@/stores/user-store'
import { Combobox } from '@/components/ui/combobox'

interface AdvanceRow {
  name: string
  description: string
  amount: string
  advance_person: string
}

interface ShareAdvanceDialogProps {
  channelId: string
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}

export function ShareAdvanceDialog({
  channelId,
  currentUserId,
  onClose,
  onSuccess,
}: ShareAdvanceDialogProps) {
  const { shareAdvanceList } = useWorkspaceWidgets()
  const { items: employees, fetchAll: fetchEmployees } = useUserStore()

  const [rows, setRows] = useState<AdvanceRow[]>([
    { name: '', description: '', amount: '', advance_person: '' },
    { name: '', description: '', amount: '', advance_person: '' },
    { name: '', description: '', amount: '', advance_person: '' },
  ])

  // 載入員工資料
  React.useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees()
    }
  }, [employees.length, fetchEmployees])

  // 篩選活躍員工
  const activeEmployees = useMemo(() => {
    return employees.filter(emp => {
      const notDeleted = !(emp as any)._deleted
      const isActive = (emp as any).status === 'active'
      return notDeleted && isActive
    })
  }, [employees])

  const addRow = () => {
    setRows([...rows, { name: '', description: '', amount: '', advance_person: '' }])
  }

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index))
    }
  }

  const updateRow = (index: number, field: keyof AdvanceRow, value: string) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const totalAmount = rows.reduce((sum, row) => {
    const amount = parseFloat(row.amount) || 0
    return sum + amount
  }, 0)

  const handleShare = async () => {
    // 驗證：至少有一筆有效資料
    const validRows = rows.filter(
      row =>
        row.name.trim() && row.amount && parseFloat(row.amount) > 0 && row.advance_person.trim()
    )

    if (validRows.length === 0) {
      alert('請至少填寫一筆完整的代墊項目')
      return
    }

    try {
      const items = validRows.map(row => ({
        name: row.name.trim(),
        description: row.description.trim(),
        amount: parseFloat(row.amount),
        advance_person: row.advance_person.trim(),
      }))

      await shareAdvanceList(channelId, items, currentUserId)
      onSuccess()
      onClose()
    } catch (error) {
      alert('分享失敗，請稍後再試')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="card-morandi-elevated w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between pb-3 border-b border-morandi-gold/20">
          <h3 className="text-lg font-semibold text-morandi-primary">記錄代墊項目</h3>
          <button onClick={onClose} className="btn-icon-morandi !w-8 !h-8">
            <X size={16} />
          </button>
        </div>

        {/* 表格區域 */}
        <div className="flex-1 overflow-y-auto my-4">
          <table className="w-full">
            <thead className="sticky top-0 bg-morandi-container/5 border-b border-morandi-gold/20">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary w-[30%]">
                  品項
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary w-[25%]">
                  說明
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary w-[20%]">
                  金額
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-secondary w-[20%]">
                  代墊人
                </th>
                <th className="w-[5%] py-2.5 px-4 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-morandi-container/20">
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={e => updateRow(index, 'name', e.target.value)}
                      placeholder="品項名稱"
                      className="input-morandi !py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={row.description}
                      onChange={e => updateRow(index, 'description', e.target.value)}
                      placeholder="說明"
                      className="input-morandi !py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={row.amount}
                      onChange={e => updateRow(index, 'amount', e.target.value)}
                      placeholder="0"
                      className="input-morandi !py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Combobox
                      options={activeEmployees.map(emp => ({
                        value: emp.display_name || emp.english_name,
                        label: `${emp.display_name || emp.english_name} (${emp.employee_number})`,
                      }))}
                      value={row.advance_person}
                      onChange={value => updateRow(index, 'advance_person', value)}
                      placeholder="選擇代墊人..."
                      emptyMessage="找不到員工"
                      showSearchIcon={true}
                      showClearButton={true}
                      className="!py-1.5 text-sm"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="btn-icon-morandi !w-7 !h-7 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 新增列按鈕 */}
          <button
            onClick={addRow}
            className="flex items-center gap-2 mt-3 text-sm text-morandi-gold hover:text-morandi-primary transition-colors"
          >
            <Plus size={16} />
            <span>新增列</span>
          </button>
        </div>

        {/* 底部：總計與操作按鈕 */}
        <div className="pt-3 border-t border-morandi-gold/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-morandi-secondary">總計金額：</span>
            <span className="text-lg font-semibold text-morandi-primary">
              ${totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-morandi-secondary !py-2 !px-4" onClick={onClose}>
              取消
            </button>
            <button className="btn-morandi-primary !py-2 !px-4" onClick={handleShare}>
              分享到頻道
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
