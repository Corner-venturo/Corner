import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MODULE_MANAGEMENT_LABELS } from '../constants/labels'

const ModuleIcon = () => (
  <svg
    className="h-6 w-6 text-morandi-gold"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </svg>
)

export function ModuleManagementSettings() {
  const router = useRouter()

  return (
    <Card className="rounded-xl shadow-lg border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <ModuleIcon />
        <h2 className="text-xl font-semibold">{MODULE_MANAGEMENT_LABELS.TITLE}</h2>
      </div>

      <div className="space-y-6">
        <div className="p-6 border border-border rounded-lg bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="h-5 w-5 text-morandi-gold"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
                <h3 className="font-semibold text-lg">{MODULE_MANAGEMENT_LABELS.AUTH_MANAGEMENT}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {MODULE_MANAGEMENT_LABELS.MANAGE_4601}
              </p>
            </div>
            <Button
              onClick={() => router.push('/settings/modules')}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            >
              {MODULE_MANAGEMENT_LABELS.MANAGE_8355}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 p-4 bg-morandi-container/10 rounded-lg">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-morandi-gold font-medium">•</span>
                {MODULE_MANAGEMENT_LABELS.LABEL_1050}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-morandi-gold font-medium">•</span>
                {MODULE_MANAGEMENT_LABELS.SETTINGS_5976}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-morandi-gold font-medium">•</span>
                {MODULE_MANAGEMENT_LABELS.LABEL_3126}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
