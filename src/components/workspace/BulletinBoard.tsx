'use client';

import { useState, useEffect } from 'react';
import { _Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, Calendar, AlertCircle, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Bulletin {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'notice' | 'event';
  is_pinned: boolean;
  author?: {
    display_name: string;
    english_name: string;
  };
  created_at: string;
  updated_at: string;
}

export function BulletinBoard() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
  const [newBulletin, setNewBulletin] = useState({
    title: '',
    content: '',
    type: 'announcement' as const,
    is_pinned: false
  });

  const {
    bulletins,
    currentWorkspace,
    loading,
    loadBulletins,
    createBulletin,
    updateBulletin,
    deleteBulletin
  } = useWorkspaceStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadBulletins(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, loadBulletins]);

  const handleSubmit = async () => {
    if (!user?.id || !currentWorkspace?.id) return;

    try {
      if (editingBulletin) {
        await updateBulletin(editingBulletin.id, newBulletin);
        setEditingBulletin(null);
      } else {
        await createBulletin({
          ...newBulletin,
          workspace_id: currentWorkspace.id,
          author_id: user.id,
          priority: newBulletin.is_pinned ? 10 : 0
        });
      }

      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('操作失敗:', error);
    }
  };

  const handleEdit = (bulletin: Bulletin) => {
    setNewBulletin({
      title: bulletin.title,
      content: bulletin.content,
      type: bulletin.type as unknown,
      is_pinned: bulletin.is_pinned
    });
    setEditingBulletin(bulletin);
    setShowAddDialog(true);
  };

  const handleDelete = async (bulletinId: string) => {
    if (confirm('確定要刪除這則公告嗎？')) {
      await deleteBulletin(bulletinId);
    }
  };

  const resetForm = () => {
    setNewBulletin({ title: '', content: '', type: 'announcement', is_pinned: false });
    setEditingBulletin(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <AlertCircle className="w-4 h-4 text-morandi-gold" />;
      case 'notice':
        return <AlertCircle className="w-4 h-4 text-morandi-red" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-morandi-green" />;
      default:
        return <AlertCircle className="w-4 h-4 text-morandi-secondary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'announcement': '一般公告',
      'notice': '重要通知',
      'event': '活動訊息'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const _getBorderColor = (type: string, is_pinned: boolean) => {
    if (is_pinned) return 'border-morandi-gold';
    switch (type) {
      case 'notice': return 'border-morandi-red/30';
      case 'event': return 'border-morandi-green/30';
      default: return 'border-border';
    }
  };

  if (loading) {
    return (
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="animate-pulse space-y-4 px-6 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="morandi-card p-4 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頂部操作列 */}
      <div className="morandi-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-morandi-primary">公告欄</h2>
            <p className="text-xs sm:text-sm text-morandi-secondary mt-1">
              {currentWorkspace?.name || '工作空間'} 的最新消息
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-morandi-gold hover:bg-morandi-gold/80 text-white border-0"
          >
            <Plus size={16} className="mr-2" />
            <span className="hidden sm:inline">發布公告</span>
            <span className="sm:hidden">發布</span>
          </Button>
        </div>
      </div>

      {/* 公告列表 */}
      <div className="space-y-4">
        {bulletins.length === 0 ? (
          <div className="morandi-card p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-morandi-secondary opacity-50" />
            <p className="text-morandi-secondary">目前沒有任何公告</p>
            <p className="text-sm text-morandi-secondary/70 mt-1">
              點擊上方按鈕發布第一則公告
            </p>
          </div>
        ) : (
          bulletins.map(bulletin => (
            <div
              key={bulletin.id}
              className={cn(
                "morandi-card p-6 transition-all hover:shadow-md",
                bulletin.is_pinned && "border-morandi-gold bg-morandi-gold/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {bulletin.is_pinned && (
                      <Pin className="w-4 h-4 text-morandi-gold fill-morandi-gold" />
                    )}
                    {getTypeIcon(bulletin.type)}
                    <span className="text-xs px-2 py-1 rounded-full bg-morandi-container text-morandi-secondary">
                      {getTypeLabel(bulletin.type)}
                    </span>
                    <h3 className="font-semibold text-morandi-primary text-sm sm:text-base">
                      {bulletin.title}
                    </h3>
                  </div>

                  <p className="text-morandi-secondary whitespace-pre-wrap mb-3 leading-relaxed">
                    {bulletin.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-morandi-secondary">
                    <span>
                      {bulletin.author?.display_name || '系統'}
                    </span>
                    <span>
                      {format(new Date(bulletin.created_at), 'yyyy/MM/dd HH:mm')}
                    </span>
                    {bulletin.created_at !== bulletin.updated_at && (
                      <span className="text-xs">(已編輯)</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 hover:bg-morandi-container text-morandi-secondary hover:text-morandi-primary"
                    onClick={() => handleEdit(bulletin)}
                    title="編輯公告"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 hover:bg-morandi-container text-morandi-secondary hover:text-morandi-red"
                    onClick={() => handleDelete(bulletin.id)}
                    title="刪除公告"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新增/編輯公告對話框 */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md morandi-card border-0">
          <DialogHeader>
            <DialogTitle>
              {editingBulletin ? '編輯公告' : '發布新公告'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">標題</label>
              <Input
                value={newBulletin.title}
                onChange={(e) => setNewBulletin({...newBulletin, title: e.target.value})}
                className="mt-1"
                placeholder="請輸入公告標題"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">內容</label>
              <Textarea
                value={newBulletin.content}
                onChange={(e) => setNewBulletin({...newBulletin, content: e.target.value})}
                className="mt-1 min-h-[120px]"
                placeholder="請輸入公告內容"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-morandi-primary">類型</label>
                <select
                  value={newBulletin.type}
                  onChange={(e) => setNewBulletin({...newBulletin, type: e.target.value as unknown})}
                  className="mt-1 px-3 py-2 border border-border rounded-md text-sm"
                >
                  <option value="announcement">一般公告</option>
                  <option value="notice">重要通知</option>
                  <option value="event">活動訊息</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newBulletin.is_pinned}
                  onChange={(e) => setNewBulletin({...newBulletin, is_pinned: e.target.checked})}
                  className="rounded"
                />
                <span>置頂公告</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-morandi-gold hover:bg-morandi-gold/80 text-morandi-primary border-0"
                disabled={!newBulletin.title.trim() || !newBulletin.content.trim()}
              >
                {editingBulletin ? '更新' : '發布'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}