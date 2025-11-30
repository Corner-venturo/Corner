'use client'

import React, { useState } from 'react'
import { Tour, TourAddOn } from '@/stores/types'
import { useTourAddOnStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourAddOnsProps {
  tour: Tour
  triggerAdd?: boolean
  onTriggerAddComplete?: () => void
}

export const TourAddOns = React.memo(function TourAddOns({
  tour,
  triggerAdd,
  onTriggerAddComplete,
}: TourAddOnsProps) {
  const {
    items: tour_add_ons,
    create: addTourAddOn,
    update: updateTourAddOn,
    delete: deleteTourAddOn,
  } = useTourAddOnStore()
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newAddOn, setNewAddOn] = useState({
    name: '',
    price: 0,
    description: '',
  })

  // 監聽外部觸發新增
  React.useEffect(() => {
    if (triggerAdd) {
      setIsAddingNew(true)
      onTriggerAddComplete?.()
    }
  }, [triggerAdd, onTriggerAddComplete])

  // 獲取此旅遊團的加購項目
  const addOns = tour_add_ons.filter((addOn: TourAddOn) => addOn.tour_id === tour.id)

  const handleAddNew = () => {
    if (!newAddOn.name.trim()) return

    addTourAddOn({
      tour_id: tour.id,
      name: newAddOn.name,
      price: newAddOn.price,
      description: newAddOn.description,
      is_active: true,
    })

    setNewAddOn({ name: '', price: 0, description: '' })
    setIsAddingNew(false)
  }

  const handleDelete = (id: string) => {
    deleteTourAddOn(id)
  }

  const toggleActive = (id: string) => {
    const addOn = addOns.find(item => item.id === id)
    if (addOn) {
      updateTourAddOn(id, { is_active: !addOn.is_active })
    }
  }

  return (
    <div className="space-y-6">
      {/* 加購項目列表 */}
      <div className="border border-border rounded-lg overflow-hidden">
        {addOns.length === 0 && !isAddingNew ? (
          <div className="text-center py-12 text-morandi-secondary">
            <ShoppingCart size={24} className="mx-auto mb-4 opacity-50" />
            <p>尚未設定任何加購項目</p>
            <p className="text-sm mt-1">點擊「新增加購項目」開始建立</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-morandi-container/30">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                    項目名稱
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                    價格
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                    說明
                  </th>
                  <th className="text-center py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                    狀態
                  </th>
                  <th className="text-center py-2.5 px-4 text-xs font-medium text-morandi-secondary">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 新增表單行 */}
                {isAddingNew && (
                  <tr className="border-b border-border bg-morandi-gold/10">
                    <td className="py-3 px-4">
                      <Input
                        value={newAddOn.name}
                        onChange={e => setNewAddOn({ ...newAddOn, name: e.target.value })}
                        placeholder="項目名稱"
                        className="h-8"
                        autoFocus
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        value={newAddOn.price}
                        onChange={e => setNewAddOn({ ...newAddOn, price: Number(e.target.value) })}
                        placeholder="價格"
                        className="h-8"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        value={newAddOn.description}
                        onChange={e => setNewAddOn({ ...newAddOn, description: e.target.value })}
                        placeholder="說明（選填）"
                        className="h-8"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-morandi-green text-sm">啟用</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={handleAddNew}
                          size="sm"
                          className="bg-morandi-green hover:bg-morandi-green-hover text-white"
                        >
                          確定
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingNew(false)
                            setNewAddOn({ name: '', price: 0, description: '' })
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          取消
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 現有項目列表 */}
                {addOns.map((addOn: TourAddOn) => (
                  <tr key={addOn.id} className="border-b border-border">
                    <td className="py-3 px-4 font-medium text-morandi-primary">{addOn.name}</td>
                    <td className="py-3 px-4 text-morandi-primary">
                      NT$ {addOn.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-morandi-secondary text-sm">
                      {addOn.description || '無'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleActive(addOn.id)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium cursor-pointer',
                          addOn.is_active
                            ? 'bg-morandi-green text-white'
                            : 'bg-morandi-container text-morandi-secondary'
                        )}
                      >
                        {addOn.is_active ? '啟用' : '停用'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <Button
                          onClick={() => handleDelete(addOn.id)}
                          size="sm"
                          variant="ghost"
                          className="text-morandi-red hover:text-morandi-red hover:bg-morandi-red/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 使用說明 */}
      <div className="bg-morandi-container/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-morandi-primary mb-2">使用說明</h4>
        <ul className="text-xs text-morandi-secondary space-y-1">
          <li>• 加購項目可供團員在訂單中選擇購買</li>
          <li>• 停用的項目不會顯示給團員選擇，但已購買的仍然有效</li>
          <li>• 價格修改不會影響已建立的訂單</li>
          <li>• 建議在團組確定前完成所有加購項目設定</li>
        </ul>
      </div>
    </div>
  )
})
