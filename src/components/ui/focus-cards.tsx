'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

type CardType = {
  title: string
  src: string
}

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    viewMode,
  }: {
    card: CardType
    index: number
    hovered: number | null
    setHovered: React.Dispatch<React.SetStateAction<number | null>>
    viewMode?: 'desktop' | 'mobile'
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'group relative overflow-hidden transition-all duration-500 ease-out',
        viewMode === 'mobile'
          ? 'h-96 w-80 flex-shrink-0 rounded-3xl shadow-lg'
          : 'rounded-3xl aspect-[4/3] w-full bg-gray-100 dark:bg-neutral-900 shadow-xl',
        hovered !== null &&
          hovered !== index &&
          viewMode !== 'mobile' &&
          'blur-[1px] scale-[0.98] opacity-80'
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
      {/* 手機版：標題直接顯示 */}
      {viewMode === 'mobile' ? (
        <div className="absolute bottom-0 left-0 right-0 py-6 px-6">
          <div className="text-xl font-semibold text-white tracking-wide">{card.title}</div>
        </div>
      ) : (
        // 桌面版：hover 顯示
        <div
          className={cn(
            'absolute inset-0 flex items-end py-8 px-6 transition-opacity duration-300',
            hovered === index ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="text-2xl font-semibold text-white drop-shadow-lg">{card.title}</div>
        </div>
      )}
    </div>
  )
)

Card.displayName = 'Card'

type Card = {
  title: string
  src: string
}

export function FocusCards({
  cards,
  viewMode,
}: {
  cards: Card[]
  viewMode?: 'desktop' | 'mobile'
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div
      className={
        viewMode === 'mobile'
          ? 'overflow-x-auto -mx-4 px-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto md:px-8 w-full'
      }
    >
      <div className={viewMode === 'mobile' ? 'flex gap-4 pb-4' : 'contents'}>
        {cards.map((card, index) => (
          <Card
            key={card.title}
            card={card}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  )
}
