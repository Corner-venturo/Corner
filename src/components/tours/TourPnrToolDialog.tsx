'use client'

/**
 * 團 PNR 分配工具
 * 解析 Amadeus 電報並自動比對團員
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Clipboard,
  Plane,
  AlertTriangle,
  Check,
  Clock,
  Briefcase,
  Utensils,
  Save,
  X,
  Loader2,
  Users,
  ArrowRight,
  Baby,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  parseAmadeusPNR,
  type ParsedPNR,
  type EnhancedSSR,
  SSRCategory,
} from '@/lib/pnr-parser'
import { useReferenceData } from '@/lib/pnr/use-reference-data'
import { usePNRStore } from '@/stores/pnrs-store'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { OrderMember } from '@/components/orders/order-member.types'
import type { PNR } from '@/types/pnr.types'
import type { Json } from '@/lib/supabase/types'

interface TourPnrToolDialogProps {
  isOpen: boolean
  onClose: () => void
  tourId: string
  tourCode: string
  tourName: string
  members: OrderMember[]
  onSuccess?: () => void
}

interface PassengerMatch {
  pnrIndex: number
  pnrName: string
  passengerType: 'ADT' | 'CHD' | 'INF' | 'INS'  // 旅客類型
  birthDate?: string                              // 兒童生日
  infant?: { name: string; birthDate: string }   // 隨行嬰兒資訊
  memberId: string | null
  memberName: string | null
  memberPassportName: string | null
  baggage: string[]
  meal: string[]
  ticketPrice: number | null
}

// 簡單的姓名比對（移除空格、轉大寫）
function normalizeNameForMatch(name: string): string {
  return name.toUpperCase().replace(/[\s\-\/]/g, '')
}

// 嘗試比對 PNR 姓名與團員
function matchPassengerToMember(
  pnrName: string,
  members: OrderMember[]
): OrderMember | null {
  const normalizedPnr = normalizeNameForMatch(pnrName)

  // 先嘗試精確比對 passport_name
  for (const member of members) {
    if (member.passport_name) {
      const normalizedMember = normalizeNameForMatch(member.passport_name)
      if (normalizedPnr === normalizedMember) {
        return member
      }
    }
  }

  // 嘗試部分比對（姓氏相同）
  const pnrSurname = pnrName.split('/')[0]?.toUpperCase() || ''
  for (const member of members) {
    if (member.passport_name) {
      const memberSurname = member.passport_name.split('/')[0]?.toUpperCase() || ''
      if (pnrSurname && memberSurname && pnrSurname === memberSurname) {
        return member
      }
    }
  }

  return null
}

// 從 SSR 中提取行李和餐食資訊
function extractPassengerSSR(
  ssrList: EnhancedSSR[] | undefined,
  passengerIndex: number
): { baggage: string[]; meal: string[] } {
  const baggage: string[] = []
  const meal: string[] = []

  if (!ssrList) return { baggage, meal }

  for (const ssr of ssrList) {
    // 檢查是否適用於此旅客
    if (ssr.passenger !== undefined && ssr.passenger !== passengerIndex + 1) {
      continue
    }

    if (ssr.category === SSRCategory.BAGGAGE) {
      baggage.push(ssr.description || ssr.code)
    } else if (ssr.category === SSRCategory.MEAL) {
      meal.push(ssr.description || ssr.code)
    }
  }

  return { baggage, meal }
}

export function TourPnrToolDialog({
  isOpen,
  onClose,
  tourId,
  tourCode,
  tourName,
  members,
  onSuccess,
}: TourPnrToolDialogProps) {
  const [rawPNR, setRawPNR] = useState('')
  const [parsedPNR, setParsedPNR] = useState<ParsedPNR | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [passengerMatches, setPassengerMatches] = useState<PassengerMatch[]>([])

  const { create: createPNR } = usePNRStore()
  const { user } = useAuthStore()

  // 載入參考資料
  const {
    getAirlineName,
    getAirportName,
    getSSRDescription,
  } = useReferenceData()

  // 計算出票期限狀態
  const deadlineStatus = useMemo(() => {
    if (!parsedPNR?.ticketingDeadline) return null
    const deadline = parsedPNR.ticketingDeadline
    const now = new Date()
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: '已過期', color: 'text-red-600 bg-red-50', urgent: true }
    if (diffDays === 0) return { text: '今日到期', color: 'text-red-600 bg-red-50', urgent: true }
    if (diffDays === 1) return { text: '明日到期', color: 'text-orange-600 bg-orange-50', urgent: true }
    if (diffDays <= 3) return { text: `${diffDays} 天內`, color: 'text-yellow-600 bg-yellow-50', urgent: true }
    return { text: `${diffDays} 天後`, color: 'text-green-600 bg-green-50', urgent: false }
  }, [parsedPNR?.ticketingDeadline])

  // 解析 PNR
  const handleParse = useCallback(() => {
    if (!rawPNR.trim()) {
      setError('請貼上 PNR 電報內容')
      setParsedPNR(null)
      setPassengerMatches([])
      return
    }

    try {
      const result = parseAmadeusPNR(rawPNR)
      setParsedPNR(result)
      setError(null)

      // 自動比對旅客（使用 passengers 陣列取得完整資訊）
      const matches: PassengerMatch[] = result.passengers.map((passenger, index) => {
        const matchedMember = matchPassengerToMember(passenger.name, members)
        const { baggage, meal } = extractPassengerSSR(result.specialRequests, index)

        return {
          pnrIndex: index,
          pnrName: passenger.name,
          passengerType: passenger.type,
          birthDate: passenger.birthDate,
          infant: passenger.infant,
          memberId: matchedMember?.id || null,
          memberName: matchedMember?.chinese_name || null,
          memberPassportName: matchedMember?.passport_name || null,
          baggage,
          meal,
          ticketPrice: matchedMember?.flight_cost || null,
        }
      })

      setPassengerMatches(matches)

      // 如果有驗證錯誤，顯示
      if (!result.validation.isValid && result.validation.errors.length > 0) {
        setError(result.validation.errors[0])
      }
    } catch (err) {
      setError('解析失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
      setParsedPNR(null)
      setPassengerMatches([])
    }
  }, [rawPNR, members])

  // 從剪貼簿貼上
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setRawPNR(text)
      setError(null)
      setParsedPNR(null)
      setPassengerMatches([])
    } catch {
      setError('無法存取剪貼簿')
    }
  }, [])

  // 持久化 PNR 資料到 localStorage
  const storageKey = `pnr-draft-${tourId}`

  // 清除（含清除 localStorage）
  const handleClear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setRawPNR('')
    setParsedPNR(null)
    setError(null)
    setPassengerMatches([])
  }, [storageKey])

  // 清除草稿（儲存成功後）
  const clearDraft = handleClear

  // 更新旅客票價
  const handlePriceChange = useCallback((index: number, price: string) => {
    setPassengerMatches(prev => prev.map((match, i) =>
      i === index ? { ...match, ticketPrice: price ? Number(price) : null } : match
    ))
  }, [])

  // 手動選擇比對的團員
  const handleMemberSelect = useCallback((pnrIndex: number, memberId: string | null) => {
    setPassengerMatches(prev => prev.map((match, i) => {
      if (i !== pnrIndex) return match
      const member = memberId ? members.find(m => m.id === memberId) : null
      return {
        ...match,
        memberId,
        memberName: member?.chinese_name || null,
        memberPassportName: member?.passport_name || null,
        ticketPrice: member?.flight_cost || match.ticketPrice,
      }
    }))
  }, [members])

  // 儲存
  const handleSave = useCallback(async () => {
    if (!parsedPNR || !user?.workspace_id) return

    setIsSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const recordLocator = parsedPNR.recordLocator || 'UNKNWN'

      // 1. 檢查 PNR 是否已存在
      const { data: existingPNR } = await supabase
        .from('pnrs')
        .select('id')
        .eq('record_locator', recordLocator)
        .single()

      if (existingPNR) {
        // PNR 已存在，更新它
        // Note: special_requests and other_info are stored as JSONB but typed as string[] in Supabase
        await supabase
          .from('pnrs')
          .update({
            raw_pnr: rawPNR,
            passenger_names: parsedPNR.passengerNames,
            ticketing_deadline: parsedPNR.ticketingDeadline?.toISOString() || null,
            segments: parsedPNR.segments as unknown as Json,
            special_requests: parsedPNR.specialRequests as unknown as string[],
            other_info: parsedPNR.otherInfo as unknown as string[],
            tour_id: tourId,
            updated_by: user.id || null,
          })
          .eq('id', existingPNR.id)
        toast.info(`PNR ${recordLocator} 已存在，已更新資料`)
      } else {
        // PNR 不存在，新建
        await createPNR({
          record_locator: recordLocator,
          workspace_id: user.workspace_id,
          employee_id: user.id || null,
          raw_pnr: rawPNR,
          passenger_names: parsedPNR.passengerNames,
          ticketing_deadline: parsedPNR.ticketingDeadline?.toISOString() || null,
          cancellation_deadline: null,
          segments: parsedPNR.segments,
          special_requests: parsedPNR.specialRequests || null,
          other_info: parsedPNR.otherInfo || null,
          status: 'active',
          tour_id: tourId,
          notes: null,
          created_by: user.id || null,
          updated_by: null,
        } as unknown as Omit<PNR, 'id' | 'created_at' | 'updated_at'>)
      }

      // 2. 更新團員的 PNR 欄位
      let updateCount = 0
      const errors: string[] = []

      // 計算有多少配對成功的團員
      const matchedMembers = passengerMatches.filter(m => m.memberId)
      toast.info(`開始更新 ${matchedMembers.length} 位團員的 PNR: ${recordLocator}`)

      for (const match of passengerMatches) {
        if (match.memberId) {
          const updateData: Record<string, unknown> = {
            pnr: recordLocator,
          }

          // 只有有值時才更新
          if (match.ticketPrice !== null) {
            updateData.flight_cost = match.ticketPrice
          }

          // 更新餐食（如果有）
          if (match.meal.length > 0) {
            updateData.special_meal = match.meal.join(', ')
          }

          const { data, error } = await supabase
            .from('order_members')
            .update(updateData)
            .eq('id', match.memberId)
            .select('id, pnr, special_meal, flight_cost')

          if (error) {
            errors.push(`${match.pnrName}: ${error.message}`)
          } else if (data && data.length > 0) {
            updateCount++
            // 顯示更新後的值確認
            toast.info(`${match.pnrName} 已更新: pnr=${data[0].pnr}`)
          } else {
            errors.push(`${match.pnrName}: 找不到該團員(${match.memberId})`)
          }
        }
      }

      if (errors.length > 0) {
        toast.error(`更新失敗: ${errors.join(', ')}`)
      }

      toast.success(`PNR ${recordLocator} 已儲存，更新 ${updateCount} 位團員`)
      clearDraft()  // 儲存成功後清除草稿
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error('儲存失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    } finally {
      setIsSaving(false)
    }
  }, [parsedPNR, rawPNR, user, tourId, tourCode, passengerMatches, createPNR, onSuccess, onClose])

  // 載入保存的草稿
  useEffect(() => {
    if (isOpen && tourId) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const draft = JSON.parse(saved)
          if (draft.rawPNR) {
            setRawPNR(draft.rawPNR)
            // 如果有保存的電報，自動解析
            if (draft.rawPNR.trim()) {
              setTimeout(() => {
                try {
                  const result = parseAmadeusPNR(draft.rawPNR)
                  setParsedPNR(result)
                  // 自動比對旅客（使用 passengers 陣列取得完整資訊）
                  const matches: PassengerMatch[] = result.passengers.map((passenger, index) => {
                    const matchedMember = matchPassengerToMember(passenger.name, members)
                    const { baggage, meal } = extractPassengerSSR(result.specialRequests, index)
                    return {
                      pnrIndex: index,
                      pnrName: passenger.name,
                      passengerType: passenger.type,
                      birthDate: passenger.birthDate,
                      infant: passenger.infant,
                      memberId: matchedMember?.id || null,
                      memberName: matchedMember?.chinese_name || null,
                      memberPassportName: matchedMember?.passport_name || null,
                      baggage,
                      meal,
                      ticketPrice: matchedMember?.flight_cost || null,
                    }
                  })
                  setPassengerMatches(matches)
                } catch {
                  // 解析失敗時不處理
                }
              }, 100)
            }
          }
        } catch {
          // 解析失敗時忽略
        }
      }
    }
  }, [isOpen, tourId, storageKey, members])

  // 保存草稿到 localStorage（空字串時清除）
  useEffect(() => {
    if (tourId) {
      if (rawPNR.trim()) {
        localStorage.setItem(storageKey, JSON.stringify({ rawPNR }))
      } else {
        // 當使用者手動清空輸入框時，也清除 localStorage
        localStorage.removeItem(storageKey)
      }
    }
  }, [tourId, rawPNR, storageKey])

  // 統計比對結果
  const matchStats = useMemo(() => {
    const matched = passengerMatches.filter(m => m.memberId).length
    const total = passengerMatches.length
    const infantCount = passengerMatches.filter(m => m.infant).length
    const childCount = passengerMatches.filter(m => m.passengerType === 'CHD').length
    return { matched, total, infantCount, childCount, allMatched: matched === total && total > 0 }
  }, [passengerMatches])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane size={20} className="text-morandi-gold" />
            PNR 電報工具
            <span className="text-sm font-normal text-morandi-secondary ml-2">
              {tourCode} - {tourName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* 輸入區 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Textarea
                value={rawPNR}
                onChange={(e) => setRawPNR(e.target.value)}
                placeholder="貼上 Amadeus PNR 電報..."
                className="min-h-[100px] font-mono text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaste}
                className="gap-1"
              >
                <Clipboard size={14} />
                從剪貼簿貼上
              </Button>
              <Button
                size="sm"
                onClick={handleParse}
                disabled={!rawPNR.trim()}
                className="gap-1 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                解析電報
              </Button>
              {parsedPNR && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="gap-1 text-morandi-secondary"
                >
                  <X size={14} />
                  清除
                </Button>
              )}
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* 解析結果 */}
          {parsedPNR && (
            <div className="space-y-4">
              {/* 基本資訊 */}
              <div className="flex items-center gap-4 p-3 bg-morandi-container/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-morandi-secondary">訂位代號</span>
                  <span className="font-mono font-bold text-lg">{parsedPNR.recordLocator}</span>
                </div>

                {deadlineStatus && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-sm font-medium",
                    deadlineStatus.color
                  )}>
                    <Clock size={14} />
                    出票期限：
                    {parsedPNR.ticketingDeadline?.toLocaleDateString('zh-TW')}
                    <span className="ml-1">({deadlineStatus.text})</span>
                    {deadlineStatus.urgent && <AlertTriangle size={14} className="ml-1" />}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-morandi-secondary ml-auto">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    {matchStats.matched}/{matchStats.total} 人已比對
                    {matchStats.allMatched && <Check size={14} className="text-green-600 ml-1" />}
                  </div>
                  {matchStats.childCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {matchStats.childCount} 兒童
                    </span>
                  )}
                  {matchStats.infantCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">
                      <Baby size={12} />
                      +{matchStats.infantCount} 嬰兒
                    </span>
                  )}
                </div>
              </div>

              {/* 航班資訊 */}
              {parsedPNR.segments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-morandi-secondary">航班資訊</h4>
                  <div className="grid gap-2">
                    {parsedPNR.segments.map((seg, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white border border-border rounded text-sm">
                        <span className="font-medium">
                          {getAirlineName(seg.airline) || seg.airline} {seg.flightNumber}
                        </span>
                        <span className="text-morandi-secondary">{seg.class}</span>
                        <span>{seg.departureDate}</span>
                        <div className="flex items-center gap-1">
                          <span>{getAirportName(seg.origin) || seg.origin}</span>
                          <ArrowRight size={12} className="text-morandi-secondary" />
                          <span>{getAirportName(seg.destination) || seg.destination}</span>
                        </div>
                        {seg.departureTime && (
                          <span className="text-morandi-secondary">
                            {seg.departureTime.slice(0, 2)}:{seg.departureTime.slice(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 旅客比對表 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-morandi-secondary">旅客比對</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-morandi-container/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">#</th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">PNR 姓名</th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary w-16">類型</th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">團員</th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">
                          <Briefcase size={14} className="inline mr-1" />
                          行李
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">
                          <Utensils size={14} className="inline mr-1" />
                          餐食
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-morandi-secondary">票價</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengerMatches.map((match, i) => (
                        <tr key={i} className="border-t border-border hover:bg-morandi-container/20">
                          <td className="px-3 py-2 text-morandi-secondary">{i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="font-mono">{match.pnrName}</div>
                            {/* 顯示隨行嬰兒資訊 */}
                            {match.infant && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-pink-600">
                                <Baby size={12} />
                                <span>{match.infant.name}</span>
                                <span className="text-pink-400">({match.infant.birthDate})</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {/* 顯示旅客類型徽章 */}
                            {match.passengerType === 'CHD' ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                兒童
                                {match.birthDate && <span className="ml-1 text-blue-500">({match.birthDate})</span>}
                              </span>
                            ) : match.infant ? (
                              <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded-full">
                                +嬰兒
                              </span>
                            ) : (
                              <span className="text-xs text-morandi-secondary">成人</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {match.memberId ? (
                              <div className="flex items-center gap-1">
                                <Check size={14} className="text-green-600" />
                                <span>{match.memberName || match.memberPassportName}</span>
                              </div>
                            ) : (
                              <select
                                className="text-sm border border-border rounded px-2 py-1 bg-yellow-50"
                                value=""
                                onChange={(e) => handleMemberSelect(i, e.target.value || null)}
                              >
                                <option value="">選擇團員...</option>
                                {members.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.chinese_name || m.passport_name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2 text-morandi-secondary">
                            {match.baggage.length > 0 ? match.baggage.join(', ') : '-'}
                          </td>
                          <td className="px-3 py-2 text-morandi-secondary">
                            {match.meal.length > 0 ? match.meal.join(', ') : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={match.ticketPrice || ''}
                              onChange={(e) => handlePriceChange(i, e.target.value)}
                              placeholder="票價"
                              className="w-24 h-7 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            <X size={16} className="mr-1" />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!parsedPNR || isSaving}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
          >
            <Save size={16} className={isSaving ? 'hidden' : ''} />
            <Loader2 size={16} className={isSaving ? 'animate-spin' : 'hidden'} />
            儲存並關聯
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
