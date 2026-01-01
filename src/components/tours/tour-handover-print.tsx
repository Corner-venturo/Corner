'use client'

import { Tour } from '@/types/tour.types'
import { Member as OrderMember } from '@/stores/types'
import { DateCell } from '@/components/table-cells'

interface MemberFieldValue {
  [memberId: string]: {
    [fieldName: string]: string
  }
}

interface TourHandoverPrintProps {
  tour: Tour
  members: OrderMember[]
  customFields: string[]
  fieldValues: MemberFieldValue
}

export function TourHandoverPrint({
  tour,
  members,
  customFields,
  fieldValues
}: TourHandoverPrintProps) {
  const getFieldValue = (memberId: string, fieldName: string): string => {
    return fieldValues[memberId]?.[fieldName] || ''
  }

  // 根據欄位分組團員
  const groupByField = (fieldName: string) => {
    const groups: { [key: string]: OrderMember[] } = {}

    members.forEach(member => {
      const value = getFieldValue(member.id, fieldName) || '未分配'
      if (!groups[value]) {
        groups[value] = []
      }
      groups[value].push(member)
    })

    return groups
  }

  // 檢查欄位是否有資料
  const hasFieldData = (fieldName: string) => {
    return members.some(member => {
      const value = getFieldValue(member.id, fieldName)
      return value && value.trim() !== ''
    })
  }

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto print:p-0">
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* 標題 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-morandi-primary mb-2">
          {tour.name} - 職務交辦單
        </h1>
        <p className="text-sm text-morandi-secondary">
          團號：{tour.code} | 總人數：{members.length} 人
        </p>
      </div>

      {/* 團員總名單 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-gold">
          團員總名單
        </h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-morandi-container/30">
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">序號</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">中文姓名</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">護照拼音</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">生日</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-center">性別</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">護照號碼</th>
              <th className="border border-morandi-gold/30 px-2 py-1 text-left">特殊餐食</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={member.id}>
                <td className="border border-morandi-gold/30 px-2 py-1">{index + 1}</td>
                <td className="border border-morandi-gold/30 px-2 py-1">{member.chinese_name || '-'}</td>
                <td className="border border-morandi-gold/30 px-2 py-1">{member.passport_name || '-'}</td>
                <td className="border border-morandi-gold/30 px-2 py-1">{member.birth_date || '-'}</td>
                <td className="border border-morandi-gold/30 px-2 py-1 text-center">
                  {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                </td>
                <td className="border border-morandi-gold/30 px-2 py-1">{member.passport_number || '-'}</td>
                <td className="border border-morandi-gold/30 px-2 py-1">{member.special_meal || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 自訂欄位分組表（只顯示有資料的欄位） */}
      {customFields.map((fieldName, fieldIndex) => {
        if (!hasFieldData(fieldName)) return null

        const groups = groupByField(fieldName)
        const groupKeys = Object.keys(groups).filter(k => k !== '未分配')

        if (groupKeys.length === 0) return null

        return (
          <div key={fieldName} className={fieldIndex > 0 ? 'page-break mt-8' : 'mt-8'}>
            <h2 className="text-lg font-bold text-morandi-primary mb-4 pb-2 border-b-2 border-morandi-gold">
              {fieldName}名單
            </h2>
            <div className="space-y-6">
              {groupKeys.map(groupName => (
                <div key={groupName}>
                  <h3 className="text-md font-semibold text-morandi-secondary mb-2 bg-morandi-container/20 px-3 py-2 rounded">
                    {groupName} ({groups[groupName].length} 人)
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-morandi-container/30">
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left w-12">序號</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">中文姓名</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">護照拼音</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-center w-12">性別</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">特殊餐食</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups[groupName].map((member, index) => (
                        <tr key={member.id}>
                          <td className="border border-morandi-gold/30 px-2 py-1">{index + 1}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1">{member.chinese_name || '-'}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1">{member.passport_name || '-'}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1 text-center">
                            {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                          </td>
                          <td className="border border-morandi-gold/30 px-2 py-1">{member.special_meal || '-'}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1 h-6"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* 未分配的團員 */}
              {groups['未分配'] && groups['未分配'].length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-status-warning mb-2 bg-status-warning-bg px-3 py-2 rounded">
                    未分配 ({groups['未分配'].length} 人)
                  </h3>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-morandi-container/30">
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left w-12">序號</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">中文姓名</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-left">護照拼音</th>
                        <th className="border border-morandi-gold/30 px-2 py-1 text-center w-12">性別</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups['未分配'].map((member, index) => (
                        <tr key={member.id}>
                          <td className="border border-morandi-gold/30 px-2 py-1">{index + 1}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1">{member.chinese_name || '-'}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1">{member.passport_name || '-'}</td>
                          <td className="border border-morandi-gold/30 px-2 py-1 text-center">
                            {member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* 頁尾 */}
      <div className="mt-8 pt-4 border-t border-morandi-gold/30 text-xs text-morandi-text-light text-center">
        <p className="flex items-center justify-center gap-1">列印日期：<DateCell date={new Date()} showIcon={false} /></p>
      </div>
    </div>
  )
}
