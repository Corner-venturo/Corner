/**
 * QR Code 元素
 */
'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { Theme } from '../types'

interface QRCodeProps {
  value: string
  theme: Theme
  size?: number
  className?: string
}

export function QRCode({
  value,
  theme,
  size = 50,
  className,
}: QRCodeProps) {
  if (!value) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6pt',
          color: theme.colors.textMuted,
        }}
      >
        QR
      </div>
    )
  }

  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor={theme.colors.background}
      fgColor={theme.colors.text}
      className={className}
    />
  )
}
