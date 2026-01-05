'use client'

import { getTodayString } from '@/lib/utils/format-date'

import React from 'react'
import { Input } from '@/components/ui/input'
import { SimpleDateInput } from '@/components/ui/simple-date-input'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { NewTourData } from '../../types'

interface TourBasicInfoProps {
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
  countries: string[]
  destinationsLoading: boolean
  getCitiesByCountry: (country: string) => Array<{ city: string; airport_code: string }>
  openAddDestinationDialog: () => void
}

export function TourBasicInfo({
  newTour,
  setNewTour,
  countries,
  destinationsLoading,
  getCitiesByCountry,
  openAddDestinationDialog,
}: TourBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-morandi-primary">旅遊團名稱</label>
        <Input
          value={newTour.name}
          onChange={e => setNewTour(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1"
        />
      </div>

      {/* Destination selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">國家</label>
          <Combobox
            value={newTour.countryCode}
            onChange={country => {
              // 台灣團自動設定城市代碼為 TW，不需選城市
              const isTaiwan = country === '台灣'
              setNewTour(prev => ({
                ...prev,
                countryCode: country,
                cityCode: isTaiwan ? 'TW' : '',
                cityName: isTaiwan ? '台灣' : '',
              }))
            }}
            options={countries.map(country => ({
              value: country,
              label: country,
            }))}
            placeholder={destinationsLoading ? '載入中...' : '選擇國家...'}
            emptyMessage="找不到國家"
            showSearchIcon={true}
            showClearButton={true}
            className="mt-1"
          />
        </div>

        {/* 台灣團不需選城市 */}
        {newTour.countryCode !== '台灣' && (
          <div>
            <label className="text-sm font-medium text-morandi-primary">城市 (機場代碼)</label>
            <div className="flex gap-2 mt-1">
              {(() => {
                const citiesForCountry = newTour.countryCode ? getCitiesByCountry(newTour.countryCode) : []
                return (
                  <Combobox
                    value={newTour.cityCode}
                    onChange={cityCode => {
                      const selectedCity = citiesForCountry.find(c => c.airport_code === cityCode)
                      setNewTour(prev => ({
                        ...prev,
                        cityCode,
                        cityName: selectedCity?.city || cityCode
                      }))
                    }}
                    options={citiesForCountry.map(c => ({
                      value: c.airport_code,
                      label: `${c.city} (${c.airport_code})`,
                    }))}
                    placeholder={!newTour.countryCode ? '請先選擇國家' : '選擇城市...'}
                    emptyMessage="找不到城市"
                    showSearchIcon={true}
                    showClearButton={true}
                    disabled={!newTour.countryCode}
                    className="flex-1"
                  />
                )
              })()}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openAddDestinationDialog}
                disabled={!newTour.countryCode}
                className="h-9 px-2 shrink-0"
                title="新增城市"
              >
                +
              </Button>
            </div>
          </div>
        )}

        {/* 台灣團顯示提示 */}
        {newTour.countryCode === '台灣' && (
          <div className="flex items-center">
            <p className="text-sm text-morandi-secondary">國內旅遊不需選擇城市</p>
          </div>
        )}
      </div>

      {/* 顯示當前選擇的城市代碼（非台灣團）*/}
      {newTour.cityCode && newTour.countryCode !== '台灣' && (
        <p className="text-xs text-morandi-secondary">
          團號城市代碼：<span className="font-mono font-semibold">{newTour.cityCode}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-morandi-primary">出發日期</label>
          <SimpleDateInput
            value={newTour.departure_date}
            onChange={departure_date => {
              setNewTour(prev => {
                const newReturnDate =
                  prev.return_date && prev.return_date < departure_date
                    ? departure_date
                    : prev.return_date

                return {
                  ...prev,
                  departure_date,
                  return_date: newReturnDate,
                }
              })
            }}
            min={getTodayString()}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-morandi-primary">返回日期</label>
          <SimpleDateInput
            value={newTour.return_date}
            onChange={return_date => {
              setNewTour(prev => ({ ...prev, return_date }))
            }}
            min={newTour.departure_date || getTodayString()}
            defaultMonth={newTour.departure_date}
            className="mt-1"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-morandi-primary">描述</label>
        <Input
          value={newTour.description || ''}
          onChange={e => setNewTour(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1"
        />
      </div>
    </div>
  )
}
