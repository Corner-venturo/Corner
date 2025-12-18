'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import type { Attraction } from '../types'
import type L from 'leaflet'

interface AttractionsMapProps {
  attractions: Attraction[]
  selectedAttraction: Attraction | null
  onSelectAttraction?: (attraction: Attraction) => void
  radiusKm?: number
}

// 計算兩點間距離（Haversine 公式）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球半徑（公里）
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
  onSelectAttraction,
  radiusKm = 5,
}: AttractionsMapProps) {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([])

  // Callback ref 來確保容器準備好
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const setMapContainerRef = (node: HTMLDivElement | null) => {
    mapContainerRef.current = node
    setMapContainer(node)
  }

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
    console.log('[AttractionsMap] useEffect 觸發, selectedAttraction:', selectedAttraction?.name, 'lat:', selectedAttraction?.latitude, 'lng:', selectedAttraction?.longitude)
    console.log('[AttractionsMap] mapContainer:', mapContainer)

    if (!mapContainerRef.current || !selectedAttraction?.latitude || !selectedAttraction?.longitude) {
      console.log('[AttractionsMap] 條件不滿足，返回')
      return
    }

    const initMap = async () => {
      console.log('[AttractionsMap] 開始初始化地圖')
      setIsLoading(true)

      // 動態載入 Leaflet（避免 SSR 問題）
      const L = (await import('leaflet')).default

      // 清理舊地圖
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // 創建新地圖
      const map = L.map(mapContainerRef.current!, {
        center: [selectedAttraction.latitude!, selectedAttraction.longitude!],
        zoom: 14,
      })

      // 添加 OpenStreetMap 圖層
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      mapRef.current = map

      // 確保地圖正確填滿容器（延遲執行以等待 DOM 完成渲染）
      setTimeout(() => {
        map.invalidateSize()
      }, 100)

      // 清理舊標記
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // 修正 Leaflet 預設圖示路徑問題
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // 創建帶圖片和名稱的標記函數
      const createMarkerIcon = (name: string, thumbnail: string | undefined, isSelected: boolean) => {
        const borderColor = isSelected ? '#ef4444' : '#3b82f6'
        const bgColor = isSelected ? '#fef2f2' : '#eff6ff'
        const size = isSelected ? 80 : 70

        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: ${size}px;
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translateX(-50%);
            ">
              <div style="
                width: ${size}px;
                height: ${size * 0.6}px;
                border-radius: 8px;
                overflow: hidden;
                border: 3px solid ${borderColor};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                background: ${bgColor};
              ">
                ${thumbnail
                  ? `<img src="${thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${bgColor};">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${borderColor}" stroke-width="2">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>`
                }
              </div>
              <div style="
                margin-top: 4px;
                padding: 2px 6px;
                background: ${borderColor};
                color: white;
                font-size: 11px;
                font-weight: 600;
                border-radius: 4px;
                white-space: nowrap;
                max-width: ${size + 20}px;
                overflow: hidden;
                text-overflow: ellipsis;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">${name}</div>
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${borderColor};
              "></div>
            </div>
          `,
          iconSize: [size, size + 40],
          iconAnchor: [size / 2, size + 40],
          popupAnchor: [0, -(size + 30)],
        })
      }

      // 添加選中景點標記
      const selectedMarker = L.marker(
        [selectedAttraction.latitude!, selectedAttraction.longitude!],
        { icon: createMarkerIcon(selectedAttraction.name, selectedAttraction.thumbnail, true) }
      ).addTo(map)

      markersRef.current.push(selectedMarker)

      // 添加附近景點標記
      nearbyAttractions.forEach((attraction) => {
        if (!attraction.latitude || !attraction.longitude) return

        const distance = calculateDistance(
          selectedAttraction.latitude!,
          selectedAttraction.longitude!,
          attraction.latitude,
          attraction.longitude
        ).toFixed(1)

        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon: createMarkerIcon(attraction.name, attraction.thumbnail, false),
        })
          .addTo(map)
          .bindPopup(
            `<div style="text-align: center; min-width: 120px;">
              <strong style="font-size: 14px;">${attraction.name}</strong>
              <p style="font-size: 12px; color: #666; margin: 4px 0;">${distance} km</p>
            </div>`
          )

        marker.on('click', () => {
          onSelectAttraction?.(attraction)
        })

        markersRef.current.push(marker)
      })

      // 繪製 5 公里範圍圓圈
      L.circle([selectedAttraction.latitude!, selectedAttraction.longitude!], {
        radius: radiusKm * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map)

      setIsLoading(false)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [selectedAttraction, nearbyAttractions, radiusKm, onSelectAttraction, mapContainer])

  // 沒有選中景點或沒有座標時的提示畫面
  if (!selectedAttraction) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <MapPin size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">選擇一個景點</p>
        <p className="text-sm mt-1">在左側列表中選擇景點以查看地圖</p>
      </div>
    )
  }

  if (!selectedAttraction.latitude || !selectedAttraction.longitude) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Navigation size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">此景點尚無座標</p>
        <p className="text-sm mt-1">請先編輯景點並添加經緯度</p>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      )}
      <div ref={setMapContainerRef} className="absolute inset-0" />
      {/* 附近景點數量提示 */}
      {nearbyAttractions.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md z-[1000]">
          <span className="text-sm font-medium text-slate-700">
            {radiusKm} 公里內有 <span className="text-blue-600">{nearbyAttractions.length}</span> 個景點
          </span>
        </div>
      )}
    </div>
  )
}
