'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { useRegionsStore } from '@/stores'
import type {
  Proposal,
  CreateProposalData,
  UpdateProposalData,
} from '@/types/proposal.types'

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  proposal?: Proposal | null
  onSubmit: (data: CreateProposalData | UpdateProposalData) => Promise<void>
}

export function ProposalDialog({
  open,
  onOpenChange,
  mode,
  proposal,
  onSubmit,
}: ProposalDialogProps) {
  const [title, setTitle] = useState('')
  const [expectedStartDate, setExpectedStartDate] = useState('')
  const [countryId, setCountryId] = useState('')
  const [mainCityId, setMainCityId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 載入地區資料
  const { countries, fetchAll: fetchRegions, getCitiesByCountry } = useRegionsStore()

  useEffect(() => {
    if (open && countries.length === 0) {
      fetchRegions()
    }
  }, [open, countries.length, fetchRegions])

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
    if (!countryId) return []
    return getCitiesByCountry(countryId)
      .filter(c => c.is_active)
      .map(c => ({
        value: c.id,
        label: `${c.name}${c.airport_code ? ` (${c.airport_code})` : ''}`,
      }))
  }, [countryId, getCitiesByCountry])

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setTitle(proposal.title || '')
      setExpectedStartDate(proposal.expected_start_date || '')
      setCountryId(proposal.country_id || '')
      setMainCityId(proposal.main_city_id || '')
    } else {
      setTitle('')
      setExpectedStartDate('')
      setCountryId('')
      setMainCityId('')
    }
  }, [mode, proposal, open])

  // 當國家改變時，清空城市
  const handleCountryChange = (newCountryId: string) => {
    setCountryId(newCountryId)
    setMainCityId('')
  }

  // 處理提交
  const handleSubmit = async () => {
    // 至少需要出發日期和國家/城市
    if (!expectedStartDate || !countryId) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim() || undefined,
        expected_start_date: expectedStartDate,
        country_id: countryId,
        main_city_id: mainCityId || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? '新增提案' : '編輯提案'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? '建立' : '儲存'}
      loading={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* 出發日期 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            預計出發日期 <span className="text-morandi-red">*</span>
          </label>
          <DatePicker
            value={expectedStartDate}
            onChange={date => setExpectedStartDate(date || '')}
            placeholder="選擇日期"
          />
        </div>

        {/* 國家/城市 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              國家 <span className="text-morandi-red">*</span>
            </label>
            <Combobox
              value={countryId}
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
              value={mainCityId}
              onChange={setMainCityId}
              options={availableCities}
              placeholder="選擇城市..."
              emptyMessage={countryId ? "找不到符合的城市" : "請先選擇國家"}
              disabled={!countryId}
            />
          </div>
        </div>

        {/* 提案名稱（選填） */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            提案名稱（選填，可於開團時補填）
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例如：2026 泰北清邁家族旅遊"
          />
        </div>
      </div>
    </FormDialog>
  )
}
