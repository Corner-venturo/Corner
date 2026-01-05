'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { useAuthStore } from '@/stores'
import { alert } from '@/lib/ui/alert-dialog'
import { convertToTour } from '@/services/proposal.service'
import { useTourDestinations } from '@/features/tours/hooks/useTourDestinations'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'

interface ConvertToTourDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: Proposal
  package: ProposalPackage | null
  onSuccess: () => void
}

export function ConvertToTourDialog({
  open,
  onOpenChange,
  proposal,
  package: pkg,
  onSuccess,
}: ConvertToTourDialogProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  // 使用 tour_destinations 資料
  const { destinations, countries, loading: destinationsLoading, addDestination } = useTourDestinations()

  const [selectedCountry, setSelectedCountry] = useState('')
  const [airportCode, setAirportCode] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 新增機場代碼
  const [showAddAirport, setShowAddAirport] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newAirportCode, setNewAirportCode] = useState('')

  // 國家選項
  const countryOptions = useMemo(() =>
    countries.map(c => ({ value: c, label: c })),
    [countries]
  )

  // 根據選擇的國家取得機場代碼選項
  const airportOptions = useMemo(() => {
    if (!selectedCountry) return []
    return destinations
      .filter(d => d.country === selectedCountry)
      .map(d => ({
        value: d.airport_code,
        label: `${d.airport_code} - ${d.city}`,
      }))
  }, [selectedCountry, destinations])

  // 初始化 - 從套件自動帶入資料
  useEffect(() => {
    if (open && pkg && countries.length > 0 && !initialized) {
      setDepartureDate(pkg.start_date || proposal.expected_start_date || '')

      // 從套件的 country_id (存放國家名稱) 自動選擇國家
      if (pkg.country_id && countries.includes(pkg.country_id)) {
        setSelectedCountry(pkg.country_id)
        // 從套件的 main_city_id (存放機場代碼) 自動選擇
        if (pkg.main_city_id) {
          setAirportCode(pkg.main_city_id)
        }
      }
      setInitialized(true)
    }
    // 關閉對話框時重置初始化狀態
    if (!open) {
      setInitialized(false)
    }
  }, [pkg, proposal, open, countries, initialized])

  // 當國家改變時（使用者手動選擇），清空機場代碼
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country)
    if (initialized) {
      // 只有初始化後的使用者操作才清空
      setAirportCode('')
      setShowAddAirport(false)
    }
  }

  // 新增機場代碼
  const handleAddAirport = async () => {
    if (!selectedCountry || !newCity.trim() || !newAirportCode.trim()) {
      await alert('請填寫城市名稱和機場代碼', 'warning')
      return
    }

    if (!/^[A-Z]{3}$/.test(newAirportCode.trim().toUpperCase())) {
      await alert('機場代碼必須是 3 個大寫英文字母', 'warning')
      return
    }

    const result = await addDestination(selectedCountry, newCity.trim(), newAirportCode.trim())
    if (result.success) {
      setAirportCode(newAirportCode.trim().toUpperCase())
      setNewCity('')
      setNewAirportCode('')
      setShowAddAirport(false)
      await alert('已新增機場代碼', 'success')
    } else {
      await alert(result.error || '新增失敗', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!pkg || !user?.workspace_id || !user?.id) {
      await alert('無法取得資訊', 'error')
      return
    }

    if (!airportCode) {
      await alert('請選擇機場代碼', 'warning')
      return
    }

    if (!departureDate) {
      await alert('請選擇出發日期', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const result = await convertToTour(
        {
          proposal_id: proposal.id,
          package_id: pkg.id,
          city_code: airportCode,
          departure_date: departureDate,
        },
        user.workspace_id,
        user.id
      )

      await alert(`轉開團成功！團號：${result.tour_code}`, 'success')

      // 關閉對話框
      onOpenChange(false)

      // 通知父元件成功
      onSuccess()

      // 導向旅遊團頁面
      router.push(`/tours?highlight=${result.tour_id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '轉開團失敗'
      await alert(message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="轉開團"
      onSubmit={handleSubmit}
      submitLabel="確認開團"
      loading={submitting}
      maxWidth="md"
      nested
    >
      <div className="space-y-4">
        <div className="p-4 bg-morandi-container/30 rounded-lg">
          <div className="text-sm text-morandi-secondary mb-2">即將轉開團的套件</div>
          <div className="font-medium text-morandi-primary">{pkg?.version_name}</div>
          {pkg?.destination && (
            <div className="text-sm text-morandi-secondary mt-1">
              目的地：{pkg.destination}
            </div>
          )}
        </div>

        {/* 國家選擇 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            國家 <span className="text-morandi-red">*</span>
          </label>
          <Combobox
            value={selectedCountry}
            onChange={handleCountryChange}
            options={countryOptions}
            placeholder={destinationsLoading ? "載入中..." : "選擇國家..."}
            showSearchIcon
          />
        </div>

        {/* 機場代碼選擇 */}
        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            機場代碼 (IATA) <span className="text-morandi-red">*</span>
          </label>
          <Combobox
            value={airportCode}
            onChange={setAirportCode}
            options={airportOptions}
            placeholder={selectedCountry ? "選擇機場代碼..." : "請先選擇國家"}
            disabled={!selectedCountry}
            showSearchIcon
            emptyMessage={selectedCountry ? "尚無機場代碼，請點擊下方新增" : "請先選擇國家"}
          />
          <p className="text-xs text-morandi-secondary mt-1">
            機場代碼將用於生成團號，例如：CNX250128A
          </p>
        </div>

        {/* 新增機場代碼區塊 */}
        {selectedCountry && (
          <div className="border border-dashed border-border rounded-lg p-3">
            {!showAddAirport ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAirport(true)}
                className="w-full text-morandi-secondary hover:text-morandi-primary"
              >
                <Plus size={16} className="mr-1" />
                新增 {selectedCountry} 的機場代碼
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium text-morandi-primary">
                  新增 {selectedCountry} 的機場代碼
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="城市名稱（如：金澤）"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                  />
                  <Input
                    placeholder="機場代碼（如：KMQ）"
                    value={newAirportCode}
                    onChange={e => setNewAirportCode(e.target.value.toUpperCase())}
                    maxLength={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAirport}
                    className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                  >
                    確認新增
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddAirport(false)
                      setNewCity('')
                      setNewAirportCode('')
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            出發日期 <span className="text-morandi-red">*</span>
          </label>
          <DatePicker
            value={departureDate}
            onChange={date => setDepartureDate(date || '')}
            placeholder="選擇出發日期"
          />
        </div>

        <div className="p-4 bg-status-warning-bg rounded-lg border border-status-warning/30">
          <div className="text-sm font-medium text-status-warning mb-1">
            注意事項
          </div>
          <ul className="text-sm text-morandi-secondary space-y-1">
            <li>- 轉開團後，此提案將標記為「已轉團」狀態</li>
            <li>- 套件關聯的報價單和行程表將自動綁定到新旅遊團</li>
            <li>- 此操作無法撤銷，請確認資訊正確後再執行</li>
          </ul>
        </div>
      </div>
    </FormDialog>
  )
}
