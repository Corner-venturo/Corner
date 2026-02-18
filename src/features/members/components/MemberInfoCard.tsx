'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageIcon, X } from 'lucide-react'
import type { EditingMember } from '../hooks/useMemberView'
import { MEMBERS_LABELS } from './constants/labels'

interface MemberInfoCardProps {
  open: boolean
  member: EditingMember | null
  onClose: () => void
}

export function MemberInfoCard({ open, member, onClose }: MemberInfoCardProps) {
  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent level={1} className="max-w-3xl max-h-[90vh] overflow-hidden [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            {member.name || member.chinese_name} 的護照
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon" aria-label="Close"
            className="absolute right-2 top-2 z-10 bg-card/80 hover:bg-card"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
          {member.passport_image_url ? (
            <div className="relative w-full max-h-[70vh] overflow-auto">
              <img src={member.passport_image_url}
                alt={`${member.name || member.chinese_name} 的護照`}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-morandi-background rounded-lg">
              <p className="text-morandi-secondary">{MEMBERS_LABELS.NOT_FOUND_7442}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-morandi-background p-4 rounded-lg">
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_883}</span>
            <span>{member.name || member.chinese_name}</span>
          </div>
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_8345}</span>
            <span>{member.name_en || member.passport_name || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_9593}</span>
            <span>{member.passport_number || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_3311}</span>
            <span>{member.passport_expiry || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_94}</span>
            <span>{member.birth_date || member.birth_date || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-morandi-secondary">{MEMBERS_LABELS.LABEL_8424}</span>
            <span>
              {member.gender === 'M'
                ? '男'
                : member.gender === 'F'
                ? '女'
                : '-'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
