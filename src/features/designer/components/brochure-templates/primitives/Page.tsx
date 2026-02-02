/**
 * 頁面容器
 */
import type { Theme, PageSize, PAGE_SIZES } from '../types'

interface PageProps {
  children: React.ReactNode
  theme: Theme
  size?: PageSize
  spread?: boolean  // 跨頁模式
  className?: string
}

export function Page({
  children,
  theme,
  size = { width: 148, height: 210, name: 'A5' },
  spread = false,
  className,
}: PageProps) {
  return (
    <div
      className={className}
      style={{
        width: spread ? `${size.width * 2}mm` : `${size.width}mm`,
        height: `${size.height}mm`,
        padding: theme.spacing.page,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: spread ? 'flex' : 'block',
      }}
    >
      {children}
    </div>
  )
}

// 跨頁內的左/右頁容器
export function PageHalf({
  children,
  side,
  theme,
  className,
}: {
  children: React.ReactNode
  side: 'left' | 'right'
  theme: Theme
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        width: '50%',
        height: '100%',
        padding: theme.spacing.page,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}
