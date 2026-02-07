'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useTourDetails } from '@/features/tours/hooks/useTours-advanced'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { TOUR_TABS, TourTabContent } from '@/components/tours/TourTabs'

export default function TourDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string

  const { channels, currentWorkspace } = useWorkspaceChannels()

  // 狀態
  const [tourId, setTourId] = useState<string | null>(null)
  const [loadingTourId, setLoadingTourId] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'members')
  const [forceShowPnr, setForceShowPnr] = useState(false)

  // 用 code 查詢 tour_id
  useEffect(() => {
    async function fetchTourId() {
      setLoadingTourId(true)
      const { data, error } = await supabase
        .from('tours')
        .select('id')
        .eq('code', code)
        .single()

      if (error || !data) {
        setTourId(null)
      } else {
        setTourId(data.id)
      }
      setLoadingTourId(false)
    }

    if (code) {
      fetchTourId()
    }
  }, [code])

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
          title="載入中..."
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
          title="找不到旅遊團"
          icon={MapPin}
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' },
            { label: code, href: `/tours/${code}` },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-morandi-secondary mb-4">找不到團號 {code} 的旅遊團</p>
            <Button onClick={handleBack}>返回列表</Button>
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
                頻道
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
