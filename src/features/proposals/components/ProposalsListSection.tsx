/**
 * ProposalsListSection - 提案列表區塊
 * 用於在旅遊團「全部」頁籤顯示提案
 */

'use client'

import React, { useMemo } from 'react'
import { FileText, ChevronRight, Calendar, MapPin, Users } from 'lucide-react'
import { useProposals } from '@/hooks/cloud-hooks'
import type { Proposal, ProposalStatus } from '@/types/proposal.types'

// 狀態配色
const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'text-morandi-secondary bg-morandi-container',
  negotiating: 'text-status-info bg-status-info-bg',
  converted: 'text-morandi-green bg-morandi-green/10',
  archived: 'text-morandi-muted bg-morandi-muted/10',
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: '草稿',
  negotiating: '洽談中',
  converted: '已轉團',
  archived: '已封存',
}

interface ProposalsListSectionProps {
  searchQuery?: string
  onProposalClick: (proposal: Proposal) => void
}

export function ProposalsListSection({
  searchQuery = '',
  onProposalClick,
}: ProposalsListSectionProps) {
  const { items: proposals } = useProposals()

  // 篩選提案（只顯示未轉團、未封存的）
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // 排除已轉團和已封存的
      if (p.status === 'converted' || p.status === 'archived') return false
      // 搜尋過濾
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.code?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.customer_name?.toLowerCase().includes(q) ||
          p.destination?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [proposals, searchQuery])

  if (filteredProposals.length === 0) {
    return null // 沒有提案時不顯示區塊
  }

  return (
    <div className="border-b border-border bg-morandi-gold/5">
      {/* 區塊標題 */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
        <FileText className="w-4 h-4 text-morandi-gold" />
        <span className="text-sm font-medium text-morandi-primary">提案</span>
        <span className="text-xs text-morandi-secondary">({filteredProposals.length})</span>
      </div>

      {/* 提案列表 */}
      <div className="divide-y divide-border/30">
        {filteredProposals.map(proposal => (
          <button
            key={proposal.id}
            onClick={() => onProposalClick(proposal)}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-morandi-gold/10 transition-colors text-left"
          >
            {/* 提案編號 */}
            <div className="w-24 shrink-0">
              <span className="font-mono text-sm text-morandi-gold">{proposal.code}</span>
            </div>

            {/* 提案名稱 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-morandi-primary truncate">
                {proposal.title}
              </div>
              {proposal.customer_name && (
                <div className="text-xs text-morandi-secondary truncate">
                  {proposal.customer_name}
                </div>
              )}
            </div>

            {/* 目的地 */}
            {proposal.destination && (
              <div className="hidden md:flex items-center gap-1 text-xs text-morandi-secondary w-24 shrink-0">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{proposal.destination}</span>
              </div>
            )}

            {/* 日期 */}
            {proposal.expected_start_date && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-morandi-secondary w-32 shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{proposal.expected_start_date}</span>
              </div>
            )}

            {/* 人數 */}
            {proposal.group_size && (
              <div className="hidden lg:flex items-center gap-1 text-xs text-morandi-secondary w-16 shrink-0">
                <Users className="w-3 h-3" />
                <span>{proposal.group_size}人</span>
              </div>
            )}

            {/* 狀態 */}
            <div className="w-20 shrink-0">
              <span
                className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[proposal.status]}`}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>

            {/* 箭頭 */}
            <ChevronRight className="w-4 h-4 text-morandi-secondary shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
