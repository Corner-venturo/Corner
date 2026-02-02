/**
 * 日系風格注意事項頁
 */
'use client'

import type { PageProps } from './types'
import { pageStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

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

export function Memo({ items, title = '旅遊須知', pageNumber, className }: MemoProps) {
  const memoItems = items || DEFAULT_ITEMS

  return (
    <div className={className} style={pageStyle}>
      {/* 標題 */}
      <div
        style={{
          fontSize: '10pt',
          color: COLORS.gold,
          letterSpacing: '2px',
          marginBottom: '2mm',
        }}
      >
        MEMO
      </div>
      <div
        style={{
          fontSize: '16pt',
          fontWeight: 700,
          marginBottom: '8mm',
          paddingBottom: '3mm',
          borderBottom: `2px solid ${COLORS.gold}`,
        }}
      >
        {title}
      </div>

      {/* 項目列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5mm' }}>
        {memoItems.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '3mm',
              padding: '3mm',
              backgroundColor: i % 2 === 0 ? COLORS.lightGray : 'transparent',
              borderRadius: '2mm',
            }}
          >
            {item.icon && (
              <div style={{ fontSize: '14pt', width: '8mm', textAlign: 'center' }}>
                {item.icon}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '10pt',
                  fontWeight: 600,
                  marginBottom: '1mm',
                }}
              >
                {item.title}
              </div>
              <div style={{ ...bodyTextStyle, fontSize: '8pt' }}>
                {item.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 緊急聯絡 */}
      <div
        style={{
          position: 'absolute',
          bottom: '15mm',
          left: '8mm',
          right: '8mm',
          padding: '4mm',
          border: `1px solid ${COLORS.gold}`,
          borderRadius: '2mm',
        }}
      >
        <div
          style={{
            fontSize: '9pt',
            fontWeight: 600,
            color: COLORS.gold,
            marginBottom: '2mm',
          }}
        >
          緊急聯絡
        </div>
        <div style={{ ...bodyTextStyle, fontSize: '8pt', display: 'flex', flexWrap: 'wrap', gap: '4mm' }}>
          <span>日本警察 110</span>
          <span>消防/救護 119</span>
          <span>外交部急難救助 +886-800-085-095</span>
        </div>
      </div>

      {pageNumber && (
        <div style={{ ...pageNumberStyle, right: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
