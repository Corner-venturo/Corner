/**
 * Canvas Store Facade
 * 整合 PersonalCanvas 和 RichDocument Stores (createStore)
 * 保持與舊版 canvas-store 相同的 API
 */

import { create } from 'zustand'
import { usePersonalCanvasStore } from './personal-canvas-store-new'
import { useRichDocumentStore } from './rich-document-store-new'
import type { PersonalCanvas, RichDocument } from './types'

/**
 * Canvas UI 狀態 (不需要同步到 Supabase 的狀態)
 */
interface CanvasUIState {
  activeCanvasTab: string
  setActiveCanvasTab: (tab: string) => void
}

/**
 * UI 狀態 Store (純前端狀態)
 */
const useCanvasUIStore = create<CanvasUIState>(set => ({
  activeCanvasTab: 'canvas',
  setActiveCanvasTab: tab => set({ activeCanvasTab: tab }),
}))

/**
 * Canvas Store Facade
 * 整合 PersonalCanvas 和 RichDocument Stores
 * 保持與舊版相同的 API
 */
export const useCanvasStore = () => {
  const canvasStore = usePersonalCanvasStore()
  const documentStore = useRichDocumentStore()
  const uiStore = useCanvasUIStore()

  return {
    // ============================================
    // 資料 (來自 createStore)
    // ============================================
    personalCanvases: canvasStore.items,
    richDocuments: documentStore.items,
    activeCanvasTab: uiStore.activeCanvasTab,

    // ============================================
    // Loading 和 Error
    // ============================================
    loading: canvasStore.loading || documentStore.loading,
    error: canvasStore.error || documentStore.error,

    // ============================================
    // Canvas 操作 (使用 createStore 的 CRUD)
    // ============================================
    createPersonalCanvas: async (
      canvas: Omit<PersonalCanvas, 'id' | 'created_at' | 'updated_at'>
    ): Promise<PersonalCanvas> => {
      const newCanvas: PersonalCanvas = {
        ...canvas,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await canvasStore.create(newCanvas)
      return newCanvas
    },

    loadPersonalCanvases: async (userId?: string, workspaceId?: string) => {
      // 使用 createStore 的 fetchAll
      await canvasStore.fetchAll()

      // 過濾邏輯在 UI 層面處理（如果需要）
      // Note: createStore 已經載入所有資料
    },

    setActiveCanvasTab: uiStore.setActiveCanvasTab,

    // ============================================
    // Document 操作 (使用 createStore 的 CRUD)
    // ============================================
    loadRichDocuments: async (canvasId?: string) => {
      // 使用 createStore 的 fetchAll
      await documentStore.fetchAll()

      // 過濾邏輯在 UI 層面處理（如果需要）
      // Note: createStore 已經載入所有資料
    },

    createRichDocument: async (document: Partial<RichDocument>) => {
      const newDoc: RichDocument = {
        id: Date.now().toString(),
        canvas_id: document.canvas_id || '',
        title: document.title || 'Untitled',
        content: document.content || '',
        tags: document.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...document,
      }

      await documentStore.create(newDoc)
    },

    updateRichDocument: async (id: string, updates: Partial<RichDocument>) => {
      await documentStore.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      })
    },

    deleteRichDocument: async (id: string) => {
      await documentStore.delete(id)
    },
  }
}

/**
 * Hook 型別（方便使用）
 */
export type CanvasStoreType = ReturnType<typeof useCanvasStore>
