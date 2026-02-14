'use client'

import { useState } from 'react'
import { Receipt, Check, Trash2 } from 'lucide-react'
import { AdvanceList } from '@/stores/workspace-store'
import { confirm } from '@/lib/ui/alert-dialog'
import { CurrencyCell } from '@/components/table-cells'
import { COMP_WORKSPACE_LABELS } from './constants/labels'

interface AdvanceListCardProps {
  advanceList: AdvanceList
  userName?: string
  onCreatePayment: (itemId: string, item: unknown) => void
  onDelete?: (listId: string) => void
  currentUserId: string
  userRole?: 'admin' | 'finance' | 'member'
}

export function AdvanceListCard({
  advanceList,
  userName = COMP_WORKSPACE_LABELS.使用者,
  onCreatePayment,
  onDelete,
  userRole = 'member',
}: AdvanceListCardProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const items = advanceList.items || []
  const pendingItems = items.filter(item => item.status === 'pending')
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const canProcess = userRole === 'admin' || userRole === 'finance'

  const toggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleBatchPayment = () => {
    const itemsToProcess = items.filter(item => selectedItems.has(item.id))
    if (itemsToProcess.length > 0) {
      onCreatePayment('batch', itemsToProcess)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm(COMP_WORKSPACE_LABELS.確定要刪除這個代墊清單嗎_已建立的請款單不會被刪除, {
      title: COMP_WORKSPACE_LABELS.刪除代墊清單,
      type: 'warning',
    })
    if (confirmed) {
      onDelete?.(advanceList.id)
    }
  }

  return (
    <div className="flex gap-3 group hover:bg-morandi-container/5 px-1 py-1.5 rounded transition-colors">
      {/* 用戶頭像 */}
      <div className="w-9 h-9 bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 rounded-md flex items-center justify-center text-sm font-semibold text-morandi-gold shrink-0 mt-0.5">
        {userName?.charAt(0) || '?'}
      </div>

      {/* 內容區 */}
      <div className="flex-1 min-w-0 relative pt-0.5 pr-1">
        {/* 標題列 */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-morandi-primary text-[15px]">{userName}</span>
          <span className="text-[11px] text-morandi-secondary/80 font-normal">
            {new Date(advanceList.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-status-danger-bg hover:text-status-danger rounded transition-colors opacity-0 group-hover:opacity-100"
              title={COMP_WORKSPACE_LABELS.刪除代墊清單}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* 分享了代墊清單 */}
        <div className="text-morandi-primary text-[15px] mb-2">
          <Receipt className="inline text-morandi-gold mr-1" size={14} />
          {COMP_WORKSPACE_LABELS.LABEL_1330}
        </div>

        {/* 代墊項目卡片 */}
        <div className="bg-morandi-container/5 rounded-lg p-3 border border-morandi-gold/20">
        {/* 摘要資訊 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-morandi-gold/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-morandi-secondary">📋 待請款項目</span>
            <span className="badge-morandi">{pendingItems.length} 筆</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-morandi-secondary">{COMP_WORKSPACE_LABELS.TOTAL}</div>
            <CurrencyCell amount={totalAmount} className="text-lg font-semibold text-morandi-primary" />
          </div>
        </div>

        {/* 項目列表 */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                item.status === 'completed'
                  ? 'bg-morandi-container/20 opacity-60'
                  : 'hover:bg-morandi-container/10'
              }`}
            >
              {/* 序號 */}
              <div className="text-sm font-medium text-morandi-secondary w-6">{index + 1}</div>

              {/* 複選框（僅未處理項目且有權限時顯示） */}
              {item.status === 'pending' && canProcess && (
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="w-4 h-4 rounded border-morandi-gold/20 text-morandi-gold focus:ring-morandi-gold/20"
                />
              )}

              {/* 項目資訊 */}
              <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                <div className="font-medium text-morandi-primary">{item.name}</div>
                <div className="text-sm text-morandi-secondary">{item.description || '-'}</div>
                <CurrencyCell amount={item.amount} className="text-sm font-medium text-morandi-primary" />
                <div className="text-sm text-morandi-secondary">{item.advance_person}</div>
              </div>

              {/* 操作按鈕 */}
              <div className="shrink-0 w-24">
                {item.status === 'completed' ? (
                  <div className="flex items-center gap-1 text-xs text-morandi-secondary">
                    <Check size={14} className="text-status-success" />
                    <span>{COMP_WORKSPACE_LABELS.LABEL_2202}</span>
                  </div>
                ) : canProcess ? (
                  <button
                    onClick={() => onCreatePayment(item.id, item)}
                    className="btn-morandi-primary !py-1 !px-2 text-xs w-full"
                  >
                    {COMP_WORKSPACE_LABELS.LABEL_4772}
                  </button>
                ) : (
                  <div className="text-xs text-morandi-secondary text-center">{COMP_WORKSPACE_LABELS.待處理}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 批次請款按鈕 */}
        {canProcess && selectedItems.size > 0 && (
          <div className="mt-3 pt-3 border-t border-morandi-gold/20 flex items-center justify-between">
            <span className="text-sm text-morandi-secondary">
              已選擇 {selectedItems.size} 筆項目
            </span>
            <button
              onClick={handleBatchPayment}
              className="btn-morandi-primary !py-1.5 !px-4 text-sm"
            >
              {COMP_WORKSPACE_LABELS.LABEL_6339}
            </button>
          </div>
        )}

        {/* 已處理資訊 */}
        {items.some(item => item.status === 'completed') && (
          <div className="mt-3 pt-3 border-t border-morandi-gold/20">
            <div className="text-xs text-morandi-secondary">
              {items.filter(item => item.status === 'completed').length} 筆已處理
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
