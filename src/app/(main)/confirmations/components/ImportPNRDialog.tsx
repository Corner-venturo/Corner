'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Upload, CheckCircle, X } from 'lucide-react'
import { parseFlightConfirmation, type ParsedHTMLConfirmation } from '@/lib/pnr-parser'
import { toast } from 'sonner'

interface ImportPNRDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: ParsedHTMLConfirmation) => void
}

export function ImportPNRDialog({ isOpen, onClose, onImport }: ImportPNRDialogProps) {
  const [rawInput, setRawInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedHTMLConfirmation | null>(null)

  const handleParse = () => {
    if (!rawInput.trim()) {
      toast.error('請貼上 PNR 內容')
      return
    }

    setIsParsing(true)
    try {
      const parsed = parseFlightConfirmation(rawInput)
      logger.log('🔍 解析結果:', parsed)

      // 如果是 Amadeus 格式，轉換成 HTML 格式
      if ('ticketingDeadline' in parsed) {
        // 這是 Amadeus 格式，需要轉換
        toast.error('請貼上機票確認單 HTML，而非 Amadeus 電報')
        return
      }

      setParsedData(parsed as ParsedHTMLConfirmation)
      toast.success('PNR 解析成功！')
    } catch (error) {
      toast.error('PNR 格式錯誤，請檢查內容')
      logger.error('PNR 解析失敗', error)
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = () => {
    if (!parsedData) return
    onImport(parsedData)
    onClose()
    // 清空狀態
    setRawInput('')
    setParsedData(null)
  }

  const handleClose = () => {
    onClose()
    // 延遲清空，避免關閉動畫中看到內容變化
    setTimeout(() => {
      setRawInput('')
      setParsedData(null)
    }, 200)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent level={1} className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-morandi-sky" />
            匯入 PNR 確認單
          </DialogTitle>
          <DialogDescription>
            貼上機票確認單的 HTML 或文字內容，系統會自動解析並填入表單
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!parsedData ? (
            <>
              {/* 輸入區 */}
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">
                  PNR 內容
                </label>
                <Textarea
                  placeholder={`貼上完整的 HTML 或文字內容，例如：

電腦代號:DMTQ65 - 亞瑪迪斯
旅客姓名:01. WU/MINGTUNG
長榮航空(BR801)
12月04日(四) 10:00 出發:臺灣桃園機場...`}
                  rows={12}
                  className="shadow-sm text-sm font-mono"
                  value={rawInput}
                  onChange={e => setRawInput(e.target.value)}
                />
              </div>

              {/* 解析按鈕 */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleClose} className="gap-2">
                  <X size={16} />
                  取消
                </Button>
                <Button
                  onClick={handleParse}
                  disabled={isParsing || !rawInput.trim()}
                  className="bg-morandi-sky hover:bg-morandi-sky/90 gap-2"
                >
                  <Upload size={16} />
                  {isParsing ? '解析中...' : '解析 PNR'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* 解析結果預覽 */}
              <div className="space-y-4 bg-morandi-container/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-morandi-success" />
                    <h3 className="text-sm font-semibold text-morandi-primary">解析成功</h3>
                  </div>
                  <button
                    onClick={() => {
                      setParsedData(null)
                      setRawInput('')
                    }}
                    className="text-sm text-morandi-secondary hover:text-morandi-primary"
                  >
                    重新輸入
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  {/* 電腦代號 */}
                  {parsedData.recordLocator && (
                    <div className="bg-card p-3 rounded border border-border">
                      <span className="font-semibold text-morandi-primary">電腦代號：</span>
                      <span className="text-morandi-secondary">{parsedData.recordLocator}</span>
                    </div>
                  )}

                  {/* 旅客姓名 */}
                  {parsedData.passengerNames.length > 0 && (
                    <div className="bg-card p-3 rounded border border-border">
                      <span className="font-semibold text-morandi-primary">旅客姓名：</span>
                      <div className="mt-1 space-y-1">
                        {parsedData.passengerNames.map((name, idx) => (
                          <div key={idx} className="text-morandi-secondary">
                            {String(idx + 1).padStart(2, '0')}. {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 航班資訊 */}
                  {parsedData.segments.length > 0 && (
                    <div className="bg-card p-3 rounded border border-border">
                      <span className="font-semibold text-morandi-primary block mb-2">航班資訊：</span>
                      <div className="space-y-2">
                        {parsedData.segments.map((seg, idx) => (
                          <div key={idx} className="text-morandi-secondary pl-2 border-l-2 border-morandi-sky">
                            <div className="font-medium">
                              {seg.airline} ({seg.flightNumber})
                            </div>
                            <div className="text-xs">
                              {seg.departureDate} {seg.departureTime} {seg.departureAirport} → {seg.arrivalTime} {seg.arrivalAirport}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 機票號碼 */}
                  {parsedData.ticketNumbers.length > 0 && (
                    <div className="bg-card p-3 rounded border border-border">
                      <span className="font-semibold text-morandi-primary">機票號碼：</span>
                      <div className="mt-1 space-y-1">
                        {parsedData.ticketNumbers.map((ticket, idx) => (
                          <div key={idx} className="text-morandi-secondary">
                            {ticket.number} - {ticket.passenger}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 匯入按鈕 */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleClose} className="gap-2">
                  <X size={16} />
                  取消
                </Button>
                <Button
                  onClick={handleImport}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover gap-2"
                >
                  <Upload size={16} />
                  匯入到確認單
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
