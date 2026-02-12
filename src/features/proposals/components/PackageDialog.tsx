'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { CountryAirportSelector } from '@/components/selectors/CountryAirportSelector'
import type { Proposal, ProposalPackage, CreatePackageData } from '@/types/proposal.types'
import { PROPOSAL_LABELS } from '../constants'

interface CountryOption {
  id: string
  name: string
  is_active: boolean
}

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposalId: string
  proposal: Proposal
  package?: ProposalPackage | null
  /** 新增時用於預填資料的基底套件 */
  basePackage?: ProposalPackage | null
  onSubmit: (data: CreatePackageData | Partial<CreatePackageData>) => Promise<void>
  /** 國家列表（從父組件傳入，避免嵌套 Dialog 載入問題） */
  countries?: CountryOption[]
}

interface FormData {
  version_name: string
  country: string        // 國家名稱
  airport_code: string   // 機場代碼
  start_date: string
  end_date: string
  days: number | null
  nights: number | null
  group_size: number | null
  notes: string
}

export function PackageDialog({
  open,
  onOpenChange,
  mode,
  proposalId,
  proposal,
  package: pkg,
  basePackage,
  onSubmit,
  countries = [],
}: PackageDialogProps) {
  // 初始表單狀態（空白，會在 dialog 開啟時由 useEffect 設定）
  const [formData, setFormData] = useState<FormData>({
    version_name: '',
    country: '',
    airport_code: '',
    start_date: '',
    end_date: '',
    days: null,
    nights: null,
    group_size: null,
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // 追蹤 dialog 是否剛開啟（用於避免重複初始化）
  const prevOpenRef = useRef(false)

  // 初始化表單資料 - 只在 dialog 從關閉變為開啟時重置
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    // 只在 dialog 剛開啟時設定表單（false → true）
    if (!wasOpen && open) {
      if (mode === 'edit' && pkg) {
        setFormData({
          version_name: pkg.version_name || '',
          country: pkg.country_id || '',    // 存放國家名稱
          airport_code: pkg.main_city_id || '',  // 存放機場代碼
          start_date: pkg.start_date || '',
          end_date: pkg.end_date || '',
          days: pkg.days || null,
          nights: pkg.nights || null,
          group_size: pkg.group_size || null,
          notes: pkg.notes || '',
        })
      } else if (mode === 'create') {
        // 新增模式：使用 basePackage 或 proposal 的資料
        setFormData({
          version_name: '',
          country: (basePackage?.country_id || proposal.country_id) || '',
          airport_code: (basePackage?.main_city_id || proposal.main_city_id) || '',
          start_date: (basePackage?.start_date || proposal.expected_start_date) || '',
          end_date: (basePackage?.end_date || proposal.expected_end_date) || '',
          days: basePackage?.days || null,
          nights: basePackage?.nights || null,
          group_size: (basePackage?.group_size || proposal.group_size) || null,
          notes: '',
        })
      }
    }
  }, [open, mode, pkg, basePackage, proposal])

  // 處理國家變更 - 台灣團自動設 TW
  const handleCountryChange = (country: string, airportCode: string) => {
    setFormData(prev => ({
      ...prev,
      country,
      airport_code: airportCode,
    }))
  }

  // 處理機場代碼變更
  const handleAirportChange = (airportCode: string) => {
    setFormData(prev => ({ ...prev, airport_code: airportCode }))
  }

  // 處理提交
  const handleSubmit = async () => {
    const { createPackageSchema } = await import('@/lib/validations/schemas')
    const validation = createPackageSchema.safeParse({ version_name: formData.version_name.trim() })
    if (!validation.success) {
      return
    }

    setSubmitting(true)
    try {
      const data: CreatePackageData | Partial<CreatePackageData> = {
        proposal_id: proposalId,
        version_name: formData.version_name.trim(),
        country_id: formData.country || undefined,     // 存放國家名稱
        main_city_id: formData.airport_code || undefined, // 存放機場代碼
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        days: formData.days || undefined,
        nights: formData.nights || undefined,
        group_size: formData.group_size || undefined,
        notes: formData.notes.trim() || undefined,
      }
      await onSubmit(data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? PROPOSAL_LABELS.packageDialog.createTitle : PROPOSAL_LABELS.packageDialog.editTitle}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? PROPOSAL_LABELS.packageDialog.createSubmit : PROPOSAL_LABELS.packageDialog.editSubmit}
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            {PROPOSAL_LABELS.packageDialog.versionNameLabel} <span className="text-morandi-red">{PROPOSAL_LABELS.required}</span>
          </label>
          <Input
            value={formData.version_name}
            onChange={e =>
              setFormData(prev => ({ ...prev, version_name: e.target.value }))
            }
            placeholder={PROPOSAL_LABELS.packageDialog.versionNamePlaceholder}
          />
        </div>

        {/* 國家/機場代碼選擇 - 使用共用組件 */}
        <CountryAirportSelector
          country={formData.country}
          airportCode={formData.airport_code}
          onCountryChange={handleCountryChange}
          onAirportChange={handleAirportChange}
          disablePortal
          showLabels
          countries={countries}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PROPOSAL_LABELS.packageDialog.departDateLabel}
            </label>
            <DatePicker
              value={formData.start_date}
              onChange={date => {
                const startDate = date || ''
                setFormData(prev => {
                  // 如果回程日期早於新的出發日期，自動調整回程日期
                  let endDate = prev.end_date
                  if (startDate && endDate && endDate < startDate) {
                    endDate = startDate
                  }
                  // 如果沒有回程日期，自動設為出發日期
                  if (startDate && !endDate) {
                    endDate = startDate
                  }
                  return { ...prev, start_date: startDate, end_date: endDate }
                })
              }}
              placeholder={PROPOSAL_LABELS.packageDialog.datePlaceholder}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              {PROPOSAL_LABELS.packageDialog.returnDateLabel}
            </label>
            <DatePicker
              value={formData.end_date}
              onChange={date => {
                const endDate = date || ''
                // 確保回程日期不早於出發日期
                if (formData.start_date && endDate && endDate < formData.start_date) {
                  setFormData(prev => ({ ...prev, end_date: formData.start_date }))
                } else {
                  setFormData(prev => ({ ...prev, end_date: endDate }))
                }
              }}
              placeholder={PROPOSAL_LABELS.packageDialog.datePlaceholder}
              minDate={formData.start_date ? new Date(formData.start_date) : undefined}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            {PROPOSAL_LABELS.packageDialog.groupSizeLabel}
          </label>
          <Input
            type="number"
            min={1}
            value={formData.group_size || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                group_size: e.target.value ? parseInt(e.target.value, 10) : null,
              }))
            }
            placeholder={PROPOSAL_LABELS.packageDialog.groupSizePlaceholder}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            {PROPOSAL_LABELS.packageDialog.notesLabel}
          </label>
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={PROPOSAL_LABELS.packageDialog.notesPlaceholder}
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  )
}
