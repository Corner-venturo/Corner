/**
 * 新增頻道 Dialog
 */

import { useState, useEffect } from 'react'
import { Hash, Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployeeStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'

interface CreateChannelDialogProps {
  isOpen: boolean
  channelName: string
  channelDescription: string
  channelType: 'public' | 'private'
  selectedMembers: string[] // 新增：選中的成員 ID
  onChannelNameChange: (name: string) => void
  onChannelDescriptionChange: (desc: string) => void
  onChannelTypeChange: (type: 'public' | 'private') => void
  onMembersChange: (members: string[]) => void // 新增：成員變更回調
  onClose: () => void
  onCreate: () => void
}

export function CreateChannelDialog({
  isOpen,
  channelName,
  channelDescription,
  channelType,
  selectedMembers,
  onChannelNameChange,
  onChannelDescriptionChange,
  onChannelTypeChange,
  onMembersChange,
  onClose,
  onCreate,
}: CreateChannelDialogProps) {
  const { user } = useAuthStore()
  const employees = useEmployeeStore(state => state.items)

  // 載入員工列表
  useEffect(() => {
    if (isOpen && employees.length === 0) {
      useEmployeeStore.getState().fetchAll()
    }
  }, [isOpen, employees.length])

  // 當前 workspace 的員工
  const workspaceEmployees = employees.filter(emp => (emp as unknown as { workspace_id?: string }).workspace_id === user?.workspace_id)

  // 切換成員選擇
  const toggleMember = (employeeId: string) => {
    // 建立者不可取消
    if (employeeId === user?.id) return

    if (selectedMembers.includes(employeeId)) {
      onMembersChange(selectedMembers.filter(id => id !== employeeId))
    } else {
      onMembersChange([...selectedMembers, employeeId])
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="card-morandi-elevated w-96 max-h-[80vh] flex flex-col">
        <h3 className="font-semibold mb-4 text-morandi-primary">建立頻道</h3>

        <div className="space-y-3 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">頻道名稱</label>
            <input
              type="text"
              placeholder="例如：專案討論"
              value={channelName}
              onChange={e => onChannelNameChange(e.target.value)}
              autoFocus
              className="input-morandi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              頻道描述（選填）
            </label>
            <textarea
              placeholder="說明這個頻道的用途"
              value={channelDescription}
              onChange={e => onChannelDescriptionChange(e.target.value)}
              className="input-morandi resize-none"
              rows={2}
            />
          </div>

          {/* 頻道類型選擇 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              頻道類型
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChannelTypeChange('public')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                  channelType === 'public'
                    ? 'bg-morandi-gold/10 border-morandi-gold text-morandi-primary'
                    : 'border-morandi-gold/20 text-morandi-secondary hover:bg-morandi-secondary/5'
                )}
              >
                <Hash size={16} />
                <span className="text-sm">公開頻道</span>
              </button>
              <button
                type="button"
                onClick={() => onChannelTypeChange('private')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                  channelType === 'private'
                    ? 'bg-morandi-gold/10 border-morandi-gold text-morandi-primary'
                    : 'border-morandi-gold/20 text-morandi-secondary hover:bg-morandi-secondary/5'
                )}
              >
                <Lock size={16} />
                <span className="text-sm">私密頻道</span>
              </button>
            </div>
            <p className="text-xs text-morandi-secondary mt-1">
              {channelType === 'public' ? '所有成員都可以看到並加入' : '只有被邀請的成員可以看到'}
            </p>
          </div>

          {/* 成員選擇 */}
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">
              邀請成員
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-morandi-gold/20 rounded-lg p-2">
              {workspaceEmployees.map(employee => {
                const isCreator = employee.id === user?.id
                const isSelected = selectedMembers.includes(employee.id)

                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => toggleMember(employee.id)}
                    disabled={isCreator}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      isSelected
                        ? 'bg-morandi-gold/10 text-morandi-primary'
                        : 'hover:bg-morandi-secondary/5 text-morandi-secondary',
                      isCreator && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-morandi-gold border-morandi-gold'
                          : 'border-morandi-gold/30'
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="flex-1">
                      {employee.chinese_name || employee.display_name || employee.email}
                      {isCreator && <span className="text-xs ml-2">(建立者)</span>}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-morandi-secondary mt-1">
              已選擇 {selectedMembers.length} 位成員
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end border-t border-morandi-gold/10 pt-4">
          <button className="btn-morandi-secondary !py-1.5 !px-3 text-sm" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-morandi-primary !py-1.5 !px-3 text-sm"
            onClick={onCreate}
            disabled={!channelName.trim() || selectedMembers.length === 0}
          >
            建立
          </button>
        </div>
      </div>
    </div>
  )
}
