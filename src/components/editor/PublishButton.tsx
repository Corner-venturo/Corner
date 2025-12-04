'use client'

import { useState } from 'react'
import { useItineraryStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import type { TourFormData } from './tour-form/types'
import { Button } from '@/components/ui/button'

interface PublishButtonData extends Partial<TourFormData> {
  id?: string
  version?: number
  status?: string
  tourId?: string
  meetingInfo?: unknown
}

export function PublishButton({ data }: { data: PublishButtonData }) {
  const [saving, setSaving] = useState(false)
  const { create, update } = useItineraryStore()
  const { user } = useAuthStore()
  const router = useRouter()

  // 轉換資料格式（camelCase → snake_case）
  const convertData = () => ({
    tour_id: data.tourId || undefined,
    tagline: data.tagline,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    departure_date: data.departureDate,
    tour_code: data.tourCode,
    cover_image: data.coverImage,
    country: data.country,
    city: data.city,
    status: (data.status || 'draft') as 'draft' | 'published',
    outbound_flight: data.outboundFlight,
    return_flight: data.returnFlight,
    features: data.features,
    focus_cards: data.focusCards,
    leader: data.leader,
    meeting_info: data.meetingInfo as { time: string; location: string } | undefined,  // ✅ 修正：使用 meeting_info 而非 meeting_points
    hotels: data.hotels,
    show_features: data.showFeatures,
    show_leader_meeting: data.showLeaderMeeting,
    show_hotels: data.showHotels,
    itinerary_subtitle: data.itinerarySubtitle,
    daily_itinerary: data.dailyItinerary,
  })

  // 儲存（覆蓋目前版本）
  const saveItinerary = async () => {
    setSaving(true)
    try {
      const convertedData = convertData()

      if (data.id) {
        // 更新目前版本
        await update(data.id, convertedData)
        alert('✅ 儲存成功！')
      } else {
        // 第一次建立
        const newItinerary = await create({
          ...convertedData,
          version: 1,
          is_latest: true,
        } as Parameters<typeof create>[0])
        alert('✅ 儲存行程表成功！')

        if (newItinerary?.id) {
          // 直接導向到編輯頁面，避免多次跳轉
          router.replace(`/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      alert('❌ 儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setSaving(false)
    }
  }

  // 另存新版本
  const saveAsNewVersion = async () => {
    if (!data.id) {
      alert('⚠️ 請先儲存行程表才能另存新版本')
      return
    }

    setSaving(true)
    try {
      const baseData = convertData()
      const currentVersion = data.version || 1

      // 建立新版本
      const newVersionData = {
        ...baseData,
        parent_id: data.id,
        version: currentVersion + 1,
        is_latest: true,
      }

      // 先將舊版本的 is_latest 設為 false
      await update(data.id, { is_latest: false } as Parameters<typeof update>[1])

      // 建立新版本
      const newVersion = await create(newVersionData as Parameters<typeof create>[0])
      alert(`✅ 已另存為新版本 v${currentVersion + 1}`)

      // 跳轉到新版本
      if (newVersion?.id) {
        router.replace(`/itinerary/new?itinerary_id=${newVersion.id}`)
      }
    } catch (error) {
      console.error('另存新版本失敗:', error)
      alert('❌ 另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = !!data.id

  // 產生分享連結
  const generateShareLink = () => {
    if (!data.id) {
      alert('⚠️ 請先儲存行程表才能產生連結！')
      return
    }

    // 使用當前網站的網址（會自動適配 localhost / Vercel 等環境）
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/view/${data.id}`

    // 複製到剪貼簿
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert('✅ 分享連結已複製！\n\n' + shareUrl)
      })
      .catch(err => {
        alert('❌ 複製失敗，請手動複製：\n' + shareUrl)
      })
  }

  return (
    <div className="flex items-center gap-2">
      {/* 版本號顯示 */}
      {isEditMode && data.version && (
        <span className="text-sm text-morandi-secondary font-medium">
          v{data.version}
        </span>
      )}

      {/* 儲存按鈕 */}
      <Button
        onClick={saveItinerary}
        disabled={saving}
        className="px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? '儲存中...' : isEditMode ? '💾 儲存' : '💾 儲存行程表'}
      </Button>

      {/* 另存新版本按鈕（僅編輯模式顯示） */}
      {isEditMode && (
        <>
          <Button
            onClick={saveAsNewVersion}
            disabled={saving}
            variant="default"
          >
            📋 另存為 v{(data.version || 1) + 1}
          </Button>

          <Button
            onClick={generateShareLink}
            variant="secondary"
          >
            🔗 產生連結
          </Button>

          <Button
            onClick={() => {
              // TODO: 實作歷史版本查看功能
              alert('📜 歷史版本功能開發中...')
            }}
            variant="secondary"
          >
            📜 歷史版本
          </Button>
        </>
      )}
    </div>
  )
}
