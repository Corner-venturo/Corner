'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Loader2, X } from 'lucide-react'
import Image from 'next/image'
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
  radiusKm = 5,
}: AttractionsMapProps) {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nearbyAttractions, setNearbyAttractions] = useState<Attraction[]>([])
  const [previewAttraction, setPreviewAttraction] = useState<Attraction | null>(null)
  const [previewDistance, setPreviewDistance] = useState<string>('')

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
    // 確保容器和座標都準備好
    if (!mapContainer || !selectedAttraction?.latitude || !selectedAttraction?.longitude) {
      return
    }

    const container = mapContainerRef.current
    if (!container) return

    const initMap = async () => {
      setIsLoading(true)

      // 動態載入 Leaflet（避免 SSR 問題）
      const L = (await import('leaflet')).default

      // 清理舊地圖
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // 創建新地圖
      const map = L.map(container, {
        center: [selectedAttraction.latitude!, selectedAttraction.longitude!],
        zoom: 14,
        zoomControl: false, // 隱藏縮放控制，更簡潔
      })

      // 使用更簡潔的地圖樣式 (CartoDB Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // 添加縮放控制到右下角
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapRef.current = map

      // 確保地圖正確填滿容器
      setTimeout(() => {
        map.invalidateSize()
      }, 100)

      // 清理舊標記
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // 創建簡潔的圓點標記
      const createDotIcon = (isSelected: boolean) => {
        const size = isSelected ? 16 : 10
        const color = isSelected ? '#ef4444' : '#3b82f6'
        const borderColor = isSelected ? '#dc2626' : '#2563eb'

        return L.divIcon({
          className: '',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: ${color};
              border: 2px solid ${borderColor};
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      // 添加選中景點標記（紅色大圓點）
      const selectedMarker = L.marker(
        [selectedAttraction.latitude!, selectedAttraction.longitude!],
        { icon: createDotIcon(true) }
      ).addTo(map)

      // 選中景點的 tooltip
      selectedMarker.bindTooltip(selectedAttraction.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
        className: 'selected-tooltip',
      })

      markersRef.current.push(selectedMarker)

      // 添加附近景點標記（藍色小圓點）
      nearbyAttractions.forEach((attraction) => {
        if (!attraction.latitude || !attraction.longitude) return

        const distance = calculateDistance(
          selectedAttraction.latitude!,
          selectedAttraction.longitude!,
          attraction.latitude,
          attraction.longitude
        ).toFixed(1)

        const marker = L.marker([attraction.latitude, attraction.longitude], {
          icon: createDotIcon(false),
        }).addTo(map)

        // hover 顯示名稱
        marker.bindTooltip(attraction.name, {
          direction: 'top',
          offset: [0, -8],
        })

        // 點擊顯示詳細資訊卡（不切換選中景點）
        marker.on('click', () => {
          setPreviewAttraction(attraction)
          setPreviewDistance(distance)
        })

        markersRef.current.push(marker)
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
  }, [selectedAttraction, nearbyAttractions, radiusKm, mapContainer])

  // 關閉預覽時清除
  const closePreview = () => {
    setPreviewAttraction(null)
    setPreviewDistance('')
  }

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
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-[1000] text-xs text-slate-600">
          附近 {nearbyAttractions.length} 個景點
        </div>
      )}

      {/* 景點預覽卡片 */}
      {previewAttraction && (
        <div className="absolute top-3 right-3 w-64 bg-white rounded-xl shadow-lg z-[1000] overflow-hidden">
          {/* 關閉按鈕 */}
          <button
            onClick={closePreview}
            className="absolute top-2 right-2 p-1 bg-black/30 hover:bg-black/50 rounded-full text-white z-10"
          >
            <X size={14} />
          </button>

          {/* 圖片 */}
          {previewAttraction.thumbnail && (
            <div className="relative h-32 w-full">
              <Image
                src={previewAttraction.thumbnail}
                alt={previewAttraction.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* 資訊 */}
          <div className="p-3">
            <h4 className="font-medium text-slate-900">{previewAttraction.name}</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              距離 {previewDistance} km
            </p>
            {previewAttraction.description && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {previewAttraction.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
