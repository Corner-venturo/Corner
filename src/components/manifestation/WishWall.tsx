'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Wish {
  id: string
  shared_wish: string
  created_at: string
}

export function WishWall() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWishes()
  }, [])

  const fetchWishes = async () => {
    try {
      const { data, error } = await supabase
        .from('manifestation_entries')
        .select('id, shared_wish, created_at')
        .not('shared_wish', 'is', null)
        .neq('shared_wish', '')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setWishes(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    )
  }

  if (wishes.length === 0) {
    return (
      <div className="text-center p-12">
        <Sparkles className="mx-auto mb-4 text-morandi-gold" size={48} />
        <h3 className="text-lg font-medium text-morandi-primary mb-2">願望之牆還很空</h3>
        <p className="text-sm text-morandi-secondary">成為第一個分享願望的人吧</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-morandi-primary mb-2">願望之牆</h2>
        <p className="text-sm text-morandi-secondary">每一個願望，都值得被看見和祝福</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishes.map((wish, index) => (
          <WishCard key={wish.id} wish={wish} index={index} />
        ))}
      </div>
    </div>
  )
}

function WishCard({ wish, index }: { wish: Wish; index: number }) {
  const colors = ['#d4c5a9', '#c9b896', '#bfad87', '#a89968']
  const color = colors[index % colors.length]

  return (
    <div
      className={cn(
        'p-6 rounded-lg border transition-all duration-200',
        'hover:shadow-md hover:scale-105'
      )}
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}40`,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}30` }}
        >
          <Sparkles size={16} style={{ color }} />
        </div>
        <p className="text-sm text-morandi-primary flex-1 leading-relaxed">{wish.shared_wish}</p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="text-xs text-morandi-secondary">
          {new Date(wish.created_at).toLocaleDateString('zh-TW')}
        </span>
        <button
          className="text-morandi-secondary hover:text-morandi-gold transition-colors"
          title="為這個願望祝福"
        >
          <Heart size={16} />
        </button>
      </div>
    </div>
  )
}
