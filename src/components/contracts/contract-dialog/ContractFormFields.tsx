'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { ContractData } from './types'

interface ContractFormFieldsProps {
  contractData: Partial<ContractData>
  onFieldChange: (field: keyof ContractData, value: string) => void
}

export function ContractFormFields({ contractData, onFieldChange }: ContractFormFieldsProps) {
  return (
    <>
      {/* 旅客資訊 */}
      <div>
        <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅客資訊（甲方）</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-morandi-primary block mb-1">姓名</label>
            <Input
              type="text"
              value={contractData.travelerName || ''}
              onChange={e => onFieldChange('travelerName', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-morandi-primary block mb-1">身分證字號</label>
            <Input
              type="text"
              value={contractData.travelerIdNumber || ''}
              onChange={e => onFieldChange('travelerIdNumber', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-morandi-primary block mb-1">住址</label>
            <Input
              type="text"
              value={contractData.travelerAddress || ''}
              onChange={e => onFieldChange('travelerAddress', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-morandi-primary block mb-1">電話</label>
            <Input
              type="text"
              value={contractData.travelerPhone || ''}
              onChange={e => onFieldChange('travelerPhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 集合時地 */}
      <div>
        <h3 className="text-sm font-semibold text-morandi-primary mb-3">集合時地</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-morandi-primary block mb-1">集合時間</label>
            <Input
              type="datetime-local"
              value={(() => {
                // 將分開的年月日時分組合成 datetime-local 格式
                const { gatherYear, gatherMonth, gatherDay, gatherHour, gatherMinute } =
                  contractData
                if (gatherYear && gatherMonth && gatherDay && gatherHour && gatherMinute) {
                  const year = gatherYear.padStart(4, '0')
                  const month = gatherMonth.padStart(2, '0')
                  const day = gatherDay.padStart(2, '0')
                  const hour = gatherHour.padStart(2, '0')
                  const minute = gatherMinute.padStart(2, '0')
                  return `${year}-${month}-${day}T${hour}:${minute}`
                }
                return ''
              })()}
              onChange={e => {
                // 將 datetime-local 格式分解成5個欄位
                const value = e.target.value // 格式: "2024-01-15T08:30"
                if (value) {
                  const [datePart, timePart] = value.split('T')
                  const [year, month, day] = datePart.split('-')
                  const [hour, minute] = timePart.split(':')

                  onFieldChange('gatherYear', year)
                  onFieldChange('gatherMonth', month)
                  onFieldChange('gatherDay', day)
                  onFieldChange('gatherHour', hour)
                  onFieldChange('gatherMinute', minute)
                } else {
                  // 清空所有欄位
                  onFieldChange('gatherYear', '')
                  onFieldChange('gatherMonth', '')
                  onFieldChange('gatherDay', '')
                  onFieldChange('gatherHour', '')
                  onFieldChange('gatherMinute', '')
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs text-morandi-primary block mb-1">集合地點</label>
            <Input
              type="text"
              value={contractData.gatherLocation || ''}
              onChange={e => onFieldChange('gatherLocation', e.target.value)}
              placeholder="集合地點（例如：桃園國際機場第一航廈）"
            />
          </div>
        </div>
      </div>

      {/* 費用 */}
      <div>
        <h3 className="text-sm font-semibold text-morandi-primary mb-3">旅遊費用</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-morandi-primary block mb-1">總金額（新台幣）</label>
            <Input
              type="text"
              value={contractData.totalAmount || ''}
              onChange={e => onFieldChange('totalAmount', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-morandi-primary block mb-1">定金（新台幣）</label>
            <Input
              type="text"
              value={contractData.depositAmount || ''}
              onChange={e => onFieldChange('depositAmount', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 乙方資訊 */}
      <div>
        <h3 className="text-sm font-semibold text-morandi-primary mb-3">乙方聯絡資訊</h3>
        <div>
          <label className="text-xs text-morandi-primary block mb-1">
            電話分機（02-7751-6051 #）
          </label>
          <Input
            type="text"
            value={contractData.companyExtension || ''}
            onChange={e => onFieldChange('companyExtension', e.target.value)}
            placeholder="分機號碼"
          />
        </div>
      </div>
    </>
  )
}
