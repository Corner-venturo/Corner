/**
 * Corner Travel 完整手冊元件
 * 
 * 自動組合所有頁面：封底/封面、目錄、每日行程、注意事項
 */
'use client'

import { BackCover } from './BackCover'
import { FrontCover } from './FrontCover'
import { TocLeft } from './TocLeft'
import { TocRight } from './TocRight'
import { DailyLeft } from './DailyLeft'
import { DailyRight } from './DailyRight'
import { MemoLeft } from './MemoLeft'
import { MemoRight } from './MemoRight'
import type { BrochureData } from './types'
import { A5_WIDTH_MM, A5_HEIGHT_MM } from './styles'

interface BrochureProps {
  data: BrochureData
  /** 每日行程的景點圖片 */
  dailyImages?: string[]
  /** 是否顯示為跨頁（印刷用） */
  spread?: boolean
  className?: string
}

interface PagePair {
  left: React.ReactNode
  right: React.ReactNode
}

export function Brochure({ data, dailyImages = [], spread = false, className }: BrochureProps) {
  const dailyItineraries = data.dailyItineraries || []
  
  // 組合所有跨頁
  const pagePairs: PagePair[] = []
  let pageNumber = 1
  
  // 封面跨頁
  pagePairs.push({
    left: <BackCover data={data} />,
    right: <FrontCover data={data} />,
  })
  pageNumber += 2
  
  // 目錄跨頁
  pagePairs.push({
    left: <TocLeft data={data} />,
    right: <TocRight data={data} pageNumber={pageNumber} />,
  })
  pageNumber += 2
  
  // 每日行程跨頁
  dailyItineraries.forEach((day, index) => {
    pagePairs.push({
      left: (
        <DailyLeft
          data={data}
          day={day}
          dayIndex={index}
          pageNumber={pageNumber}
        />
      ),
      right: (
        <DailyRight
          data={data}
          day={day}
          dayIndex={index}
          attractionImage={dailyImages[index]}
          pageNumber={pageNumber + 1}
        />
      ),
    })
    pageNumber += 2
  })
  
  // 注意事項跨頁
  pagePairs.push({
    left: <MemoLeft data={data} pageNumber={pageNumber} />,
    right: <MemoRight data={data} pageNumber={pageNumber + 1} />,
  })
  
  // 跨頁模式（印刷用）
  if (spread) {
    return (
      <div className={className}>
        {pagePairs.map((pair, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              width: `${A5_WIDTH_MM * 2}mm`,
              height: `${A5_HEIGHT_MM}mm`,
              marginBottom: '4mm',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {pair.left}
            {pair.right}
          </div>
        ))}
      </div>
    )
  }
  
  // 單頁模式（預覽用）
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4mm',
      }}
    >
      {pagePairs.flatMap((pair, index) => [
        <div
          key={`${index}-left`}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          {pair.left}
        </div>,
        <div
          key={`${index}-right`}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          {pair.right}
        </div>,
      ])}
    </div>
  )
}
