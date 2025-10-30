/**
 * Personal Canvas - main component for personal workspace canvas management
 */

'use client'

import { RichTextEditor } from '@/components/workspace/RichTextEditor'
import { usePersonalCanvas } from './usePersonalCanvas'
import { useCanvasState } from '../shared/useCanvasState'
import { CanvasList, CanvasListHeader } from './CanvasList'
import { DocumentList } from './DocumentList'
import { DocumentViewer } from './DocumentViewer'
import { PersonalCanvasProps } from '../shared/types'
import { RichDocument } from '@/stores/workspace-store'

export function PersonalCanvas({ canvasId }: PersonalCanvasProps) {
  const {
    activeCanvasId,
    setActiveCanvasId,
    selectedDocument,
    setSelectedDocument,
    currentCanvas,
    personalCanvases,
    richDocuments,
    addNewCanvas,
    handleSaveDocument,
    handleDeleteDocument,
    handleToggleFavorite,
  } = usePersonalCanvas(canvasId)

  const {
    viewMode,
    setViewMode,
    editMode,
    setEditMode,
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
  } = useCanvasState()

  // Filter documents
  const filteredDocuments = richDocuments.filter((doc: RichDocument) => {
    const matchesSearch =
      !searchTerm ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || (doc.tags?.includes(selectedTag) ?? false)
    return matchesSearch && matchesTag
  })

  // Get all unique tags
  const allTags = [
    ...new Set(richDocuments.flatMap((doc: RichDocument) => doc.tags || []).filter(Boolean)),
  ]

  // Handler functions
  const handleCreateDocument = () => {
    setSelectedDocument(null)
    setEditMode('create')
  }

  const handleEditDocument = (document: RichDocument) => {
    setSelectedDocument(document)
    setEditMode('edit')
  }

  const handleViewDocument = (document: RichDocument) => {
    setSelectedDocument(document)
    setEditMode('view')
  }

  const handleSave = async (
    title: string,
    content: string,
    formatData: Record<string, unknown>
  ) => {
    await handleSaveDocument(title, content, formatData, editMode as 'create' | 'edit')
    setEditMode('view')
  }

  const handleCancel = () => {
    setEditMode('view')
    setSelectedDocument(null)
  }

  const handleBackToList = () => {
    setEditMode('view')
    setSelectedDocument(null)
  }

  // Render document editing/creating
  if (editMode === 'create' || (editMode === 'edit' && selectedDocument)) {
    return (
      <div className="h-full p-6">
        <RichTextEditor
          initialTitle={selectedDocument?.title || ''}
          initialContent={selectedDocument?.content || ''}
          onSave={handleSave}
          onCancel={handleCancel}
          className="h-full"
        />
      </div>
    )
  }

  // Render document viewer
  if (editMode === 'view' && selectedDocument) {
    return (
      <DocumentViewer
        document={selectedDocument}
        onEdit={() => handleEditDocument(selectedDocument)}
        onDelete={() => handleDeleteDocument(selectedDocument.id)}
        onToggleFavorite={() => handleToggleFavorite(selectedDocument)}
        onBack={handleBackToList}
      />
    )
  }

  // If no active canvas selected, show canvas selection
  if (!activeCanvasId) {
    return (
      <div className="h-full flex flex-col">
        <CanvasListHeader canvasCount={personalCanvases.length} onAddCanvas={addNewCanvas} />
        <div className="flex-1 overflow-auto p-6">
          <CanvasList
            canvases={personalCanvases}
            onSelectCanvas={setActiveCanvasId}
            onAddCanvas={addNewCanvas}
          />
        </div>
      </div>
    )
  }

  // Render document list for selected canvas
  return (
    <DocumentList
      documents={filteredDocuments}
      viewMode={viewMode}
      searchTerm={searchTerm}
      selectedTag={selectedTag}
      allTags={allTags}
      canvasTitle={currentCanvas?.title || '個人工作區'}
      onSetViewMode={setViewMode}
      onSetSearchTerm={setSearchTerm}
      onSetSelectedTag={setSelectedTag}
      onViewDocument={handleViewDocument}
      onEditDocument={handleEditDocument}
      onDeleteDocument={handleDeleteDocument}
      onToggleFavorite={handleToggleFavorite}
      onCreateDocument={handleCreateDocument}
      onBackToCanvasList={() => setActiveCanvasId(null)}
    />
  )
}
