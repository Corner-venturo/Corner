import React from 'react'
import { FormDialog } from '@/components/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Save, X } from 'lucide-react'
import { SAVE_VERSION_DIALOG_LABELS } from '../constants/labels';

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
      title={SAVE_VERSION_DIALOG_LABELS.保存版本}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitDisabled={!versionName.trim()}
      maxWidth="md"
      footer={
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
            <X size={16} />
            {SAVE_VERSION_DIALOG_LABELS.取消}
          </Button>
          <Button
            type="submit"
            disabled={!versionName.trim()}
            className="bg-morandi-green hover:bg-morandi-green-hover text-white gap-2"
          >
            <Save size={16} />
            <span dangerouslySetInnerHTML={{ __html: SAVE_VERSION_DIALOG_LABELS.保存快捷鍵 }} />
          </Button>
        </div>
      }
    >
      <div>
        <label className="text-sm font-medium text-morandi-primary">{SAVE_VERSION_DIALOG_LABELS.版本名稱}</label>
        <Input
          value={versionName}
          onChange={e => setVersionName(e.target.value)}
          placeholder={SAVE_VERSION_DIALOG_LABELS.例如_初版_修正版_最終版等}
          className="mt-1"
          autoFocus
        />
      </div>
    </FormDialog>
  )
}
