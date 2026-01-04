'use client'

import { Suspense } from 'react'
import { BrochureEditor } from '@/features/itinerary/components/brochure-designer/editor'
import { Loader2 } from 'lucide-react'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-morandi-gold" />
        </div>
      }
    >
      <BrochureEditor />
    </Suspense>
  )
}
