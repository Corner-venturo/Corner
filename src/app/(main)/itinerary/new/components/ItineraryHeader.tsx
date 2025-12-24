'use client'

import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { PublishButton } from '@/components/editor/PublishButton'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import type { LocalTourData } from '../hooks/useItineraryEditor'
import type { ItineraryVersionRecord } from '@/stores/types'

interface ItineraryHeaderProps {
  tourData: LocalTourData
  itineraryId: string | null
  currentVersionIndex: number
  onVersionChange: (index: number, versionData?: ItineraryVersionRecord) => void
  onVersionRecordsChange: (versionRecords: ItineraryVersionRecord[]) => void
  onBack: () => void
  onPrintA5?: () => void
}

export function ItineraryHeader({
  tourData,
  itineraryId,
  currentVersionIndex,
  onVersionChange,
  onVersionRecordsChange,
  onBack,
  onPrintA5,
}: ItineraryHeaderProps) {
  return (
    <ResponsiveHeader
      title={tourData.tourCode ? `編輯行程 - ${tourData.tourCode}` : '新增網頁行程'}
      breadcrumb={[
        { label: '首頁', href: '/' },
        { label: '行程管理', href: '/itinerary' },
        { label: tourData.tourCode ? `編輯 - ${tourData.tourCode}` : '新增網頁行程', href: '#' },
      ]}
      showBackButton={true}
      onBack={onBack}
      actions={
        <div className="flex items-center gap-3">
          {itineraryId && onPrintA5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintA5}
              className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
            >
              <BookOpen size={16} className="mr-1" />
              A5 手冊
            </Button>
          )}
          <PublishButton
            data={{ ...tourData, id: itineraryId || undefined, version_records: tourData.version_records }}
            currentVersionIndex={currentVersionIndex}
            onVersionChange={onVersionChange}
            onVersionRecordsChange={onVersionRecordsChange}
          />
        </div>
      }
    />
  )
}
