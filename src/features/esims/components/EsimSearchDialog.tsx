'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ESIM_STATUSES } from '@/types/esim.types'
import type { EsimSearchFilters } from '@/types/esim.types'

interface EsimSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch?: (filters: EsimSearchFilters) => void
}

export function EsimSearchDialog({ open, onOpenChange, onSearch }: EsimSearchDialogProps) {
  const [filters, setFilters] = useState<EsimSearchFilters>({})

  const handleSearch = () => {
    onSearch?.(filters)
    onOpenChange(false)
  }

  const handleReset = () => {
    setFilters({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>詳細搜尋</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="esim_number">網卡單號</Label>
            <Input
              id="esim_number"
              value={filters.esim_number || ''}
              onChange={e => setFilters({ ...filters, esim_number: e.target.value })}
              placeholder="輸入網卡單號"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group_code">團號</Label>
            <Input
              id="group_code"
              value={filters.group_code || ''}
              onChange={e => setFilters({ ...filters, group_code: e.target.value })}
              placeholder="輸入團號"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order_number">訂單編號</Label>
            <Input
              id="order_number"
              value={filters.order_number || ''}
              onChange={e => setFilters({ ...filters, order_number: e.target.value })}
              placeholder="輸入訂單編號"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="supplier_order_number">供應商訂單編號</Label>
            <Input
              id="supplier_order_number"
              value={filters.supplier_order_number || ''}
              onChange={e => setFilters({ ...filters, supplier_order_number: e.target.value })}
              placeholder="輸入供應商訂單編號"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product_id">商品ID</Label>
            <Input
              id="product_id"
              value={filters.product_id || ''}
              onChange={e => setFilters({ ...filters, product_id: e.target.value })}
              placeholder="輸入商品ID"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">信箱</Label>
            <Input
              id="email"
              type="email"
              value={filters.email || ''}
              onChange={e => setFilters({ ...filters, email: e.target.value })}
              placeholder="輸入信箱"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">狀態</Label>
            <Select
              value={filters.status?.toString()}
              onValueChange={value => setFilters({ ...filters, status: Number(value) })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ESIM_STATUSES.UNCONFIRMED.toString()}>待確認</SelectItem>
                <SelectItem value={ESIM_STATUSES.CONFIRMED.toString()}>已確認</SelectItem>
                <SelectItem value={ESIM_STATUSES.ERROR.toString()}>錯誤</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button onClick={handleSearch}>搜尋</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
