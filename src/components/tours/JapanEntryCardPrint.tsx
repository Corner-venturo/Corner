'use client'

import React, { forwardRef } from 'react'

interface MemberData {
  id: string
  passport_name?: string | null  // 格式: SURNAME/GIVENNAME
  birth_date?: string | null     // 格式: YYYY-MM-DD
  passport_number?: string | null
}

interface JapanEntryCardPrintProps {
  members: MemberData[]
  flightNumber?: string
  hotelName?: string
  hotelAddress?: string
  hotelPhone?: string
  stayDays?: number
}

// 將生日轉成間隔格式 (每個數字間加空格)
function formatBirthDate(birthDate: string | null | undefined): string {
  if (!birthDate) return ''
  // 從 YYYY-MM-DD 轉成 YYYYMMDD
  const clean = birthDate.replace(/-/g, '')
  // 每個字元間加兩個空格
  return clean.split('').join('  ')
}

// 從 passport_name 分離姓和名
function splitName(passportName: string | null | undefined): { surname: string; givenName: string } {
  if (!passportName) return { surname: '', givenName: '' }
  const parts = passportName.split('/')
  return {
    surname: parts[0] || '',
    givenName: parts[1] || '',
  }
}

export const JapanEntryCardPrint = forwardRef<HTMLDivElement, JapanEntryCardPrintProps>(
  ({ members, flightNumber = 'BR-XXX', hotelName = '', hotelAddress = '', hotelPhone = '', stayDays = 5 }, ref) => {
    return (
      <div ref={ref} className="japan-entry-card-print">
        <style>{`
          @media print {
            @page {
              size: 165mm 105mm landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .japan-entry-card-print {
              width: 100%;
            }
            .entry-card {
              page-break-after: always;
              page-break-inside: avoid;
            }
            .entry-card:last-child {
              page-break-after: auto;
            }
            .no-print {
              display: none !important;
            }
          }

          .entry-card {
            width: 165mm;
            height: 105mm;
            padding: 8mm 10mm 5mm 10mm;
            box-sizing: border-box;
            font-family: 'Microsoft JhengHei', 'Noto Sans TC', sans-serif;
            font-size: 9pt;
            font-weight: bold;
            position: relative;
            background: white;
            margin-bottom: 5mm;
          }

          .entry-card-table {
            width: 100%;
            border-collapse: collapse;
          }

          .entry-card-table td {
            vertical-align: top;
            padding: 0 5.4pt;
          }

          .name-row td {
            text-align: center;
            height: 34.6pt;
            font-size: 9pt;
          }

          .date-cell {
            letter-spacing: 0;
            font-family: 'Microsoft JhengHei', sans-serif;
          }

          .info-row td {
            height: 14.95pt;
            font-size: 9pt;
          }

          .address-row td {
            height: 24.3pt;
            line-height: 10pt;
            font-size: 9pt;
          }

          .empty-row td {
            height: 24.3pt;
          }

          .last-row td {
            height: 19.85pt;
          }

          .signature-row td {
            height: 24.75pt;
          }

          @media screen {
            .entry-card {
              border: 1px dashed #ccc;
              margin-bottom: 10px;
            }
          }
        `}</style>

        {members.map((member, index) => {
          const { surname, givenName } = splitName(member.passport_name)
          const birthDateFormatted = formatBirthDate(member.birth_date)

          return (
            <div key={member.id || index} className="entry-card">
              <table className="entry-card-table">
                <tbody>
                  {/* 第一行：姓 | 名 */}
                  <tr className="name-row">
                    <td style={{ width: '177.2pt' }}>{surname}</td>
                    <td style={{ width: '205.55pt' }} colSpan={4}>{givenName}</td>
                  </tr>

                  {/* 第二行：生日 | TAIWAN | TAIPEI */}
                  <tr className="info-row">
                    <td>
                      <span className="date-cell">{birthDateFormatted}</span>
                    </td>
                    <td colSpan={2} style={{ width: '106.3pt' }}>TAIWAN</td>
                    <td colSpan={2} style={{ width: '99.25pt', textIndent: '18pt' }}>TAIPEI</td>
                  </tr>

                  {/* 第三行：V | (空) | 航班號碼 */}
                  <tr className="info-row">
                    <td>V</td>
                    <td colSpan={2}>&nbsp;</td>
                    <td colSpan={2}>{flightNumber}</td>
                  </tr>

                  {/* 第四行：(空) | (空) | N日 */}
                  <tr style={{ height: '24.7pt' }}>
                    <td>&nbsp;</td>
                    <td colSpan={2}>&nbsp;</td>
                    <td colSpan={2} style={{ paddingLeft: '12pt' }}>{stayDays} 日</td>
                  </tr>

                  {/* 第五行：住宿地址 | 電話 */}
                  <tr className="address-row">
                    <td colSpan={2} style={{ width: '248.35pt' }}>
                      <div style={{ lineHeight: '10pt' }}>{hotelAddress}</div>
                      <div style={{ lineHeight: '10pt' }}>{hotelName}</div>
                    </td>
                    <td colSpan={3} style={{ width: '134.4pt', textAlign: 'center' }}>{hotelPhone}</td>
                  </tr>

                  {/* 第六行：空白 */}
                  <tr className="empty-row">
                    <td colSpan={2}>&nbsp;</td>
                    <td colSpan={3}>&nbsp;</td>
                  </tr>

                  {/* 第七行：空白 */}
                  <tr className="last-row">
                    <td colSpan={4}>&nbsp;</td>
                    <td style={{ width: '77.95pt' }}>&nbsp;</td>
                  </tr>

                  {/* 第八行：簽名欄 */}
                  <tr className="signature-row">
                    <td colSpan={4}>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    )
  }
)

JapanEntryCardPrint.displayName = 'JapanEntryCardPrint'

export default JapanEntryCardPrint
