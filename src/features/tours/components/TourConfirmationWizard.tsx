'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Tour } from '@/types/tour.types'
import { toast } from 'sonner'
import { QUOTE_STATUS_LABELS } from '@/constants/quote-status'
import {
  Lock,
  FileText,
  Map,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { DateCell, CurrencyCell } from '@/components/table-cells'

// 報價單資訊
interface QuoteInfo {
  id: string
  code: string | null
  name: string | null
  status: string | null
  total_amount: number | null
  created_at: string | null
  version?: number
}

// 行程資訊
interface ItineraryInfo {
  id: string
  title: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  version?: number
}

interface TourConfirmationWizardProps {
  tour: Tour
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed?: () => void
}

type WizardStep = 'quote' | 'itinerary' | 'confirm'

const STEPS: { key: WizardStep; label: string; icon: typeof FileText }[] = [
  { key: 'quote', label: '選擇報價單', icon: FileText },
  { key: 'itinerary', label: '選擇行程', icon: Map },
  { key: 'confirm', label: '確認鎖定', icon: Lock },
]

export function TourConfirmationWizard({
  tour,
  open,
  onOpenChange,
  onConfirmed,
}: TourConfirmationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('quote')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 資料狀態
  const [quotes, setQuotes] = useState<QuoteInfo[]>([])
  const [itineraries, setItineraries] = useState<ItineraryInfo[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)

  // 載入關聯的報價單和行程
  useEffect(() => {
    if (open) {
      loadData()
      // 重置選擇
      setCurrentStep('quote')
      setSelectedQuoteId(null)
      setSelectedItineraryId(null)
    }
  }, [open, tour.id])

  const loadData = async () => {
    setLoading(true)
    try {
      // 並行載入報價單和行程
      const [quotesRes, itinerariesRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, code, name, status, total_amount, created_at')
          .eq('tour_id', tour.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('itineraries')
          .select('id, title, status, created_at, updated_at')
          .eq('tour_id', tour.id)
          .order('updated_at', { ascending: false }),
      ])

      if (quotesRes.error) throw quotesRes.error
      if (itinerariesRes.error) throw itinerariesRes.error

      // 加上版本號
      const quotesWithVersion = (quotesRes.data || []).map((q, i, arr) => ({
        ...q,
        version: arr.length - i,
      }))
      const itinerariesWithVersion = (itinerariesRes.data || []).map((it, i, arr) => ({
        ...it,
        version: arr.length - i,
      }))

      setQuotes(quotesWithVersion)
      setItineraries(itinerariesWithVersion)

      // 預設選擇最新版本
      if (quotesWithVersion.length > 0) {
        setSelectedQuoteId(quotesWithVersion[0].id)
      }
      if (itinerariesWithVersion.length > 0) {
        setSelectedItineraryId(itinerariesWithVersion[0].id)
      }
    } catch (error) {
      logger.error('載入資料失敗:', error)
      toast.error('載入資料失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 'quote') {
      if (!selectedQuoteId && quotes.length > 0) {
        toast.error('請選擇報價單版本')
        return
      }
      setCurrentStep('itinerary')
    } else if (currentStep === 'itinerary') {
      if (!selectedItineraryId && itineraries.length > 0) {
        toast.error('請選擇行程版本')
        return
      }
      setCurrentStep('confirm')
    }
  }

  const handleBack = () => {
    if (currentStep === 'itinerary') {
      setCurrentStep('quote')
    } else if (currentStep === 'confirm') {
      setCurrentStep('itinerary')
    }
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const selectedQuote = quotes.find(q => q.id === selectedQuoteId)
      const selectedItinerary = itineraries.find(it => it.id === selectedItineraryId)

      // 更新 tour 狀態為進行中，並記錄鎖定的版本
      const { error } = await supabase
        .from('tours')
        .update({
          status: '進行中',
          locked_quote_id: selectedQuoteId,
          locked_quote_version: selectedQuote?.version || null,
          locked_itinerary_id: selectedItineraryId,
          locked_itinerary_version: selectedItinerary?.version || null,
          locked_at: new Date().toISOString(),
          // locked_by 需要從 auth 取得當前用戶
          updated_at: new Date().toISOString(),
        })
        .eq('id', tour.id)

      if (error) throw error

      toast.success('版本已鎖定！')
      onOpenChange(false)
      onConfirmed?.()
    } catch (error) {
      logger.error('鎖定失敗:', error)
      toast.error('鎖定失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId)
  const selectedItinerary = itineraries.find(it => it.id === selectedItineraryId)

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-morandi-gold" />
            確認精靈 - {tour.name}
          </DialogTitle>
          <DialogDescription>
            選擇要鎖定的報價單和行程版本，確認後將無法自由修改
          </DialogDescription>
        </DialogHeader>

        {/* 步驟指示器 */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = step.key === currentStep
            const isCompleted = index < currentStepIndex
            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                    isActive && 'bg-morandi-gold/20 text-morandi-gold font-medium',
                    isCompleted && 'bg-status-success-bg text-status-success',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            )
          })}
        </div>

        {/* 內容區域 */}
        <div className="min-h-[300px] py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Step 1: 選擇報價單 */}
              {currentStep === 'quote' && (
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    選擇報價單版本
                  </h3>
                  {quotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>此團尚無報價單</p>
                      <p className="text-sm">可跳過此步驟繼續</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quotes.map(quote => (
                        <button
                          key={quote.id}
                          onClick={() => setSelectedQuoteId(quote.id)}
                          className={cn(
                            'w-full p-4 rounded-lg border text-left transition-all',
                            selectedQuoteId === quote.id
                              ? 'border-morandi-gold bg-morandi-gold/10'
                              : 'border-border hover:border-morandi-gold/50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {quote.name || quote.code || '未命名報價單'}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  v{quote.version}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                {quote.code} · <DateCell date={quote.created_at} showIcon={false} />
                              </div>
                            </div>
                            <div className="text-right">
                              {quote.total_amount != null && (
                                <div className="font-medium">
                                  <CurrencyCell amount={quote.total_amount} />
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] || quote.status}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: 選擇行程 */}
              {currentStep === 'itinerary' && (
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    選擇行程版本
                  </h3>
                  {itineraries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Map className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>此團尚無行程</p>
                      <p className="text-sm">可跳過此步驟繼續</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {itineraries.map(itinerary => (
                        <button
                          key={itinerary.id}
                          onClick={() => setSelectedItineraryId(itinerary.id)}
                          className={cn(
                            'w-full p-4 rounded-lg border text-left transition-all',
                            selectedItineraryId === itinerary.id
                              ? 'border-morandi-gold bg-morandi-gold/10'
                              : 'border-border hover:border-morandi-gold/50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {itinerary.title || '未命名行程'}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  v{itinerary.version}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                最後更新: <DateCell date={itinerary.updated_at} showIcon={false} />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {itinerary.status}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: 確認鎖定 */}
              {currentStep === 'confirm' && (
                <div className="space-y-6">
                  <div className="bg-status-warning-bg border border-status-warning/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-morandi-primary">確認鎖定版本</h4>
                        <p className="text-sm text-morandi-secondary mt-1">
                          鎖定後，報價單和行程將無法自由修改。如需修改，須先輸入密碼解鎖。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="text-sm text-muted-foreground mb-1">選定報價單</div>
                      <div className="font-medium">
                        {selectedQuote ? (
                          <>
                            {selectedQuote.name || selectedQuote.code || '未命名'} (v{selectedQuote.version})
                          </>
                        ) : (
                          <span className="text-muted-foreground">未選擇</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="text-sm text-muted-foreground mb-1">選定行程</div>
                      <div className="font-medium">
                        {selectedItinerary ? (
                          <>
                            {selectedItinerary.title || '未命名'} (v{selectedItinerary.version})
                          </>
                        ) : (
                          <span className="text-muted-foreground">未選擇</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部按鈕 */}
        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {currentStep !== 'quote' && (
              <Button variant="outline" onClick={handleBack} disabled={submitting} className="gap-2">
                <ArrowLeft size={16} />
                上一步
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="gap-2">
              <X size={16} />
              取消
            </Button>
            {currentStep !== 'confirm' ? (
              <Button onClick={handleNext} disabled={loading} className="gap-2">
                下一步
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                確認鎖定
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
