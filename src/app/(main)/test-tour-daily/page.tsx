/**
 * Test Page: useTourDailyData Hook
 * 
 * 用於測試 useTourDailyData hook 的功能
 * 訪問：http://localhost:3000/test-tour-daily
 */

'use client'

import React, { useState } from 'react'
import { TourDailyDataExample } from '@/components/tour-daily'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestTourDailyPage() {
  const [tourId, setTourId] = useState('740c4d09-d201-4f0a-9d25-b798d3280180') // 沖繩團 ID
  const [testTourId, setTestTourId] = useState('')

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">useTourDailyData Hook 測試</h1>
        <p className="text-muted-foreground">
          測試 tour_daily_display + tour_itinerary_items 資料組合
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">控制面板</h3>
        <div className="flex gap-2">
          <Input
            placeholder="輸入旅遊團 ID"
            value={testTourId}
            onChange={e => setTestTourId(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => setTourId(testTourId)}
            disabled={!testTourId}
          >
            載入
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          預設：740c4d09-d201-4f0a-9d25-b798d3280180（沖繩團）
        </p>
      </Card>

      {/* 資料展示 */}
      <div>
        <h3 className="font-semibold mb-3">資料展示</h3>
        <TourDailyDataExample tourId={tourId} />
      </div>
    </div>
  )
}
