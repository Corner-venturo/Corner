/**
 * Personal Canvas hook - manages canvas state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  useWorkspaceChannels,
  useWorkspaceCanvas,
  PersonalCanvas as PersonalCanvasType,
  RichDocument,
} from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import { CANVAS_LIMITS } from '../shared/constants'

export function usePersonalCanvas(initialCanvasId?: string) {
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(initialCanvasId || null)
  const [selectedDocument, setSelectedDocument] = useState<RichDocument | null>(null)

  const { currentWorkspace } = useWorkspaceChannels()
  const {
    richDocuments,
    personalCanvases,
    loadRichDocuments,
    createRichDocument,
    updateRichDocument,
    deleteRichDocument,
    loadPersonalCanvases,
    createPersonalCanvas,
  } = useWorkspaceCanvas()

  const { user } = useAuthStore()

  // Load personal canvases when component mounts
  useEffect(() => {
    if (user?.id && currentWorkspace?.id) {
      loadPersonalCanvases(user.id, currentWorkspace.id)
    }
  }, [user?.id, currentWorkspace?.id, loadPersonalCanvases])

  // Load documents when canvas changes
  useEffect(() => {
    if (activeCanvasId) {
      loadRichDocuments(activeCanvasId)
    }
  }, [activeCanvasId, loadRichDocuments])

  // Get current canvas info
  const currentCanvas = personalCanvases.find(
    (canvas: PersonalCanvasType) => canvas.id === activeCanvasId
  )

  // Add new canvas
  const addNewCanvas = useCallback(async () => {
    if (!user?.id || !currentWorkspace?.id) return

    if (personalCanvases.length >= CANVAS_LIMITS.MAX_PERSONAL_CANVASES) {
      alert(
        `最多只能建立 ${CANVAS_LIMITS.MAX_PERSONAL_CANVASES} 個自訂工作區，請刪除不需要的工作區後再新增。`
      )
      return
    }

    const canvasNumber = personalCanvases.length + 1
    const newCanvas = {
      employee_id: user.id,
      workspace_id: currentWorkspace.id,
      canvas_number: canvasNumber,
      title: `我的工作區 ${canvasNumber}`,
      type: 'custom' as const,
      content: {},
      layout: {},
    }

    try {
      const createdCanvas = await createPersonalCanvas(newCanvas)
      if (createdCanvas) {
        setActiveCanvasId(createdCanvas.id)
      }
    } catch (error) {
      alert('建立工作區失敗，請稍後再試。')
    }
  }, [user?.id, currentWorkspace?.id, personalCanvases.length, createPersonalCanvas])

  // Document operations
  const handleSaveDocument = useCallback(
    async (
      title: string,
      content: string,
      formatData: Record<string, unknown>,
      mode: 'create' | 'edit'
    ) => {
      if (!activeCanvasId) return

      try {
        if (mode === 'create') {
          await createRichDocument({
            canvas_id: activeCanvasId,
            title,
            content,
            format_data: formatData,
            tags: [],
            is_favorite: false,
          })
        } else if (mode === 'edit' && selectedDocument) {
          await updateRichDocument(selectedDocument.id, {
            title,
            content,
            format_data: formatData,
          })
        }
        setSelectedDocument(null)
      } catch (error) {
        throw error
      }
    },
    [activeCanvasId, selectedDocument, createRichDocument, updateRichDocument]
  )

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!confirm('確定要刪除這個文件嗎？')) return

      try {
        await deleteRichDocument(documentId)
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null)
        }
      } catch (error) {
        // Error handled silently
      }
    },
    [selectedDocument, deleteRichDocument]
  )

  const handleToggleFavorite = useCallback(
    async (document: RichDocument) => {
      try {
        await updateRichDocument(document.id, {
          is_favorite: !document.is_favorite,
        })
      } catch (error) {
        // Error handled silently
      }
    },
    [updateRichDocument]
  )

  const handleUpdateTags = useCallback(
    async (documentId: string, tags: string[]) => {
      try {
        await updateRichDocument(documentId, { tags })
      } catch (error) {
        // Error handled silently
      }
    },
    [updateRichDocument]
  )

  return {
    // State
    activeCanvasId,
    setActiveCanvasId,
    selectedDocument,
    setSelectedDocument,
    currentCanvas,
    personalCanvases,
    richDocuments,
    // Operations
    addNewCanvas,
    handleSaveDocument,
    handleDeleteDocument,
    handleToggleFavorite,
    handleUpdateTags,
  }
}
