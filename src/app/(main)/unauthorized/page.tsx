'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-morandi-background p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldX size={40} className="text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-morandi-primary">存取被拒絕</h1>
          <p className="text-morandi-secondary">您沒有權限存取此頁面</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            <ArrowLeft size={16} className="mr-2" />
            返回上一頁
          </Button>

          <Button onClick={() => router.push('/')} className="w-full">
            回到首頁
          </Button>
        </div>

        <p className="text-xs text-morandi-muted">如果您認為這是錯誤，請聯繫系統管理員</p>
      </Card>
    </div>
  )
}
