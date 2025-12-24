'use client'

import React from 'react'
import type { NewTourData } from '../../types'

interface TourSettingsProps {
  newTour: NewTourData
  setNewTour: React.Dispatch<React.SetStateAction<NewTourData>>
}

export function TourSettings({ newTour, setNewTour }: TourSettingsProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isSpecial"
          checked={newTour.isSpecial}
          onChange={e => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="isSpecial" className="text-sm text-morandi-primary">
          特殊團
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enableCheckin"
          checked={newTour.enable_checkin || false}
          onChange={e => setNewTour(prev => ({ ...prev, enable_checkin: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="enableCheckin" className="text-sm text-morandi-primary">
          開啟報到功能
        </label>
      </div>
    </div>
  )
}
