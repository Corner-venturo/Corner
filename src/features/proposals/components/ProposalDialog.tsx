'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRegionsStore } from '@/stores/region-store'
import { useTourDestinations } from '@/features/tours/hooks/useTourDestinations'
import { toast } from 'sonner'
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
  const [country, setCountry] = useState('')
  const [airportCode, setAirportCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 新增目的地對話框
  const [showAddDestination, setShowAddDestination] = useState(false)
  const [newAirportCode, setNewAirportCode] = useState('')
  const [newCityName, setNewCityName] = useState('')
  const [addingDestination, setAddingDestination] = useState(false)

  // 載入國家資料（從 countries 表）
  const { countries, fetchCountries, incrementCountryUsage } = useRegionsStore()

  // 載入目的地資料（從 tour_destinations 表）
  const { destinations, addDestination, fetchDestinations } = useTourDestinations()

  // 使用 ref 追蹤是否已載入
  const hasLoadedCountries = useRef(false)

  // 初次載入國家（只執行一次）
  useEffect(() => {
    if (!hasLoadedCountries.current && countries.length === 0) {
      hasLoadedCountries.current = true
      fetchCountries()
    }
  }, [countries.length, fetchCountries])

  // 國家選項（按使用次數排序）
  const countryOptions = useMemo(() => {
    return [...countries]
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .map(c => ({
        value: c.name,
        label: c.name,
      }))
  }, [countries])

  // 根據選中的國家取得可用的目的地
  const availableDestinations = useMemo(() => {
    if (!country) return []
    return destinations
      .filter(d => d.country === country)
      .map(d => ({
        value: d.airport_code,
        label: `${d.airport_code} - ${d.city}`,
      }))
  }, [country, destinations])

  // 取得選中的機場代碼資訊
  const selectedDestination = useMemo(() => {
    return destinations.find(d => d.airport_code === airportCode && d.country === country)
  }, [destinations, airportCode, country])

  // 初始化表單資料
  useEffect(() => {
    if (mode === 'edit' && proposal) {
      setTitle(proposal.title || '')
      setExpectedStartDate(proposal.expected_start_date || '')
      // 從 destination 欄位反推國家和機場代碼
      if (proposal.destination) {
        const dest = destinations.find(d => d.airport_code === proposal.destination)
        if (dest) {
          setCountry(dest.country)
          setAirportCode(dest.airport_code)
        } else {
          // 如果找不到對應的目的地，保留原始值
          setAirportCode(proposal.destination)
        }
      }
    } else {
      setTitle('')
      setExpectedStartDate('')
      setCountry('')
      setAirportCode('')
    }
  }, [mode, proposal, open, destinations])

  // 當國家改變時，清空機場代碼
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setAirportCode('')
    // 增加使用次數（fire-and-forget，不等待）
    if (newCountry) {
      incrementCountryUsage(newCountry).catch(() => {})
    }
  }

  // 處理新增目的地
  const handleAddDestination = async () => {
    if (!newAirportCode || !newCityName || !country) {
      toast.error('請填寫完整資訊')
      return
    }

    setAddingDestination(true)
    try {
      const result = await addDestination(country, newCityName.trim(), newAirportCode.trim())
      if (result.success) {
        toast.success(`已新增目的地：${newCityName} (${newAirportCode})`)
        setAirportCode(newAirportCode.toUpperCase())
        setShowAddDestination(false)
        await fetchDestinations()
      } else {
        toast.error(result.error || '新增失敗')
      }
    } finally {
      setAddingDestination(false)
    }
  }

  // 處理提交
  const handleSubmit = async () => {
    // 至少需要出發日期和機場代碼
    if (!expectedStartDate || !airportCode) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim() || undefined,
        expected_start_date: expectedStartDate,
        // 存機場代碼到 destination 欄位
        destination: airportCode,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
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

          {/* 國家/機場代碼 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                國家 <span className="text-morandi-red">*</span>
              </label>
              <Combobox
                value={country}
                onChange={handleCountryChange}
                options={countryOptions}
                placeholder="選擇國家..."
                emptyMessage="無符合的國家"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                機場代碼 <span className="text-morandi-red">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    value={airportCode}
                    onChange={setAirportCode}
                    options={availableDestinations}
                    placeholder={country ? "選擇或新增..." : "請先選擇國家"}
                    emptyMessage={country ? "無符合的目的地" : "請先選擇國家"}
                    disabled={!country}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!country) {
                      toast.error('請先選擇國家')
                      return
                    }
                    setNewAirportCode('')
                    setNewCityName('')
                    setShowAddDestination(true)
                  }}
                  disabled={!country}
                  className="shrink-0"
                  title="新增目的地"
                >
                  <Plus size={16} />
                </Button>
              </div>
              {/* 輔助提示 */}
              {country && availableDestinations.length === 0 && (
                <p className="text-xs text-morandi-secondary mt-1">
                  此國家尚無目的地，請點擊 + 新增
                </p>
              )}
            </div>
          </div>

          {/* 顯示選中的目的地資訊 */}
          {selectedDestination && (
            <div className="text-sm text-morandi-secondary bg-morandi-container/30 px-3 py-2 rounded">
              目的地：{selectedDestination.city} ({selectedDestination.airport_code})
            </div>
          )}

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

      {/* 新增目的地對話框 */}
      <Dialog open={showAddDestination} onOpenChange={setShowAddDestination}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新增目的地</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-morandi-secondary">
              找不到機場代碼 <span className="font-mono font-bold text-morandi-gold">{newAirportCode}</span>，
              請輸入對應的城市名稱來新增：
            </p>
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                國家
              </label>
              <Input value={country} disabled />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                機場代碼
              </label>
              <Input
                value={newAirportCode}
                onChange={e => setNewAirportCode(e.target.value.toUpperCase())}
                placeholder="例如：KIX"
                maxLength={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                城市名稱 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={newCityName}
                onChange={e => setNewCityName(e.target.value)}
                placeholder="例如：大阪"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDestination(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleAddDestination}
                disabled={!newCityName.trim() || addingDestination}
                className="gap-2"
              >
                <Plus size={16} />
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
