/**
 * ProposalsListSection - 提案列表
 * 用於在旅遊團「全部」頁籤顯示提案（與旅遊團列表整合）
 */

'use client'

import React, { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { useProposals } from '@/hooks/cloud-hooks'
import { DateCell } from '@/components/table-cells'
import type { Proposal, ProposalStatus } from '@/types/proposal.types'

// 狀態配色（與旅遊團風格一致）
const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'text-morandi-secondary',
  negotiating: 'text-status-info',
  converted: 'text-morandi-green',
  archived: 'text-morandi-muted',
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
    return null
  }

  return (
    <>
      {filteredProposals.map(proposal => (
        <tr
          key={proposal.id}
          onClick={() => onProposalClick(proposal)}
          className="border-b border-border/60 hover:bg-morandi-gold/5 cursor-pointer transition-colors"
        >
          {/* 團號（提案編號） */}
          <td className="px-4 py-3">
            <span className="text-sm text-morandi-primary">{proposal.code}</span>
          </td>

          {/* 旅遊團名稱（提案名稱） */}
          <td className="px-4 py-3">
            <span className="text-sm text-morandi-primary">{proposal.title}</span>
          </td>

          {/* 出發日期 */}
          <td className="px-4 py-3">
            <DateCell date={proposal.expected_start_date} showIcon={false} />
          </td>

          {/* 回程日期 */}
          <td className="px-4 py-3">
            <DateCell date={proposal.expected_end_date} fallback="-" showIcon={false} />
          </td>

          {/* 狀態 */}
          <td className="px-4 py-3">
            <span className={`text-sm font-medium ${STATUS_COLORS[proposal.status]}`}>
              {STATUS_LABELS[proposal.status]}
            </span>
          </td>

          {/* 操作欄（箭頭） */}
          <td className="px-4 py-3">
            <ChevronRight className="w-4 h-4 text-morandi-secondary" />
          </td>
        </tr>
      ))}
    </>
  )
}
