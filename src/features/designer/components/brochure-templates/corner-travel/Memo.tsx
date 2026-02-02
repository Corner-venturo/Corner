/**
 * Corner Travel 注意事項跨頁
 * 
 * 左頁：旅遊須知
 * 右頁：緊急聯絡、筆記區
 */
'use client'

import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, bodyTextStyle, pageNumberStyle, COLORS, A5_WIDTH_MM, A5_HEIGHT_MM } from './styles'

interface MemoItem {
  title: string
  content: string
}

interface EmergencyContact {
  title: string
  phone: string
}

interface MemoProps extends PageProps {
  memoItems?: MemoItem[]
  emergencyContacts?: EmergencyContact[]
}

const DEFAULT_MEMOS: MemoItem[] = [
  { title: '時差', content: '日本比台灣快1小時。' },
  { title: '電壓', content: '日本電壓為100V，插座為雙平腳插座。' },
  { title: '貨幣', content: '日本使用日圓（JPY）。建議先換好日圓。' },
  { title: '氣候', content: '請依季節準備適當衣物。' },
  { title: '通訊', content: '建議租借WiFi分享器或購買SIM卡。' },
]

const DEFAULT_CONTACTS: EmergencyContact[] = [
  { title: '日本警察', phone: '110' },
  { title: '日本消防/救護', phone: '119' },
  { title: '台北駐日代表處', phone: '+81-3-3280-7811' },
  { title: '外交部急難救助', phone: '+886-800-085-095' },
]

export function Memo({ data, memoItems, emergencyContacts, pageNumber, className }: MemoProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  const items = memoItems || DEFAULT_MEMOS
  const contacts = emergencyContacts || DEFAULT_CONTACTS
  const leftPageNum = pageNumber || 10
  const rightPageNum = leftPageNum + 1

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        width: `${A5_WIDTH_MM * 2}mm`,
        height: `${A5_HEIGHT_MM}mm`,
      }}
    >
      {/* 左頁：旅遊須知 */}
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div>TRAVEL GUIDE FOR VISITING JAPAN</div>
          <div>{cityName}</div>
        </div>
        <div style={dividerStyle} />

        <div style={{ fontSize: '12pt', fontWeight: 700, marginBottom: '6mm' }}>
          MEMO｜旅遊須知
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
          {items.map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: '9pt', fontWeight: 600, marginBottom: '1mm' }}>{item.title}</div>
              <div style={{ ...bodyTextStyle, fontSize: '8pt' }}>{item.content}</div>
            </div>
          ))}
        </div>

        <div style={{ ...pageNumberStyle, left: '8mm' }}>{String(leftPageNum).padStart(2, '0')}</div>
      </div>

      {/* 右頁：緊急聯絡 */}
      <div style={pageStyle}>
        <div style={{ ...headerStyle, textAlign: 'right' }}>
          <div>{cityName} × JAPAN</div>
          <div>{data.mainTitle || '日本東京行程手冊'}</div>
        </div>
        <div style={{ ...dividerStyle, marginLeft: 'auto' }} />

        <div style={{ fontSize: '12pt', fontWeight: 700, marginBottom: '6mm' }}>
          EMERGENCY｜緊急聯絡
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={bodyTextStyle}>{c.title}</div>
              <div style={{ fontSize: '9pt', fontWeight: 600, fontFamily: 'monospace' }}>{c.phone}</div>
            </div>
          ))}
        </div>

        {/* 筆記區 */}
        <div
          style={{
            marginTop: '10mm',
            padding: '4mm',
            backgroundColor: COLORS.lightGray,
            borderRadius: '2mm',
            minHeight: '40mm',
          }}
        >
          <div style={{ fontSize: '8pt', fontWeight: 500, color: COLORS.gray }}>NOTES 筆記</div>
        </div>

        <div style={{ ...pageNumberStyle, right: '8mm' }}>{String(rightPageNum).padStart(2, '0')}</div>
      </div>
    </div>
  )
}
