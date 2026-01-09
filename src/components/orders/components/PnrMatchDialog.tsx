'use client'

/**
 * PNR 配對對話框
 *
 * 功能：
 * 1. 貼上 PNR 電報
 * 2. 自動解析旅客姓名
 * 3. 比對團員名單（護照拼音）
 * 4. 若團員名單為空或無匹配，自動從客戶資料庫搜尋
 * 5. 顯示配對結果與建議客戶
 * 6. 批量儲存 PNR 到團員或建立新團員
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, AlertCircle, Plane, Save, RefreshCw, UserPlus, Users } from 'lucide-react'
import { parseAmadeusPNR, type ParsedPNR } from '@/lib/pnr-parser'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'

interface TourMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
  pnr?: string | null
}

interface SuggestedCustomer {
  id: string
  name: string
  passport_romanization: string | null
  passport_number: string | null
  national_id: string | null
  date_of_birth: string | null
  gender: string | null
  score: number
}

interface MatchResult {
  pnrPassenger: string
  matchedMember: TourMember | null
  suggestedCustomers: SuggestedCustomer[]
  selectedCustomerId: string | null
  confidence: 'exact' | 'partial' | 'none'
  score: number
}

interface PnrMatchDialogProps {
  isOpen: boolean
  onClose: () => void
  members: TourMember[]
  orderId?: string
  workspaceId?: string
  onSuccess?: () => void
}

export function PnrMatchDialog({
  isOpen,
  onClose,
  members,
  orderId,
  workspaceId,
  onSuccess,
}: PnrMatchDialogProps) {
  const [rawPnr, setRawPnr] = useState('')
  const [parsedPnr, setParsedPnr] = useState<ParsedPNR | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({})
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)

  /**
   * 從客戶資料庫搜尋符合護照拼音的客戶
   * 對所有旅客都搜尋，這樣取消配對後也能選擇客戶
   */
  const searchCustomersForPassengers = useCallback(async (
    pnrNames: string[]
  ): Promise<Record<string, SuggestedCustomer[]>> => {
    if (pnrNames.length === 0) {
      return {}
    }

    try {
      // 從客戶資料庫載入所有有護照拼音的客戶
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, passport_romanization, passport_number, national_id, date_of_birth, gender')
        .not('passport_romanization', 'is', null)

      if (error) throw error

      // 為每個旅客搜尋相似的客戶
      const suggestions: Record<string, SuggestedCustomer[]> = {}

      for (const pnrName of pnrNames) {
        const normalizedPnr = normalizeName(pnrName)
        const pnrParts = splitPassportName(pnrName)
        const matchedCustomers: SuggestedCustomer[] = []

        for (const customer of customers || []) {
          if (!customer.passport_romanization) continue

          const normalizedCustomer = normalizeName(customer.passport_romanization)
          const customerParts = splitPassportName(customer.passport_romanization)

          // 完全相符
          if (normalizedPnr === normalizedCustomer) {
            matchedCustomers.push({ ...customer, score: 100 })
            continue
          }

          // 姓氏必須完全相同才考慮
          if (pnrParts.surname !== customerParts.surname) continue

          // 姓氏相同，計算名字相似度
          const givenNameScore = calculateSimilarity(pnrParts.givenName, customerParts.givenName)

          if (givenNameScore >= 50) {
            matchedCustomers.push({ ...customer, score: givenNameScore })
          }
        }

        // 按分數排序，取前 5 個
        suggestions[pnrName] = matchedCustomers
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      }

      return suggestions
    } catch (error) {
      logger.error('搜尋客戶失敗:', error)
      return {}
    }
  }, [])

  // 解析 PNR 並進行配對
  const handleParse = useCallback(async () => {
    if (!rawPnr.trim()) {
      toast.error('請先貼上 PNR 電報')
      return
    }

    const parsed = parseAmadeusPNR(rawPnr)
    setParsedPnr(parsed)

    // 進行成員配對
    const memberResults = parsed.passengerNames.map((pnrName) => ({
      pnrName,
      match: findBestMatch(pnrName, members),
    }))

    // 統計配對數量
    const exactCount = memberResults.filter(r => r.match.confidence === 'exact').length
    const partialCount = memberResults.filter(r => r.match.confidence === 'partial').length
    const noneCount = memberResults.filter(r => r.match.confidence === 'none').length

    // 對所有旅客搜尋客戶資料庫（這樣取消配對後也能選擇客戶）
    setIsSearchingCustomers(true)
    const customerSuggestions = await searchCustomersForPassengers(parsed.passengerNames)
    setIsSearchingCustomers(false)

    // 組合配對結果
    const results: MatchResult[] = memberResults.map(({ pnrName, match }) => ({
      pnrPassenger: pnrName,
      matchedMember: match.member,
      suggestedCustomers: customerSuggestions[pnrName] || [],
      selectedCustomerId: null,
      confidence: match.confidence,
      score: match.score,
    }))

    setMatchResults(results)
    setManualMatches({})

    // 顯示統計
    const suggestedCount = results.filter(r => r.suggestedCustomers.length > 0).length

    if (noneCount === 0 && partialCount === 0) {
      toast.success(`全部配對成功！共 ${results.length} 位旅客`)
    } else if (suggestedCount > 0) {
      toast.info(`配對完成：${exactCount} 完全符合, ${partialCount} 部分符合, ${noneCount} 未配對。找到 ${suggestedCount} 位可能的客戶建議`)
    } else {
      toast.info(`配對完成：${exactCount} 完全符合, ${partialCount} 部分符合, ${noneCount} 未配對`)
    }
  }, [rawPnr, members, searchCustomersForPassengers])

  // 手動選擇配對（現有成員）或取消配對
  const handleManualMatch = (pnrPassenger: string, memberId: string) => {
    if (memberId === '__NONE__') {
      // 取消配對
      setManualMatches(prev => ({ ...prev, [pnrPassenger]: '__NONE__' }))
    } else if (memberId === '') {
      // 恢復自動配對
      setManualMatches(prev => {
        const newMatches = { ...prev }
        delete newMatches[pnrPassenger]
        return newMatches
      })
    } else {
      // 手動選擇成員
      setManualMatches(prev => ({ ...prev, [pnrPassenger]: memberId }))
    }
    // 清除該旅客的客戶選擇
    setMatchResults(prev => prev.map(r =>
      r.pnrPassenger === pnrPassenger ? { ...r, selectedCustomerId: null } : r
    ))
  }

  // 選擇建議客戶
  const handleSelectCustomer = (pnrPassenger: string, customerId: string) => {
    setMatchResults(prev => prev.map(r =>
      r.pnrPassenger === pnrPassenger ? { ...r, selectedCustomerId: customerId || null } : r
    ))
    // 選擇客戶時，同時取消成員配對（設為 __NONE__）
    // 這樣 finalResults 才會正確顯示為「已選客戶」而不是原本的成員配對
    if (customerId) {
      setManualMatches(prev => ({ ...prev, [pnrPassenger]: '__NONE__' }))
    } else {
      // 如果清除客戶選擇，也清除取消配對狀態，恢復自動配對
      setManualMatches(prev => {
        const newMatches = { ...prev }
        delete newMatches[pnrPassenger]
        return newMatches
      })
    }
  }

  // 計算最終配對結果（包含手動調整）
  const finalResults = useMemo(() => {
    return matchResults.map(result => {
      const manualMemberId = manualMatches[result.pnrPassenger]
      if (manualMemberId === '__NONE__') {
        // 手動取消配對
        return {
          ...result,
          matchedMember: null,
          confidence: 'none' as const,
          score: 0,
        }
      }
      if (manualMemberId) {
        const manualMember = members.find(m => m.id === manualMemberId) || null
        return {
          ...result,
          matchedMember: manualMember,
          confidence: manualMember ? 'exact' as const : 'none' as const,
        }
      }
      return result
    })
  }, [matchResults, manualMatches, members])

  // 儲存配對結果
  const handleSave = async () => {
    if (!parsedPnr) return

    const recordLocator = parsedPnr.recordLocator || rawPnr.slice(0, 6)

    // 分類配對結果
    const matchedMembers = finalResults.filter(r => r.matchedMember)
    const selectedCustomers = finalResults.filter(r => r.selectedCustomerId && !r.matchedMember)

    if (matchedMembers.length === 0 && selectedCustomers.length === 0) {
      toast.error('沒有可儲存的配對')
      return
    }

    // 檢查是否需要建立新成員但缺少 orderId
    if (selectedCustomers.length > 0 && !orderId) {
      toast.error('無法建立新成員：缺少訂單資訊')
      return
    }

    setIsSaving(true)
    try {
      let updatedCount = 0
      let createdCount = 0

      // 1. 更新現有成員的 PNR
      if (matchedMembers.length > 0) {
        const updates = matchedMembers.map(r => ({
          id: r.matchedMember!.id,
          pnr: recordLocator,
        }))

        for (const update of updates) {
          await supabase
            .from('order_members')
            .update({ pnr: update.pnr })
            .eq('id', update.id)
        }
        updatedCount = matchedMembers.length
      }

      // 2. 從選擇的客戶建立新成員
      if (selectedCustomers.length > 0 && orderId && workspaceId) {
        for (const result of selectedCustomers) {
          const customer = result.suggestedCustomers.find(c => c.id === result.selectedCustomerId)
          if (!customer) continue

          const newMember = {
            order_id: orderId,
            workspace_id: workspaceId,
            customer_id: customer.id,
            chinese_name: customer.name,
            passport_name: customer.passport_romanization,
            passport_number: customer.passport_number,
            id_number: customer.national_id,
            birth_date: customer.date_of_birth,
            gender: customer.gender,
            pnr: recordLocator,
            member_type: 'adult',
            identity: '大人',
          }

          const { error } = await supabase
            .from('order_members')
            .insert(newMember)

          if (error) {
            logger.error('建立成員失敗:', error)
          } else {
            createdCount++
          }
        }
      }

      // 顯示結果
      const messages: string[] = []
      if (updatedCount > 0) messages.push(`${updatedCount} 位團員已更新 PNR`)
      if (createdCount > 0) messages.push(`${createdCount} 位新成員已建立`)
      toast.success(`${messages.join('，')}。訂位代號: ${recordLocator}`)

      onSuccess?.()
      handleClose()
    } catch (error) {
      logger.error('儲存失敗:', error)
      toast.error('儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setRawPnr('')
    setParsedPnr(null)
    setMatchResults([])
    setManualMatches({})
    onClose()
  }

  // 統計
  const stats = useMemo(() => {
    const exact = finalResults.filter(r => r.confidence === 'exact').length
    const partial = finalResults.filter(r => r.confidence === 'partial').length
    const none = finalResults.filter(r => r.confidence === 'none').length
    const withSuggestions = finalResults.filter(r => r.suggestedCustomers.length > 0 && !r.matchedMember).length
    const selectedCustomers = finalResults.filter(r => r.selectedCustomerId && !r.matchedMember).length
    return { exact, partial, none, withSuggestions, selectedCustomers, total: finalResults.length }
  }, [finalResults])

  // 可儲存的總數（配對的成員 + 選擇的客戶）
  const savableCount = useMemo(() => {
    const matchedCount = finalResults.filter(r => r.matchedMember).length
    const selectedCount = finalResults.filter(r => r.selectedCustomerId && !r.matchedMember).length
    return matchedCount + selectedCount
  }, [finalResults])

  // 未配對的團員
  const unmatchedMembers = useMemo(() => {
    const matchedIds = new Set(finalResults.map(r => r.matchedMember?.id).filter(Boolean))
    return members.filter(m => !matchedIds.has(m.id))
  }, [members, finalResults])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane size={20} className="text-morandi-gold" />
            PNR 配對
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* 輸入區域 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-morandi-primary">
              貼上 PNR 電報
            </label>
            <Textarea
              value={rawPnr}
              onChange={(e) => setRawPnr(e.target.value)}
              placeholder={`貼上 Amadeus PNR 電報...

範例：
RP/TPEW123ML/TPEW123ML        AA/SU  16NOV25/1238Z   FUM2GY
1.CHEN/YIHSUAN  2.HSIEH/CHIAJEN MR
3  BR 116 Q 15JAN 4 TPECTS HK2  0930 1405
...`}
              className="min-h-[120px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={handleParse} disabled={!rawPnr.trim()}>
                <RefreshCw size={16} className="mr-1" />
                解析並配對
              </Button>
              {parsedPnr && (
                <span className="text-sm text-morandi-secondary self-center">
                  訂位代號: <strong>{parsedPnr.recordLocator || '未識別'}</strong>
                </span>
              )}
            </div>
          </div>

          {/* 配對結果 */}
          {matchResults.length > 0 && (
            <div className="space-y-3">
              {/* 統計 */}
              <div className="flex items-center gap-4 p-3 bg-morandi-container/30 rounded-lg flex-wrap">
                <span className="text-sm font-medium">配對結果：</span>
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check size={14} /> {stats.exact} 完全符合
                </span>
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertCircle size={14} /> {stats.partial} 部分符合
                </span>
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <X size={14} /> {stats.none} 未配對
                </span>
                {stats.withSuggestions > 0 && (
                  <span className="flex items-center gap-1 text-sm text-blue-600">
                    <Users size={14} /> {stats.withSuggestions} 位有建議客戶
                  </span>
                )}
                {stats.selectedCustomers > 0 && (
                  <span className="flex items-center gap-1 text-sm text-purple-600">
                    <UserPlus size={14} /> {stats.selectedCustomers} 位已選擇客戶
                  </span>
                )}
              </div>

              {/* 說明文字 */}
              {stats.withSuggestions > 0 && orderId && (
                <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <Users size={12} className="inline mr-1" />
                  系統已從客戶資料庫找到相似護照拼音的客戶，您可以在「建議客戶」欄選擇後自動建立成員。
                </div>
              )}
              {stats.withSuggestions > 0 && !orderId && (
                <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                  <AlertCircle size={12} className="inline mr-1" />
                  找到建議客戶，但因未指定訂單，無法建立新成員。請先選擇要新增成員的訂單。
                </div>
              )}

              {/* 配對列表 */}
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-morandi-container/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">PNR 旅客</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">配對狀態</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">團員（護照拼音）</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">中文姓名</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">手動選擇</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">建議客戶</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalResults.map((result, index) => (
                      <tr
                        key={index}
                        className={cn(
                          'border-t',
                          result.selectedCustomerId && 'bg-purple-50',
                          !result.selectedCustomerId && result.confidence === 'none' && 'bg-red-50',
                          !result.selectedCustomerId && result.confidence === 'partial' && 'bg-amber-50'
                        )}
                      >
                        <td className="px-3 py-2 font-mono whitespace-nowrap">{result.pnrPassenger}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {result.selectedCustomerId ? (
                            <span className="flex items-center gap-1 text-purple-600">
                              <UserPlus size={14} /> 已選客戶
                            </span>
                          ) : result.confidence === 'exact' ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check size={14} /> 完全符合
                            </span>
                          ) : result.confidence === 'partial' ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertCircle size={14} /> 部分符合
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <X size={14} /> 未配對
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">
                          {result.matchedMember?.passport_name || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {result.matchedMember?.chinese_name || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={
                              manualMatches[result.pnrPassenger] === '__NONE__'
                                ? '__NONE__'
                                : manualMatches[result.pnrPassenger] || result.matchedMember?.id || ''
                            }
                            onChange={(e) => handleManualMatch(result.pnrPassenger, e.target.value)}
                            className="text-xs border rounded px-2 py-1 w-full max-w-[150px]"
                            disabled={!!result.selectedCustomerId}
                          >
                            <option value="">-- 自動配對 --</option>
                            <option value="__NONE__">❌ 取消配對</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.chinese_name || m.passport_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {result.suggestedCustomers.length > 0 ? (
                            <select
                              value={result.selectedCustomerId || ''}
                              onChange={(e) => handleSelectCustomer(result.pnrPassenger, e.target.value)}
                              className={cn(
                                "text-xs border rounded px-2 py-1 w-full max-w-[180px]",
                                result.selectedCustomerId && "border-purple-400 bg-purple-50"
                              )}
                              disabled={!!result.matchedMember && !result.selectedCustomerId}
                            >
                              <option value="">-- 選擇客戶 --</option>
                              {result.suggestedCustomers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.passport_romanization}) {c.score}%
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-morandi-muted">無建議</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 未配對的團員 */}
              {unmatchedMembers.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-700 mb-2">
                    未在 PNR 中的團員 ({unmatchedMembers.length} 人)：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unmatchedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-1 bg-white rounded text-xs border border-amber-200"
                      >
                        {m.chinese_name || m.passport_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 航班資訊 */}
              {parsedPnr && parsedPnr.segments.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 mb-2">航班資訊：</p>
                  <div className="space-y-1">
                    {parsedPnr.segments.map((seg, i) => (
                      <p key={i} className="text-xs font-mono text-blue-600">
                        {seg.airline}{seg.flightNumber} {seg.origin}→{seg.destination} {seg.departureDate} {seg.departureTime}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="gap-1" onClick={handleClose}>
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!parsedPnr || savableCount === 0 || isSaving}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Save size={16} className="mr-1" />
            {isSaving ? '儲存中...' : `儲存配對 (${savableCount} 人)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// 名稱配對演算法
// =====================================================

/**
 * 分離護照拼音的姓氏和名字
 * 格式: SURNAME/GIVENNAME 或 SURNAME/GIVENNAME MR
 */
function splitPassportName(name: string): { surname: string; givenName: string } {
  const normalized = normalizeName(name)
  const parts = normalized.split('/')
  if (parts.length >= 2) {
    return { surname: parts[0], givenName: parts.slice(1).join('/') }
  }
  // 沒有斜線的情況，當作整個是姓名
  return { surname: normalized, givenName: '' }
}

function findBestMatch(
  pnrName: string,
  members: TourMember[]
): { member: TourMember | null; confidence: 'exact' | 'partial' | 'none'; score: number } {
  // 正規化 PNR 姓名 (移除稱謂、空格)
  const normalizedPnr = normalizeName(pnrName)
  const pnrParts = splitPassportName(pnrName)

  let bestMatch: TourMember | null = null
  let bestScore = 0

  for (const member of members) {
    if (!member.passport_name) continue

    const normalizedMember = normalizeName(member.passport_name)
    const memberParts = splitPassportName(member.passport_name)

    // 1. 完全相符（護照拼音完全一樣）
    if (normalizedPnr === normalizedMember) {
      return { member, confidence: 'exact', score: 100 }
    }

    // 2. 計算姓氏相似度（姓氏必須完全相同才考慮）
    // 姓氏必須 100% 相同，避免 LAI 配到 LIN，或 CHEN 配到 CHENG
    if (pnrParts.surname !== memberParts.surname) continue

    // 3. 姓氏相同，計算名字相似度
    const givenNameScore = calculateSimilarity(pnrParts.givenName, memberParts.givenName)

    if (givenNameScore > bestScore) {
      bestScore = givenNameScore
      bestMatch = member
    }
  }

  // 判斷信心度
  // 「完全符合」只有在護照拼音完全相同時才會返回（上面已經 return 了）
  // 這裡只會是「部分符合」或「未配對」
  let confidence: 'exact' | 'partial' | 'none' = 'none'

  if (bestScore >= 80) {
    // 姓氏相同，名字高度相似（如 TZUCHUN vs TZUCHEN）
    confidence = 'partial'
  } else if (bestScore >= 60) {
    // 姓氏相同，名字部分相似
    confidence = 'partial'
  } else {
    confidence = 'none'
    bestMatch = null
  }

  return { member: bestMatch, confidence, score: bestScore }
}

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+(MR|MRS|MS|MISS|MSTR|CHD|INF)$/i, '') // 移除稱謂
    .replace(/\s+/g, '') // 移除空格
    .trim()
}

function calculateSimilarity(str1: string, str2: string): number {
  // Jaro-Winkler 相似度簡化版
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0 && len2 === 0) return 100
  if (len1 === 0 || len2 === 0) return 0

  // 計算共同字元
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1
  const matched1 = new Array(len1).fill(false)
  const matched2 = new Array(len2).fill(false)
  let matches = 0
  let transpositions = 0

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(len2, i + matchWindow + 1)

    for (let j = start; j < end; j++) {
      if (matched2[j] || str1[i] !== str2[j]) continue
      matched1[i] = true
      matched2[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  // 計算換位
  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!matched1[i]) continue
    while (!matched2[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3

  // Winkler 加權（共同前綴）
  let prefix = 0
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (str1[i] === str2[i]) prefix++
    else break
  }

  return Math.round((jaro + prefix * 0.1 * (1 - jaro)) * 100)
}
