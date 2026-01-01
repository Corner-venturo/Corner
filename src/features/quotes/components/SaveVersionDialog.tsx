import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Save, X } from 'lucide-react'

interface SaveVersionDialogProps {
  isOpen: boolean
  onClose: () => void
  versionName: string
  setVersionName: (name: string) => void
  onSave: (versionName: string) => void
}

export const SaveVersionDialog: React.FC<SaveVersionDialogProps> = ({
  isOpen,
  onClose,
  versionName,
  setVersionName,
  onSave,
}) => {
  const handleSubmit = () => {
    onSave(versionName)
    onClose()
    setVersionName('')
  }

  const handleCancel = () => {
    onClose()
    setVersionName('')
  }

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={onClose}
      title="保存版本"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitDisabled={!versionName.trim()}
      maxWidth="md"
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            type="submit"
            disabled={!versionName.trim()}
            className="bg-morandi-green hover:bg-morandi-green-hover text-white gap-2"
          >
            <Save size={16} />
            保存 <span className="ml-1 text-xs opacity-70">(Enter)</span>
          </Button>
        </div>
      }
    >
      <div>
        <label className="text-sm font-medium text-morandi-primary">版本名稱</label>
        <Input
          value={versionName}
          onChange={e => setVersionName(e.target.value)}
          placeholder="例如：初版、修正版、最終版等"
          className="mt-1"
          autoFocus
        />
      </div>
    </FormDialog>
  )
}
