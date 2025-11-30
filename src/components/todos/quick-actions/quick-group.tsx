'use client'

import React, { useState } from 'react'

import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleDateInput } from '@/components/ui/simple-date-input'
import { Combobox } from '@/components/ui/combobox'
import { DestinationSelector } from '@/components/shared/destination-selector'
import { useTourStore, useOrderStore } from '@/stores'
import { useUserStore } from '@/stores/user-store'
import { useAuthStore } from '@/stores/auth-store'

interface QuickGroupProps {
  onSubmit?: () => void
}

export function QuickGroup({ onSubmit }: QuickGroupProps) {
  const tourStore = useTourStore()
  const orderStore = useOrderStore()
  const { items: employees } = useUserStore()
  const { currentProfile } = useAuthStore()
  const [submitting, setSubmitting] = useState(false)

  const [newTour, setNewTour] = useState({
    name: '',
    countryCode: '',
    cityCode: '',
    customLocation: '',
    departure_date: '',
    return_date: '',
    price: 0,
    max_participants: undefined as number | undefined,
    description: '',
    isSpecial: false,
  })

  const currentUserName = currentProfile?.display_name || currentProfile?.english_name || ''

  const [newOrder, setNewOrder] = useState({
    contact_person: '',
    sales_person: currentUserName,
    assistant: '',
    member_count: undefined as number | undefined,
    total_amount: 0,
  })

  // 篩選業務人員和助理
  const salesPersons = employees.filter(emp => emp.status === 'active')
  const assistants = employees.filter(emp => emp.status === 'active')

  const handleSubmit = async () => {
    if (!newTour.name.trim() || !newTour.departure_date || !newTour.return_date) {
      alert('請填寫必填欄位（團名、出發日期、返回日期）')
      return
    }

    if (!newTour.countryCode) {
      alert('請選擇國家/地區')
      return
    }

    if (newTour.countryCode !== '__custom__' && !newTour.cityCode) {
      alert('請選擇城市')
      return
    }

    if (newTour.countryCode === '__custom__' && !newTour.customLocation) {
      alert('請輸入自訂目的地')
      return
    }

    setSubmitting(true)
    try {
      const tourData = {
        name: newTour.name,
        country_code: newTour.countryCode === '__custom__' ? '__custom__' : newTour.countryCode,
        city_code: newTour.countryCode === '__custom__' ? '__custom__' : newTour.cityCode,
        custom_location: newTour.countryCode === '__custom__' ? newTour.customLocation : null,
        departure_date: newTour.departure_date,
        return_date: newTour.return_date,
        price: newTour.price,
        max_participants: newTour.max_participants || 20,
        description: newTour.description,
        status: 'draft' as const,
        contract_status: 'pending' as const,
        total_revenue: 0,
        total_cost: 0,
        profit: 0,
      }

      const createdTour = await tourStore.create(tourData)

      // 如果有填寫聯絡人，同時建立訂單
      if (newOrder.contact_person.trim()) {
        const orderData = {
          tour_id: createdTour.id,
          code: createdTour.code,
          tour_name: createdTour.name,
          contact_person: newOrder.contact_person,
          sales_person: newOrder.sales_person || '未指派',
          assistant: newOrder.assistant || '未指派',
          member_count: newOrder.member_count || 1,
          total_amount: newOrder.total_amount,
          paid_amount: 0,
          remaining_amount: newOrder.total_amount,
          payment_status: 'unpaid' as const,
        }

        await orderStore.create(orderData)
      }

      // 重置表單
      setNewTour({
        name: '',
        countryCode: '',
        cityCode: '',
        customLocation: '',
        departure_date: '',
        return_date: '',
        price: 0,
        max_participants: 20,
        description: '',
        isSpecial: false,
      })
      setNewOrder({
        contact_person: '',
        sales_person: '',
        assistant: '',
        member_count: 1,
        total_amount: 0,
      })

      alert(newOrder.contact_person ? '成功建立旅遊團和訂單！' : '成功建立旅遊團！')
      onSubmit?.()
    } catch (error) {
      alert('建立失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 旅遊團資訊 */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">
            旅遊團名稱 <span className="text-morandi-red">*</span>
          </label>
          <Input
            value={newTour.name}
            onChange={e => setNewTour(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如：東京五日遊"
            className="border-morandi-container/30"
          />
        </div>

        <DestinationSelector
          countryCode={newTour.countryCode}
          cityCode={newTour.cityCode}
          customLocation={newTour.customLocation}
          onCountryChange={(countryCode, cities) => {
            setNewTour(prev => ({
              ...prev,
              countryCode,
              cityCode: countryCode === '__custom__' ? '__custom__' : cities[0]?.code || '',
              customLocation: '',
            }))
          }}
          onCityChange={cityCode => setNewTour(prev => ({ ...prev, cityCode }))}
          onCustomLocationChange={customLocation =>
            setNewTour(prev => ({ ...prev, customLocation }))
          }
          showCustomFields={false}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-morandi-secondary mb-2 block">
              出發日期 <span className="text-morandi-red">*</span>
            </label>
            <SimpleDateInput
              value={newTour.departure_date}
              onChange={departure_date => {
                setNewTour(prev => {
                  const newReturnDate =
                    prev.return_date && prev.return_date < departure_date
                      ? departure_date
                      : prev.return_date
                  return { ...prev, departure_date, return_date: newReturnDate }
                })
              }}
              min={new Date().toISOString().split('T')[0]}
              className="border-morandi-container/30"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-secondary mb-2 block">
              返回日期 <span className="text-morandi-red">*</span>
            </label>
            <SimpleDateInput
              value={newTour.return_date}
              onChange={return_date => {
                setNewTour(prev => ({ ...prev, return_date }))
              }}
              min={newTour.departure_date || new Date().toISOString().split('T')[0]}
              className="border-morandi-container/30"
              required
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isSpecial-quick"
            checked={newTour.isSpecial}
            onChange={e => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="isSpecial-quick" className="text-sm text-morandi-primary">
            特殊團
          </label>
        </div>
      </div>

      {/* 訂單資訊（選填） */}
      <div className="border-t border-morandi-container/30 pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-morandi-primary">同時新增訂單（選填）</h4>

        <div>
          <label className="text-sm font-medium text-morandi-secondary mb-2 block">聯絡人</label>
          <Input
            value={newOrder.contact_person}
            onChange={e => setNewOrder(prev => ({ ...prev, contact_person: e.target.value }))}
            placeholder="留空則不建立訂單"
            className="border-morandi-container/30"
          />
        </div>

        {newOrder.contact_person && (
          <>
            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                業務人員
              </label>
              <Combobox
                value={newOrder.sales_person}
                onChange={sales_person => setNewOrder(prev => ({ ...prev, sales_person }))}
                options={salesPersons.map(emp => ({
                  value: emp.display_name || emp.english_name || '',
                  label: emp.display_name || emp.english_name || '',
                }))}
                placeholder="選擇業務人員..."
                emptyMessage="找不到員工"
                showSearchIcon={true}
                showClearButton={true}
                className="border-morandi-container/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-secondary mb-2 block">助理</label>
              <Combobox
                value={newOrder.assistant}
                onChange={assistant => setNewOrder(prev => ({ ...prev, assistant }))}
                options={assistants.map(emp => ({
                  value: emp.display_name || emp.english_name || '',
                  label: emp.display_name || emp.english_name || '',
                }))}
                placeholder="選擇助理..."
                emptyMessage="找不到員工"
                showSearchIcon={true}
                showClearButton={true}
                className="border-morandi-container/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  團員人數
                </label>
                <Input
                  type="number"
                  value={newOrder.member_count || ''}
                  onChange={e => {
                    const value = e.target.value
                    setNewOrder(prev => ({
                      ...prev,
                      member_count: value === '' ? undefined : Number(value),
                    }))
                  }}
                  placeholder="1"
                  min="0"
                  className="border-morandi-container/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-secondary mb-2 block">
                  訂單金額
                </label>
                <Input
                  type="number"
                  value={newOrder.total_amount}
                  onChange={e =>
                    setNewOrder(prev => ({ ...prev, total_amount: Number(e.target.value) }))
                  }
                  className="border-morandi-container/30"
                />
              </div>
            </div>
          </>
        )}

        <div className="bg-morandi-container/10 p-3 rounded-lg">
          <p className="text-xs text-morandi-secondary">
            提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
          </p>
        </div>
      </div>

      {/* 提交按鈕 */}
      <Button
        onClick={handleSubmit}
        disabled={
          submitting || !newTour.name.trim() || !newTour.departure_date || !newTour.return_date
        }
        className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white"
      >
        <Users size={16} className="mr-2" />
        {submitting ? '建立中...' : newOrder.contact_person ? '建立旅遊團 & 訂單' : '建立旅遊團'}
      </Button>
    </div>
  )
}
