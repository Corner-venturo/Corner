'use client'

import { useCallback, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTourPageState } from './useTourPageState'
import { useEmployees } from '@/hooks/cloud-hooks'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import type { Proposal, ProposalPackage } from '@/types/proposal.types'

// 判斷是否為台灣（支援多種寫法）
const isTaiwanCountry = (country: string | undefined | null): boolean => {
  if (!country) return false
  const normalized = country.trim().toLowerCase()
  return normalized === '台灣' || normalized === 'taiwan' || normalized === '臺灣'
}

interface UseToursFormReturn {
  handleOpenCreateDialog: (fromQuoteId?: string) => Promise<void>
  resetForm: () => void
  handleNavigationEffect: () => void
  /** 從提案轉開團的資料 */
  proposalConvertData: { proposal: Proposal; package: ProposalPackage } | null
  clearProposalConvertData: () => void
}

interface UseToursFormParams {
  state: ReturnType<typeof useTourPageState>
  openDialog: (type: string, data?: unknown, meta?: unknown) => void
}

export function useToursForm({ state, openDialog }: UseToursFormParams): UseToursFormReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { items: employees, fetchAll: fetchEmployees } = useEmployees()

  // 從提案轉開團的資料
  const [proposalConvertData, setProposalConvertData] = useState<{ proposal: Proposal; package: ProposalPackage } | null>(null)

  // 追蹤是否已處理過導航參數（防止重複填入覆蓋用戶輸入）
  const navigationProcessedRef = useRef(false)

  const {
    setNewTour,
    setAvailableCities,
    setNewOrder,
    setFormError,
  } = state

  const clearProposalConvertData = useCallback(() => {
    setProposalConvertData(null)
    // 重置導航處理標記（允許下次轉開團重新填入）
    navigationProcessedRef.current = false
    // 清除 URL 參數
    router.replace('/tours', { scroll: false })
  }, [router])

  // Lazy load: only load employees when opening create dialog
  const handleOpenCreateDialog = useCallback(
    async (fromQuoteId?: string) => {
      setNewTour({
        name: '',
        countryCode: '',
        cityCode: '',
        departure_date: '',
        return_date: '',
        price: 0,
        status: '進行中',  // 直接開團預設為進行中
        isSpecial: false,
        max_participants: 20,
        description: '',
      })
      setAvailableCities([])

      if (employees.length === 0) {
        await fetchEmployees()
      }
      openDialog('create', undefined, fromQuoteId)
    },
    [employees.length, fetchEmployees, openDialog, setNewTour, setAvailableCities]
  )

  const resetForm = useCallback(() => {
    setNewTour({
      name: '',
      countryCode: '',
      cityCode: '',
      departure_date: '',
      return_date: '',
      price: 0,
      status: '進行中',  // 開團預設為進行中
      isSpecial: false,
      max_participants: 20,
      description: '',
    })
    setAvailableCities([])
    setNewOrder({
      contact_person: '',
      sales_person: '',
      assistant: '',
      member_count: 1,
      total_amount: 0,
    })
    setFormError(null)
    // 重置導航處理標記（允許下次轉開團重新填入）
    navigationProcessedRef.current = false
  }, [setNewTour, setAvailableCities, setNewOrder, setFormError])

  // 處理從提案轉開團的 URL 參數
  const handleNavigationEffect = useCallback(async () => {
    const action = searchParams.get('action')
    const fromProposal = searchParams.get('fromProposal')
    const packageId = searchParams.get('packageId')

    // 從提案轉開團
    if (action === 'create' && fromProposal && packageId) {
      // 防止重複處理（避免覆蓋用戶已輸入的資料）
      if (navigationProcessedRef.current) {
        return
      }
      navigationProcessedRef.current = true
      try {
        // 取得提案、套件和行程表資料
        const [proposalRes, packageRes, itineraryRes] = await Promise.all([
          supabase.from('proposals').select('*').eq('id', fromProposal).single(),
          supabase.from('proposal_packages').select('*').eq('id', packageId).single(),
          // 查詢關聯的行程表（取最新的一筆）
          supabase.from('itineraries').select('outbound_flight, return_flight').eq('proposal_package_id', packageId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])

        if (proposalRes.error) throw proposalRes.error
        if (packageRes.error) throw packageRes.error

        const proposal = proposalRes.data as Proposal
        const pkg = packageRes.data as ProposalPackage

        // 儲存轉開團資料
        setProposalConvertData({ proposal, package: pkg })

        // 確保員工資料已載入
        if (employees.length === 0) {
          await fetchEmployees()
        }

        // 解析行程表的航班資訊
        type FlightData = { airline?: string; flightNumber?: string; departureTime?: string; arrivalTime?: string } | null
        const outboundFlight = itineraryRes.data?.outbound_flight as FlightData
        const returnFlight = itineraryRes.data?.return_flight as FlightData

        // 預填表單資料（包含航班）
        const isTaiwan = isTaiwanCountry(pkg.country_id)
        setNewTour({
          name: pkg.version_name || proposal.title || '',
          countryCode: pkg.country_id || '',
          cityCode: isTaiwan ? 'TW' : (pkg.main_city_id || ''),
          cityName: isTaiwan ? '台灣' : '',
          departure_date: pkg.start_date || proposal.expected_start_date || '',
          return_date: pkg.end_date || proposal.expected_end_date || '',
          price: 0,
          status: '進行中',  // 開團後直接進入進行中狀態
          isSpecial: false,
          max_participants: pkg.group_size || 20,
          description: '',
          // 帶入行程表的航班資訊
          outbound_flight_number: outboundFlight?.flightNumber || '',
          outbound_flight_text: outboundFlight
            ? `${outboundFlight.airline || ''} ${outboundFlight.flightNumber || ''} ${outboundFlight.departureTime || ''}-${outboundFlight.arrivalTime || ''}`.trim()
            : '',
          return_flight_number: returnFlight?.flightNumber || '',
          return_flight_text: returnFlight
            ? `${returnFlight.airline || ''} ${returnFlight.flightNumber || ''} ${returnFlight.departureTime || ''}-${returnFlight.arrivalTime || ''}`.trim()
            : '',
        })

        // 預填訂單聯絡人資料
        setNewOrder({
          contact_person: proposal.customer_name || '',
          sales_person: '',
          assistant: '',
          member_count: pkg.group_size || 1,
          total_amount: 0,
        })

        // 開啟建立對話框
        openDialog('create')

        logger.info('從提案轉開團', { proposalId: fromProposal, packageId, hasItinerary: !!itineraryRes.data })
      } catch (error) {
        logger.error('載入提案資料失敗', error)
        // 清除 URL 參數
        router.replace('/tours', { scroll: false })
      }
    }
  }, [searchParams, employees.length, fetchEmployees, setNewTour, setNewOrder, openDialog, router])

  return {
    handleOpenCreateDialog,
    resetForm,
    handleNavigationEffect,
    proposalConvertData,
    clearProposalConvertData,
  }
}
