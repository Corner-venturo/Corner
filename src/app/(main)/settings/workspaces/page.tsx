'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useWorkspaceChannels } from '@/stores/workspace'
import { useEmployeeStore, useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Building2, Users, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

/**
 * Workspace 管理頁面
 * 用於管理多分公司設定（台北、台中等）
 * 使用前端過濾實現資料隔離
 */
export default function WorkspacesPage() {
  const { workspaces, loadWorkspaces, createWorkspace, updateWorkspace, createChannel } = useWorkspaceChannels()
  const employeeStore = useEmployeeStore()
  const { user } = useAuthStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
  })

  // 載入資料
  const loadData = useCallback(() => {
    loadWorkspaces()
    employeeStore.fetchAll()
  }, [loadWorkspaces, employeeStore])

  // 載入 workspaces 和 employees 資料
  useEffect(() => {
    loadData()
  }, [loadData])

  // 計算每個 workspace 的員工數
  const getEmployeeCount = (workspaceId: string) => {
    return (employeeStore.items || []).filter(emp => emp.workspace_id === workspaceId).length
  }

  const handleCreate = async () => {
    if (!newWorkspace.name || !user) {
      toast.error('請填寫工作空間名稱')
      return
    }

    try {
      const createdWs = await createWorkspace({
        name: newWorkspace.name,
        description: newWorkspace.description,
        is_active: true,
      })

      if (createdWs) {
        logger.log(`Workspace created: ${createdWs.id}. Creating announcement channel...`)
        // Automatically create an announcement channel
        await createChannel({
          workspace_id: createdWs.id,
          name: '公告',
          description: '此頻道用於發布全工作空間的重要公告。',
          type: 'PUBLIC',
          is_announcement: true,
          created_by: user.id,
        })
        toast.success('工作空間和公告頻道已建立')
      }

      setNewWorkspace({ name: '', description: '' })
      setShowAddDialog(false)

    } catch (error) {
      logger.error('Failed to create workspace or announcement channel:', error)
      toast.error('建立失敗')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateWorkspace(id, { is_active: !currentStatus })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-morandi-primary mb-2">工作空間管理</h1>
          <p className="text-morandi-secondary">
            管理多分公司設定，實現資料隔離（台北公司 vs 台中分公司）
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Plus size={16} className="mr-2" />
          新增工作空間
        </Button>
      </div>

      {/* 資料隔離說明卡片 */}
      <Card className="bg-morandi-container/10 border-morandi-container/30 p-6 mb-6">
        <div className="flex items-start gap-4">
          <Shield className="text-morandi-gold mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-morandi-primary mb-2">什麼是資料隔離？</h3>
            <p className="text-sm text-morandi-secondary mb-3">
              工作空間可以確保不同分公司的資料獨立管理：
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1 ml-4">
              <li>• 台北員工預設看到台北的旅遊團、訂單、客戶</li>
              <li>• 台中員工預設看到台中的旅遊團、訂單、客戶</li>
              <li>• 系統管理員可以切換工作空間查看所有資料</li>
              <li>• 員工資料、航空公司、飯店等主檔仍然全公司共享</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 工作空間列表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {(workspaces || []).map(workspace => (
          <Card
            key={workspace.id}
            className="border-morandi-container/30 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    workspace.is_active ? 'bg-morandi-gold/20' : 'bg-morandi-container/20'
                  }`}
                >
                  <Building2
                    size={24}
                    className={workspace.is_active ? 'text-morandi-gold' : 'text-morandi-muted'}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-morandi-primary">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-morandi-secondary">{workspace.description || '無描述'}</p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workspace.is_active
                    ? 'bg-morandi-green/20 text-morandi-green'
                    : 'bg-morandi-muted/20 text-morandi-muted'
                }`}
              >
                {workspace.is_active ? '啟用' : '停用'}
              </div>
            </div>

            {workspace.description && (
              <p className="text-sm text-morandi-secondary mb-4">{workspace.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-morandi-secondary mb-4">
              <Users size={16} />
              <span>員工數：{getEmployeeCount(workspace.id)} 人</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(workspace.id, workspace.is_active ?? false)}
                className="flex-1"
              >
                {workspace.is_active ? '停用' : '啟用'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void alert('編輯功能開發中', 'info')}
                className="flex-1"
              >
                編輯
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 新增對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-morandi-primary">新增工作空間</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                名稱 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={newWorkspace.name}
                onChange={e => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：台北總公司、台中分公司"
                className="border-morandi-container/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                說明
              </label>
              <Input
                value={newWorkspace.description}
                onChange={e =>
                  setNewWorkspace(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="簡短說明此工作空間"
                className="border-morandi-container/30"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="flex-1 gap-2"
            >
              <X size={16} />
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newWorkspace.name}
              className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Plus size={16} />
              建立
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {workspaces?.length === 0 && !showAddDialog && (
        <Card className="border-dashed border-2 border-morandi-container/30 p-12 text-center">
          <Building2 size={48} className="text-morandi-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-morandi-primary mb-2">尚未建立工作空間</h3>
          <p className="text-morandi-secondary mb-4">開始建立第一個工作空間以啟用多分公司管理</p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增工作空間
          </Button>
        </Card>
      )}
    </div>
  )
}