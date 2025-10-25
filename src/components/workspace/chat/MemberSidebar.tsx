'use client';

interface MemberSidebarProps {
  isOpen: boolean;
}

export function MemberSidebar({ isOpen }: MemberSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 border-l border-border bg-morandi-container/5 flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-morandi-primary">成員列表</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-center text-morandi-secondary text-sm py-4">
          載入成員列表中...
        </div>
      </div>
    </div>
  );
}
