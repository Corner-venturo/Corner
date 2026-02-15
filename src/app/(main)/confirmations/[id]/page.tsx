'use client'

import { logger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { NotFoundState } from '@/components/ui/not-found-state'
import { EditorContainer } from '../components/EditorContainer'
import { PreviewContainer } from '../components/PreviewContainer'
import { PrintableConfirmation } from '../components/PrintableConfirmation'
import { ImportPNRDialog } from '../components/ImportPNRDialog'
import { Button } from '@/components/ui/button'
import { Printer, Upload, X, Save } from 'lucide-react'
import { useConfirmations, updateConfirmation } from '@/data'
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
import { LABELS } from '../constants/labels'

export default function EditConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { items: confirmations, loading: isLoadingConfirmations } = useConfirmations()
  const currentUser = useAuthStore(state => state.user)

  const [formData, setFormData] = useState<ConfirmationFormData>({
    type: 'flight',
    booking_number: '',
    confirmation_number: '',
    data: {},
    status: 'draft',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoadingConfirmations) {
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
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    }
  }, [id, confirmations, isLoadingConfirmations])

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
      toast.error(LABELS.BOOKING_NUMBER_REQUIRED)
      return
    }

    setIsSaving(true)
    try {
      await updateConfirmation(id, {
        type: formData.type,
        booking_number: formData.booking_number,
        confirmation_number: formData.confirmation_number,
        data: formData.data,
        status: formData.status,
        notes: formData.notes,
        updated_by: auth.user!.id,
      } as Partial<Confirmation>)

      toast.success(LABELS.CONFIRMATION_UPDATED)
      router.push('/confirmations')
    } catch (error) {
      logger.error('更新失敗:', error)
      toast.error(LABELS.UPDATE_FAILED)
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
        cabin: parsed.segments[0]?.cabin || LABELS.ECONOMY_CLASS,
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

    toast.success(LABELS.PNR_IMPORT_SUCCESS)
  }

  const currentConfirmation = confirmations.find(c => c.id === id)

  if (isLoadingConfirmations) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-morandi-secondary">{LABELS.LOADING}</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <ContentPageLayout
        title={LABELS.EDIT_CONFIRMATION}
        breadcrumb={[
          { label: LABELS.HOME, href: '/' },
          { label: LABELS.CONFIRMATIONS_MANAGEMENT, href: '/confirmations' },
          { label: LABELS.EDIT_CONFIRMATION, href: '#' },
        ]}
        showBackButton={true}
        contentClassName="flex-1 flex items-center justify-center"
      >
        <NotFoundState
          title={LABELS.NOT_FOUND_TITLE}
          description={LABELS.NOT_FOUND_DESCRIPTION}
          backButtonLabel={LABELS.BACK_TO_CONFIRMATIONS}
          backHref="/confirmations"
        />
      </ContentPageLayout>
    )
  }

  return (
    <ContentPageLayout
      title={LABELS.EDIT_CONFIRMATION}
      breadcrumb={[
        { label: LABELS.HOME, href: '/' },
        { label: LABELS.CONFIRMATIONS_MANAGEMENT, href: '/confirmations' },
        { label: LABELS.EDIT_CONFIRMATION, href: '#' },
      ]}
      showBackButton={true}
      headerActions={
        <div className="flex gap-2">
          {formData.type === 'flight' && (
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {LABELS.IMPORT_PNR}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsPrintDialogOpen(true)}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {LABELS.PRINT}
          </Button>
          <Button variant="outline" onClick={() => router.push('/confirmations')} className="gap-2">
            <X size={16} />
            {LABELS.CANCEL}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
            <Save size={16} />
            {isSaving ? LABELS.SAVE : LABELS.UPDATE_CONFIRMATION}
          </Button>
        </div>
      }
      contentClassName="flex-1 overflow-hidden"
    >
      {/* 主要內容區域 */}
      <div className="h-full flex">
        <EditorContainer
          formData={formData}
          onFormDataChange={setFormData}
          onTypeChange={handleTypeChange}
        />
        <PreviewContainer formData={formData} />
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
    </ContentPageLayout>
  )
}
