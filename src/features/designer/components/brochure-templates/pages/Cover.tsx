'use client'
/**
 * 封面頁
 */

import { Page } from '../primitives/Page'
import { Text } from '../primitives/Text'
import { Image } from '../primitives/Image'
import { Divider } from '../primitives/Divider'
import type { PageProps, PageSize } from '../types'

interface CoverProps extends PageProps {
  variant?: 'full' | 'arch'  // full = 滿版圖片, arch = 圓拱形（日系）
}

export function Cover({
  data,
  theme,
  size,
  variant = 'full',
  className,
}: CoverProps) {
  const isArch = variant === 'arch'

  return (
    <Page theme={theme} size={size} className={className}>
      {/* 公司名稱 */}
      <Text theme={theme} variant="label" align="center" style={{ marginTop: '15mm' }}>
        {data.companyName || 'Corner Travel'}
      </Text>
      <Divider theme={theme} align="center" width="50px" />

      {/* 封面圖片 */}
      {data.coverImage && (
        <div style={{ margin: '10mm auto', width: isArch ? '100mm' : '100%' }}>
          <Image
            src={data.coverImage}
            theme={theme}
            height={isArch ? '110mm' : '100mm'}
            rounded={isArch ? 'arch' : true}
          />
        </div>
      )}

      {/* 底部資訊 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: theme.spacing.page,
          right: theme.spacing.page,
          textAlign: 'center',
        }}
      >
        <Text theme={theme} variant="h2" style={{ marginBottom: '3mm' }}>
          {data.mainTitle || data.destination || '旅行手冊'}
        </Text>
        {data.subTitle && (
          <Text theme={theme} variant="body" color="muted" style={{ marginBottom: '3mm' }}>
            {data.subTitle}
          </Text>
        )}
        <Text theme={theme} variant="caption" color="muted">
          {data.travelDates}
        </Text>
      </div>
    </Page>
  )
}
