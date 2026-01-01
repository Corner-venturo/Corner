'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useItineraryStore, useAuthStore } from '@/stores'
import type { TourFormData } from '@/components/editor/tour-form/types'
import type { ItineraryVersionRecord } from '@/stores/types'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'
import { alert } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'

interface PublishButtonData extends Partial<TourFormData> {
  id?: string
  status?: string
  tourId?: string
  meetingInfo?: unknown
  version_records?: ItineraryVersionRecord[]
}

interface UsePublishProps {
  data: PublishButtonData
  currentVersionIndex: number
  onVersionChange: (index: number, versionData?: ItineraryVersionRecord) => void
  onVersionRecordsChange?: (versionRecords: ItineraryVersionRecord[]) => void
}

export function usePublish({
  data,
  currentVersionIndex,
  onVersionChange,
  onVersionRecordsChange,
}: UsePublishProps) {
  const [saving, setSaving] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [copied, setCopied] = useState(false)
  const { create, update } = useItineraryStore()
  const { user } = useAuthStore()
  const router = useRouter()

  const versionRecords = data.version_records || []
  const isEditMode = !!data.id

  // 分享連結（優先使用團號，沒有則用 ID）
  const shareUrl = data.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/view/${data.tourCode || data.id}`
    : null

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
    cover_style: data.coverStyle || 'original',
    flight_style: data.flightStyle || 'original',
    itinerary_style: data.itineraryStyle || 'original',
    price: data.price || null,
    price_note: data.priceNote || null,
    country: data.country,
    city: data.city,
    status: (data.status || '提案') as '提案' | '進行中',
    outbound_flight: data.outboundFlight,
    return_flight: data.returnFlight,
    features: data.features,
    focus_cards: data.focusCards,
    leader: data.leader,
    meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
    hotels: data.hotels,
    show_features: data.showFeatures,
    show_leader_meeting: data.showLeaderMeeting,
    show_hotels: data.showHotels,
    show_pricing_details: data.showPricingDetails,
    pricing_details: data.pricingDetails,
    price_tiers: data.priceTiers || null,
    show_price_tiers: data.showPriceTiers || false,
    faqs: data.faqs || null,
    show_faqs: data.showFaqs || false,
    notices: data.notices || null,
    show_notices: data.showNotices || false,
    cancellation_policy: data.cancellationPolicy || null,
    show_cancellation_policy: data.showCancellationPolicy || false,
    itinerary_subtitle: data.itinerarySubtitle,
    daily_itinerary: data.dailyItinerary,
  })

  // 儲存（覆蓋目前版本）
  const saveItinerary = async () => {
    setSaving(true)
    try {
      const convertedData = convertData()

      if (data.id) {
        if (currentVersionIndex === -1) {
          // 更新主版本（同時更新版本 1 的資料）
          let updatedRecords = [...versionRecords]
          if (updatedRecords.length > 0) {
            updatedRecords[0] = {
              ...updatedRecords[0],
              note: stripHtml(data.title) || updatedRecords[0].note,
              daily_itinerary: data.dailyItinerary || [],
              features: data.features,
              focus_cards: data.focusCards,
              leader: data.leader,
              meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
              hotels: data.hotels,
            }
          } else {
            const firstVersion: ItineraryVersionRecord = {
              id: generateUUID(),
              version: 1,
              note: stripHtml(data.title) || '版本 1',
              daily_itinerary: data.dailyItinerary || [],
              features: data.features,
              focus_cards: data.focusCards,
              leader: data.leader,
              meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
              hotels: data.hotels,
              created_at: new Date().toISOString(),
            }
            updatedRecords = [firstVersion]
          }
          await update(data.id, { ...convertedData, version_records: updatedRecords })
          onVersionRecordsChange?.(updatedRecords)
        } else {
          const updatedRecords = [...versionRecords]
          updatedRecords[currentVersionIndex] = {
            ...updatedRecords[currentVersionIndex],
            daily_itinerary: data.dailyItinerary || [],
            features: data.features,
            focus_cards: data.focusCards,
            leader: data.leader,
            meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
            hotels: data.hotels,
          }
          await update(data.id, { version_records: updatedRecords })
          onVersionRecordsChange?.(updatedRecords)
        }
      } else {
        const firstVersion: ItineraryVersionRecord = {
          id: generateUUID(),
          version: 1,
          note: stripHtml(data.title) || '版本 1',
          daily_itinerary: data.dailyItinerary || [],
          features: data.features,
          focus_cards: data.focusCards,
          leader: data.leader,
          meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
          hotels: data.hotels,
          created_at: new Date().toISOString(),
        }

        const newItinerary = await create({
          ...convertedData,
          created_by: user?.id || undefined,
          version_records: [firstVersion],
        } as Parameters<typeof create>[0])

        if (newItinerary?.id) {
          router.replace(`/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }
    } catch (error) {
      logger.error('儲存失敗:', error)
      await alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 另存新版本
  const saveAsNewVersion = async () => {
    if (!data.id) {
      await alert('請先儲存行程表才能另存新版本', 'warning')
      return
    }

    setSaving(true)
    try {
      const newVersion: ItineraryVersionRecord = {
        id: generateUUID(),
        version: versionRecords.length + 1,
        note: versionNote || `版本 ${versionRecords.length + 1}`,
        daily_itinerary: data.dailyItinerary || [],
        features: data.features,
        focus_cards: data.focusCards,
        leader: data.leader,
        meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
        hotels: data.hotels,
        created_at: new Date().toISOString(),
      }

      const updatedRecords = [...versionRecords, newVersion]
      await update(data.id, { version_records: updatedRecords })
      onVersionRecordsChange?.(updatedRecords)

      setVersionNote('')
      onVersionChange(updatedRecords.length - 1, newVersion)
    } catch (error) {
      logger.error('另存新版本失敗:', error)
      await alert('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 另存新檔
  const saveAsNewFile = async () => {
    setSaving(true)
    try {
      const convertedData = convertData()

      const newItinerary = await create({
        ...convertedData,
        title: newFileName || `${stripHtml(data.title) || '行程表'} (複本)`,
        created_by: user?.id || undefined,
        version_records: [],
      } as Parameters<typeof create>[0])

      if (newItinerary?.id) {
        setNewFileName('')
        window.location.href = `/itinerary/new?itinerary_id=${newItinerary.id}`
      }
    } catch (error) {
      logger.error('另存新檔失敗:', error)
      await alert('另存新檔失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 複製連結
  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // 取得目前版本名稱
  const getCurrentVersionName = () => {
    if (currentVersionIndex === -1) {
      const firstVersion = versionRecords[0]
      return stripHtml(firstVersion?.note) || stripHtml(data.title) || '版本 1'
    }
    const record = versionRecords[currentVersionIndex]
    return stripHtml(record?.note) || `版本 ${record?.version || currentVersionIndex + 1}`
  }

  return {
    saving,
    versionNote,
    setVersionNote,
    newFileName,
    setNewFileName,
    copied,
    versionRecords,
    isEditMode,
    shareUrl,
    saveItinerary,
    saveAsNewVersion,
    saveAsNewFile,
    copyShareLink,
    getCurrentVersionName,
    stripHtml,
  }
}
