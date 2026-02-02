/**
 * 注意事項頁
 */
'use client'

import { Page } from '../primitives/Page'
import { Text } from '../primitives/Text'
import { Divider } from '../primitives/Divider'
import type { PageProps } from '../types'

interface MemoItem {
  icon?: string
  title: string
  content: string
}

interface MemoProps extends PageProps {
  items?: MemoItem[]
  title?: string
}

const DEFAULT_ITEMS: MemoItem[] = [
  { icon: '🕐', title: '時差', content: '日本比台灣快1小時' },
  { icon: '🔌', title: '電壓', content: '100V，雙平腳插座' },
  { icon: '💴', title: '貨幣', content: '日圓 (JPY)' },
  { icon: '📱', title: '通訊', content: '建議租借 WiFi 或購買 SIM 卡' },
  { icon: '🌡️', title: '氣候', content: '請依季節準備適當衣物' },
]

const EMERGENCY_CONTACTS = [
  { name: '日本警察', phone: '110' },
  { name: '消防/救護', phone: '119' },
  { name: '外交部急難救助', phone: '+886-800-085-095' },
]

export function Memo({ theme, size, items, title = '旅遊須知', pageNumber, className }: MemoProps) {
  const memoItems = items || DEFAULT_ITEMS

  return (
    <Page theme={theme} size={size} className={className}>
      {/* 標題 */}
      <Text theme={theme} variant="label" color="accent" style={{ marginBottom: '2mm' }}>
        MEMO
      </Text>
      <Text
        theme={theme}
        variant="h2"
        style={{
          marginBottom: theme.spacing.section,
          paddingBottom: '3mm',
          borderBottom: `2px solid ${theme.colors.accent}`,
        }}
      >
        {title}
      </Text>

      {/* 項目列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
        {memoItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '3mm',
              padding: '3mm',
              backgroundColor: i % 2 === 0 ? theme.colors.surface : 'transparent',
              borderRadius: '2mm',
            }}
          >
            {item.icon && (
              <div style={{ fontSize: '14pt', width: '8mm', textAlign: 'center' }}>
                {item.icon}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <Text theme={theme} variant="body" style={{ fontWeight: 600, marginBottom: '1mm' }}>
                {item.title}
              </Text>
              <Text theme={theme} variant="caption">
                {item.content}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* 緊急聯絡 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: theme.spacing.page,
          right: theme.spacing.page,
          padding: '4mm',
          border: `1px solid ${theme.colors.accent}`,
          borderRadius: '2mm',
        }}
      >
        <Text theme={theme} variant="caption" color="accent" style={{ fontWeight: 600, marginBottom: '2mm' }}>
          緊急聯絡
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4mm' }}>
          {EMERGENCY_CONTACTS.map((contact, i) => (
            <Text key={i} theme={theme} variant="caption">
              {contact.name} {contact.phone}
            </Text>
          ))}
        </div>
      </div>

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
