'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useTourDetails } from '@/features/tours/hooks/useTours-advanced'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { TOUR_TABS, TourTabContent } from '@/features/tours/components/TourTabs'
import { CODE_LABELS } from './constants/labels'

const fetchTourIdByCode = async (code: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('tours')
    .select('id')
    .eq('code', code)
    .single()

  if (error || !data) return null
  return data.id
}

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string

  const { channels, currentWorkspace } = useWorkspaceChannels()

  // 用 SWR 查詢 tour_id
  const { data: tourId, isLoading: loadingTourId } = useSWR(
    code ? `tour-id-${code}` : null,
    () => fetchTourIdByCode(code)
  )
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'members')
  const [forceShowPnr, setForceShowPnr] = useState(false)

  // 載入團詳情
  const { tour, loading, actions } = useTourDetails(tourId || '')

  // 檢查是否已有工作頻道
  const existingChannel = channels.find((ch: { tour_id?: string | null }) => ch.tour_id === tour?.id)

  // 返回列表
  const handleBack = () => {
    router.push('/tours')
  }

  // 處理資料更新
  const handleSuccess = () => {
    actions.refresh()
    setForceShowPnr(true)
  }

  // 載入中
  if (loadingTourId || loading) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title={CODE_LABELS.LOADING_6912}
          icon={MapPin}
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' },
            { label: code, href: `/tours/${code}` },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-morandi-secondary" size={32} />
        </div>
      </div>
    )
  }

  // 找不到團
  if (!tour) {
    return (
      <div className="h-full flex flex-col">
        <ResponsiveHeader
          title={CODE_LABELS.NOT_FOUND_9865}
          icon={MapPin}
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' },
            { label: code, href: `/tours/${code}` },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-morandi-secondary mb-4">{CODE_LABELS.NOT_FOUND_2154} {code} 的旅遊團</p>
            <Button onClick={handleBack}>{CODE_LABELS.LABEL_5810}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={tour.name}
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '旅遊團管理', href: '/tours' },
          { label: `${tour.code} ${tour.name}`, href: `/tours/${code}` },
        ]}
        tabs={[...TOUR_TABS]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            {existingChannel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/workspace?channel=${existingChannel.id}`)}
              >
                <MessageSquare size={16} className="mr-1" />
                {CODE_LABELS.LABEL_9173}
              </Button>
            )}
          </div>
        }
      />

      {/* 內容區域 - 使用共用元件 */}
      <div className="flex-1 overflow-auto">
        <TourTabContent
          tour={tour}
          activeTab={activeTab}
          workspaceId={currentWorkspace?.id}
          forceShowPnr={forceShowPnr}
        />
      </div>
    </div>
  )
}
