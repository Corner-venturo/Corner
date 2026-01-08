'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { Checkbox } from '@/components/ui/checkbox'
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
  const { destinations, countries, loading: destinationsLoading } = useTourDestinations()

  const [tourName, setTourName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [airportCode, setAirportCode] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 訂單資訊（選填）
  const [createOrder, setCreateOrder] = useState(true)
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')

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
      // 團名：優先用套件版本名稱，否則用提案標題
      setTourName(pkg.version_name || proposal.title || '')
      setDepartureDate(pkg.start_date || proposal.expected_start_date || '')

      // 聯絡人資訊：從提案帶入
      setContactPerson(proposal.customer_name || '')
      setContactPhone(proposal.customer_phone || '')

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
      setTourName('')
      setContactPerson('')
      setContactPhone('')
    }
  }, [pkg, proposal, open, countries, initialized])

  // 當國家改變時（使用者手動選擇），清空機場代碼
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country)
    if (initialized) {
      // 只有初始化後的使用者操作才清空
      setAirportCode('')
    }
  }

  const handleSubmit = async () => {
    if (!pkg || !user?.workspace_id || !user?.id) {
      await alert('無法取得資訊', 'error')
      return
    }

    if (!tourName.trim()) {
      await alert('請輸入團名', 'warning')
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

    // 如果勾選建立訂單，則聯絡人為必填
    if (createOrder && !contactPerson.trim()) {
      await alert('請輸入聯絡人', 'warning')
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
          tour_name: tourName.trim(),
          // 只有勾選建立訂單時才傳入聯絡人資訊
          contact_person: createOrder ? contactPerson.trim() : undefined,
          contact_phone: createOrder && contactPhone.trim() ? contactPhone.trim() : undefined,
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
      submitLabel={createOrder ? '確認開團並建立訂單' : '確認開團'}
      loading={submitting}
      maxWidth="lg"
      nested
    >
      <div className="space-y-4">
        {/* 套件資訊 */}
        <div className="p-3 bg-morandi-container/30 rounded-lg">
          <div className="text-xs text-morandi-secondary mb-1">即將轉開團的套件</div>
          <div className="font-medium text-morandi-primary">{pkg?.version_name}</div>
          {pkg?.destination && (
            <span className="text-sm text-morandi-secondary ml-2">
              ({pkg.destination})
            </span>
          )}
        </div>

        {/* 左右兩欄 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 左欄：開團資訊 */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-morandi-gold border-b border-morandi-gold/30 pb-1">
              開團資訊
            </div>

            {/* 團名 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-1 block">
                團名 <span className="text-morandi-red">*</span>
              </label>
              <Input
                value={tourName}
                onChange={e => setTourName(e.target.value)}
                placeholder="輸入團名..."
              />
            </div>

            {/* 國家選擇 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-1 block">
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
              <label className="text-sm font-medium text-morandi-primary mb-1 block">
                機場代碼 <span className="text-morandi-red">*</span>
              </label>
              <Combobox
                value={airportCode}
                onChange={setAirportCode}
                options={airportOptions}
                placeholder={selectedCountry ? "選擇機場代碼..." : "請先選擇國家"}
                disabled={!selectedCountry}
                showSearchIcon
                emptyMessage="尚無此國家的機場代碼"
              />
              <p className="text-xs text-morandi-secondary mt-1">
                用於生成團號，例如：CNX250128A
              </p>
            </div>

            {/* 出發日期 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-1 block">
                出發日期 <span className="text-morandi-red">*</span>
              </label>
              <DatePicker
                value={departureDate}
                onChange={date => setDepartureDate(date || '')}
                placeholder="選擇出發日期"
              />
            </div>
          </div>

          {/* 右欄：訂單資訊（選填） */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-1">
              <Checkbox
                id="create-order"
                checked={createOrder}
                onCheckedChange={(checked) => setCreateOrder(checked === true)}
              />
              <label
                htmlFor="create-order"
                className="text-sm font-medium text-morandi-primary cursor-pointer"
              >
                同時建立訂單
              </label>
              <span className="text-xs text-morandi-secondary">（選填）</span>
            </div>

            {createOrder && (
              <>
                {/* 聯絡人 */}
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-1 block">
                    聯絡人 <span className="text-morandi-red">*</span>
                  </label>
                  <Input
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="輸入聯絡人姓名..."
                  />
                </div>

                {/* 聯絡電話 */}
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-1 block">
                    聯絡電話
                  </label>
                  <Input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="輸入聯絡電話..."
                  />
                </div>

                <p className="text-xs text-morandi-secondary">
                  訂單將自動關聯到此旅遊團
                </p>
              </>
            )}

            {!createOrder && (
              <div className="text-sm text-morandi-secondary py-4 text-center">
                不建立訂單，僅開團
              </div>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="p-3 bg-status-warning-bg rounded-lg border border-status-warning/30 text-sm">
          <ul className="text-morandi-secondary space-y-0.5">
            <li>• 轉開團後，此提案將標記為「已轉團」</li>
            <li>• 套件關聯的報價單和行程表將自動綁定</li>
          </ul>
        </div>
      </div>
    </FormDialog>
  )
}
