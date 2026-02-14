'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useWorkspaceChannels } from '@/stores/workspace'
import { useAuthStore } from '@/stores'
import { useEmployeesSlim } from '@/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Building2, Users, Shield, X } from 'lucide-react'
import { toast } from 'sonner'
import { alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import { LABELS } from '../constants/labels'

/**
 * Workspace 管理頁面
 * 用於管理多分公司設定（台北、台中等）
 * 使用前端過濾實現資料隔離
 */
export default function WorkspacesPage() {
  const { workspaces, loadWorkspaces, createWorkspace, updateWorkspace, createChannel } = useWorkspaceChannels()
  const { items: employees } = useEmployeesSlim()
  const { user } = useAuthStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
  })

  // 載入 workspaces 資料（employees 由 SWR 自動載入）
  useEffect(() => {
    loadWorkspaces()
   
  }, [])

  // 計算每個 workspace 的員工數
  const getEmployeeCount = useCallback((workspaceId: string) => {
    return (employees || []).filter(emp => emp.workspace_id === workspaceId).length
  }, [employees])

  const handleCreate = async () => {
    if (!newWorkspace.name || !user) {
      toast.error(LABELS.WORKSPACE_NAME_REQUIRED_MSG)
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
          name: LABELS.ANNOUNCEMENT,
          description: LABELS.ANNOUNCEMENT_CHANNEL_DESC,
          type: 'PUBLIC',
          is_announcement: true,
          created_by: user.id,
        })

        // 自動建立專屬機器人
        try {
          const botResponse = await fetch('/api/debug/setup-workspace-bots', {
            method: 'POST',
          })
          if (botResponse.ok) {
            logger.log(`Bot created for workspace: ${createdWs.id}`)
          }
        } catch (botError) {
          logger.warn(LABELS.BOT_CREATION_FAILED, botError)
        }

        toast.success(LABELS.WORKSPACE_CREATED_SUCCESS)
      }

      setNewWorkspace({ name: '', description: '' })
      setShowAddDialog(false)

    } catch (error) {
      logger.error('Failed to create workspace or announcement channel:', error)
      toast.error(LABELS.CREATION_FAILED)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateWorkspace(id, { is_active: !currentStatus })
    } catch (error) {
      logger.error('Failed to toggle workspace active status:', error)
      toast.error(LABELS.CREATION_FAILED)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-morandi-primary mb-2">{LABELS.WORKSPACE_MANAGEMENT}</h1>
          <p className="text-morandi-secondary">
            {LABELS.WORKSPACE_MANAGEMENT_DESC}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
        >
          <Plus size={16} className="mr-2" />
          {LABELS.ADD_WORKSPACE}
        </Button>
      </div>

      {/* 資料隔離說明卡片 */}
      <Card className="bg-morandi-container/10 border-morandi-container/30 p-6 mb-6">
        <div className="flex items-start gap-4">
          <Shield className="text-morandi-gold mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-morandi-primary mb-2">{LABELS.DATA_ISOLATION_TITLE}</h3>
            <p className="text-sm text-morandi-secondary mb-3">
              {LABELS.DATA_ISOLATION_DESC}
            </p>
            <ul className="text-sm text-morandi-secondary space-y-1 ml-4">
              <li>{LABELS.DATA_ISOLATION_POINT1}</li>
              <li>{LABELS.DATA_ISOLATION_POINT2}</li>
              <li>{LABELS.DATA_ISOLATION_POINT3}</li>
              <li>{LABELS.DATA_ISOLATION_POINT4}</li>
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
                  <p className="text-sm text-morandi-secondary">{workspace.description || LABELS.NO_DESCRIPTION}</p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workspace.is_active
                    ? 'bg-morandi-green/20 text-morandi-green'
                    : 'bg-morandi-muted/20 text-morandi-muted'
                }`}
              >
                {workspace.is_active ? LABELS.STATUS_ACTIVE : LABELS.STATUS_INACTIVE}
              </div>
            </div>

            {workspace.description && (
              <p className="text-sm text-morandi-secondary mb-4">{workspace.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-morandi-secondary mb-4">
              <Users size={16} />
              <span>{LABELS.EMPLOYEE_COUNT.replace('{count}', getEmployeeCount(workspace.id).toString())}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(workspace.id, workspace.is_active ?? false)}
                className="flex-1"
              >
                {workspace.is_active ? LABELS.STATUS_INACTIVE : LABELS.STATUS_ACTIVE}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void alert(LABELS.EDIT_FEATURE_COMING, 'info')}
                className="flex-1"
              >
                {LABELS.EDIT}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 新增對話框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent level={1} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-morandi-primary">{LABELS.ADD_WORKSPACE_TITLE}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                {LABELS.WORKSPACE_NAME_LABEL} <span className="text-morandi-red">{LABELS.WORKSPACE_NAME_REQUIRED}</span>
              </label>
              <Input
                value={newWorkspace.name}
                onChange={e => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                placeholder={LABELS.WORKSPACE_NAME_PLACEHOLDER}
                className="border-morandi-container/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                {LABELS.WORKSPACE_DESCRIPTION_LABEL}
              </label>
              <Input
                value={newWorkspace.description}
                onChange={e =>
                  setNewWorkspace(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder={LABELS.WORKSPACE_DESCRIPTION_PLACEHOLDER}
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
              {LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newWorkspace.name}
              className="flex-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              <Plus size={16} />
              {LABELS.CREATE}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {workspaces?.length === 0 && !showAddDialog && (
        <Card className="border-dashed border-2 border-morandi-container/30 p-12 text-center">
          <Building2 size={48} className="text-morandi-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-morandi-primary mb-2">{LABELS.NO_WORKSPACE_TITLE}</h3>
          <p className="text-morandi-secondary mb-4">{LABELS.NO_WORKSPACE_DESC}</p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            {LABELS.ADD_WORKSPACE}
          </Button>
        </Card>
      )}
    </div>
  )
}