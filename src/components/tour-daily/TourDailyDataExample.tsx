/**
 * TourDailyDataExample
 * 
 * useTourDailyData hook 範例使用
 * 用於測試和示範 hook 的功能
 */

'use client'

import React from 'react'
import { useTourDailyData } from '@/hooks/useTourDailyData'
import { Card } from '@/components/ui/card'

interface TourDailyDataExampleProps {
  tourId: string
}

export function TourDailyDataExample({ tourId }: TourDailyDataExampleProps) {
  const {
    days,
    totalDays,
    isLoading,
    error,
    getTotalCost,
  } = useTourDailyData(tourId)

  // 載入中
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
        <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  // 錯誤
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">
          載入失敗：{error.message}
        </p>
      </div>
    )
  }

  // 無資料
  if (totalDays === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-blue-800">
          此旅遊團尚無行程資料
        </p>
      </div>
    )
  }

  const { estimated, actual } = getTotalCost()

  return (
    <div className="space-y-6">
      {/* 統計資訊 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">行程統計</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">總天數</div>
            <div className="text-2xl font-bold">{totalDays}</div>
          </div>
          <div>
            <div className="text-muted-foreground">預估成本</div>
            <div className="text-2xl font-bold">
              NT$ {estimated.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">實際成本</div>
            <div className="text-2xl font-bold">
              NT$ {actual.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* 每日資料 */}
      <div className="space-y-4">
        <h3 className="font-semibold">每日行程</h3>
        
        {days.map(day => (
          <Card key={day.day} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-lg">{day.dayLabel}</h4>
                <p className="text-sm text-muted-foreground">{day.title}</p>
              </div>
              {day.isHidden && (
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  隱藏
                </span>
              )}
            </div>

            {day.highlight && (
              <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-sm">✨ {day.highlight}</p>
              </div>
            )}

            {day.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {day.description}
              </p>
            )}

            {/* 項目統計 */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-muted-foreground">住宿</div>
                <div className="font-semibold">
                  {day.accommodations.length}
                </div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-muted-foreground">餐食</div>
                <div className="font-semibold">
                  {day.meals.length}
                </div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="text-muted-foreground">行程</div>
                <div className="font-semibold">
                  {day.activities.length}
                </div>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <div className="text-muted-foreground">交通</div>
                <div className="font-semibold">
                  {day.transportation.length}
                </div>
              </div>
            </div>

            {/* 成本 */}
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">預估成本：</span>
              <span className="font-semibold">
                NT$ {day.totalEstimatedCost.toLocaleString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
