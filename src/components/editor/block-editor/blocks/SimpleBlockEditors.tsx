/**
 * 簡化版區塊編輯器
 *
 * 包含較少使用的區塊編輯器
 */

'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, MapPin, Users, HelpCircle, AlertCircle, XCircle } from 'lucide-react'
import type {
  FocusCardsBlockData,
  LeaderMeetingBlockData,
  PricingBlockData,
  PriceTiersBlockData,
  FAQsBlockData,
  NoticesBlockData,
  CancellationBlockData,
} from '../types'

// ============================================================
// 精選景點區塊編輯器
// ============================================================

interface FocusCardsBlockEditorProps {
  data: FocusCardsBlockData
  onChange: (data: Partial<FocusCardsBlockData>) => void
}

export function FocusCardsBlockEditor({ data, onChange }: FocusCardsBlockEditorProps) {
  const cards = data.focusCards || []

  const addCard = useCallback(() => {
    onChange({ focusCards: [...cards, { title: '', src: '' }] })
  }, [cards, onChange])

  const updateCard = useCallback((index: number, field: 'title' | 'src', value: string) => {
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], [field]: value }
    onChange({ focusCards: newCards })
  }, [cards, onChange])

  const removeCard = useCallback((index: number) => {
    onChange({ focusCards: cards.filter((_, i) => i !== index) })
  }, [cards, onChange])

  return (
    <div className="space-y-2">
      {cards.map((card, index) => (
        <div key={index} className="flex gap-2 p-2 bg-morandi-container/30 rounded-lg">
          <MapPin size={14} className="text-morandi-gold mt-2 shrink-0" />
          <div className="flex-1 space-y-1">
            <Input
              value={card.title || ''}
              onChange={e => updateCard(index, 'title', e.target.value)}
              placeholder="景點名稱"
              className="h-8 text-sm"
            />
            <Input
              value={card.src || ''}
              onChange={e => updateCard(index, 'src', e.target.value)}
              placeholder="圖片 URL"
              className="h-8 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeCard(index)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addCard}>
        <Plus size={14} />
        新增景點
      </Button>
    </div>
  )
}

// ============================================================
// 領隊與集合區塊編輯器
// ============================================================

interface LeaderMeetingBlockEditorProps {
  data: LeaderMeetingBlockData
  onChange: (data: Partial<LeaderMeetingBlockData>) => void
}

export function LeaderMeetingBlockEditor({ data, onChange }: LeaderMeetingBlockEditorProps) {
  const leader = data.leader || { name: '', domesticPhone: '', overseasPhone: '' }
  const points = data.meetingPoints || []

  const updateLeader = useCallback((field: string, value: string) => {
    onChange({ leader: { ...leader, [field]: value } })
  }, [leader, onChange])

  const addPoint = useCallback(() => {
    onChange({ meetingPoints: [...points, { time: '', location: '' }] })
  }, [points, onChange])

  const updatePoint = useCallback((index: number, field: 'time' | 'location', value: string) => {
    const newPoints = [...points]
    newPoints[index] = { ...newPoints[index], [field]: value }
    onChange({ meetingPoints: newPoints })
  }, [points, onChange])

  const removePoint = useCallback((index: number) => {
    onChange({ meetingPoints: points.filter((_, i) => i !== index) })
  }, [points, onChange])

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-morandi-gold" />
          <span className="text-sm font-medium">領隊資訊</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            value={leader.name || ''}
            onChange={e => updateLeader('name', e.target.value)}
            placeholder="領隊姓名"
            className="h-8 text-sm"
          />
          <Input
            value={leader.domesticPhone || ''}
            onChange={e => updateLeader('domesticPhone', e.target.value)}
            placeholder="國內電話"
            className="h-8 text-sm"
          />
          <Input
            value={leader.overseasPhone || ''}
            onChange={e => updateLeader('overseasPhone', e.target.value)}
            placeholder="海外電話"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div>
        <span className="text-sm font-medium">集合地點</span>
        <div className="space-y-1 mt-2">
          {points.map((point, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={point.time || ''}
                onChange={e => updatePoint(index, 'time', e.target.value)}
                placeholder="時間"
                className="h-8 text-sm w-24"
              />
              <Input
                value={point.location || ''}
                onChange={e => updatePoint(index, 'location', e.target.value)}
                placeholder="地點"
                className="h-8 text-sm flex-1"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removePoint(index)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={addPoint}>
            <Plus size={14} />
            新增集合地點
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 團費明細區塊編輯器
// ============================================================

interface PricingBlockEditorProps {
  data: PricingBlockData
  onChange: (data: Partial<PricingBlockData>) => void
}

export function PricingBlockEditor({ data, onChange }: PricingBlockEditorProps) {
  const pricing = data.pricingDetails || { included_items: [], excluded_items: [], notes: [] }

  return (
    <div className="text-sm text-morandi-secondary">
      <div className="space-y-2">
        <div>費用包含：{pricing.included_items?.length || 0} 項</div>
        <div>費用不含：{pricing.excluded_items?.length || 0} 項</div>
        <div>注意事項：{pricing.notes?.length || 0} 條</div>
        <p className="text-xs mt-2">（詳細編輯請使用完整版編輯器）</p>
      </div>
    </div>
  )
}

// ============================================================
// 價格方案區塊編輯器
// ============================================================

interface PriceTiersBlockEditorProps {
  data: PriceTiersBlockData
  onChange: (data: Partial<PriceTiersBlockData>) => void
}

export function PriceTiersBlockEditor({ data, onChange }: PriceTiersBlockEditorProps) {
  const tiers = data.priceTiers || []

  const addTier = useCallback(() => {
    onChange({ priceTiers: [...tiers, { label: '', price: '' }] })
  }, [tiers, onChange])

  const updateTier = useCallback((index: number, field: string, value: string) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    onChange({ priceTiers: newTiers })
  }, [tiers, onChange])

  const removeTier = useCallback((index: number) => {
    onChange({ priceTiers: tiers.filter((_, i) => i !== index) })
  }, [tiers, onChange])

  return (
    <div className="space-y-2">
      {tiers.map((tier, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={tier.label || ''}
            onChange={e => updateTier(index, 'label', e.target.value)}
            placeholder="方案名稱"
            className="h-8 text-sm flex-1"
          />
          <Input
            value={tier.price || ''}
            onChange={e => updateTier(index, 'price', e.target.value)}
            placeholder="價格"
            className="h-8 text-sm w-28"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeTier(index)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addTier}>
        <Plus size={14} />
        新增方案
      </Button>
    </div>
  )
}

// ============================================================
// 常見問題區塊編輯器
// ============================================================

interface FAQsBlockEditorProps {
  data: FAQsBlockData
  onChange: (data: Partial<FAQsBlockData>) => void
}

export function FAQsBlockEditor({ data, onChange }: FAQsBlockEditorProps) {
  const faqs = data.faqs || []

  const addFaq = useCallback(() => {
    onChange({ faqs: [...faqs, { question: '', answer: '' }] })
  }, [faqs, onChange])

  const updateFaq = useCallback((index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    onChange({ faqs: newFaqs })
  }, [faqs, onChange])

  const removeFaq = useCallback((index: number) => {
    onChange({ faqs: faqs.filter((_, i) => i !== index) })
  }, [faqs, onChange])

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => (
        <div key={index} className="p-2 bg-morandi-container/30 rounded-lg space-y-1">
          <div className="flex gap-2">
            <HelpCircle size={14} className="text-morandi-gold mt-2 shrink-0" />
            <Input
              value={faq.question || ''}
              onChange={e => updateFaq(index, 'question', e.target.value)}
              placeholder="問題"
              className="h-8 text-sm flex-1"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFaq(index)}>
              <Trash2 size={14} />
            </Button>
          </div>
          <Textarea
            value={faq.answer || ''}
            onChange={e => updateFaq(index, 'answer', e.target.value)}
            placeholder="答案"
            className="text-sm min-h-[60px]"
          />
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addFaq}>
        <Plus size={14} />
        新增問題
      </Button>
    </div>
  )
}

// ============================================================
// 提醒事項區塊編輯器
// ============================================================

interface NoticesBlockEditorProps {
  data: NoticesBlockData
  onChange: (data: Partial<NoticesBlockData>) => void
}

export function NoticesBlockEditor({ data, onChange }: NoticesBlockEditorProps) {
  const notices = data.notices || []

  const addNotice = useCallback(() => {
    onChange({ notices: [...notices, ''] })
  }, [notices, onChange])

  const updateNotice = useCallback((index: number, value: string) => {
    const newNotices = [...notices]
    newNotices[index] = value
    onChange({ notices: newNotices })
  }, [notices, onChange])

  const removeNotice = useCallback((index: number) => {
    onChange({ notices: notices.filter((_, i) => i !== index) })
  }, [notices, onChange])

  return (
    <div className="space-y-2">
      {notices.map((notice, index) => (
        <div key={index} className="flex gap-2">
          <AlertCircle size={14} className="text-amber-500 mt-2 shrink-0" />
          <Input
            value={notice || ''}
            onChange={e => updateNotice(index, e.target.value)}
            placeholder="提醒事項"
            className="h-8 text-sm flex-1"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeNotice(index)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addNotice}>
        <Plus size={14} />
        新增提醒
      </Button>
    </div>
  )
}

// ============================================================
// 取消政策區塊編輯器
// ============================================================

interface CancellationBlockEditorProps {
  data: CancellationBlockData
  onChange: (data: Partial<CancellationBlockData>) => void
}

export function CancellationBlockEditor({ data, onChange }: CancellationBlockEditorProps) {
  const policies = data.cancellationPolicy || []

  const addPolicy = useCallback(() => {
    onChange({ cancellationPolicy: [...policies, ''] })
  }, [policies, onChange])

  const updatePolicy = useCallback((index: number, value: string) => {
    const newPolicies = [...policies]
    newPolicies[index] = value
    onChange({ cancellationPolicy: newPolicies })
  }, [policies, onChange])

  const removePolicy = useCallback((index: number) => {
    onChange({ cancellationPolicy: policies.filter((_, i) => i !== index) })
  }, [policies, onChange])

  return (
    <div className="space-y-2">
      {policies.map((policy, index) => (
        <div key={index} className="flex gap-2">
          <XCircle size={14} className="text-red-500 mt-2 shrink-0" />
          <Input
            value={policy || ''}
            onChange={e => updatePolicy(index, e.target.value)}
            placeholder="取消政策"
            className="h-8 text-sm flex-1"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removePolicy(index)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addPolicy}>
        <Plus size={14} />
        新增政策
      </Button>
    </div>
  )
}
