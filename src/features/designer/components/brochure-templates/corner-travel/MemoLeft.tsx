/**
 * Corner Travel 注意事項頁（左頁）
 * 
 * 包含：
 * - 頂部標題
 * - 旅遊須知
 * - 行前準備
 */
import type { PageProps } from './types'
import { pageStyle, headerStyle, dividerStyle, sectionTitleStyle, bodyTextStyle, pageNumberStyle, COLORS } from './styles'

interface MemoItem {
  title: string
  content: string
}

interface MemoLeftProps extends PageProps {
  memoItems?: MemoItem[]
}

export function MemoLeft({ data, memoItems, pageNumber, className }: MemoLeftProps) {
  const cityName = data.destination?.split(',')[0]?.trim().toUpperCase() || 'TOKYO'
  
  // 預設注意事項
  const defaultMemos: MemoItem[] = [
    {
      title: '時差',
      content: '日本比台灣快1小時。',
    },
    {
      title: '電壓',
      content: '日本電壓為100V，插座為雙平腳插座。建議攜帶轉接頭。',
    },
    {
      title: '貨幣',
      content: '日本使用日圓（JPY）。建議在台灣先換好日圓，或使用國際提款卡。',
    },
    {
      title: '氣候',
      content: '請依季節準備適當衣物，冬季建議攜帶保暖外套。',
    },
    {
      title: '通訊',
      content: '建議租借WiFi分享器或購買當地SIM卡。',
    },
  ]
  
  const items = memoItems || defaultMemos
  
  return (
    <div className={className} style={pageStyle}>
      {/* 頂部標題 */}
      <div style={headerStyle}>
        <div>TRAVEL GUIDE FOR VISITING JAPAN</div>
        <div>{cityName}</div>
      </div>
      
      {/* 分隔線 */}
      <div style={dividerStyle} />
      
      {/* 主標題 */}
      <div
        style={{
          fontSize: '12pt',
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '6mm',
        }}
      >
        MEMO｜旅遊須知
      </div>
      
      {/* 注意事項列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
        {items.map((item, index) => (
          <div key={index}>
            <div
              style={{
                fontSize: '9pt',
                fontWeight: 600,
                color: COLORS.black,
                marginBottom: '1mm',
              }}
            >
              {item.title}
            </div>
            <div style={{ ...bodyTextStyle, fontSize: '8pt' }}>
              {item.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* 頁碼 */}
      {pageNumber && (
        <div style={{ ...pageNumberStyle, left: '8mm' }}>
          {String(pageNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
