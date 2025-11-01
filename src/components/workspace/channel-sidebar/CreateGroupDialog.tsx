/**
 * 新增群組 Dialog
 */

interface CreateGroupDialogProps {
  isOpen: boolean;
  groupName: string;
  onGroupNameChange: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export function CreateGroupDialog({
  isOpen,
  groupName,
  onGroupNameChange,
  onClose,
  onCreate,
}: CreateGroupDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="card-morandi-elevated w-80">
        <h3 className="font-semibold mb-3 text-morandi-primary">新增群組</h3>
        <input
          type="text"
          placeholder="群組名稱"
          value={groupName}
          onChange={e => onGroupNameChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCreate()}
          autoFocus
          className="input-morandi"
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button
            className="btn-morandi-secondary !py-1.5 !px-3 text-sm"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="btn-morandi-primary !py-1.5 !px-3 text-sm"
            onClick={onCreate}
          >
            建立
          </button>
        </div>
      </div>
    </div>
  );
}
