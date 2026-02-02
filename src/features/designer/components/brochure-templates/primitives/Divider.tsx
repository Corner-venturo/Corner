/**
 * 分隔線元素
 */
import type { Theme } from '../types'

interface DividerProps {
  theme: Theme
  width?: string
  color?: 'accent' | 'border' | 'primary'
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function Divider({
  theme,
  width = '25mm',
  color = 'accent',
  align = 'left',
  className,
}: DividerProps) {
  const colorMap = {
    accent: theme.colors.accent,
    border: theme.colors.border,
    primary: theme.colors.primary,
  }

  const alignMap = {
    left: '0',
    center: 'auto',
    right: '0 0 0 auto',
  }

  return (
    <div
      className={className}
      style={{
        width,
        height: '2px',
        backgroundColor: colorMap[color],
        margin: alignMap[align],
        marginTop: theme.spacing.element,
        marginBottom: theme.spacing.element,
      }}
    />
  )
}
