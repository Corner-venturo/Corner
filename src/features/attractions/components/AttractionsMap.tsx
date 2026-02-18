'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import type { Attraction } from '../types'
import type L from 'leaflet'
import { ATTRACTIONS_LABELS, ATTRACTIONS_MAP_LABELS } from './constants/labels'
import { logger } from '@/lib/utils/logger'

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

// Morandi 配色
function getCategoryColor(category?: string): string {
  switch (category) {
    case '神社寺廟': return '#E8C4C4'
    case '自然景觀': return '#A8BFA6'
    case '歷史古蹟': return '#D4C4A8'
    case '主題樂園': return '#C4B8E0'
    case '美術館': return '#A5BCCD'
    case '購物': return '#E8D4C4'
    default: return '#CFB9A5'
  }
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

    setNearbyAttractions(nearby)
  }, [selectedAttraction, attractions, radiusKm])

  // 初始化地圖
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!selectedAttraction?.latitude || !selectedAttraction?.longitude) return

    // 防止重複初始化
    if (initedRef.current && mapRef.current) {
      mapRef.current.setView([selectedAttraction.latitude, selectedAttraction.longitude], 14)
      return
    }

    const initMap = async () => {
      setIsLoading(true)
      const L = (await import('leaflet')).default

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // 創建地圖 - 隱藏縮放控制，確保可拖曳
      const map = L.map(container, {
        center: [selectedAttraction.latitude!, selectedAttraction.longitude!],
        zoom: 14,
        zoomControl: false,  // 隱藏縮放控制
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        keyboard: true,
      })

      // CartoDB Positron 淺色底圖
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      initedRef.current = true

      setTimeout(() => map.invalidateSize(), 200)

      // 搜尋範圍圓圈（虛線）
      L.circle([selectedAttraction.latitude!, selectedAttraction.longitude!], {
        radius: radiusKm * 1000,
        color: '#94A3B8',
        fillColor: '#94A3B8',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '8, 8',
      }).addTo(map)

      // 創建自訂標記（圓角方形 + 圖片）
      const createMarkerIcon = (attraction: Attraction, isMain: boolean) => {
        const color = isMain ? '#dc2626' : getCategoryColor(attraction.category)
        const size = isMain ? 44 : 36
        const imgSize = isMain ? 36 : 28
        const img = attraction.thumbnail || ''

        return L.divIcon({
          className: 'custom-attraction-marker',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: ${color};
              border: 3px solid white;
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            ">
              ${img ? `
                <img
                  src="${img}"
                  style="width: ${imgSize}px; height: ${imgSize}px; object-fit: cover; border-radius: 6px;"
                  onerror="this.style.display='none'"
                />
              ` : `
                <div style="
                  width: ${imgSize}px;
                  height: ${imgSize}px;
                  background: rgba(255,255,255,0.3);
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: ${isMain ? 16 : 12}px;
                ">📍</div>
              `}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      // 主景點標記
      const mainMarker = L.marker(
        [selectedAttraction.latitude!, selectedAttraction.longitude!],
        { icon: createMarkerIcon(selectedAttraction, true) }
      ).addTo(map)

      mainMarker.bindTooltip(selectedAttraction.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -24],
        className: 'main-marker-tooltip',
      })

      // 附近景點標記
      nearbyAttractions.slice(0, 8).forEach((attraction) => {
        if (!attraction.latitude || !attraction.longitude) return

        const distance = calculateDistance(
          selectedAttraction.latitude!,
          selectedAttraction.longitude!,
          attraction.latitude,
          attraction.longitude
        ).toFixed(1)

        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon: createMarkerIcon(attraction, false),
        }).addTo(map)

        // hover 顯示名稱
        marker.bindTooltip(attraction.name, {
          direction: 'top',
          offset: [0, -20],
          className: 'nearby-marker-tooltip',
        })

        // 點擊顯示詳細資訊
        marker.bindPopup(`
          <div style="min-width: 180px; padding: 4px;">
            ${attraction.thumbnail ? `
              <img src="${attraction.thumbnail}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
            ` : ''}
            <div style="font-weight: 600; font-size: 14px; color: #334155;">${attraction.name}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
              ${attraction.category || ''} · ${distance} km
            </div>
            ${attraction.description ? `
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; line-height: 1.4;">
                ${attraction.description.slice(0, 80)}${attraction.description.length > 80 ? '...' : ''}
              </div>
            ` : ''}
          </div>
        `, {
          closeButton: true,
          className: 'attraction-popup',
        })
      })

      setIsLoading(false)
    }

    initMap().catch((err) => logger.error('[initMap]', err))

    return () => {}
  }, [selectedAttraction?.id, selectedAttraction?.latitude, selectedAttraction?.longitude, nearbyAttractions, radiusKm])

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

  if (!selectedAttraction) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-morandi-secondary">
        <MapPin size={40} className="mb-3 opacity-40" />
        <p className="text-sm">{ATTRACTIONS_LABELS.SELECT_2958}</p>
      </div>
    )
  }

  if (!selectedAttraction.latitude || !selectedAttraction.longitude) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-morandi-secondary">
        <Navigation size={40} className="mb-3 opacity-40" />
        <p className="text-sm">{ATTRACTIONS_LABELS.EMPTY_8357}</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-[2000]">
          <Loader2 size={24} className="animate-spin text-morandi-secondary" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      {nearbyAttractions.length > 0 && (
        <div className="absolute bottom-3 left-3 text-xs bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-[1000] text-morandi-primary">
          {radiusKm}{ATTRACTIONS_MAP_LABELS.NEARBY_PREFIX}{nearbyAttractions.length}{ATTRACTIONS_MAP_LABELS.NEARBY_SUFFIX}
        </div>
      )}
    </div>
  )
}
