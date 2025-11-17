'use client'

import React, { useEffect, useState } from 'react'
import { useWorkspacePermissionStore } from '@/stores/workspace-permission-store'
import { useEmployeeStore, useWorkspaceStore } from '@/stores'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Plus, Trash2, Eye, Edit3, Trash, DollarSign, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export default function PermissionsManagementPage() {
  const {
    permissions,
    loading,
    error,
    fetchAllPermissions,
    grantAccess,
    revokeAccess,
    clearError,
  } = useWorkspacePermissionStore()

  const { items: employees, fetchAll: fetchEmployees } = useEmployeeStore()
  const { workspaces, loadWorkspaces } = useWorkspaceStore()

  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [permissionConfig, setPermissionConfig] = useState({
    can_view: true,
    can_edit: false,
    can_delete: false,
    can_manage_finance: false,
  })
  const [expiresDate, setExpiresDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    fetchAllPermissions()
    fetchEmployees()
    loadWorkspaces()
  }, [])

  const handleGrantAccess = async () => {
    if (!selectedUserId || !selectedWorkspaceId) {
      alert('請選擇員工和分公司')
      return
    }

    const result = await grantAccess({
      target_user_id: selectedUserId,
      workspace_id: selectedWorkspaceId,
      ...permissionConfig,
      expires_at: expiresDate || null,
      notes: notes || null,
    })

    if (result) {
      setShowGrantDialog(false)
      resetForm()
    }
  }

  const handleRevokeAccess = async (userId: string, workspaceId: string, userName: string) => {
    if (confirm(`確定要撤銷 ${userName} 對此分公司的權限嗎？`)) {
      await revokeAccess(userId, workspaceId)
    }
  }

  const resetForm = () => {
    setSelectedUserId('')
    setSelectedWorkspaceId('')
    setPermissionConfig({
      can_view: true,
      can_edit: false,
      can_delete: false,
      can_manage_finance: false,
    })
    setExpiresDate('')
    setNotes('')
  }

  const getPermissionBadges = (permission: any) => {
    const badges = []
    if (permission.can_view) badges.push({ label: '查看', icon: Eye, variant: 'default' as const })
    if (permission.can_edit) badges.push({ label: '編輯', icon: Edit3, variant: 'secondary' as const })
    if (permission.can_delete)
      badges.push({ label: '刪除', icon: Trash, variant: 'destructive' as const })
    if (permission.can_manage_finance)
      badges.push({ label: '財務', icon: DollarSign, variant: 'outline' as const })
    return badges
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-morandi-gold" />
            跨分公司權限管理
          </h1>
          <p className="text-muted-foreground mt-2">
            管理員工的跨分公司資料存取權限（例如：台北管理員可查看台中資料）
          </p>
        </div>
        <Button onClick={() => setShowGrantDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          授權新權限
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              關閉
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>目前授權清單</CardTitle>
          <CardDescription>顯示所有生效中的跨分公司權限</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無任何跨分公司權限</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>員工</TableHead>
                  <TableHead>可存取分公司</TableHead>
                  <TableHead>權限</TableHead>
                  <TableHead>授權者</TableHead>
                  <TableHead>授權時間</TableHead>
                  <TableHead>過期時間</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map(permission => {
                  const badges = getPermissionBadges(permission)
                  return (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.workspace_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {badges.map(({ label, icon: Icon, variant }, i) => (
                            <Badge key={i} variant={variant} className="gap-1">
                              <Icon className="w-3 h-3" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {permission.granted_by_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(permission.granted_at).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {permission.expires_at
                          ? new Date(permission.expires_at).toLocaleDateString('zh-TW')
                          : '永久'}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {permission.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRevokeAccess(
                              permission.user_id,
                              permission.workspace_id,
                              permission.user_name
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grant Permission Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>授權跨分公司權限</DialogTitle>
            <DialogDescription>
              允許員工查看或管理其他分公司的資料（例如：台北管理員可查看台中的旅遊團資料）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 選擇員工 */}
            <div className="space-y-2">
              <Label htmlFor="employee">選擇員工</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="請選擇員工" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => {
                    const personalInfo = emp.personal_info as { email?: string } | null
                    return (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.display_name || emp.chinese_name || emp.english_name} ({personalInfo?.email || '無email'})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 選擇分公司 */}
            <div className="space-y-2">
              <Label htmlFor="workspace">可存取的分公司</Label>
              <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                <SelectTrigger id="workspace">
                  <SelectValue placeholder="請選擇分公司" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces
                    .filter(w => w.is_active)
                    .map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 權限選項 */}
            <div className="space-y-2">
              <Label>授予權限</Label>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_view"
                    checked={permissionConfig.can_view}
                    onCheckedChange={checked =>
                      setPermissionConfig(prev => ({ ...prev, can_view: !!checked }))
                    }
                  />
                  <label htmlFor="can_view" className="flex items-center gap-2 cursor-pointer">
                    <Eye className="w-4 h-4 text-morandi-blue" />
                    查看資料
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_edit"
                    checked={permissionConfig.can_edit}
                    onCheckedChange={checked =>
                      setPermissionConfig(prev => ({ ...prev, can_edit: !!checked }))
                    }
                  />
                  <label htmlFor="can_edit" className="flex items-center gap-2 cursor-pointer">
                    <Edit3 className="w-4 h-4 text-morandi-green" />
                    編輯資料
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_delete"
                    checked={permissionConfig.can_delete}
                    onCheckedChange={checked =>
                      setPermissionConfig(prev => ({ ...prev, can_delete: !!checked }))
                    }
                  />
                  <label htmlFor="can_delete" className="flex items-center gap-2 cursor-pointer">
                    <Trash className="w-4 h-4 text-morandi-red" />
                    刪除資料
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="can_manage_finance"
                    checked={permissionConfig.can_manage_finance}
                    onCheckedChange={checked =>
                      setPermissionConfig(prev => ({ ...prev, can_manage_finance: !!checked }))
                    }
                  />
                  <label
                    htmlFor="can_manage_finance"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-morandi-gold" />
                    管理財務
                  </label>
                </div>
              </div>
            </div>

            {/* 過期時間 */}
            <div className="space-y-2">
              <Label htmlFor="expires">權限過期時間（選填）</Label>
              <Input
                id="expires"
                type="date"
                value={expiresDate}
                onChange={e => setExpiresDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">留空則為永久權限</p>
            </div>

            {/* 備註 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備註（選填）</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="例如：臨時支援台中分公司業務"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              取消
            </Button>
            <Button onClick={handleGrantAccess} disabled={loading}>
              {loading ? '授權中...' : '確定授權'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
