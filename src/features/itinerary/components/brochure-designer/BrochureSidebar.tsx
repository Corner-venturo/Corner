'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Calendar, MapPin } from 'lucide-react'
import { AirportImageLibrary } from '@/components/editor/tour-form/sections/cover/AirportImageLibrary'
import type { BrochureCoverData } from './types'

interface BrochureSidebarProps {
  data: BrochureCoverData
  onChange: (data: Partial<BrochureCoverData>) => void
}

export function BrochureSidebar({ data, onChange }: BrochureSidebarProps) {
  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto">
      {/* 標題 */}
      <div>
        <h3 className="text-lg font-bold text-morandi-primary mb-1">封面設定</h3>
        <p className="text-sm text-morandi-secondary">編輯手冊封面資訊</p>
      </div>

      {/* 表單欄位 */}
      <div className="flex flex-col gap-4">
        {/* 客戶名稱 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
            <Building2 size={14} className="text-morandi-gold" />
            客戶名稱 / 團體名稱
          </Label>
          <Input
            value={data.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="如：Acme Corp 年度旅遊"
            className="h-10"
          />
        </div>

        {/* 國家 + 城市 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">國家</Label>
            <Input
              value={data.country}
              onChange={(e) => onChange({ country: e.target.value.toUpperCase() })}
              placeholder="如：JAPAN"
              className="h-10 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-morandi-primary">城市</Label>
            <Input
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value.toUpperCase() })}
              placeholder="如：KYOTO"
              className="h-10 uppercase"
            />
          </div>
        </div>

        {/* 機場代碼 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
            <MapPin size={14} className="text-morandi-gold" />
            機場代碼 (IATA)
          </Label>
          <Input
            value={data.airportCode}
            onChange={(e) => onChange({ airportCode: e.target.value.toUpperCase() })}
            placeholder="如：KIX、CNX、BKK"
            className="h-10 uppercase"
            maxLength={3}
          />
          <p className="text-xs text-morandi-secondary">
            輸入機場代碼以載入對應的封面圖片庫
          </p>
        </div>

        {/* 旅遊日期 */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary flex items-center gap-1.5">
            <Calendar size={14} className="text-morandi-gold" />
            旅遊日期
          </Label>
          <Input
            value={data.travelDates}
            onChange={(e) => onChange({ travelDates: e.target.value })}
            placeholder="如：2024.10.15 - 2024.10.22"
            className="h-10"
          />
        </div>
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 封面圖片選擇 */}
      <div>
        <AirportImageLibrary
          airportCode={data.airportCode}
          selectedImage={data.coverImage}
          onImageSelect={(url) => onChange({ coverImage: url })}
          onImageUpload={(url) => onChange({ coverImage: url })}
          position={data.coverImagePosition}
          onPositionChange={(pos) => onChange({ coverImagePosition: pos })}
        />
      </div>

      {/* 分隔線 */}
      <div className="h-px bg-border" />

      {/* 公司資訊 */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-morandi-primary">公司資訊</h4>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">公司名稱</Label>
          <Input
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="角落旅行社"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">緊急聯絡電話</Label>
          <Input
            value={data.emergencyContact}
            onChange={(e) => onChange({ emergencyContact: e.target.value })}
            placeholder="+886 2-2345-6789"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-morandi-primary">緊急聯絡 Email</Label>
          <Input
            value={data.emergencyEmail}
            onChange={(e) => onChange({ emergencyEmail: e.target.value })}
            placeholder="service@corner.travel"
            className="h-10"
          />
        </div>
      </div>
    </div>
  )
}
