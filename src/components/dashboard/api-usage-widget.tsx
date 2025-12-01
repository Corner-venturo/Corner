import { getApiUsageForCurrentMonth } from '@/app/dashboard/actions'
import { AlertTriangle, FileText } from 'lucide-react'

// Assuming a Progress component exists, similar to Shadcn/UI
import { Progress } from '@/components/ui/progress' 

interface ApiUsageWidgetProps {
  apiService: string;
  serviceDisplayName: string;
  freeTierLimit: number;
}

export async function ApiUsageWidget({ 
  apiService,
  serviceDisplayName,
  freeTierLimit 
}: ApiUsageWidgetProps) {
  
  const { count, error } = await getApiUsageForCurrentMonth(apiService)

  if (error || count === null) {
    return (
      <div className="w-full max-w-sm p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-destructive mr-3" />
          <div>
            <p className="font-semibold">{serviceDisplayName} Usage</p>
            <p className="text-sm text-destructive">Could not load data</p>
          </div>
        </div>
      </div>
    )
  }

  const percentageUsed = (count / freeTierLimit) * 100

  return (
    <div className="w-full max-w-sm p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
           <FileText className="w-5 h-5 text-muted-foreground mr-2" />
           <h4 className="font-semibold">{serviceDisplayName} OCR Usage</h4>
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          {count} / {freeTierLimit}
        </p>
      </div>
      <Progress value={percentageUsed} className="w-full" />
      <p className="text-xs text-muted-foreground mt-2">
        {count > 0 ? `${percentageUsed.toFixed(1)}% of free tier used this month.` : 'No usage this month.'}
      </p>
    </div>
  )
}
