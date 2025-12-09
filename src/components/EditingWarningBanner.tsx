'use client'

import { AlertTriangle, Users } from 'lucide-react'
import { useEditingPresence } from '@/hooks/useEditingPresence'

interface EditingWarningBannerProps {
  resourceType: string
  resourceId: string
  resourceName?: string  // 資源名稱，例如「此行程」「此訂單」
}

/**
 * 編輯中警告橫幅
 * 當有其他人正在編輯同一份資源時顯示警告
 */
export function EditingWarningBanner({
  resourceType,
  resourceId,
  resourceName = '此頁面',
}: EditingWarningBannerProps) {
  const { otherEditors, isOtherEditing, currentEditors } = useEditingPresence({
    resourceType,
    resourceId,
    enabled: !!resourceId,
  })

  if (!isOtherEditing) {
    return null
  }

  const editorNames = otherEditors.map(e => e.name).join('、')

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">
          {editorNames} 正在編輯{resourceName}
        </p>
        <p className="text-xs text-amber-600 mt-1">
          同時編輯可能導致資料衝突，建議等對方編輯完成後再進行修改。
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-amber-600">
        <Users className="w-4 h-4" />
        <span>{currentEditors.length} 人在線</span>
      </div>
    </div>
  )
}
