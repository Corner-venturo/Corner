/**
 * Document List - displays documents in grid or list view
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Edit, Trash2, Star, Search, Grid, List as ListIcon } from 'lucide-react'
import { RichDocument } from '@/stores/workspace-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ViewMode } from '../shared/types'

interface DocumentListProps {
  documents: RichDocument[]
  viewMode: ViewMode
  searchTerm: string
  selectedTag: string
  allTags: string[]
  canvasTitle: string
  onSetViewMode: (mode: ViewMode) => void
  onSetSearchTerm: (term: string) => void
  onSetSelectedTag: (tag: string) => void
  onViewDocument: (doc: RichDocument) => void
  onEditDocument: (doc: RichDocument) => void
  onDeleteDocument: (docId: string) => void
  onToggleFavorite: (doc: RichDocument) => void
  onCreateDocument: () => void
  onBackToCanvasList: () => void
}

export function DocumentList({
  documents,
  viewMode,
  searchTerm,
  selectedTag,
  allTags,
  canvasTitle,
  onSetViewMode,
  onSetSearchTerm,
  onSetSelectedTag,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onToggleFavorite,
  onCreateDocument,
  onBackToCanvasList,
}: DocumentListProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToCanvasList}>
            ← 返回工作區列表
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-morandi-primary">{canvasTitle}</h2>
            <p className="text-sm text-morandi-secondary">{documents.length} 個文件</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateDocument}
            className="bg-morandi-gold hover:bg-morandi-gold-hover"
          >
            <Plus size={16} className="mr-2" />
            新增文件
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-morandi-container/10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-morandi-secondary" />
          <Input
            value={searchTerm}
            onChange={e => onSetSearchTerm(e.target.value)}
            placeholder="搜尋文件..."
            className="pl-10"
          />
        </div>

        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={e => onSetSelectedTag(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm"
          >
            <option value="">全部標籤</option>
            {allTags.map((tag: string) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="w-8 h-8"
            onClick={() => onSetViewMode('grid')}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="w-8 h-8"
            onClick={() => onSetViewMode('list')}
          >
            <ListIcon size={16} />
          </Button>
        </div>
      </div>

      {/* Document grid/list */}
      <div className="flex-1 overflow-auto p-4">
        {documents.length === 0 ? (
          <EmptyDocumentState
            searchTerm={searchTerm}
            selectedTag={selectedTag}
            onCreateDocument={onCreateDocument}
          />
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            )}
          >
            {documents.map((document: RichDocument) => (
              <DocumentCard
                key={document.id}
                document={document}
                viewMode={viewMode}
                onView={() => onViewDocument(document)}
                onEdit={() => onEditDocument(document)}
                onDelete={() => onDeleteDocument(document.id)}
                onToggleFavorite={() => onToggleFavorite(document)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface EmptyDocumentStateProps {
  searchTerm: string
  selectedTag: string
  onCreateDocument: () => void
}

function EmptyDocumentState({
  searchTerm,
  selectedTag,
  onCreateDocument,
}: EmptyDocumentStateProps) {
  const hasFilters = searchTerm || selectedTag

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <FileText className="w-16 h-16 text-morandi-secondary/50 mb-4" />
      <h3 className="text-lg font-medium text-morandi-primary mb-2">
        {hasFilters ? '沒有找到符合的文件' : '還沒有任何文件'}
      </h3>
      <p className="text-morandi-secondary mb-4">
        {hasFilters ? '嘗試調整搜尋條件或清除篩選器' : '開始創建您的第一個文件'}
      </p>
      {!hasFilters && (
        <Button onClick={onCreateDocument} className="bg-morandi-gold hover:bg-morandi-gold-hover">
          <Plus size={16} className="mr-2" />
          新增文件
        </Button>
      )}
    </div>
  )
}

interface DocumentCardProps {
  document: RichDocument
  viewMode: ViewMode
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

function DocumentCard({
  document,
  viewMode,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: DocumentCardProps) {
  return (
    <div
      className={cn(
        'morandi-card transition-all hover:shadow-md cursor-pointer',
        viewMode === 'list' && 'flex items-center'
      )}
      onClick={onView}
    >
      <div className={cn('p-4', viewMode === 'list' && 'flex-1 flex items-center justify-between')}>
        <div className={cn(viewMode === 'grid' && 'mb-3', viewMode === 'list' && 'flex-1')}>
          <div className="flex items-start justify-between mb-2">
            <h3
              className={cn(
                'font-medium text-morandi-primary',
                viewMode === 'grid' && 'text-base line-clamp-2',
                viewMode === 'list' && 'text-sm'
              )}
            >
              {document.title}
            </h3>
            <Star
              className={cn(
                'w-4 h-4 ml-2 cursor-pointer',
                document.is_favorite
                  ? 'text-morandi-gold fill-morandi-gold'
                  : 'text-morandi-secondary'
              )}
              onClick={e => {
                e.stopPropagation()
                onToggleFavorite()
              }}
            />
          </div>

          {viewMode === 'grid' && (
            <p className="text-sm text-morandi-secondary line-clamp-3 mb-3">
              {document.content.replace(/<[^>]*>/g, '')}
            </p>
          )}

          <div
            className={cn(
              'flex items-center justify-between text-xs text-morandi-secondary',
              viewMode === 'list' && 'mt-1'
            )}
          >
            <span>
              {document.updated_at ? format(new Date(document.updated_at), 'MM/dd') : '未知'}
            </span>
            <div className="flex items-center gap-2">
              {document.tags && document.tags.length > 0 && (
                <div className="flex gap-1">
                  {document.tags.slice(0, 2).map((tag: string) => (
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

        {viewMode === 'list' && <DocumentActions onEdit={onEdit} onDelete={onDelete} />}
      </div>

      {viewMode === 'grid' && (
        <div className="px-4 pb-4 flex justify-end gap-1">
          <DocumentActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}

interface DocumentActionsProps {
  onEdit: () => void
  onDelete: () => void
}

function DocumentActions({ onEdit, onDelete }: DocumentActionsProps) {
  return (
    <div className="flex items-center gap-1 ml-4">
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8"
        onClick={e => {
          e.stopPropagation()
          onEdit()
        }}
      >
        <Edit size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 hover:bg-morandi-red/10 hover:text-morandi-red"
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
