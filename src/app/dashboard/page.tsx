import { ApiUsageWidget } from '@/components/dashboard/api-usage-widget'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Widget Loader Component
function WidgetSkeleton() {
    return (
        <div className="w-full max-w-sm p-4 border rounded-lg shadow-sm bg-card text-card-foreground flex items-center justify-center h-[98px]">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    )
}


export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          An overview of your system's status and usage.
        </p>
      </header>
      
      <main className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<WidgetSkeleton />}>
           <ApiUsageWidget 
              apiService="mindee_passport_ocr"
              serviceDisplayName="Mindee Passport"
              freeTierLimit={250}
            />
        </Suspense>
        {/* You can add more widgets here as needed */}
      </main>
    </div>
  )
}
