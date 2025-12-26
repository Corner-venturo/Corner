'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { EditorContainer } from '../components/EditorContainer'
import { PreviewContainer } from '../components/PreviewContainer'
import { PrintableConfirmation } from '../components/PrintableConfirmation'
import { ImportPNRDialog } from '../components/ImportPNRDialog'
import { Button } from '@/components/ui/button'
import { Printer, Upload, X, Save } from 'lucide-react'
import { useConfirmationStore } from '@/stores/confirmation-store'
import { useAuthStore } from '@/stores/auth-store'
import type {
  ConfirmationFormData,
  ConfirmationType,
  Confirmation,
  FlightData,
  FlightPassenger,
  FlightSegment,
} from '@/types/confirmation.types'
import type { ParsedHTMLConfirmation } from '@/lib/pnr-parser'
import { toast } from 'sonner'
import { useRequireAuthSync } from '@/hooks/useRequireAuth'

export default function EditConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const confirmations = useConfirmationStore(state => state.items)
  const update = useConfirmationStore(state => state.update)
  const fetchAll = useConfirmationStore(state => state.fetchAll)
  const currentUser = useAuthStore(state => state.user)

  const [formData, setFormData] = useState<ConfirmationFormData>({
    type: 'flight',
    booking_number: '',
    confirmation_number: '',
    data: {},
    status: 'draft',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  useEffect(() => {
    const loadConfirmation = async () => {
      await fetchAll()
      setIsLoading(false)
    }
    loadConfirmation()
  }, [fetchAll])

  useEffect(() => {
    if (!isLoading) {
      const confirmation = confirmations.find(c => c.id === id)
      if (confirmation) {
        setFormData({
          type: confirmation.type,
          booking_number: confirmation.booking_number,
          confirmation_number: confirmation.confirmation_number,
          data: confirmation.data,
          status: confirmation.status,
          notes: confirmation.notes,
        })
      } else {
        toast.error('找不到確認單')
        router.push('/confirmations')
      }
    }
  }, [id, confirmations, isLoading, router])

  const handleTypeChange = (type: ConfirmationType) => {
    setFormData({
      ...formData,
      type,
      data: {}, // 重置資料
    })
  }

  const handleSave = async () => {
    const auth = useRequireAuthSync()

    if (!auth.isAuthenticated) {
      auth.showLoginRequired()
      return
    }

    if (!formData.booking_number) {
      toast.error('請填寫訂單編號')
      return
    }

    setIsSaving(true)
    try {
      await update(id, {
        type: formData.type,
        booking_number: formData.booking_number,
        confirmation_number: formData.confirmation_number,
        data: formData.data,
        status: formData.status,
        notes: formData.notes,
        updated_by: auth.user!.id,
      } as Partial<Confirmation>)

      toast.success('確認單已更新')
      router.push('/confirmations')
    } catch (error) {
      logger.error('更新失敗:', error)
      toast.error('更新失敗')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // 處理 PNR 匯入
  const handleImportPNR = (parsed: ParsedHTMLConfirmation) => {
    // 轉換成 FlightData 格式
    const passengers: FlightPassenger[] = parsed.passengerNames.map((name, idx) => {
      const ticket = parsed.ticketNumbers.find(t => t.passenger === name)
      return {
        nameEn: name,
        cabin: parsed.segments[0]?.cabin || '經濟',
        ticketNumber: ticket?.number || '',
        bookingCode: parsed.recordLocator,
      }
    })

    const segments: FlightSegment[] = parsed.segments.map(seg => ({
      route: `${seg.departureAirport} - ${seg.arrivalAirport}`,
      departureDate: seg.departureDate,
      departureTime: seg.departureTime,
      departureAirport: seg.departureAirport,
      departureTerminal: seg.terminal,
      arrivalDate: seg.departureDate, // 目前 HTML 沒有抵達日期，使用出發日期
      arrivalTime: seg.arrivalTime,
      arrivalAirport: seg.arrivalAirport,
      arrivalTerminal: seg.terminal,
      airline: seg.airline,
      flightNumber: seg.flightNumber,
    }))

    const flightData: FlightData = {
      passengers,
      segments,
      baggage: [],
      importantNotes: [],
      ...(('airlineContacts' in parsed && parsed.airlineContacts) && {
        airlineContacts: parsed.airlineContacts,
      }),
    }

    // 更新表單
    setFormData({
      ...formData,
      type: 'flight',
      booking_number: parsed.recordLocator,
      data: flightData,
    })

    toast.success('PNR 已成功匯入！')
  }

  const currentConfirmation = confirmations.find(c => c.id === id)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 頁面頂部 */}
      <ResponsiveHeader
        title="編輯確認單"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '確認單管理', href: '/confirmations' },
          { label: '編輯確認單', href: '#' },
        ]}
        showBackButton={true}
        actions={
          <div className="flex gap-2">
            {formData.type === 'flight' && (
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                匯入 PNR
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsPrintDialogOpen(true)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              列印
            </Button>
            <Button variant="outline" onClick={() => router.push('/confirmations')} className="gap-2">
              <X size={16} />
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Save size={16} />
              {isSaving ? '儲存中...' : '更新確認單'}
            </Button>
          </div>
        }
      />

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          <EditorContainer
            formData={formData}
            onFormDataChange={setFormData}
            onTypeChange={handleTypeChange}
          />
          <PreviewContainer formData={formData} />
        </div>
      </div>

      {/* 列印預覽 */}
      {currentConfirmation && (
        <PrintableConfirmation
          confirmation={currentConfirmation}
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
          onPrint={handlePrint}
        />
      )}

      {/* PNR 匯入對話框 */}
      <ImportPNRDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportPNR}
      />
    </div>
  )
}
