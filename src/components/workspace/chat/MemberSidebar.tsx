'use client'

import { useEffect, useState, useMemo } from 'react'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useChannelMemberStore } from '@/stores/workspace/channel-member-store'
import { useEmployees } from '@/data'
import { useAuthStore } from '@/stores'
import { User, UserPlus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { alert } from '@/lib/ui/alert-dialog'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'

interface MemberSidebarProps {
  isOpen: boolean
}

export function MemberSidebar({ isOpen }: MemberSidebarProps) {
  const { selectedChannel, currentWorkspace } = useWorkspaceChannels()
  const { items: channelMembers, fetchAll: fetchChannelMembers, create: addMember } = useChannelMemberStore()
  const { items: employees } = useEmployees()
  const { user } = useAuthStore()
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // 載入頻道成員資料
  useEffect(() => {
    if (isOpen) {
      fetchChannelMembers()
    }
  }, [isOpen, fetchChannelMembers])

  // 計算當前頻道的成員（含員工資料）
  const members = useMemo(() => {
    if (!selectedChannel?.id) return []

    return channelMembers
      .filter(m => m.channel_id === selectedChannel.id && m.status === 'active')
      .map(member => {
        const employee = employees.find(emp => emp.id === member.employee_id)
        return {
          id: member.id,
          employeeId: member.employee_id,
          role: member.role,
          status: member.status,
          profile: employee ? {
            displayName: employee.display_name,
            englishName: employee.english_name,
            email: employee.personal_info?.email,
            status: employee.status,
          } : null,
        }
      })
  }, [channelMembers, employees, selectedChannel?.id])

  const memberEmployeeIds = new Set(members.map(m => m.employeeId))

  // 🔐 權限驗證：檢查當前用戶在此頻道的角色
  const currentUserMember = members.find(m => m.employeeId === user?.id)
  const currentUserRole = currentUserMember?.role
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'

  // 過濾出還不是成員的員工
  const availableEmployees = employees.filter(emp => {
    // 1. 排除已經是成員的
    if (memberEmployeeIds.has(emp.id)) return false

    // 2. 只顯示活躍狀態
    if (emp.status !== 'active') return false

    // 3. 🔥 排除工程師帳號（LIAO）
    // 工程師帳號不應該被加入頻道成員
    if (emp.employee_number === 'liao00' || emp.english_name?.toLowerCase() === 'liao') return false

    // 4. 搜尋過濾
    if (searchQuery !== '') {
      const query = searchQuery.toLowerCase()
      return (
        emp.display_name.toLowerCase().includes(query) ||
        emp.english_name?.toLowerCase().includes(query) ||
        emp.employee_number.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleAddMembers = async () => {
    if (!selectedChannel || !currentWorkspace || selectedEmployees.length === 0) return

    setIsAdding(true)
    try {
      // 使用 Store 批次新增成員
      for (const employeeId of selectedEmployees) {
        await addMember({
          workspace_id: currentWorkspace.id,
          channel_id: selectedChannel.id,
          employee_id: employeeId,
          role: 'member',
          status: 'active',
        })
      }

      // 重新載入成員列表
      await fetchChannelMembers()

      // 重置狀態
      setSelectedEmployees([])
      setSearchQuery('')
      setShowAddMemberDialog(false)
    } catch (error) {
      void alert(COMP_WORKSPACE_LABELS.新增成員失敗_請稍後再試, 'error')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-morandi-primary">成員列表</h3>
          {canManageMembers && (
            <button
              onClick={() => setShowAddMemberDialog(true)}
              className="p-1.5 rounded-md hover:bg-morandi-gold/10 text-morandi-gold transition-colors"
              title={COMP_WORKSPACE_LABELS.新增成員}
            >
              <UserPlus size={16} />
            </button>
          )}
        </div>
        <p className="text-xs text-morandi-secondary">
          {members.length} 位成員
          {currentUserRole && (
            <span className="ml-2 text-morandi-gold">
              · 你的角色：
              {currentUserRole === 'owner'
                ? COMP_WORKSPACE_LABELS.擁有者
                : currentUserRole === 'admin'
                  ? COMP_WORKSPACE_LABELS.管理員
                  : currentUserRole === 'manager'
                    ? COMP_WORKSPACE_LABELS.經理
                    : currentUserRole === 'member'
                      ? COMP_WORKSPACE_LABELS.成員
                      : COMP_WORKSPACE_LABELS.訪客}
            </span>
          )}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {members.length === 0 ? (
          <div className="text-center text-morandi-secondary text-sm py-8">
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p>此頻道目前沒有成員</p>
          </div>
        ) : (
          <div className="space-y-1">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-morandi-container/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-morandi-gold/20 flex items-center justify-center text-xs font-medium text-morandi-primary">
                  {member.profile?.displayName?.[0]?.toUpperCase() || 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-morandi-primary truncate">
                    {member.profile?.displayName || member.profile?.englishName || COMP_WORKSPACE_LABELS.未知成員}
                  </p>
                  <p className="text-xs text-morandi-secondary truncate">{member.role || COMP_WORKSPACE_LABELS.成員}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增成員對話框 */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent level={1} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-morandi-primary">新增成員到頻道</DialogTitle>
          </DialogHeader>

          {/* 搜尋框 */}
          <div className="border-b border-border pb-4">
            <input
              type="text"
              placeholder={COMP_WORKSPACE_LABELS.搜尋員工姓名或編號}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-morandi-gold/20 text-sm"
            />
          </div>

          {/* 員工列表 */}
          <div className="max-h-96 overflow-y-auto">
            {availableEmployees.length === 0 ? (
              <div className="text-center text-morandi-secondary text-sm py-8">
                <User size={32} className="mx-auto mb-2 opacity-50" />
                <p>沒有可新增的員工</p>
              </div>
            ) : (
              <div className="space-y-1">
                {availableEmployees.map(employee => (
                  <div
                    key={employee.id}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                      selectedEmployees.includes(employee.id)
                        ? 'bg-morandi-gold/10 border border-morandi-gold/30'
                        : 'hover:bg-morandi-container/10 border border-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-morandi-gold/20 flex items-center justify-center text-sm font-medium text-morandi-primary">
                      {employee.display_name[0]?.toUpperCase() || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-morandi-primary truncate">
                        {employee.display_name}
                      </p>
                      <p className="text-xs text-morandi-secondary truncate">
                        {employee.employee_number} · {employee.english_name}
                      </p>
                    </div>
                    {selectedEmployees.includes(employee.id) && (
                      <div className="w-5 h-5 rounded-full bg-morandi-gold flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-xs text-morandi-secondary">
              已選擇 {selectedEmployees.length} 位員工
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddMemberDialog(false)}
                disabled={isAdding}
                className="gap-2"
              >
                <X size={16} />
                取消
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedEmployees.length === 0 || isAdding}
                className="bg-morandi-gold hover:bg-morandi-gold-hover gap-2"
              >
                <Check size={16} />
                {isAdding ? COMP_WORKSPACE_LABELS.新增中 : `新增 (${selectedEmployees.length})`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
