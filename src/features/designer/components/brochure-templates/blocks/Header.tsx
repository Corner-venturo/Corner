/**
 * 頁首區塊
 */
import { Text } from '../primitives/Text'
import { Divider } from '../primitives/Divider'
import type { Theme } from '../types'

interface HeaderProps {
  theme: Theme
  title?: string
  subtitle?: string
  align?: 'left' | 'right'
  showDivider?: boolean
}

export function Header({
  theme,
  title,
  subtitle,
  align = 'left',
  showDivider = true,
}: HeaderProps) {
  return (
    <div style={{ marginBottom: theme.spacing.section }}>
      {title && (
        <Text theme={theme} variant="label" color="primary" align={align}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text theme={theme} variant="label" color="primary" align={align}>
          {subtitle}
        </Text>
      )}
      {showDivider && (
        <Divider theme={theme} align={align} />
      )}
    </div>
  )
}
