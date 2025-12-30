'use client'

/**
 * PNR 配對對話框
 *
 * 功能：
 * 1. 貼上 PNR 電報
 * 2. 自動解析旅客姓名
 * 3. 比對團員名單（護照拼音）
 * 4. 顯示配對結果
 * 5. 批量儲存 PNR 到團員
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
import { Check, X, AlertCircle, Plane, Save, RefreshCw } from 'lucide-react'
import { parseAmadeusPNR, type ParsedPNR } from '@/lib/pnr-parser'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TourMember {
  id: string
  chinese_name: string | null
  passport_name: string | null
  pnr?: string | null
}

interface MatchResult {
  pnrPassenger: string
  matchedMember: TourMember | null
  confidence: 'exact' | 'partial' | 'none'
  score: number
}

interface PnrMatchDialogProps {
  isOpen: boolean
  onClose: () => void
  members: TourMember[]
  onSuccess?: () => void
}

export function PnrMatchDialog({
  isOpen,
  onClose,
  members,
  onSuccess,
}: PnrMatchDialogProps) {
  const [rawPnr, setRawPnr] = useState('')
  const [parsedPnr, setParsedPnr] = useState<ParsedPNR | null>(null)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({})

  // 解析 PNR 並進行配對
  const handleParse = useCallback(() => {
    if (!rawPnr.trim()) {
      toast.error('請先貼上 PNR 電報')
      return
    }

    const parsed = parseAmadeusPNR(rawPnr)
    setParsedPnr(parsed)

    // 進行配對
    const results: MatchResult[] = parsed.passengerNames.map((pnrName) => {
      const match = findBestMatch(pnrName, members)
      return {
        pnrPassenger: pnrName,
        matchedMember: match.member,
        confidence: match.confidence,
        score: match.score,
      }
    })

    setMatchResults(results)
    setManualMatches({})

    // 顯示統計
    const exactCount = results.filter(r => r.confidence === 'exact').length
    const partialCount = results.filter(r => r.confidence === 'partial').length
    const noneCount = results.filter(r => r.confidence === 'none').length

    if (noneCount === 0) {
      toast.success(`全部配對成功！共 ${results.length} 位旅客`)
    } else {
      toast.info(`配對完成：${exactCount} 完全符合, ${partialCount} 部分符合, ${noneCount} 未配對`)
    }
  }, [rawPnr, members])

  // 手動選擇配對
  const handleManualMatch = (pnrPassenger: string, memberId: string) => {
    setManualMatches(prev => ({ ...prev, [pnrPassenger]: memberId }))
  }

  // 計算最終配對結果（包含手動調整）
  const finalResults = useMemo(() => {
    return matchResults.map(result => {
      const manualMemberId = manualMatches[result.pnrPassenger]
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
    const matchedMembers = finalResults.filter(r => r.matchedMember)

    if (matchedMembers.length === 0) {
      toast.error('沒有可儲存的配對')
      return
    }

    setIsSaving(true)
    try {
      // 批量更新團員的 PNR
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

      toast.success(`已儲存 ${matchedMembers.length} 位團員的 PNR: ${recordLocator}`)
      onSuccess?.()
      handleClose()
    } catch (error) {
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
    return { exact, partial, none, total: finalResults.length }
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
              <div className="flex items-center gap-4 p-3 bg-morandi-container/30 rounded-lg">
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
              </div>

              {/* 配對列表 */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-morandi-container/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">PNR 旅客</th>
                      <th className="px-3 py-2 text-left font-medium">配對狀態</th>
                      <th className="px-3 py-2 text-left font-medium">團員（護照拼音）</th>
                      <th className="px-3 py-2 text-left font-medium">中文姓名</th>
                      <th className="px-3 py-2 text-left font-medium">手動選擇</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalResults.map((result, index) => (
                      <tr
                        key={index}
                        className={cn(
                          'border-t',
                          result.confidence === 'none' && 'bg-red-50',
                          result.confidence === 'partial' && 'bg-amber-50'
                        )}
                      >
                        <td className="px-3 py-2 font-mono">{result.pnrPassenger}</td>
                        <td className="px-3 py-2">
                          {result.confidence === 'exact' && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check size={14} /> 完全符合
                            </span>
                          )}
                          {result.confidence === 'partial' && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertCircle size={14} /> 部分符合
                            </span>
                          )}
                          {result.confidence === 'none' && (
                            <span className="flex items-center gap-1 text-red-600">
                              <X size={14} /> 未配對
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {result.matchedMember?.passport_name || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {result.matchedMember?.chinese_name || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={manualMatches[result.pnrPassenger] || result.matchedMember?.id || ''}
                            onChange={(e) => handleManualMatch(result.pnrPassenger, e.target.value)}
                            className="text-xs border rounded px-2 py-1 w-full max-w-[150px]"
                          >
                            <option value="">-- 選擇團員 --</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.chinese_name || m.passport_name}
                              </option>
                            ))}
                          </select>
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
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!parsedPnr || stats.exact + stats.partial === 0 || isSaving}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Save size={16} className="mr-1" />
            {isSaving ? '儲存中...' : `儲存配對 (${stats.exact + stats.partial} 人)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// 名稱配對演算法
// =====================================================

function findBestMatch(
  pnrName: string,
  members: TourMember[]
): { member: TourMember | null; confidence: 'exact' | 'partial' | 'none'; score: number } {
  // 正規化 PNR 姓名 (移除稱謂、空格)
  const normalizedPnr = normalizeName(pnrName)

  let bestMatch: TourMember | null = null
  let bestScore = 0
  let confidence: 'exact' | 'partial' | 'none' = 'none'

  for (const member of members) {
    if (!member.passport_name) continue

    const normalizedMember = normalizeName(member.passport_name)

    // 1. 完全相符
    if (normalizedPnr === normalizedMember) {
      return { member, confidence: 'exact', score: 100 }
    }

    // 2. 計算相似度
    const score = calculateSimilarity(normalizedPnr, normalizedMember)

    if (score > bestScore) {
      bestScore = score
      bestMatch = member
    }
  }

  // 判斷信心度
  if (bestScore >= 80) {
    confidence = 'exact'
  } else if (bestScore >= 50) {
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
