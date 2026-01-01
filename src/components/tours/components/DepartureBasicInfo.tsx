'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TourDepartureData } from '@/types/tour-departure.types'

interface DepartureBasicInfoProps {
  data: TourDepartureData | null
  isEditing: boolean
  setData: (setter: (prev: TourDepartureData | null) => TourDepartureData | null) => void
}

export function DepartureBasicInfo({ data, isEditing, setData }: DepartureBasicInfoProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-morandi-primary mb-4">基本資訊</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label className="text-sm text-morandi-primary">隨團領隊</Label>
          {isEditing ? (
            <Input
              value={data?.tour_leader || ''}
              onChange={e => setData(prev => ({ ...prev!, tour_leader: e.target.value }))}
              placeholder="領隊姓名"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{data?.tour_leader || '-'}</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-morandi-primary">領隊聯絡方式</Label>
          {isEditing ? (
            <Input
              value={data?.tour_leader_contact || ''}
              onChange={e => setData(prev => ({ ...prev!, tour_leader_contact: e.target.value }))}
              placeholder="電話或 Email"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{data?.tour_leader_contact || '-'}</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-morandi-primary">承辦業務</Label>
          {isEditing ? (
            <Input
              value={data?.sales_person || ''}
              onChange={e => setData(prev => ({ ...prev!, sales_person: e.target.value }))}
              placeholder="業務姓名"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{data?.sales_person || '-'}</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-morandi-primary">助理人員</Label>
          {isEditing ? (
            <Input
              value={data?.assistant_person || ''}
              onChange={e => setData(prev => ({ ...prev!, assistant_person: e.target.value }))}
              placeholder="助理姓名"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{data?.assistant_person || '-'}</p>
          )}
        </div>
        <div className="col-span-2 md:col-span-4">
          <Label className="text-sm text-morandi-primary">航班資訊</Label>
          {isEditing ? (
            <Input
              value={data?.flight_info || ''}
              onChange={e => setData(prev => ({ ...prev!, flight_info: e.target.value }))}
              placeholder="去程／回程航班資訊"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-morandi-primary">{data?.flight_info || '-'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
