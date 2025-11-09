/**
 * 新增頻道 Dialog
 */

import { Hash, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateChannelDialogProps {
  isOpen: boolean
  channelName: string
  channelDescription: string
  channelType: 'public' | 'private'
  onChannelNameChange: (name: string) => void
  onChannelDescriptionChange: (desc: string) => void
  onChannelTypeChange: (type: 'public' | 'private') => void
  onClose: () => void
  onCreate: () => void
}

export function CreateChannelDialog({
  isOpen,
  channelName,
  channelDescription,
  channelType,
  onChannelNameChange,
  onChannelDescriptionChange,
  onChannelTypeChange,
  onClose,
  onCreate,
}: CreateChannelDialogProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="card-morandi-elevated w-96">
        <h3 className="font-semibold mb-4 text-morandi-primary">建立頻道</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">頻道名稱</label>
            <input
              type="text"
              placeholder="例如：專案討論"
              value={channelName}
              onChange={e => onChannelNameChange(e.target.value)}
              autoFocus
              className="input-morandi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              頻道描述（選填）
            </label>
            <textarea
              placeholder="說明這個頻道的用途"
              value={channelDescription}
              onChange={e => onChannelDescriptionChange(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-2">頻道類型</label>
            <div className="flex gap-2">
              <button
                onClick={() => onChannelTypeChange('public')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border transition-colors text-sm',
                  channelType === 'public'
                    ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-primary'
                    : 'border-morandi-gold/20 text-morandi-secondary hover:border-morandi-gold/40'
                )}
              >
                <Hash size={16} className="inline mr-1" />
                公開
              </button>
              <button
                onClick={() => onChannelTypeChange('private')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg border transition-colors text-sm',
                  channelType === 'private'
                    ? 'border-morandi-gold bg-morandi-gold/10 text-morandi-primary'
                    : 'border-morandi-gold/20 text-morandi-secondary hover:border-morandi-gold/40'
                )}
              >
                <Lock size={16} className="inline mr-1" />
                私密
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <button className="btn-morandi-secondary !py-1.5 !px-3 text-sm" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-morandi-primary !py-1.5 !px-3 text-sm"
            onClick={onCreate}
            disabled={!channelName.trim()}
          >
            建立
          </button>
        </div>
      </div>
    </div>
  )
}
