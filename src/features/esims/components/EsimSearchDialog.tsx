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
import { RotateCcw, Search } from 'lucide-react'
import { LABELS } from '../constants/labels'
import { ESIM_STATUSES } from '@/types/esim.types'
import type { EsimSearchFilters, EsimStatus } from '@/types/esim.types'

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
      <DialogContent level={1} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{LABELS.detailedSearch}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="esim_number">{LABELS.esimNumber}</Label>
            <Input
              id="esim_number"
              value={filters.esim_number || ''}
              onChange={e => setFilters({ ...filters, esim_number: e.target.value })}
              placeholder={LABELS.esimNumberPlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group_code">{LABELS.tourCode}</Label>
            <Input
              id="group_code"
              value={filters.group_code || ''}
              onChange={e => setFilters({ ...filters, group_code: e.target.value })}
              placeholder={LABELS.tourCodePlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order_number">{LABELS.orderNumberLabel}</Label>
            <Input
              id="order_number"
              value={filters.order_number || ''}
              onChange={e => setFilters({ ...filters, order_number: e.target.value })}
              placeholder={LABELS.orderNumberPlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="supplier_order_number">{LABELS.supplierOrderNumber}</Label>
            <Input
              id="supplier_order_number"
              value={filters.supplier_order_number || ''}
              onChange={e => setFilters({ ...filters, supplier_order_number: e.target.value })}
              placeholder={LABELS.supplierOrderNumberPlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product_id">{LABELS.productId}</Label>
            <Input
              id="product_id"
              value={filters.product_id || ''}
              onChange={e => setFilters({ ...filters, product_id: e.target.value })}
              placeholder={LABELS.productIdPlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{LABELS.email}</Label>
            <Input
              id="email"
              type="email"
              value={filters.email || ''}
              onChange={e => setFilters({ ...filters, email: e.target.value })}
              placeholder={LABELS.emailPlaceholder}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">{LABELS.status}</Label>
            <Select
              value={filters.status?.toString()}
              onValueChange={value => setFilters({ ...filters, status: Number(value) as EsimStatus })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={LABELS.statusPlaceholder} />
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
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw size={16} />
            {LABELS.reset}
          </Button>
          <Button onClick={handleSearch} className="gap-2">
            <Search size={16} />
            {LABELS.search}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
