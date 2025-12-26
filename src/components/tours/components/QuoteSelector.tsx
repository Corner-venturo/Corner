'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calculator, ExternalLink, Check } from 'lucide-react'
import type { Tour } from '@/types/tour.types'

interface LinkedQuoteInfo {
  id: string
  code: string | null
  name: string | null
  status: string | null
  total_amount: number | null
  created_at: string
}

interface QuoteSelectorProps {
  tour: Tour
  linkedQuotes: LinkedQuoteInfo[]
  selectedQuoteId: string | null
  showQuoteSelector: boolean
  setShowQuoteSelector: (show: boolean) => void
  onSelectQuote: (quoteId: string) => void
}

const formatQuoteStatus = (status: string | null) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'text-morandi-secondary' },
    pending: { label: '待審核', color: 'text-morandi-gold' },
    approved: { label: '已核准', color: 'text-morandi-green' },
    rejected: { label: '已拒絕', color: 'text-morandi-red' },
    sent: { label: '已發送', color: 'text-status-info' },
    confirmed: { label: '已確認', color: 'text-morandi-green' },
  }
  return statusMap[status || 'draft'] || { label: status || '未知', color: 'text-morandi-secondary' }
}

export function QuoteSelector({
  tour,
  linkedQuotes,
  selectedQuoteId,
  showQuoteSelector,
  setShowQuoteSelector,
  onSelectQuote,
}: QuoteSelectorProps) {
  return (
    <Dialog open={showQuoteSelector} onOpenChange={setShowQuoteSelector}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg text-morandi-primary flex items-center gap-2">
            <Calculator className="h-5 w-5 text-morandi-gold" />
            選擇報價單版本
          </DialogTitle>
          <DialogDescription className="text-morandi-secondary">
            此團有 {linkedQuotes.length} 個報價單版本，請選擇要帶入的版本
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {linkedQuotes.map((quote, index) => {
            const isSelected = selectedQuoteId === quote.id
            const statusInfo = formatQuoteStatus(quote.status)

            return (
              <button
                key={quote.id}
                onClick={() => onSelectQuote(quote.id)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-morandi-gold bg-morandi-gold/10'
                    : 'border-border hover:border-morandi-secondary/50 hover:bg-morandi-container/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-morandi-gold flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-morandi-gold">{quote.code || `版本 ${index + 1}`}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color} bg-current/10`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-morandi-primary mt-1">{quote.name || tour.name}</div>
                      <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                        <span>建立於 {new Date(quote.created_at).toLocaleDateString('zh-TW')}</span>
                        {quote.total_amount && (
                          <span className="font-medium">NT$ {quote.total_amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-morandi-secondary" />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setShowQuoteSelector(false)}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
