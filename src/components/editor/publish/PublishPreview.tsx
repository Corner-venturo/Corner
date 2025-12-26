'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Link2, Check, Copy, ExternalLink } from 'lucide-react'

interface PublishPreviewProps {
  shareUrl: string | null
  copied: boolean
  onCopy: () => void
}

export function PublishPreview({ shareUrl, copied, onCopy }: PublishPreviewProps) {
  if (!shareUrl) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
        >
          <Link2 size={14} className="mr-1.5" />
          連結
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="space-y-2">
          <div className="text-sm font-medium text-morandi-primary">分享連結</div>
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="text-xs h-8 bg-muted"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 flex-shrink-0"
              onClick={onCopy}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 flex-shrink-0"
              asChild
            >
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
          <p className="text-xs text-morandi-secondary">
            此連結可分享給客戶，無需登入即可查看行程
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
