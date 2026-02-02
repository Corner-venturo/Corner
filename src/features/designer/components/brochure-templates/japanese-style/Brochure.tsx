/**
 * 日系風格完整手冊
 */
'use client'

import { Cover } from './Cover'
import { Toc } from './Toc'
import { Daily } from './Daily'
import { Hotel } from './Hotel'
import { Memo } from './Memo'
import type { BrochureData } from './types'

interface BrochureProps {
  data: BrochureData
  dailyImages?: string[]
  className?: string
}

export function Brochure({ data, dailyImages = [], className }: BrochureProps) {
  const dailyItineraries = data.dailyItineraries || []
  const hotels = data.hotels || []
  let pageNum = 1

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
      <Cover data={data} />
      <Toc data={data} pageNumber={++pageNum} />
      
      {dailyItineraries.map((day, i) => (
        <Daily
          key={i}
          data={data}
          day={day}
          dayIndex={i}
          image={dailyImages[i]}
          pageNumber={++pageNum}
        />
      ))}
      
      {hotels.map((hotel, i) => (
        <Hotel key={i} data={data} hotel={hotel} pageNumber={++pageNum} />
      ))}
      
      <Memo data={data} pageNumber={++pageNum} />
    </div>
  )
}
