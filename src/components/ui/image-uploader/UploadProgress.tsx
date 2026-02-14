'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { IMAGE_UPLOADER_LABELS } from './constants/labels'

export interface UploadProgressProps {
  uploading: boolean
  current?: number
  total?: number
}

export function UploadProgress({ uploading, current, total }: UploadProgressProps) {
  if (!uploading) return null

  return (
    <div className="flex items-center gap-2 text-sm text-morandi-secondary">
      <Loader2 size={16} className="animate-spin text-morandi-gold" />
      <span>
        {IMAGE_UPLOADER_LABELS.UPLOADING_2213}
        {current !== undefined && total !== undefined && ` (${current}/${total})`}
      </span>
    </div>
  )
}
