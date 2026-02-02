/**
 * 文字元素
 */
import type { Theme } from '../types'

interface TextProps {
  children: React.ReactNode
  theme: Theme
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label'
  color?: 'primary' | 'secondary' | 'accent' | 'muted'
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<string, React.CSSProperties> = {
  h1: { fontSize: '24pt', fontWeight: 900, letterSpacing: '2px' },
  h2: { fontSize: '16pt', fontWeight: 700, letterSpacing: '1px' },
  h3: { fontSize: '12pt', fontWeight: 600, letterSpacing: '0.5px' },
  body: { fontSize: '9pt', fontWeight: 400, lineHeight: 1.8 },
  caption: { fontSize: '8pt', fontWeight: 400, lineHeight: 1.6 },
  label: { fontSize: '10pt', fontWeight: 600, letterSpacing: '1.5px' },
}

export function Text({
  children,
  theme,
  variant = 'body',
  color = 'primary',
  align = 'left',
  className,
  style,
}: TextProps) {
  const colorMap = {
    primary: theme.colors.text,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    muted: theme.colors.textMuted,
  }

  return (
    <div
      className={className}
      style={{
        fontFamily: variant.startsWith('h') ? theme.fonts.heading : theme.fonts.body,
        color: colorMap[color],
        textAlign: align,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
