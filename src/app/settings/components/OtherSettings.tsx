import { Card } from '@/components/ui/card'

export function OtherSettings() {
  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <h2 className="text-xl font-semibold mb-6">其他設定</h2>
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">語言設定</h3>
          <p className="text-sm text-morandi-secondary">繁體中文（預設）</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">通知設定</h3>
          <p className="text-sm text-morandi-secondary">系統通知：開啟</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">資料備份</h3>
          <p className="text-sm text-morandi-secondary">自動備份：每日凌晨 2:00</p>
        </div>
      </div>
    </Card>
  )
}
