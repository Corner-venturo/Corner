/**
 * 編輯頻道 Dialog
 */

interface EditChannelDialogProps {
  isOpen: boolean;
  channelName: string;
  channelDescription: string;
  onChannelNameChange: (name: string) => void;
  onChannelDescriptionChange: (desc: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditChannelDialog({
  isOpen,
  channelName,
  channelDescription,
  onChannelNameChange,
  onChannelDescriptionChange,
  onClose,
  onSave,
}: EditChannelDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">編輯頻道</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">
              頻道名稱
            </label>
            <input
              type="text"
              value={channelName}
              onChange={e => onChannelNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
              placeholder="輸入頻道名稱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-secondary mb-1">
              描述（可選）
            </label>
            <textarea
              value={channelDescription}
              onChange={e => onChannelDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-morandi-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
              placeholder="輸入頻道描述"
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-morandi-gold/30 rounded-lg text-morandi-secondary hover:bg-morandi-container/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={!channelName.trim()}
            className="flex-1 px-4 py-2 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}
