'use client'

import { FileX, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * 手冊設計器頁面 - 暫時維護中
 * 原始的 canvas editor 系統正在重構
 */
export default function Page() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-morandi-container flex items-center justify-center">
          <FileX className="w-8 h-8 text-morandi-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-morandi-primary">手冊設計器維護中</h1>
          <p className="text-sm text-morandi-secondary mt-1">此功能正在升級，請稍後再試</p>
        </div>
      </div>
      <Link href="/itinerary">
        <Button variant="outline" className="gap-2">
          <ArrowLeft size={16} />
          返回行程列表
        </Button>
      </Link>
    </div>
  )
}
