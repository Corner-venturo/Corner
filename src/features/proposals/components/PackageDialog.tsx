'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { useRegionsStore } from '@/stores'
import type { Proposal, ProposalPackage, CreatePackageData } from '@/types/proposal.types'

interface PackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposalId: string
  proposal: Proposal
  package?: ProposalPackage | null
  onSubmit: (data: CreatePackageData | Partial<CreatePackageData>) => Promise<void>
}

interface FormData {
  version_name: string
  country_id: string
  main_city_id: string
  destination: string
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
  onSubmit,
}: PackageDialogProps) {
  // 載入地區資料
  const { countries, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()

  useEffect(() => {
    if (open && countries.length === 0) {
      fetchRegions()
    }
  }, [open, countries.length, fetchRegions])

  const initialFormData: FormData = useMemo(() => ({
    version_name: '',
    country_id: proposal.country_id || '',
    main_city_id: proposal.main_city_id || '',
    destination: proposal.destination || '',
    start_date: proposal.expected_start_date || '',
    end_date: proposal.expected_end_date || '',
    days: null,
    nights: null,
    group_size: proposal.group_size || null,
    notes: '',
  }), [proposal])

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // 取得啟用的國家列表
  const activeCountries = useMemo(() =>
    countries.filter(c => c.is_active).map(c => ({
      value: c.id,
      label: c.name,
    })),
    [countries]
  )

  // 根據選中的國家取得城市列表
  const availableCities = useMemo(() => {
    if (!formData.country_id) return []
    return getCitiesByCountry(formData.country_id)
      .filter(c => c.is_active)
      .map(c => ({
        value: c.id,
        label: `${c.name}${c.airport_code ? ` (${c.airport_code})` : ''}`,
        code: c.airport_code || '',
      }))
  }, [formData.country_id, getCitiesByCountry])

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && pkg) {
      setFormData({
        version_name: pkg.version_name || '',
        country_id: pkg.country_id || '',
        main_city_id: pkg.main_city_id || '',
        destination: pkg.destination || '',
        start_date: pkg.start_date || '',
        end_date: pkg.end_date || '',
        days: pkg.days || null,
        nights: pkg.nights || null,
        group_size: pkg.group_size || null,
        notes: pkg.notes || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [mode, pkg, open, initialFormData])

  // 當國家改變時，自動清空城市
  const handleCountryChange = (countryId: string) => {
    setFormData(prev => ({
      ...prev,
      country_id: countryId,
      main_city_id: '', // 清空城市
    }))
  }

  // 處理提交
  const handleSubmit = async () => {
    if (!formData.version_name.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const data: CreatePackageData | Partial<CreatePackageData> = {
        proposal_id: proposalId,
        version_name: formData.version_name.trim(),
        country_id: formData.country_id || undefined,
        main_city_id: formData.main_city_id || undefined,
        destination: formData.destination.trim() || undefined,
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
      title={mode === 'create' ? '新增團體套件' : '編輯團體套件'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? '建立' : '儲存'}
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            版本名稱 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={formData.version_name}
            onChange={e =>
              setFormData(prev => ({ ...prev, version_name: e.target.value }))
            }
            placeholder="例如：方案A - 經濟版"
          />
        </div>

        {/* 國家/城市選擇 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              國家
            </label>
            <Combobox
              value={formData.country_id}
              onChange={handleCountryChange}
              options={activeCountries}
              placeholder="選擇國家..."
              emptyMessage="找不到符合的國家"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              城市
            </label>
            <Combobox
              value={formData.main_city_id}
              onChange={cityId => setFormData(prev => ({ ...prev, main_city_id: cityId }))}
              options={availableCities}
              placeholder="選擇城市..."
              emptyMessage={formData.country_id ? "找不到符合的城市" : "請先選擇國家"}
              disabled={!formData.country_id}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            目的地說明（選填）
          </label>
          <Input
            value={formData.destination}
            onChange={e =>
              setFormData(prev => ({ ...prev, destination: e.target.value }))
            }
            placeholder="例如：清邁古城區"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              出發日期
            </label>
            <DatePicker
              value={formData.start_date}
              onChange={date =>
                setFormData(prev => ({ ...prev, start_date: date || '' }))
              }
              placeholder="選擇日期"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              回程日期
            </label>
            <DatePicker
              value={formData.end_date}
              onChange={date =>
                setFormData(prev => ({ ...prev, end_date: date || '' }))
              }
              placeholder="選擇日期"
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
            value={formData.group_size || ''}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                group_size: e.target.value ? parseInt(e.target.value, 10) : null,
              }))
            }
            placeholder="人數"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            備註
          </label>
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="套件相關備註..."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  )
}
