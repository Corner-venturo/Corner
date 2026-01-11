'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { ListPageLayout } from '@/components/layout/list-page-layout'
import { Users, Edit2, Trash2, Plus, UserPlus, ChevronDown, ChevronRight } from 'lucide-react'
import { useCustomerGroups, useCustomerGroupMembers, useCustomers } from '@/hooks/cloud-hooks'
import { useAuthStore } from '@/stores'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { TableColumn } from '@/components/ui/enhanced-table'
import { DateCell, ActionCell, NumberCell } from '@/components/table-cells'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormDialog } from '@/components/dialog'
import { Combobox } from '@/components/ui/combobox'
import type {
  CustomerGroup,
  CustomerGroupMember,
  CustomerGroupType,
} from '@/stores/types'

// 群組類型標籤
const GROUP_TYPE_LABELS: Record<CustomerGroupType, string> = {
  family: '家庭',
  company: '公司',
  club: '社團',
  other: '其他',
}

// 群組類型顏色
const GROUP_TYPE_COLORS: Record<CustomerGroupType, string> = {
  family: 'text-morandi-gold bg-morandi-gold/10',
  company: 'text-status-info bg-status-info-bg',
  club: 'text-morandi-green bg-morandi-green/10',
  other: 'text-morandi-secondary bg-morandi-container',
}

export default function CustomerGroupsPage() {
  const { user } = useAuthStore()
  const {
    items: groups,
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,
  } = useCustomerGroups()
  const {
    items: allMembers,
    create: createMember,
    delete: deleteMember,
  } = useCustomerGroupMembers()
  const { items: customers } = useCustomers()

  // 展開狀態
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  // 對話框狀態
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null)

  // 表單狀態
  const [formData, setFormData] = useState<{
    name: string
    type: CustomerGroupType
    note: string
  }>({
    name: '',
    type: 'other',
    note: '',
  })
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

  // 取得群組成員
  const getGroupMembers = useCallback(
    (groupId: string) => {
      return allMembers.filter(m => m.group_id === groupId)
    },
    [allMembers]
  )

  // 取得客戶名稱
  const getCustomerName = useCallback(
    (customerId: string) => {
      const customer = customers.find(c => c.id === customerId)
      return customer?.name || '未知客戶'
    },
    [customers]
  )

  // 切換展開/收合
  const toggleExpand = useCallback((groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }, [])

  // 處理新增群組
  const handleAddGroup = useCallback(async () => {
    if (!formData.name.trim()) {
      await alert('請輸入群組名稱', 'warning')
      return
    }

    try {
      await createGroup({
        name: formData.name.trim(),
        type: formData.type,
        note: formData.note.trim() || null,
        created_by: user?.id || null,
      } as Omit<CustomerGroup, 'id' | 'created_at' | 'updated_at'>)

      setAddDialogOpen(false)
      setFormData({ name: '', type: 'other', note: '' })
    } catch (error) {
      await alert('建立群組失敗', 'error')
    }
  }, [formData, createGroup, user?.id])

  // 處理編輯群組
  const handleEditGroup = useCallback(async () => {
    if (!selectedGroup || !formData.name.trim()) {
      await alert('請輸入群組名稱', 'warning')
      return
    }

    try {
      await updateGroup(selectedGroup.id, {
        name: formData.name.trim(),
        type: formData.type,
        note: formData.note.trim() || null,
      })

      setEditDialogOpen(false)
      setSelectedGroup(null)
      setFormData({ name: '', type: 'other', note: '' })
    } catch (error) {
      await alert('更新群組失敗', 'error')
    }
  }, [selectedGroup, formData, updateGroup])

  // 處理刪除群組
  const handleDeleteGroup = useCallback(
    async (group: CustomerGroup) => {
      const members = getGroupMembers(group.id)
      if (members.length > 0) {
        await alert(`此群組有 ${members.length} 位成員，請先移除所有成員後再刪除`, 'warning')
        return
      }

      const confirmed = await confirm(`確定要刪除群組「${group.name}」嗎？`, {
        type: 'warning',
        title: '刪除群組',
      })

      if (confirmed) {
        try {
          await deleteGroup(group.id)
        } catch (error) {
          await alert('刪除群組失敗', 'error')
        }
      }
    },
    [deleteGroup, getGroupMembers]
  )

  // 開啟編輯對話框
  const openEditDialog = useCallback((group: CustomerGroup) => {
    setSelectedGroup(group)
    setFormData({
      name: group.name,
      type: group.type,
      note: group.note || '',
    })
    setEditDialogOpen(true)
  }, [])

  // 開啟新增成員對話框
  const openAddMemberDialog = useCallback((group: CustomerGroup) => {
    setSelectedGroup(group)
    setSelectedCustomerId('')
    setAddMemberDialogOpen(true)
  }, [])

  // 處理新增成員
  const handleAddMember = useCallback(async () => {
    if (!selectedGroup || !selectedCustomerId) {
      await alert('請選擇客戶', 'warning')
      return
    }

    // 檢查是否已存在
    const existingMember = allMembers.find(
      m => m.group_id === selectedGroup.id && m.customer_id === selectedCustomerId
    )
    if (existingMember) {
      await alert('此客戶已在群組中', 'warning')
      return
    }

    try {
      await createMember({
        group_id: selectedGroup.id,
        customer_id: selectedCustomerId,
        role: 'member',
      })

      setAddMemberDialogOpen(false)
      setSelectedGroup(null)
      setSelectedCustomerId('')
    } catch (error) {
      await alert('新增成員失敗', 'error')
    }
  }, [selectedGroup, selectedCustomerId, allMembers, createMember])

  // 處理移除成員
  const handleRemoveMember = useCallback(
    async (member: CustomerGroupMember) => {
      const customerName = getCustomerName(member.customer_id)
      const confirmed = await confirm(`確定要從群組中移除「${customerName}」嗎？`, {
        type: 'warning',
        title: '移除成員',
      })

      if (confirmed) {
        try {
          await deleteMember(member.id)
        } catch (error) {
          await alert('移除成員失敗', 'error')
        }
      }
    },
    [deleteMember, getCustomerName]
  )

  // 可選的客戶列表（排除已在群組中的）
  const availableCustomers = useMemo(() => {
    if (!selectedGroup) return customers
    const memberIds = allMembers
      .filter(m => m.group_id === selectedGroup.id)
      .map(m => m.customer_id)
    return customers.filter(c => !memberIds.includes(c.id))
  }, [selectedGroup, allMembers, customers])

  // 表格欄位定義
  const columns: TableColumn<CustomerGroup>[] = useMemo(
    () => [
      {
        key: 'expand',
        label: '',
        width: '40px',
        render: (_, group) => {
          const isExpanded = expandedGroups.includes(group.id)
          const memberCount = getGroupMembers(group.id).length
          return (
            <button
              onClick={e => {
                e.stopPropagation()
                toggleExpand(group.id)
              }}
              className="p-1 hover:bg-morandi-container/50 rounded"
              disabled={memberCount === 0}
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-morandi-secondary" />
              ) : (
                <ChevronRight
                  size={16}
                  className={memberCount === 0 ? 'text-morandi-muted' : 'text-morandi-secondary'}
                />
              )}
            </button>
          )
        },
      },
      {
        key: 'name',
        label: '群組名稱',
        sortable: true,
        render: (_, group) => (
          <div className="font-medium text-morandi-primary">{group.name}</div>
        ),
      },
      {
        key: 'type',
        label: '類型',
        sortable: true,
        width: '100px',
        render: (_, group) => (
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${GROUP_TYPE_COLORS[group.type]}`}
          >
            {GROUP_TYPE_LABELS[group.type]}
          </span>
        ),
      },
      {
        key: 'member_count',
        label: '成員數',
        width: '80px',
        render: (_, group) => {
          const count = getGroupMembers(group.id).length
          return <NumberCell value={count} suffix="人" />
        },
      },
      {
        key: 'note',
        label: '備註',
        render: (_, group) => (
          <span className="text-sm text-morandi-secondary">{group.note || '-'}</span>
        ),
      },
      {
        key: 'created_at',
        label: '建立時間',
        sortable: true,
        width: '120px',
        render: (_, group) => <DateCell date={group.created_at} showIcon={false} />,
      },
    ],
    [expandedGroups, getGroupMembers, toggleExpand]
  )

  // 渲染操作按鈕
  const renderActions = useCallback(
    (group: CustomerGroup) => (
      <ActionCell
        actions={[
          {
            icon: UserPlus,
            label: '新增成員',
            onClick: () => openAddMemberDialog(group),
          },
          {
            icon: Edit2,
            label: '編輯',
            onClick: () => openEditDialog(group),
          },
          {
            icon: Trash2,
            label: '刪除',
            onClick: () => handleDeleteGroup(group),
            variant: 'danger',
          },
        ]}
      />
    ),
    [openAddMemberDialog, openEditDialog, handleDeleteGroup]
  )

  // 渲染展開內容（成員列表）
  const renderExpanded = useCallback(
    (group: CustomerGroup) => {
      const members = getGroupMembers(group.id)
      if (members.length === 0) {
        return (
          <div className="p-4 text-center text-morandi-secondary text-sm">尚無成員</div>
        )
      }

      return (
        <div className="p-4 bg-morandi-container/20">
          <div className="text-sm font-medium text-morandi-primary mb-2">群組成員</div>
          <div className="flex flex-wrap gap-2">
            {members.map(member => {
              const customerName = getCustomerName(member.customer_id)
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-lg border border-border"
                >
                  <span className="text-sm text-morandi-primary">{customerName}</span>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="text-morandi-muted hover:text-morandi-red transition-colors"
                    title="移除成員"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )
    },
    [getGroupMembers, getCustomerName, handleRemoveMember]
  )

  // 狀態 Tab 配置
  const statusTabs = useMemo(
    () => [
      { value: 'all', label: '全部' },
      { value: 'family', label: '家庭' },
      { value: 'company', label: '公司' },
      { value: 'club', label: '社團' },
      { value: 'other', label: '其他' },
    ],
    []
  )

  return (
    <>
      <ListPageLayout
        title="客戶群組"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '顧客管理', href: '/customers' },
          { label: '客戶群組', href: '/customer-groups' },
        ]}
        data={groups}
        columns={columns}
        searchFields={['name', 'note']}
        searchPlaceholder="搜尋群組名稱..."
        statusTabs={statusTabs}
        statusField="type"
        defaultStatusTab="all"
        onRowClick={group => toggleExpand(group.id)}
        renderActions={renderActions}
        renderExpanded={renderExpanded}
        expandedRows={expandedGroups}
        onToggleExpand={toggleExpand}
        bordered={true}
        onAdd={() => {
          setFormData({ name: '', type: 'other', note: '' })
          setAddDialogOpen(true)
        }}
        addLabel="新增群組"
      />

      {/* 新增群組對話框 */}
      <FormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="新增客戶群組"
        onSubmit={handleAddGroup}
        submitLabel="建立"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              群組名稱 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：王家旅遊團"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              群組類型
            </label>
            <Combobox
              value={formData.type}
              onChange={type =>
                setFormData(prev => ({ ...prev, type: type as CustomerGroupType }))
              }
              options={Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="選擇類型..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">備註</label>
            <Input
              value={formData.note}
              onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="選填"
            />
          </div>
        </div>
      </FormDialog>

      {/* 編輯群組對話框 */}
      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="編輯客戶群組"
        onSubmit={handleEditGroup}
        submitLabel="儲存"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              群組名稱 <span className="text-morandi-red">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：王家旅遊團"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              群組類型
            </label>
            <Combobox
              value={formData.type}
              onChange={type =>
                setFormData(prev => ({ ...prev, type: type as CustomerGroupType }))
              }
              options={Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="選擇類型..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">備註</label>
            <Input
              value={formData.note}
              onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="選填"
            />
          </div>
        </div>
      </FormDialog>

      {/* 新增成員對話框 */}
      <FormDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        title={`新增成員到「${selectedGroup?.name || ''}」`}
        onSubmit={handleAddMember}
        submitLabel="新增"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              選擇客戶 <span className="text-morandi-red">*</span>
            </label>
            <Combobox
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              options={availableCustomers.map(c => ({
                value: c.id,
                label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
              }))}
              placeholder="搜尋並選擇客戶..."
              showSearchIcon={true}
              emptyMessage="找不到客戶"
            />
          </div>
          {availableCustomers.length === 0 && (
            <p className="text-sm text-morandi-secondary">
              所有客戶都已加入此群組，或目前沒有可用的客戶。
            </p>
          )}
        </div>
      </FormDialog>
    </>
  )
}
