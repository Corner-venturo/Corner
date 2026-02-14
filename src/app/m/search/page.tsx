'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GlobalSearch } from '@/components/mobile/GlobalSearch'
import { SEARCH_LABELS } from './constants/labels'

export default function MobileSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/m"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-morandi-container transition-colors -ml-2"
          >
            <ArrowLeft size={20} className="text-morandi-primary" />
          </Link>
          <h1 className="text-lg font-bold text-morandi-primary">{SEARCH_LABELS.SEARCH}</h1>
        </div>
      </div>

      {/* 搜尋區域 */}
      <div className="p-4">
        <GlobalSearch autoFocus />
      </div>

      {/* 搜尋提示 */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-medium text-morandi-secondary mb-3">{SEARCH_LABELS.SEARCH_4837}</h3>
        <div className="space-y-2 text-sm text-morandi-secondary">
          <div className="flex items-start gap-2">
            <span className="text-morandi-gold">•</span>
            <span>輸入團號如 <span className="text-morandi-primary font-medium">CNX250128A</span> {SEARCH_LABELS.LABEL_1787}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-morandi-gold">•</span>
            <span>輸入成員姓名如 <span className="text-morandi-primary font-medium">{SEARCH_LABELS.LABEL_4921}</span> {SEARCH_LABELS.SEARCH_4129}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-morandi-gold">•</span>
            <span>輸入目的地如 <span className="text-morandi-primary font-medium">{SEARCH_LABELS.LABEL_7261}</span> {SEARCH_LABELS.SEARCH_9017}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-morandi-gold">•</span>
            <span>{SEARCH_LABELS.LABEL_1767}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
