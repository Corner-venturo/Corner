'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertCircle } from 'lucide-react'
import { LABELS } from '../constants/labels'

/**
 * 跨分公司權限管理頁面
 *
 * ⚠️ 此功能已停用
 *
 * 根據 2025-11-15 的 RLS 規範決定，Venturo 不使用 RLS 和跨 workspace 權限系統。
 * 原因：
 * 1. 內部管理系統，員工都是信任的
 * 2. 簡化架構，避免 RLS 複雜度
 * 3. 提升效能，減少權限檢查開銷
 * 4. 需要彈性的跨 workspace 查詢
 *
 * 此頁面依賴的 `user_workspace_permissions` 表格未建立，也不會建立。
 */
export default function PermissionsManagementPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-morandi-gold" />
          {LABELS.CROSS_WORKSPACE_PERMISSIONS}
        </h1>
        <p className="text-muted-foreground mt-2">
          {LABELS.PERMISSIONS_MANAGEMENT_DESC}
        </p>
      </div>

      {/* Notice Card */}
      <Card className="border-morandi-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-morandi-gold">
            <AlertCircle className="w-5 h-5" />
            {LABELS.FEATURE_DISABLED}
          </CardTitle>
          <CardDescription>{LABELS.FEATURE_DISABLED_DESC}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">{LABELS.DISABLE_REASONS}</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{LABELS.DISABLE_REASON_1}</li>
              <li>{LABELS.DISABLE_REASON_2}</li>
              <li>{LABELS.DISABLE_REASON_3}</li>
              <li>{LABELS.DISABLE_REASON_4}</li>
              <li>{LABELS.DISABLE_REASON_5}</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">{LABELS.EXISTING_PERMISSIONS}</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Supabase Auth</strong> - {LABELS.AUTH_LOGIN}</li>
              <li><strong>employees.permissions</strong> - {LABELS.FUNCTION_PERMISSIONS}</li>
              <li><strong>employees.workspace_id</strong> - {LABELS.DATA_ISOLATION}</li>
              <li><strong>user.roles</strong> - {LABELS.ROLE_LABELS}</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {LABELS.REFERENCE_DOC}<code className="text-morandi-gold">{LABELS.RLS_SPEC_DOC}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
