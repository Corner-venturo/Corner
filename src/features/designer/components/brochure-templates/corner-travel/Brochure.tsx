/**
 * Corner Travel 完整手冊元件
 */
'use client'

import { Cover } from './Cover'
import { Toc } from './Toc'
import { Daily } from './Daily'
import { Memo } from './Memo'
import type { BrochureData } from './types'

interface BrochureProps {
  data: BrochureData
  dailyImages?: string[]
  className?: string
}

export function Brochure({ data, dailyImages = [], className }: BrochureProps) {
  const dailyItineraries = data.dailyItineraries || []

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
      <Cover data={data} />
      <Toc data={data} pageNumber={2} />
      {dailyItineraries.map((day, i) => (
        <Daily
          key={i}
          data={data}
          day={day}
          dayIndex={i}
          attractionImage={dailyImages[i]}
          pageNumber={4 + i * 2}
        />
      ))}
      <Memo data={data} pageNumber={4 + dailyItineraries.length * 2} />
    </div>
  )
}
