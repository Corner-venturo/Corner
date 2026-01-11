'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { TourPreview } from '@/components/editor/TourPreview'
import { Sparkles, Building2, UtensilsCrossed, Calendar, Plane, MapPin } from 'lucide-react'
import type { LocalTourData } from '../hooks/useItineraryEditor'

interface ItineraryPreviewProps {
  tourData: LocalTourData
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  IconBuilding: Building2,
  IconToolsKitchen2: UtensilsCrossed,
  IconSparkles: Sparkles,
  IconCalendar: Calendar,
  IconPlane: Plane,
  IconMapPin: MapPin,
}

export function ItineraryPreview({ tourData }: ItineraryPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const mobileContentRef = useRef<HTMLDivElement>(null)

  const scale = viewMode === 'mobile' ? 0.7 : 0.5

  // Convert icon strings to components for preview
  const processedData = useMemo(
    () => ({
      ...tourData,
      features: (tourData.features || []).map((f) => ({
        ...f,
        iconComponent: iconMap[f.icon] || Sparkles,
      })),
    }),
    [tourData]
  )

  // 切換到手機模式時，滾動到標題區域
  useEffect(() => {
    if (viewMode === 'mobile' && mobileContentRef.current) {
      setTimeout(() => {
        if (mobileContentRef.current) {
          const heroHeight = window.innerHeight * 0.7
          mobileContentRef.current.scrollTop = heroHeight - 400
        }
      }, 100)
    }
  }, [viewMode])

  return (
    <div className="w-1/2 bg-card flex flex-col">
      {/* 標題列 */}
      <div className="h-14 bg-card border-b px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-morandi-primary">即時預覽</h2>
          <div className="flex gap-2 bg-morandi-container/30 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-morandi-gold text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
              }`}
            >
              💻 電腦
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-morandi-gold text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
              }`}
            >
              📱 手機
            </button>
          </div>
        </div>
      </div>

      {/* 預覽容器 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="w-full h-full flex items-center justify-center">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            {viewMode === 'mobile' ? (
              <div className="relative">
                <div className="bg-black rounded-[45px] p-[8px] shadow-lg">
                  <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-black w-[120px] h-[34px] rounded-full"></div>
                  </div>

                  <div
                    className="bg-card rounded-[37px] overflow-hidden relative"
                    style={{
                      width: '390px',
                      height: '844px',
                    }}
                  >
                    <div
                      className="w-full h-full overflow-y-auto"
                      ref={mobileContentRef}
                      style={{
                        scrollBehavior: 'smooth',
                      }}
                    >
                      <TourPreview data={processedData} viewMode="mobile" />
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                      <div className="w-32 h-1 bg-border rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="bg-card shadow-lg rounded-lg overflow-hidden"
                style={{
                  width: '1200px',
                  height: '800px',
                }}
              >
                <div className="w-full h-full overflow-y-auto">
                  <TourPreview data={processedData} viewMode="desktop" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
