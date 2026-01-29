'use client'

import TourPage from '@/components/TourPage'

export function TourPreview({
  data,
  viewMode = 'desktop',
}: {
  /** 🔧 技術債：同 TourPage.data，待統一類型 */
  data: any
  viewMode?: 'desktop' | 'mobile'
}) {
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
