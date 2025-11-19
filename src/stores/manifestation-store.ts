import { create } from 'zustand'
import { ManifestationEntry, ManifestationProgress } from '@/types/manifestation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from './auth-store'

interface ManifestationState {
  // 狀態
  entries: ManifestationEntry[]
  currentEntry: ManifestationEntry | null
  progress: ManifestationProgress | null
  isLoading: boolean
  error: string | null

  // 方法
  fetchEntries: () => Promise<void>
  fetchEntryByChapter: (chapterNumber: number) => Promise<void>
  createEntry: (entry: Partial<ManifestationEntry>) => Promise<ManifestationEntry | null>
  updateEntry: (id: string, updates: Partial<ManifestationEntry>) => Promise<boolean>
  deleteEntry: (id: string) => Promise<boolean>
  fetchProgress: () => Promise<void>
  setCurrentEntry: (entry: ManifestationEntry | null) => void
  clearError: () => void
}

export const useManifestationStore = create<ManifestationState>((set, get) => ({
  entries: [],
  currentEntry: null,
  progress: null,
  isLoading: false,
  error: null,

  // 獲取當前用戶的所有記錄
  fetchEntries: async () => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: '請先登入' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('manifestation_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('chapter_number', { ascending: true })

      if (error) throw error

      set({ entries: (data as ManifestationEntry[]) || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '獲取記錄失敗',
        isLoading: false,
      })
    }
  },

  // 獲取特定章節的記錄
  fetchEntryByChapter: async (chapterNumber: number) => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: '請先登入' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('manifestation_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_number', chapterNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows found
        throw error
      }

      set({ currentEntry: (data as ManifestationEntry) || null, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '獲取章節記錄失敗',
        isLoading: false,
      })
    }
  },

  // 創建新記錄
  createEntry: async (entry: Partial<ManifestationEntry>) => {
    const user = useAuthStore.getState().user
    if (!user) {
      set({ error: '請先登入' })
      return null
    }

    set({ isLoading: true, error: null })

    try {
      const newEntry = {
        ...entry,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('manifestation_entries')
        .insert(newEntry)
        .select()
        .single()

      if (error) throw error

      // 更新本地狀態
      set(state => ({
        entries: [...state.entries, data as ManifestationEntry],
        currentEntry: data as ManifestationEntry,
        isLoading: false,
      }))

      // 重新獲取進度
      get().fetchProgress()

      return data
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '創建記錄失敗',
        isLoading: false,
      })
      return null
    }
  },

  // 更新記錄
  updateEntry: async (id: string, updates: Partial<ManifestationEntry>) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await supabase
        .from('manifestation_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新本地狀態
      set(state => ({
        entries: state.entries.map(e => (e.id === id ? data as ManifestationEntry : e)),
        currentEntry: state.currentEntry?.id === id ? data as ManifestationEntry : state.currentEntry,
        isLoading: false,
      }))

      // 如果更新了 is_completed，重新獲取進度
      if (updates.is_completed !== undefined) {
        get().fetchProgress()
      }

      return true
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新記錄失敗',
        isLoading: false,
      })
      return false
    }
  },

  // 刪除記錄
  deleteEntry: async (id: string) => {
    set({ isLoading: true, error: null })

    try {
      const { error } = await supabase.from('manifestation_entries').delete().eq('id', id)

      if (error) throw error

      // 更新本地狀態
      set(state => ({
        entries: state.entries.filter(e => e.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
        isLoading: false,
      }))

      // 重新獲取進度
      get().fetchProgress()

      return true
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刪除記錄失敗',
        isLoading: false,
      })
      return false
    }
  },

  // 獲取用戶進度
  fetchProgress: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('manifestation_user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      set({ progress: (data || null) as ManifestationProgress | null })
    } catch (error) {}
  },

  // 設置當前記錄
  setCurrentEntry: (entry: ManifestationEntry | null) => {
    set({ currentEntry: entry })
  },

  // 清除錯誤
  clearError: () => {
    set({ error: null })
  },
}))
