'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Star,
  Search,
  Grid,
  List,
  Eye,
  Settings,
  Tag
} from 'lucide-react';
import { RichTextEditor, RichTextViewer } from './RichTextEditor';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PersonalCanvasProps {
  canvasId?: string;
}

interface RichDocument {
  id: string;
  canvas_id: string;
  title: string;
  content: string;
  format_data: Record<string, any>;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'grid' | 'list';
type EditMode = 'view' | 'create' | 'edit';

export function PersonalCanvas({ canvasId }: PersonalCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [selectedDocument, setSelectedDocument] = useState<RichDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(canvasId || null);

  const {
    richDocuments,
    personalCanvases,
    currentWorkspace,
    loadRichDocuments,
    createRichDocument,
    updateRichDocument,
    deleteRichDocument,
    loadPersonalCanvases,
    createPersonalCanvas
  } = useWorkspaceStore();

  const { user } = useAuthStore();

  // Load personal canvases when component mounts
  useEffect(() => {
    if (user?.id && currentWorkspace?.id) {
      loadPersonalCanvases(user.id, currentWorkspace.id);
    }
  }, [user?.id, currentWorkspace?.id, loadPersonalCanvases]);

  // Load documents when canvas changes
  useEffect(() => {
    if (activeCanvasId) {
      loadRichDocuments(activeCanvasId);
    }
  }, [activeCanvasId, loadRichDocuments]);

  // Get current canvas info
  const currentCanvas = personalCanvases.find(canvas => canvas.id === activeCanvasId);

  // Function to add new canvas
  const addNewCanvas = async () => {
    if (!user?.id || !currentWorkspace?.id) return;

    // 限制最多只能有 5 個自訂工作區
    if (personalCanvases.length >= 5) {
      alert('最多只能建立 5 個自訂工作區，請刪除不需要的工作區後再新增。');
      return;
    }

    const canvasNumber = personalCanvases.length + 1;
    const newCanvas = {
      employee_id: user.id,
      workspace_id: currentWorkspace.id,
      canvas_number: canvasNumber,
      title: `我的工作區 ${canvasNumber}`,
      type: 'custom' as const,
      content: {},
      layout: {}
    };

    try {
      const createdCanvas = await createPersonalCanvas(newCanvas);
      // 自動切換到新建立的工作區
      if (createdCanvas) {
        setActiveCanvasId(createdCanvas.id);
      }
    } catch (error) {
      console.error('建立工作區失敗:', error);
      alert('建立工作區失敗，請稍後再試。');
    }
  };

  // Filter documents based on search and tags
  const filteredDocuments = richDocuments.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !selectedTag || doc.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  // Get all unique tags
  const allTags = [...new Set(richDocuments.flatMap(doc => doc.tags))];

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setEditMode('create');
  };

  const handleEditDocument = (document: RichDocument) => {
    setSelectedDocument(document);
    setEditMode('edit');
  };

  const handleViewDocument = (document: RichDocument) => {
    setSelectedDocument(document);
    setEditMode('view');
  };

  const handleSaveDocument = async (title: string, content: string, formatData: Record<string, any>) => {
    if (!activeCanvasId) return;

    try {
      if (editMode === 'create') {
        await createRichDocument({
          canvas_id: activeCanvasId,
          title,
          content,
          format_data: formatData,
          tags: [], // Start with empty tags, can be added later
          is_favorite: false
        });
      } else if (editMode === 'edit' && selectedDocument) {
        await updateRichDocument(selectedDocument.id, {
          title,
          content,
          format_data: formatData
        });
      }
      setEditMode('view');
      setSelectedDocument(null);
    } catch (error) {
      console.error('儲存文件失敗:', error);
      throw error;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('確定要刪除這個文件嗎？')) {
      try {
        await deleteRichDocument(documentId);
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
          setEditMode('view');
        }
      } catch (error) {
        console.error('刪除文件失敗:', error);
      }
    }
  };

  const handleToggleFavorite = async (document: RichDocument) => {
    try {
      await updateRichDocument(document.id, {
        is_favorite: !document.is_favorite
      });
    } catch (error) {
      console.error('更新收藏失敗:', error);
    }
  };

  const handleUpdateTags = async (documentId: string, tags: string[]) => {
    try {
      await updateRichDocument(documentId, { tags });
    } catch (error) {
      console.error('更新標籤失敗:', error);
    }
  };

  // Render document editing/viewing
  if (editMode === 'create' || (editMode === 'edit' && selectedDocument)) {
    return (
      <div className="h-full p-6">
        <RichTextEditor
          initialTitle={selectedDocument?.title || ''}
          initialContent={selectedDocument?.content || ''}
          onSave={handleSaveDocument}
          onCancel={() => {
            setEditMode('view');
            setSelectedDocument(null);
          }}
          className="h-full"
        />
      </div>
    );
  }

  // Render document viewer
  if (editMode === 'view' && selectedDocument) {
    return (
      <div className="h-full flex flex-col">
        {/* 文件檢視工具列 */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode('view')}
            >
              ← 返回
            </Button>
            <div className="flex items-center gap-2">
              <Star
                className={cn(
                  "w-5 h-5 cursor-pointer",
                  selectedDocument.is_favorite
                    ? "text-morandi-gold fill-morandi-gold"
                    : "text-morandi-secondary"
                )}
                onClick={() => handleToggleFavorite(selectedDocument)}
              />
              <span className="text-sm text-morandi-secondary">
                {format(new Date(selectedDocument.created_at), 'yyyy/MM/dd HH:mm')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditDocument(selectedDocument)}
            >
              <Edit size={16} className="mr-2" />
              編輯
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-morandi-red/10 hover:text-morandi-red"
              onClick={() => handleDeleteDocument(selectedDocument.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* 文件內容 */}
        <div className="flex-1 overflow-auto p-6">
          <RichTextViewer
            title={selectedDocument.title}
            content={selectedDocument.content}
          />
        </div>
      </div>
    );
  }

  // If no active canvas selected, show canvas selection interface
  if (!activeCanvasId) {
    return (
      <div className="h-full flex flex-col">
        {/* 工作區選擇頭部 */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <div>
            <h2 className="text-lg font-semibold text-morandi-primary">私人畫布</h2>
            <p className="text-sm text-morandi-secondary">
              選擇或創建您的個人工作區
            </p>
          </div>
          <Button
            onClick={addNewCanvas}
            disabled={personalCanvases.length >= 5}
            className={cn(
              "text-sm",
              personalCanvases.length >= 5
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-morandi-gold hover:bg-morandi-gold/80 text-white"
            )}
            title={personalCanvases.length >= 5 ? "最多只能建立 5 個自訂工作區" : "新增自訂工作區"}
          >
            <Plus size={16} className="mr-2" />
            新增工作區 ({personalCanvases.length}/5)
          </Button>
        </div>

        {/* 工作區卡片列表 */}
        <div className="flex-1 overflow-auto p-6">
          {personalCanvases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-16 h-16 text-morandi-secondary/50 mb-4" />
              <h3 className="text-lg font-medium text-morandi-primary mb-2">
                還沒有任何工作區
              </h3>
              <p className="text-morandi-secondary mb-4">
                建立您的第一個個人工作區來開始使用
              </p>
              <Button
                onClick={addNewCanvas}
                className="bg-morandi-gold hover:bg-morandi-gold/80 text-white"
              >
                <Plus size={16} className="mr-2" />
                建立工作區
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalCanvases.map(canvas => (
                <div
                  key={canvas.id}
                  className="morandi-card p-6 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => setActiveCanvasId(canvas.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-morandi-primary text-base">
                      {canvas.title}
                    </h3>
                    <FileText className="w-5 h-5 text-morandi-secondary" />
                  </div>
                  <p className="text-sm text-morandi-secondary mb-4">
                    工作區 #{canvas.canvas_number}
                  </p>
                  <div className="flex items-center justify-between text-xs text-morandi-secondary">
                    <span>
                      {format(new Date(canvas.updated_at), 'MM/dd')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCanvasId(canvas.id);
                      }}
                    >
                      <Eye size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render document list/grid view for selected canvas
  return (
    <div className="h-full flex flex-col">
      {/* 工具列 */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveCanvasId(null)}
          >
            ← 返回工作區列表
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-morandi-primary">
              {currentCanvas?.title || '個人工作區'}
            </h2>
            <p className="text-sm text-morandi-secondary">
              {filteredDocuments.length} 個文件
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateDocument}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Plus size={16} className="mr-2" />
            新增文件
          </Button>
        </div>
      </div>

      {/* 搜尋和篩選 */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-morandi-container/10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-secondary" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋文件..."
            className="pl-10"
          />
        </div>

        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm"
          >
            <option value="">全部標籤</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="w-8 h-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="w-8 h-8"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto p-4">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-morandi-secondary/50 mb-4" />
            <h3 className="text-lg font-medium text-morandi-primary mb-2">
              {searchTerm || selectedTag ? '沒有找到符合的文件' : '還沒有任何文件'}
            </h3>
            <p className="text-morandi-secondary mb-4">
              {searchTerm || selectedTag
                ? '嘗試調整搜尋條件或清除篩選器'
                : '開始創建您的第一個文件'
              }
            </p>
            {!searchTerm && !selectedTag && (
              <Button
                onClick={handleCreateDocument}
                className="bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                <Plus size={16} className="mr-2" />
                新增文件
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {filteredDocuments.map(document => (
              <div
                key={document.id}
                className={cn(
                  "morandi-card transition-all hover:shadow-md cursor-pointer",
                  viewMode === 'list' && "flex items-center"
                )}
                onClick={() => handleViewDocument(document)}
              >
                <div className={cn(
                  "p-4",
                  viewMode === 'list' && "flex-1 flex items-center justify-between"
                )}>
                  <div className={cn(
                    viewMode === 'grid' && "mb-3",
                    viewMode === 'list' && "flex-1"
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={cn(
                        "font-medium text-morandi-primary",
                        viewMode === 'grid' && "text-base line-clamp-2",
                        viewMode === 'list' && "text-sm"
                      )}>
                        {document.title}
                      </h3>
                      <Star
                        className={cn(
                          "w-4 h-4 ml-2 cursor-pointer",
                          document.is_favorite
                            ? "text-morandi-gold fill-morandi-gold"
                            : "text-morandi-secondary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(document);
                        }}
                      />
                    </div>

                    {viewMode === 'grid' && (
                      <p className="text-sm text-morandi-secondary line-clamp-3 mb-3">
                        {document.content.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    <div className={cn(
                      "flex items-center justify-between text-xs text-morandi-secondary",
                      viewMode === 'list' && "mt-1"
                    )}>
                      <span>
                        {format(new Date(document.updated_at), 'MM/dd')}
                      </span>
                      <div className="flex items-center gap-2">
                        {document.tags.length > 0 && (
                          <div className="flex gap-1">
                            {document.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-morandi-container/30 text-morandi-secondary rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 2 && (
                              <span className="text-morandi-secondary">+{document.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDocument(document);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:bg-morandi-red/10 hover:text-morandi-red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(document.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                {viewMode === 'grid' && (
                  <div className="px-4 pb-4 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(document);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-morandi-red/10 hover:text-morandi-red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(document.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}