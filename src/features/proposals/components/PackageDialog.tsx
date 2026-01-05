'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { useRegionsStore } from '@/stores'
import { useTourDestinations } from '@/features/tours/hooks/useTourDestinations'
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
  onSubmit,
}: PackageDialogProps) {
  // 國家用 useRegionsStore
  const { countries, fetchAll: fetchRegions } = useRegionsStore()
  // 機場代碼用 useTourDestinations
  const { destinations, addDestination, loading: destinationsLoading } = useTourDestinations()

  useEffect(() => {
    if (open && countries.length === 0) {
      fetchRegions()
    }
  }, [open, countries.length, fetchRegions])

  // 新增機場代碼狀態
  const [showAddNew, setShowAddNew] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newAirportCode, setNewAirportCode] = useState('')

  const initialFormData: FormData = useMemo(() => ({
    version_name: '',
    country: proposal.country_id || '',
    airport_code: proposal.main_city_id || '',
    start_date: proposal.expected_start_date || '',
    end_date: proposal.expected_end_date || '',
    days: null,
    nights: null,
    group_size: proposal.group_size || null,
    notes: '',
  }), [proposal])

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // 取得啟用的國家列表（從 useRegionsStore）
  const countryOptions = useMemo(() =>
    countries
      .filter(c => c.is_active)
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .map(c => ({
        value: c.name,  // 存國家名稱
        label: c.name,
      })),
    [countries]
  )

  // 根據選中的國家取得機場代碼列表（從 tour_destinations）
  const availableAirports = useMemo(() => {
    if (!formData.country) return []
    return destinations
      .filter(d => d.country === formData.country)
      .map(d => ({
        value: d.airport_code,
        label: `${d.city} (${d.airport_code})`,
      }))
  }, [formData.country, destinations])

  // 初始化表單資料
  useEffect(() => {
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
    } else {
      setFormData(initialFormData)
    }
  }, [mode, pkg, open, initialFormData])

  // 當國家改變時，清空機場代碼
  const handleCountryChange = (country: string) => {
    setFormData(prev => ({
      ...prev,
      country: country,
      airport_code: '', // 清空機場代碼
    }))
  }

  // 當機場代碼改變時
  const handleAirportChange = (airportCode: string) => {
    setFormData(prev => ({ ...prev, airport_code: airportCode }))
  }

  // 新增機場代碼
  const handleAddAirport = useCallback(async () => {
    if (!formData.country || !newCity.trim() || !newAirportCode.trim()) return

    const result = await addDestination(formData.country, newCity, newAirportCode)
    if (result.success) {
      // 自動選擇新增的機場代碼
      setFormData(prev => ({
        ...prev,
        airport_code: newAirportCode.trim().toUpperCase(),
      }))
      setShowAddNew(false)
      setNewCity('')
      setNewAirportCode('')
    }
  }, [formData.country, newCity, newAirportCode, addDestination])

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
      title={mode === 'create' ? '新增團體套件' : '編輯團體套件'}
      onSubmit={handleSubmit}
      submitLabel={mode === 'create' ? '建立' : '儲存'}
      loading={submitting}
      maxWidth="md"
      nested
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

        {/* 國家/機場代碼選擇 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              國家
            </label>
            <Combobox
              value={formData.country}
              onChange={handleCountryChange}
              options={countryOptions}
              placeholder="選擇國家..."
              emptyMessage="找不到符合的國家"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              機場代碼
            </label>
            <Combobox
              value={formData.airport_code}
              onChange={handleAirportChange}
              options={availableAirports}
              placeholder={destinationsLoading ? "載入中..." : "選擇機場代碼..."}
              emptyMessage={formData.country ? "尚無機場代碼，請點擊下方新增" : "請先選擇國家"}
              disabled={!formData.country}
            />
          </div>
        </div>

        {/* 新增機場代碼區塊 - 只有選了國家才能新增 */}
        {formData.country && (
          !showAddNew ? (
            <button
              type="button"
              onClick={() => setShowAddNew(true)}
              className="text-sm text-morandi-gold hover:text-morandi-gold-hover"
            >
              + 新增機場代碼
            </button>
          ) : (
            <div className="border border-border rounded-lg p-3 space-y-3 bg-morandi-container/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-morandi-primary">
                  新增 {formData.country} 的機場代碼
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNew(false)
                    setNewCity('')
                    setNewAirportCode('')
                  }}
                  className="text-morandi-secondary hover:text-morandi-primary text-sm"
                >
                  取消
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  placeholder="城市（如：東京）"
                />
                <Input
                  value={newAirportCode}
                  onChange={e => setNewAirportCode(e.target.value.toUpperCase())}
                  placeholder="代碼（如：NRT）"
                  maxLength={4}
                />
              </div>
              <button
                type="button"
                onClick={handleAddAirport}
                disabled={!newCity.trim() || !newAirportCode.trim()}
                className="w-full px-3 py-1.5 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                新增並選擇
              </button>
            </div>
          )
        )}

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
