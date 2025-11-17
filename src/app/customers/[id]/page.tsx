'use client'

import { logger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCustomerStore } from '@/stores'
import { useRealtimeForCustomers } from '@/hooks/use-realtime-hooks'
import { BasicInfoTab } from './tabs/BasicInfoTab'
import { GroupHistoryTab } from './tabs/GroupHistoryTab'
import type { Customer } from '@/types/customer.types'
import { toast } from 'sonner'

export default function CustomerDetailPage() {
  // Realtime 訂閱
  useRealtimeForCustomers()

  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const { items: customers, update, fetchAll } = useCustomerStore()
  const [activeTab, setActiveTab] = useState('basic-info')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Customer>>({})

  // 載入資料
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // 找到當前客戶
  useEffect(() => {
    const found = customers.find(c => c.id === customerId)
    if (found) {
      setCustomer(found)
      const { id, created_at, ...editableData } = found
      setFormData(editableData)
    }
  }, [customers, customerId])

  const handleSave = async () => {
    if (!customer) return

    try {
      await update(customer.id, formData)
      toast.success('客戶資料已更新')
      setIsEditing(false)
    } catch (error) {
      toast.error('更新失敗')
      logger.error('Failed to update customer:', error)
    }
  }

  const handleCancel = () => {
    setFormData(customer || {})
    setIsEditing(false)
  }

  if (!customer) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-morandi-text-secondary">找不到客戶資料</p>
          <Button
            variant="outline"
            onClick={() => router.push('/customers')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title={customer.name}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '顧客管理', href: '/customers' },
          { label: customer.name, href: `/customers/${customer.id}` },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/customers')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>

            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  儲存
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                編輯資料
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-hidden bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger
                value="basic-info"
                className="data-[state=active]:bg-morandi-gold/10 data-[state=active]:text-morandi-gold"
              >
                基本資料
              </TabsTrigger>
              <TabsTrigger
                value="group-history"
                className="data-[state=active]:bg-morandi-gold/10 data-[state=active]:text-morandi-gold"
              >
                參團歷史
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="basic-info" className="mt-0">
              <BasicInfoTab
                customer={customer}
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
              />
            </TabsContent>

            <TabsContent value="group-history" className="mt-0">
              <GroupHistoryTab customerId={customer.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
