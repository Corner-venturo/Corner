'use client'

import { useState, useEffect } from 'react'
import { Bus, Plus } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CountryList } from '@/features/transportation-rates/components/CountryList'
import { RatesDetailDialog } from '@/features/transportation-rates/components/RatesDetailDialog'
import { supabase } from '@/lib/supabase/client'
import { TransportationRate } from '@/types/transportation-rates.types'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

export default function TransportationRatesPage() {
  const { user } = useAuthStore()
  const [rates, setRates] = useState<TransportationRate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddingNewCountry, setIsAddingNewCountry] = useState(false)
  const [newCountryName, setNewCountryName] = useState('')

  // 載入車資資料
  const fetchRates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transportation_rates')
      .select('*')
      .order('category')
      .order('supplier')
      .order('route')

    if (error) {
      console.error('Error fetching rates:', error)
      toast.error('載入車資資料失敗')
      setLoading(false)
      return
    }

    setRates(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRates()
  }, [])

  // 打開國家詳細表格
  const handleOpenCountry = (countryName: string, editMode: boolean) => {
    setSelectedCountry(countryName)
    setIsEditMode(editMode)
    setIsDialogOpen(true)
  }

  // 新增國家
  const handleAddNewCountry = () => {
    if (!newCountryName.trim()) {
      toast.error('請輸入國家名稱')
      return
    }

    // 檢查國家是否已存在
    if (rates.some(rate => rate.country_name === newCountryName.trim())) {
      toast.error('此國家已存在')
      return
    }

    setSelectedCountry(newCountryName.trim())
    setIsEditMode(true)
    setIsAddingNewCountry(false)
    setIsDialogOpen(true)
    setNewCountryName('')
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="車資管理"
        icon={Bus}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '車資管理', href: '/database/transportation-rates' },
        ]}
        actions={
          <Button
            onClick={() => setIsAddingNewCountry(true)}
            className="gap-2"
            size="sm"
          >
            <Plus size={16} />
            新增國家
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <CountryList rates={rates} loading={loading} onOpenCountry={handleOpenCountry} />
      </div>

      {/* 新增國家 Dialog */}
      <Dialog open={isAddingNewCountry} onOpenChange={setIsAddingNewCountry}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增國家</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary mb-2 block">
                國家名稱
              </label>
              <Input
                placeholder="例如：越南、泰國"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewCountry()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNewCountry(false)
                  setNewCountryName('')
                }}
              >
                取消
              </Button>
              <Button onClick={handleAddNewCountry}>
                確認
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 大型懸浮視窗 - 顯示該國車資詳細表格 */}
      {selectedCountry && (
        <RatesDetailDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          countryName={selectedCountry}
          rates={rates.filter(rate => rate.country_name === selectedCountry)}
          onUpdate={fetchRates}
          isEditMode={isEditMode}
        />
      )}
    </div>
  )
}
