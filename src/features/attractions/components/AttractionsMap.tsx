'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import type { Attraction } from '../types'
import type L from 'leaflet'

interface AttractionsMapProps {
  attractions: Attraction[]
  selectedAttraction: Attraction | null
  radiusKm?: number
}

// 計算兩點間距離（Haversine 公式）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function AttractionsMap({
  attractions,
  selectedAttraction,
  radiusKm = 5,
}: AttractionsMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerReady, setContainerReady] = useState(false)

  // 篩選附近景點
  useEffect(() => {
    if (!selectedAttraction?.latitude || !selectedAttraction?.longitude) {
      setNearbyAttractions([])
      return
    }

    const nearby = attractions.filter((a) => {
      if (!a.latitude || !a.longitude) return false
      if (a.id === selectedAttraction.id) return false
      const distance = calculateDistance(
        selectedAttraction.latitude!,
        selectedAttraction.longitude!,
        a.latitude,
        a.longitude
      )
      return distance <= radiusKm
    })

    setNearbyAttractions(nearby)
  }, [selectedAttraction, attractions, radiusKm])

  // 初始化地圖
  useEffect(() => {
    if (!containerReady || !containerRef.current || !selectedAttraction?.latitude || !selectedAttraction?.longitude) {
      return
    }

    const initMap = async () => {
      setIsLoading(true)
      const L = (await import('leaflet')).default

      // 清理舊地圖
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // 創建地圖
      const map = L.map(containerRef.current!, {
        center: [selectedAttraction.latitude!, selectedAttraction.longitude!],
        zoom: 14,
        zoomControl: false,
        attributionControl: false, // 隱藏 attribution，更乾淨
      })

      // 簡潔淺色底圖
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map

      setTimeout(() => map.invalidateSize(), 100)

      // 簡單圓點標記
      const createDot = (isMain: boolean) => {
        const size = isMain ? 14 : 8
        const color = isMain ? '#dc2626' : '#2563eb'
        return L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      // 主景點（紅點）
      const mainMarker = L.marker(
        [selectedAttraction.latitude!, selectedAttraction.longitude!],
        { icon: createDot(true) }
      ).addTo(map)

      mainMarker.bindTooltip(selectedAttraction.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -8],
        className: 'map-tooltip-main',
      })

      // 附近景點（藍點）- 只顯示最多 6 個
      const limitedNearby = nearbyAttractions.slice(0, 6)
      limitedNearby.forEach((attraction) => {
        if (!attraction.latitude || !attraction.longitude) return

        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon: createDot(false),
        }).addTo(map)

        // hover 才顯示名稱
        marker.bindTooltip(attraction.name, {
          direction: 'top',
          offset: [0, -6],
          className: 'map-tooltip',
        })
      })

      setIsLoading(false)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [selectedAttraction, nearbyAttractions, radiusKm, containerReady])

  // 沒有選中景點
  if (!selectedAttraction) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <MapPin size={40} className="mb-3 opacity-40" />
        <p className="text-sm">選擇景點查看位置</p>
      </div>
    )
  }

  // 沒有座標
  if (!selectedAttraction.latitude || !selectedAttraction.longitude) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Navigation size={40} className="mb-3 opacity-40" />
        <p className="text-sm">此景點尚無座標</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-slate-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}
      <div
        ref={(node) => {
          containerRef.current = node
          if (node && !containerReady) setContainerReady(true)
        }}
        className="absolute inset-0"
      />
      {/* 簡潔的附近景點計數 */}
      {nearbyAttractions.length > 0 && (
        <div className="absolute bottom-3 left-3 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
          附近 {nearbyAttractions.length} 景點
        </div>
      )}
    </div>
  )
}
