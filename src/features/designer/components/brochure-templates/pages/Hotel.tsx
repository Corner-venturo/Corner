'use client'
/**
 * 飯店介紹頁
 */

import { Page } from '../primitives/Page'
import { Text } from '../primitives/Text'
import { HotelCard } from '../blocks/HotelCard'
import type { PageProps, HotelInfo } from '../types'

interface HotelProps extends PageProps {
  hotel: HotelInfo
}

export function Hotel({ theme, size, hotel, pageNumber, className }: HotelProps) {
  return (
    <Page theme={theme} size={size} className={className}>
      <HotelCard theme={theme} hotel={hotel} showImage />

      {pageNumber && (
        <Text
          theme={theme}
          variant="caption"
          color="muted"
          style={{ position: 'absolute', bottom: '6mm', right: theme.spacing.page }}
        >
          {String(pageNumber).padStart(2, '0')}
        </Text>
      )}
    </Page>
  )
}
