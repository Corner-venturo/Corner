import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Building2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PermissionManagementSettings() {
  const router = useRouter()

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-morandi-gold" />
        <h2 className="text-xl font-semibold">權限管理</h2>
      </div>

      <div className="space-y-4">
        {/* Workspace 管理 */}
        <div className="p-6 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-morandi-blue" />
                <h3 className="font-medium">分公司管理</h3>
              </div>
              <p className="text-sm text-morandi-secondary mb-3">
                管理所有分公司（台北、台中等），建立新分公司、查看員工分佈
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push('/settings/workspaces')}
              className="ml-4 gap-2"
            >
              <span>管理分公司</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 跨分公司權限 */}
        <div className="p-6 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-morandi-gold" />
                <h3 className="font-medium">跨分公司權限</h3>
              </div>
              <p className="text-sm text-morandi-secondary mb-3">
                授權管理員查看或管理其他分公司的資料（例如：台北管理員可查看台中的旅遊團）
              </p>

              {/* 功能說明 */}
              <div className="mt-3 p-3 bg-morandi-container/20 rounded-lg text-xs text-morandi-muted space-y-1">
                <p>✓ 授權特定員工跨分公司查看資料</p>
                <p>✓ 設定不同權限等級（查看、編輯、刪除、財務）</p>
                <p>✓ 設定權限過期時間（可選）</p>
                <p>✓ 隨時撤銷權限</p>
              </div>
            </div>

            <Button
              variant="default"
              onClick={() => router.push('/settings/permissions')}
              className="ml-4 gap-2 bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              <Shield className="h-4 w-4" />
              <span>權限設定</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
