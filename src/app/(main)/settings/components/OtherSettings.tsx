import { Card } from '@/components/ui/card'
import { OTHER_SETTINGS_LABELS } from '../constants/labels'

export function OtherSettings() {
  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <h2 className="text-xl font-semibold mb-6">{OTHER_SETTINGS_LABELS.TITLE}</h2>
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">{OTHER_SETTINGS_LABELS.LANGUAGE_SETTING}</h3>
          <p className="text-sm text-morandi-secondary">{OTHER_SETTINGS_LABELS.LANGUAGE_VALUE}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">{OTHER_SETTINGS_LABELS.NOTIFICATION_SETTING}</h3>
          <p className="text-sm text-morandi-secondary">{OTHER_SETTINGS_LABELS.NOTIFICATION_VALUE}</p>
        </div>
        <div className="p-6 border border-border rounded-lg bg-card">
          <h3 className="font-medium mb-2">{OTHER_SETTINGS_LABELS.BACKUP_SETTING}</h3>
          <p className="text-sm text-morandi-secondary">{OTHER_SETTINGS_LABELS.BACKUP_VALUE}</p>
        </div>
      </div>
    </Card>
  )
}
