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

// 計算兩點間距離
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([])
  const initedRef = useRef(false)

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

    console.log('[AttractionsMap] 附近景點:', nearby.length)
    setNearbyAttractions(nearby)
  }, [selectedAttraction, attractions, radiusKm])

  // 初始化地圖
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      console.log('[AttractionsMap] 容器不存在')
      return
    }
    if (!selectedAttraction?.latitude || !selectedAttraction?.longitude) {
      console.log('[AttractionsMap] 沒有座標')
      return
    }

    // 防止重複初始化
    if (initedRef.current && mapRef.current) {
      // 只更新中心點
      mapRef.current.setView([selectedAttraction.latitude, selectedAttraction.longitude], 14)
      return
    }

    const initMap = async () => {
      console.log('[AttractionsMap] 開始初始化地圖')
      setIsLoading(true)

      const L = (await import('leaflet')).default

      // 清理舊地圖
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // 創建地圖 - 明確啟用拖曳
      const map = L.map(container, {
        center: [selectedAttraction.latitude!, selectedAttraction.longitude!],
        zoom: 14,
        dragging: true,        // 明確啟用拖曳
        touchZoom: true,       // 觸控縮放
        scrollWheelZoom: true, // 滾輪縮放
        doubleClickZoom: true, // 雙擊縮放
        boxZoom: true,
        keyboard: true,
        zoomControl: true,     // 顯示縮放控制
      })

      // 標準 OpenStreetMap 圖層
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OSM',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      initedRef.current = true

      // 延遲讓地圖正確顯示
      setTimeout(() => {
        map.invalidateSize()
        console.log('[AttractionsMap] invalidateSize 完成')
      }, 200)

      // 創建更明顯的標記
      const createIcon = (color: string, size: number) => {
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            "></div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      // 主景點標記（大紅點）
      console.log('[AttractionsMap] 添加主標記:', selectedAttraction.name)
      const mainMarker = L.marker(
        [selectedAttraction.latitude!, selectedAttraction.longitude!],
        { icon: createIcon('#dc2626', 20) }
      ).addTo(map)

      // 主景點名稱 tooltip（永遠顯示）
      mainMarker.bindTooltip(selectedAttraction.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -12],
        className: 'main-marker-tooltip',
      })

      // 附近景點標記（藍點）
      console.log('[AttractionsMap] 附近景點數量:', nearbyAttractions.length)
      nearbyAttractions.slice(0, 8).forEach((attraction) => {
        if (!attraction.latitude || !attraction.longitude) return

        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon: createIcon('#3b82f6', 12),
        }).addTo(map)

        // hover 顯示名稱
        marker.bindTooltip(attraction.name, {
          direction: 'top',
          offset: [0, -8],
          className: 'nearby-marker-tooltip',
        })
      })

      setIsLoading(false)
      console.log('[AttractionsMap] 地圖初始化完成')
    }

    initMap()

    return () => {
      // 不在這裡清理，讓地圖保持
    }
  }, [selectedAttraction?.id, selectedAttraction?.latitude, selectedAttraction?.longitude, nearbyAttractions])

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        initedRef.current = false
      }
    }
  }, [])

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
    <div className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[2000]">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {nearbyAttractions.length > 0 && (
        <div className="absolute bottom-3 left-3 text-xs bg-white px-2 py-1 rounded shadow z-[1000]">
          附近 {nearbyAttractions.length} 個景點
        </div>
      )}
    </div>
  )
}
