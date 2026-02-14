'use client'

import TourPage from '@/features/tours/components/TourPage'
import type { TourPreviewProps } from '@/features/tours'

export function TourPreview({ data, viewMode = 'desktop' }: TourPreviewProps) {
  return (
    <div
      style={{
        width: viewMode === 'mobile' ? '390px' : '1200px',
        minHeight: viewMode === 'mobile' ? '844px' : '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 包裹 TourPage，確保內容不會溢出 */}
      <div className={viewMode === 'mobile' ? 'mobile-preview-wrapper' : ''}>
        <TourPage data={data} isPreview={true} viewMode={viewMode} />
      </div>
    </div>
  )
}
