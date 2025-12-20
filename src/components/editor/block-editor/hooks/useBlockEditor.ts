/**
 * 區塊編輯器核心 Hook
 *
 * 提供區塊的狀態管理和操作方法
 */

import { useReducer, useCallback, useMemo } from 'react'
import type {
  AnyBlock,
  BlockType,
  BlockEditorState,
  BlockEditorAction,
  BlockDataMap,
} from '../types'
import { createBlock, BLOCK_CONFIGS, reorderBlocks } from '../types'

// ============================================================
// 初始狀態
// ============================================================

const initialState: BlockEditorState = {
  blocks: [],
  selectedBlockId: null,
  isDirty: false,
  autoSaveStatus: 'idle',
}

// ============================================================
// Reducer
// ============================================================

function blockEditorReducer(
  state: BlockEditorState,
  action: BlockEditorAction
): BlockEditorState {
  switch (action.type) {
    case 'SET_BLOCKS': {
      return {
        ...state,
        blocks: action.payload.blocks,
        isDirty: false,
      }
    }

    case 'ADD_BLOCK': {
      const { blockType, afterId } = action.payload
      const config = BLOCK_CONFIGS[blockType]

      // 檢查是否可以新增
      if (!config.canAdd) return state

      const currentCount = state.blocks.filter(b => b.meta.type === blockType).length
      if (config.maxCount && currentCount >= config.maxCount) return state

      // 計算新區塊的順序
      let insertIndex = state.blocks.length
      if (afterId) {
        const afterIndex = state.blocks.findIndex(b => b.meta.id === afterId)
        if (afterIndex !== -1) {
          insertIndex = afterIndex + 1
        }
      }

      // 建立新區塊（明確轉型為 AnyBlock）
      const newBlock = createBlock(blockType, insertIndex) as AnyBlock

      // 插入並重新排序
      const newBlocks: AnyBlock[] = [...state.blocks]
      newBlocks.splice(insertIndex, 0, newBlock)

      return {
        ...state,
        blocks: reorderBlocks(newBlocks),
        selectedBlockId: newBlock.meta.id,
        isDirty: true,
      }
    }

    case 'REMOVE_BLOCK': {
      const { blockId } = action.payload
      const block = state.blocks.find(b => b.meta.id === blockId)
      if (!block) return state

      const config = BLOCK_CONFIGS[block.meta.type]
      if (!config.canRemove) return state

      const newBlocks = state.blocks.filter(b => b.meta.id !== blockId)

      return {
        ...state,
        blocks: reorderBlocks(newBlocks),
        selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
        isDirty: true,
      }
    }

    case 'UPDATE_BLOCK': {
      const { blockId, data } = action.payload

      const newBlocks = state.blocks.map(block => {
        if (block.meta.id !== blockId) return block
        return {
          ...block,
          data: { ...block.data, ...data },
        } as AnyBlock
      })

      return {
        ...state,
        blocks: newBlocks,
        isDirty: true,
      }
    }

    case 'MOVE_BLOCK': {
      const { blockId, direction } = action.payload
      const currentIndex = state.blocks.findIndex(b => b.meta.id === blockId)
      if (currentIndex === -1) return state

      const block = state.blocks[currentIndex]
      const config = BLOCK_CONFIGS[block.meta.type]
      if (!config.canReorder) return state

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= state.blocks.length) return state

      const newBlocks = [...state.blocks]
      ;[newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]]

      return {
        ...state,
        blocks: reorderBlocks(newBlocks),
        isDirty: true,
      }
    }

    case 'TOGGLE_VISIBILITY': {
      const { blockId } = action.payload

      const newBlocks = state.blocks.map(block => {
        if (block.meta.id !== blockId) return block
        return {
          ...block,
          meta: { ...block.meta, visible: !block.meta.visible },
        } as AnyBlock
      })

      return {
        ...state,
        blocks: newBlocks,
        isDirty: true,
      }
    }

    case 'SELECT_BLOCK': {
      return {
        ...state,
        selectedBlockId: action.payload.blockId,
      }
    }

    case 'REORDER_BLOCKS': {
      return {
        ...state,
        blocks: reorderBlocks(action.payload.blocks),
        isDirty: true,
      }
    }

    case 'SET_DIRTY': {
      return {
        ...state,
        isDirty: action.payload.isDirty,
      }
    }

    case 'SET_AUTOSAVE_STATUS': {
      return {
        ...state,
        autoSaveStatus: action.payload.status,
      }
    }

    default:
      return state
  }
}

// ============================================================
// Hook
// ============================================================

export interface UseBlockEditorOptions {
  initialBlocks?: AnyBlock[]
  onBlocksChange?: (blocks: AnyBlock[]) => void
}

export function useBlockEditor(options: UseBlockEditorOptions = {}) {
  const { initialBlocks = [], onBlocksChange } = options

  const [state, dispatch] = useReducer(blockEditorReducer, {
    ...initialState,
    blocks: initialBlocks,
  })

  // ============================================================
  // 區塊操作方法
  // ============================================================

  const setBlocks = useCallback((blocks: AnyBlock[]) => {
    dispatch({ type: 'SET_BLOCKS', payload: { blocks } })
  }, [])

  const addBlock = useCallback((blockType: BlockType, afterId?: string) => {
    dispatch({ type: 'ADD_BLOCK', payload: { blockType, afterId } })
  }, [])

  const removeBlock = useCallback((blockId: string) => {
    dispatch({ type: 'REMOVE_BLOCK', payload: { blockId } })
  }, [])

  const updateBlock = useCallback(<T extends BlockType>(
    blockId: string,
    data: Partial<BlockDataMap[T]>
  ) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { blockId, data } })
    onBlocksChange?.(state.blocks)
  }, [onBlocksChange, state.blocks])

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    dispatch({ type: 'MOVE_BLOCK', payload: { blockId, direction } })
  }, [])

  const toggleBlockVisibility = useCallback((blockId: string) => {
    dispatch({ type: 'TOGGLE_VISIBILITY', payload: { blockId } })
  }, [])

  const selectBlock = useCallback((blockId: string | null) => {
    dispatch({ type: 'SELECT_BLOCK', payload: { blockId } })
  }, [])

  const reorderBlocksAction = useCallback((blocks: AnyBlock[]) => {
    dispatch({ type: 'REORDER_BLOCKS', payload: { blocks } })
  }, [])

  const setDirty = useCallback((isDirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: { isDirty } })
  }, [])

  const setAutoSaveStatus = useCallback((status: 'idle' | 'saving' | 'saved' | 'error') => {
    dispatch({ type: 'SET_AUTOSAVE_STATUS', payload: { status } })
  }, [])

  // ============================================================
  // 輔助方法
  // ============================================================

  const getBlockById = useCallback((blockId: string) => {
    return state.blocks.find(b => b.meta.id === blockId)
  }, [state.blocks])

  const getBlockByType = useCallback(<T extends BlockType>(type: T) => {
    return state.blocks.find(b => b.meta.type === type) as AnyBlock | undefined
  }, [state.blocks])

  const getVisibleBlocks = useMemo(() => {
    return state.blocks.filter(b => b.meta.visible)
  }, [state.blocks])

  const selectedBlock = useMemo(() => {
    return state.selectedBlockId
      ? state.blocks.find(b => b.meta.id === state.selectedBlockId)
      : null
  }, [state.blocks, state.selectedBlockId])

  // ============================================================
  // 回傳
  // ============================================================

  return {
    // 狀態
    blocks: state.blocks,
    selectedBlockId: state.selectedBlockId,
    selectedBlock,
    isDirty: state.isDirty,
    autoSaveStatus: state.autoSaveStatus,

    // 區塊操作
    setBlocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    toggleBlockVisibility,
    selectBlock,
    reorderBlocks: reorderBlocksAction,

    // 狀態操作
    setDirty,
    setAutoSaveStatus,

    // 輔助方法
    getBlockById,
    getBlockByType,
    getVisibleBlocks,
  }
}

export type UseBlockEditorReturn = ReturnType<typeof useBlockEditor>
