'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ItineraryEditPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    // 重新導向到新增頁面，帶上 itinerary_id 參數來載入既有的行程資料
    router.replace(`/itinerary/new?itinerary_id=${slug}`)
  }, [slug, router])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-morandi-secondary">載入中...</div>
    </div>
  )
}
