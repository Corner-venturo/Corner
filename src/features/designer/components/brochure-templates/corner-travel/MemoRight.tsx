/**
 * Corner Travel 注意事項頁（右頁）
 * 
 * 包含：
 * - 頂部標題（右對齊）
 * - 緊急聯絡
 * - 備註空間
 */
import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface EmergencyContact {
  title: string
  phone: string
}

interface MemoRightProps extends PageProps {
  emergencyContacts?: EmergencyContact[]
}

export function MemoRight({ data, emergencyContacts, pageNumber, className }: MemoRightProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  
  // 預設緊急聯絡
  const defaultContacts: EmergencyContact[] = [
    { title: '日本警察', phone: '110' },
    { title: '日本消防/救護', phone: '119' },
    { title: '台北駐日經濟文化代表處', phone: '+81-3-3280-7811' },
    { title: '外交部旅外國人急難救助專線', phone: '+886-800-085-095' },
  ]
  
  const contacts = emergencyContacts || defaultContacts
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題（右對齊） */}
      <div style={{ ...headerStyle, textAlign: 'right' }}>
        <div>{cityName} × JAPAN</div>
        <div>{data.mainTitle || '日本東京行程手冊'}</div>
      </div>
      
      {/* 分隔線（右對齊） */}
      <div style={{ ...dividerStyle, marginLeft: 'auto' }} />
      
      {/* 緊急聯絡標題 */}
      <div
        style={{
          fontSize: '12pt',
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '6mm',
        }}
      >
        EMERGENCY｜緊急聯絡
      </div>
      
      {/* 緊急聯絡列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm' }}>
        {contacts.map((contact, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ ...bodyTextStyle, color: COLORS.black }}>
              {contact.title}
            </div>
            <div
              style={{
                fontSize: '9pt',
                fontWeight: 600,
                color: COLORS.black,
                fontFamily: 'monospace',
              }}
            >
              {contact.phone}
            </div>
          </div>
        ))}
      </div>
      
      {/* 筆記區塊 */}
      <div
        style={{
          marginTop: '10mm',
          padding: '4mm',
          backgroundColor: COLORS.lightGray,
          borderRadius: '2mm',
          minHeight: '40mm',
        }}
      >
        <div
          style={{
            fontSize: '8pt',
            fontWeight: 500,
            color: COLORS.gray,
            marginBottom: '2mm',
          }}
        >
          NOTES 筆記
        </div>
        {/* 留白區域供手寫 */}
      </div>
      
      {/* 頁碼 */}
      {pageNumber && (
        <div style={{ ...pageNumberStyle, right: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
