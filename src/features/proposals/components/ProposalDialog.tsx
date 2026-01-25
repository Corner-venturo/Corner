'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { CountryAirportSelector } from '@/components/selectors/CountryAirportSelector'
import { X, Save } from 'lucide-react'
import type {
  Proposal,
  CreateProposalData,
  UpdateProposalData,
} from '@/types/proposal.types'

// 擴展的提案資料（包含第一個版本）
export interface CreateProposalWithPackageData extends CreateProposalData {
  /** 第一個版本的資料 */
  firstPackage?: {
    version_name: string
    country: string
    airport_code: string
    start_date: string
    end_date: string
    group_size: number | null
    notes: string
  }
}

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposal?: Proposal | null
  onSubmit: (data: CreateProposalWithPackageData | UpdateProposalData) => Promise<void>
}

export function ProposalDialog({
  open,
  onOpenChange,
  mode,
  proposal,
  onSubmit,
}: ProposalDialogProps) {
  // 提案資訊（編輯模式使用）
  const [title, setTitle] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState('')

  // 第一個版本資訊（create 模式使用）
  const [versionName, setVersionName] = useState('')
  const [country, setCountry] = useState('')
  const [airportCode, setAirportCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupSize, setGroupSize] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setTitle(proposal.title || '')
      setExpectedStartDate(proposal.expected_start_date || '')
    } else if (mode === 'create') {
      // 重置所有欄位
      setTitle('')
      setExpectedStartDate('')
      setVersionName('')
      setCountry('')
      setAirportCode('')
      setStartDate('')
      setEndDate('')
      setGroupSize(null)
      setNotes('')
    }
  }, [mode, proposal, open])

  // 處理國家變更
  const handleCountryChange = (newCountry: string, newAirportCode: string) => {
    setCountry(newCountry)
    setAirportCode(newAirportCode)
  }

  // 處理機場代碼變更
  const handleAirportChange = (newAirportCode: string) => {
    setAirportCode(newAirportCode)
  }

  // 處理提交
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (mode === 'create') {
        // 新增模式：建立提案和第一個版本
        const data: CreateProposalWithPackageData = {
          title: versionName.trim() || undefined, // 用版本名稱當提案名稱
          expected_start_date: startDate || undefined,
          firstPackage: {
            version_name: versionName.trim(),
            country,
            airport_code: airportCode,
            start_date: startDate,
            end_date: endDate,
            group_size: groupSize,
            notes: notes.trim(),
          },
        }
        await onSubmit(data)
      } else {
        // 編輯模式：只更新提案
        await onSubmit({
          title: title.trim() || undefined,
          expected_start_date: expectedStartDate || undefined,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 表單是否有效
  const isValid = mode === 'edit' || versionName.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        level={1}
        className="max-w-lg w-[90vw] max-h-[85vh] overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新增提案' : '編輯提案'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {mode === 'edit' ? (
            // 編輯模式：提案資訊
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  提案名稱
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：2026 泰北清邁家族旅遊"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  預計出發日期（選填）
                </label>
                <DatePicker
                  value={expectedStartDate}
                  onChange={date => setExpectedStartDate(date || '')}
                  placeholder="選擇日期"
                />
              </div>
            </div>
          ) : (
            // 新增模式：直接建立第一個版本
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  版本名稱 <span className="text-morandi-red">*</span>
                </label>
                <Input
                  value={versionName}
                  onChange={e => setVersionName(e.target.value)}
                  placeholder="例如：方案A - 經濟版"
                  autoFocus
                />
              </div>

              {/* 國家/機場代碼選擇 */}
              <CountryAirportSelector
                country={country}
                airportCode={airportCode}
                onCountryChange={handleCountryChange}
                onAirportChange={handleAirportChange}
                disablePortal
                showLabels
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">
                    出發日期
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={date => {
                      const newStartDate = date || ''
                      setStartDate(newStartDate)
                      // 如果回程日期早於新的出發日期，自動調整
                      if (newStartDate && endDate && endDate < newStartDate) {
                        setEndDate(newStartDate)
                      }
                    }}
                    placeholder="選擇日期"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">
                    回程日期
                  </label>
                  <DatePicker
                    value={endDate}
                    onChange={date => {
                      const newEndDate = date || ''
                      // 確保回程日期不早於出發日期
                      if (startDate && newEndDate && newEndDate < startDate) {
                        setEndDate(startDate)
                      } else {
                        setEndDate(newEndDate)
                      }
                    }}
                    placeholder="選擇日期"
                    minDate={startDate ? new Date(startDate) : undefined}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  預計人數
                </label>
                <Input
                  type="number"
                  min={1}
                  value={groupSize || ''}
                  onChange={e =>
                    setGroupSize(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  placeholder="人數"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary mb-2 block">
                  備註
                </label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="版本相關備註..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="gap-2"
          >
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isValid}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Save size={16} />
            {submitting ? '建立中...' : mode === 'create' ? '建立提案' : '儲存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
