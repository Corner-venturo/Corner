'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Combobox } from '@/components/ui/combobox'
import { useAuthStore } from '@/stores'
import { alert } from '@/lib/ui/alert-dialog'
import { convertToTour } from '@/services/proposal.service'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'

// 常用機場代碼 (IATA)
const CITY_CODES = [
  { value: 'CNX', label: 'CNX - 清邁' },
  { value: 'BKK', label: 'BKK - 曼谷' },
  { value: 'HKT', label: 'HKT - 普吉島' },
  { value: 'DMK', label: 'DMK - 曼谷廊曼' },
  { value: 'SGN', label: 'SGN - 胡志明市' },
  { value: 'HAN', label: 'HAN - 河內' },
  { value: 'DAD', label: 'DAD - 峴港' },
  { value: 'REP', label: 'REP - 暹粒' },
  { value: 'RGN', label: 'RGN - 仰光' },
  { value: 'NRT', label: 'NRT - 東京成田' },
  { value: 'HND', label: 'HND - 東京羽田' },
  { value: 'KIX', label: 'KIX - 大阪關西' },
  { value: 'NGO', label: 'NGO - 名古屋' },
  { value: 'CTS', label: 'CTS - 札幌' },
  { value: 'OKA', label: 'OKA - 沖繩' },
  { value: 'FUK', label: 'FUK - 福岡' },
  { value: 'ICN', label: 'ICN - 首爾仁川' },
  { value: 'PVG', label: 'PVG - 上海浦東' },
  { value: 'PEK', label: 'PEK - 北京' },
  { value: 'HKG', label: 'HKG - 香港' },
  { value: 'MFM', label: 'MFM - 澳門' },
  { value: 'SIN', label: 'SIN - 新加坡' },
  { value: 'KUL', label: 'KUL - 吉隆坡' },
  { value: 'MNL', label: 'MNL - 馬尼拉' },
  { value: 'SZX', label: 'SZX - 深圳' },
]

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

  const [cityCode, setCityCode] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 初始化
  useEffect(() => {
    if (pkg) {
      setDepartureDate(pkg.start_date || proposal.expected_start_date || '')
    }
  }, [pkg, proposal, open])

  const handleSubmit = async () => {
    if (!pkg || !user?.workspace_id || !user?.id) {
      await alert('無法取得資訊', 'error')
      return
    }

    if (!cityCode) {
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
          city_code: cityCode,
          departure_date: departureDate,
        },
        user.workspace_id,
        user.id
      )

      await alert(`轉開團成功！團號：${result.tour_code}`, 'success')
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

        <div>
          <label className="text-sm font-medium text-morandi-primary mb-2 block">
            機場代碼 (IATA) <span className="text-morandi-red">*</span>
          </label>
          <Combobox
            value={cityCode}
            onChange={setCityCode}
            options={CITY_CODES}
            placeholder="選擇或搜尋機場代碼..."
            showSearchIcon
          />
          <p className="text-xs text-morandi-secondary mt-1">
            機場代碼將用於生成團號，例如：CNX250128A
          </p>
        </div>

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
