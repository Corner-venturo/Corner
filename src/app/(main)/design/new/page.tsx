'use client'

import dynamic from 'next/dynamic'
import { DESIGNER_LABELS } from './constants/labels'

const DesignerPageContent = dynamic(
  () => import('./DesignerPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-morandi-secondary">{DESIGNER_LABELS.LOADING_DESIGN_TOOL}</p>
        </div>
      </div>
    ),
  }
)

export default function DesignerPage() {
  return <DesignerPageContent />
}
