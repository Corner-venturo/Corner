import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SaveVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  versionName: string;
  setVersionName: (name: string) => void;
  onSave: (versionName: string) => void;
}

export const SaveVersionDialog: React.FC<SaveVersionDialogProps> = ({
  isOpen,
  onClose,
  versionName,
  setVersionName,
  onSave
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(versionName);
    onClose();
    setVersionName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>保存版本</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary">版本名稱</label>
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="例如：初版、修正版、最終版等"
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setVersionName('');
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-morandi-green hover:bg-morandi-green-hover text-white"
            >
              保存 <span className="ml-1 text-xs opacity-70">(Enter)</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
