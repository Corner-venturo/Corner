import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export interface MealDiff {
  day: number
  type: 'lunch' | 'dinner'
  typeLabel: string
  oldValue: string
  newValue: string
}

interface SyncToItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  diffs: MealDiff[]
  itineraryTitle?: string
}

export const SyncToItineraryDialog: React.FC<SyncToItineraryDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  diffs,
  itineraryTitle,
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={onClose}
      title="同步餐飲到行程表"
      onSubmit={handleConfirm}
      onCancel={onClose}
      submitDisabled={diffs.length === 0}
      maxWidth="lg"
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            disabled={diffs.length === 0}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            確認同步
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {itineraryTitle && (
          <p className="text-sm text-morandi-secondary">
            將同步到行程表：<span className="font-medium text-morandi-primary">{itineraryTitle}</span>
          </p>
        )}

        {diffs.length === 0 ? (
          <div className="text-center py-8 text-morandi-secondary">
            沒有需要同步的變更
          </div>
        ) : (
          <>
            <p className="text-sm text-morandi-secondary">
              以下 {diffs.length} 項餐飲將會更新：
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-morandi-container/40">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-morandi-primary">天數</th>
                    <th className="text-left py-2 px-3 font-medium text-morandi-primary">餐別</th>
                    <th className="text-left py-2 px-3 font-medium text-morandi-primary">原本</th>
                    <th className="text-center py-2 px-3 font-medium text-morandi-primary w-10"></th>
                    <th className="text-left py-2 px-3 font-medium text-morandi-primary">更新後</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.map((diff, index) => (
                    <tr key={index} className="border-t border-border/50">
                      <td className="py-2 px-3 text-morandi-primary">Day {diff.day}</td>
                      <td className="py-2 px-3 text-morandi-primary">{diff.typeLabel}</td>
                      <td className="py-2 px-3 text-morandi-secondary">
                        {diff.oldValue || <span className="text-morandi-muted">（空）</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <ArrowRight size={14} className="text-morandi-gold inline" />
                      </td>
                      <td className="py-2 px-3">
                        <span className={diff.newValue === '自理' ? 'text-status-warning font-medium' : 'text-morandi-green font-medium'}>
                          {diff.newValue || <span className="text-morandi-muted">（空）</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </FormDialog>
  )
}
