import { CHAT_LABELS } from './constants/labels'
'use client'

interface UploadProgressProps {
  progress: number
}

export function UploadProgress({ progress }: UploadProgressProps) {
  if (progress === 0) return null

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-morandi-secondary">{CHAT_LABELS.UPLOADING_2341}</span>
        <span className="text-xs text-morandi-secondary">{progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-morandi-container/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-morandi-gold transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
