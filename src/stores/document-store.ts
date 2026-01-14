'use client'

/**
 * DocumentStore - 文件編輯器狀態管理
 *
 * 核心理念：載入→編輯→儲存版本（非即時同步）
 * 適用於：手冊編輯器、行程表編輯器
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

// ============================================
// Types
// ============================================

export type DocumentType = 'brochure' | 'itinerary'

// Entity type for brochure association
export type BrochureEntityType = 'tour' | 'package' | 'itinerary'

export interface BrochureDocument {
  id: string
  tour_id: string | null
  package_id: string | null
  itinerary_id: string | null
  workspace_id: string
  name: string
  type: 'front' | 'back' | 'full'
  current_version_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ItineraryDocument {
  id: string
  tour_id: string | null
  workspace_id: string
  name: string
  current_version_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// JSON type compatible with Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  data: Json // Fabric.js canvas JSON
  thumbnail_url: string | null
  restored_from: string | null
  created_at: string
  created_by: string | null
}

export interface DesignTemplate {
  id: string
  workspace_id: string | null
  name: string
  description: string | null
  type: string // DocumentType but stored as string in DB
  category: string | null
  tags: string[] | null
  data: Json
  thumbnail_url: string | null
  is_public: boolean | null
  is_featured: boolean | null
  use_count: number | null
  created_at: string
  updated_at: string
  created_by: string | null
}

// Loading stages for progress display
export type LoadingStage =
  | 'idle'
  | 'fetching_document'
  | 'fetching_version'
  | 'preloading_images'
  | 'rendering_canvas'
  | 'saving'
  | 'uploading_thumbnail'
  | 'creating_version'

// ============================================
// Store State
// ============================================

interface DocumentState {
  // Current document
  documentType: DocumentType | null
  document: BrochureDocument | ItineraryDocument | null
  currentVersion: DocumentVersion | null
  versions: DocumentVersion[]

  // Loading state
  isLoading: boolean
  loadingStage: LoadingStage
  loadingProgress: number // 0-100

  // Dirty state (has unsaved changes)
  isDirty: boolean

  // Saving state
  isSaving: boolean

  // Error state
  error: string | null

  // Actions
  loadDocument: (type: DocumentType, documentId: string) => Promise<void>
  loadOrCreateDocument: (type: DocumentType, entityId: string, workspaceId: string, entityType?: BrochureEntityType) => Promise<string>
  saveVersion: (canvasData: Json, thumbnailUrl?: string) => Promise<DocumentVersion | null>
  loadVersion: (versionId: string) => Promise<void>
  restoreVersion: (versionId: string) => Promise<void>
  fetchVersions: () => Promise<void>

  // Template actions
  applyTemplate: (templateId: string) => Promise<Json | null>
  saveAsTemplate: (name: string, category: string, canvasData: Json, thumbnailUrl?: string) => Promise<DesignTemplate | null>
  fetchTemplates: (type: DocumentType) => Promise<DesignTemplate[]>

  // State setters
  setIsDirty: (dirty: boolean) => void
  setLoadingStage: (stage: LoadingStage, progress?: number) => void
  reset: () => void
}

// ============================================
// Initial State
// ============================================

const initialState = {
  documentType: null,
  document: null,
  currentVersion: null,
  versions: [],
  isLoading: false,
  loadingStage: 'idle' as LoadingStage,
  loadingProgress: 0,
  isDirty: false,
  isSaving: false,
  error: null,
}

// ============================================
// Store
// ============================================

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...initialState,

  // ============================================
  // Load Document
  // ============================================
  loadDocument: async (type: DocumentType, documentId: string) => {
    
    set({
      isLoading: true,
      loadingStage: 'fetching_document',
      loadingProgress: 10,
      error: null,
      documentType: type,
    })

    try {
      // 1. Fetch document
      const tableName = type === 'brochure' ? 'brochure_documents' : 'itinerary_documents'
      const { data: doc, error: docError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError) throw new Error(`無法載入文件: ${docError.message}`)
      if (!doc) throw new Error('文件不存在')

      set({
        document: doc,
        loadingStage: 'fetching_version',
        loadingProgress: 30,
      })

      // 2. Fetch current version if exists
      if (doc.current_version_id) {
        const versionTable = type === 'brochure' ? 'brochure_versions' : 'itinerary_versions'
        const { data: version, error: versionError } = await supabase
          .from(versionTable)
          .select('*')
          .eq('id', doc.current_version_id)
          .single()

        if (versionError) throw new Error(`無法載入版本: ${versionError.message}`)

        set({
          currentVersion: version,
          loadingStage: 'preloading_images',
          loadingProgress: 60,
        })
      }

      // Note: Image preloading and canvas rendering will be done by the component
      set({
        loadingStage: 'rendering_canvas',
        loadingProgress: 80,
      })

      // Done loading
      set({
        isLoading: false,
        loadingStage: 'idle',
        loadingProgress: 100,
        isDirty: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        loadingStage: 'idle',
        loadingProgress: 0,
        error: error instanceof Error ? error.message : '載入失敗',
      })
    }
  },

  // ============================================
  // Load or Create Document
  // ============================================
  loadOrCreateDocument: async (type: DocumentType, entityId: string, workspaceId: string, entityType: BrochureEntityType = 'tour') => {
    const tableName = type === 'brochure' ? 'brochure_documents' : 'itinerary_documents'

    // Determine which field to use based on entity type
    const entityField = entityType === 'tour' ? 'tour_id' :
                        entityType === 'package' ? 'package_id' :
                        'itinerary_id'

    set({
      isLoading: true,
      loadingStage: 'fetching_document',
      loadingProgress: 10,
      error: null,
      documentType: type,
    })

    try {
      // 1. Try to find existing document for this entity
      const { data: existingDocs, error: findError } = await supabase
        .from(tableName)
        .select('id')
        .eq(entityField, entityId)
        .limit(1)

      if (findError) throw new Error(`搜尋文件失敗: ${findError.message}`)

      if (existingDocs && existingDocs.length > 0) {
        // Document exists, load it
        const documentId = existingDocs[0].id
        await get().loadDocument(type, documentId)
        return documentId
      }

      // 2. Create new document
      set({ loadingProgress: 30 })

      const newDoc = {
        [entityField]: entityId,
        workspace_id: workspaceId,
        name: type === 'brochure' ? '新手冊' : '新行程表',
        ...(type === 'brochure' ? { type: 'full' } : {}),
      }

      const { data: created, error: createError } = await supabase
        .from(tableName)
        .insert(newDoc)
        .select()
        .single()

      if (createError) throw new Error(`建立文件失敗: ${createError.message}`)
      if (!created) throw new Error('建立文件失敗')

      set({
        document: created,
        currentVersion: null,
        isLoading: false,
        loadingStage: 'idle',
        loadingProgress: 100,
        isDirty: false,
      })

      return created.id
    } catch (error) {
      set({
        isLoading: false,
        loadingStage: 'idle',
        loadingProgress: 0,
        error: error instanceof Error ? error.message : '操作失敗',
      })
      throw error
    }
  },

  // ============================================
  // Save Version
  // ============================================
  saveVersion: async (canvasData: Json, thumbnailUrl?: string) => {
    const { document, documentType } = get()
    if (!document || !documentType) return null

    set({ isSaving: true, loadingStage: 'saving' })

    try {
      const versionTable = documentType === 'brochure' ? 'brochure_versions' : 'itinerary_versions'
      const docTable = documentType === 'brochure' ? 'brochure_documents' : 'itinerary_documents'

      // 1. Create new version
      set({ loadingStage: 'creating_version' })

      const { data: newVersion, error: versionError } = await supabase
        .from(versionTable)
        .insert({
          document_id: document.id,
          data: canvasData,
          thumbnail_url: thumbnailUrl || null,
        })
        .select()
        .single()

      if (versionError) throw new Error(`儲存版本失敗: ${versionError.message}`)

      // 2. Update document's current_version_id
      const { error: updateError } = await supabase
        .from(docTable)
        .update({ current_version_id: newVersion.id })
        .eq('id', document.id)

      if (updateError) throw new Error(`更新文件失敗: ${updateError.message}`)

      // 3. Update local state
      set({
        currentVersion: newVersion,
        document: { ...document, current_version_id: newVersion.id },
        isSaving: false,
        loadingStage: 'idle',
        isDirty: false,
      })

      return newVersion
    } catch (error) {
      set({
        isSaving: false,
        loadingStage: 'idle',
        error: error instanceof Error ? error.message : '儲存失敗',
      })
      return null
    }
  },

  // ============================================
  // Load Specific Version
  // ============================================
  loadVersion: async (versionId: string) => {
    const { documentType } = get()
    if (!documentType) return

        const versionTable = documentType === 'brochure' ? 'brochure_versions' : 'itinerary_versions'

    set({
      isLoading: true,
      loadingStage: 'fetching_version',
    })

    try {
      const { data: version, error } = await supabase
        .from(versionTable)
        .select('*')
        .eq('id', versionId)
        .single()

      if (error) throw new Error(`載入版本失敗: ${error.message}`)

      set({
        currentVersion: version,
        isLoading: false,
        loadingStage: 'idle',
        isDirty: true, // Mark as dirty since we loaded an old version
      })
    } catch (error) {
      set({
        isLoading: false,
        loadingStage: 'idle',
        error: error instanceof Error ? error.message : '載入版本失敗',
      })
    }
  },

  // ============================================
  // Restore Version (creates new version from old)
  // ============================================
  restoreVersion: async (versionId: string) => {
    const { documentType, document } = get()
    if (!documentType || !document) return

        const versionTable = documentType === 'brochure' ? 'brochure_versions' : 'itinerary_versions'
    const docTable = documentType === 'brochure' ? 'brochure_documents' : 'itinerary_documents'

    set({
      isLoading: true,
      loadingStage: 'fetching_version',
    })

    try {
      // 1. Fetch old version
      const { data: oldVersion, error: fetchError } = await supabase
        .from(versionTable)
        .select('*')
        .eq('id', versionId)
        .single()

      if (fetchError) throw new Error(`載入版本失敗: ${fetchError.message}`)

      set({ loadingStage: 'creating_version' })

      // 2. Create new version based on old
      const { data: newVersion, error: createError } = await supabase
        .from(versionTable)
        .insert({
          document_id: document.id,
          data: oldVersion.data,
          thumbnail_url: oldVersion.thumbnail_url,
          restored_from: versionId,
        })
        .select()
        .single()

      if (createError) throw new Error(`建立版本失敗: ${createError.message}`)

      // 3. Update document
      const { error: updateError } = await supabase
        .from(docTable)
        .update({ current_version_id: newVersion.id })
        .eq('id', document.id)

      if (updateError) throw new Error(`更新文件失敗: ${updateError.message}`)

      // 4. Update local state
      set({
        currentVersion: newVersion,
        document: { ...document, current_version_id: newVersion.id },
        isLoading: false,
        loadingStage: 'idle',
        isDirty: false,
      })

      // 5. Refresh version list
      await get().fetchVersions()
    } catch (error) {
      set({
        isLoading: false,
        loadingStage: 'idle',
        error: error instanceof Error ? error.message : '恢復版本失敗',
      })
    }
  },

  // ============================================
  // Fetch All Versions
  // ============================================
  fetchVersions: async () => {
    const { documentType, document } = get()
    if (!documentType || !document) return

        const versionTable = documentType === 'brochure' ? 'brochure_versions' : 'itinerary_versions'

    try {
      const { data: versions, error } = await supabase
        .from(versionTable)
        .select('*')
        .eq('document_id', document.id)
        .order('version_number', { ascending: false })

      if (error) throw new Error(`載入版本歷史失敗: ${error.message}`)

      set({ versions: versions || [] })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '載入版本歷史失敗',
      })
    }
  },

  // ============================================
  // Apply Template
  // ============================================
  applyTemplate: async (templateId: string) => {
    
    set({
      isLoading: true,
      loadingStage: 'fetching_document',
    })

    try {
      const { data: template, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw new Error(`載入模板失敗: ${error.message}`)

      // Increment use count
      await supabase
        .from('design_templates')
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq('id', templateId)

      set({
        isLoading: false,
        loadingStage: 'idle',
        isDirty: true,
      })

      return template.data
    } catch (error) {
      set({
        isLoading: false,
        loadingStage: 'idle',
        error: error instanceof Error ? error.message : '套用模板失敗',
      })
      return null
    }
  },

  // ============================================
  // Save As Template
  // ============================================
  saveAsTemplate: async (name: string, category: string, canvasData: Json, thumbnailUrl?: string) => {
    const { documentType, document } = get()
    if (!documentType || !document) return null

    try {
      const { data: template, error } = await supabase
        .from('design_templates')
        .insert({
          workspace_id: 'workspace_id' in document ? document.workspace_id : null,
          name,
          type: documentType,
          category,
          data: canvasData,
          thumbnail_url: thumbnailUrl || null,
          is_public: false,
        })
        .select()
        .single()

      if (error) throw new Error(`儲存模板失敗: ${error.message}`)

      return template
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '儲存模板失敗',
      })
      return null
    }
  },

  // ============================================
  // Fetch Templates
  // ============================================
  fetchTemplates: async (type: DocumentType) => {
    
    try {
      const { data: templates, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('type', type)
        .order('use_count', { ascending: false })

      if (error) throw new Error(`載入模板失敗: ${error.message}`)

      return templates || []
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '載入模板失敗',
      })
      return []
    }
  },

  // ============================================
  // State Setters
  // ============================================
  setIsDirty: (dirty: boolean) => set({ isDirty: dirty }),

  setLoadingStage: (stage: LoadingStage, progress?: number) =>
    set({
      loadingStage: stage,
      ...(progress !== undefined ? { loadingProgress: progress } : {}),
    }),

  reset: () => set(initialState),
}))
