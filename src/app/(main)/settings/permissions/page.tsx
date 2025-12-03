'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertCircle } from 'lucide-react'

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
          跨分公司權限管理
        </h1>
        <p className="text-muted-foreground mt-2">
          管理員工的跨分公司資料存取權限
        </p>
      </div>

      {/* Notice Card */}
      <Card className="border-morandi-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-morandi-gold">
            <AlertCircle className="w-5 h-5" />
            功能已停用
          </CardTitle>
          <CardDescription>此功能已根據系統架構決策停用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">停用原因：</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Venturo 是內部管理系統，員工都是信任的</li>
              <li>簡化架構，避免 RLS (Row Level Security) 帶來的複雜度</li>
              <li>提升效能，減少每次查詢的權限檢查開銷</li>
              <li>主管可能需要跨 workspace 查詢資料</li>
              <li>專注於業務邏輯開發，不處理資料庫層權限</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">現有權限控制方式：</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Supabase Auth</strong> - 登入驗證</li>
              <li><strong>employees.permissions</strong> - 功能權限控制（查看人資設定）</li>
              <li><strong>employees.workspace_id</strong> - 資料隔離（前端 filter）</li>
              <li><strong>user.roles</strong> - 角色標籤（admin, tour_leader 等）</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              參考文檔：<code className="text-morandi-gold">CLAUDE.md - RLS 規範</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
