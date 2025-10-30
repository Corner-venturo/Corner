import { useState, useEffect } from 'react'
import { Checklist, ChecklistItem } from './types'
import { STORAGE_KEYS } from './constants'

export function useChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)

  useEffect(() => {
    const savedChecklists = localStorage.getItem(STORAGE_KEYS.CHECKLISTS)
    if (savedChecklists) {
      setChecklists(JSON.parse(savedChecklists))
    }
  }, [])

  const addChecklistItem = (checklistId: string) => {
    if (editingChecklist && editingChecklist.id === checklistId) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: '',
        completed: false,
      }
      setEditingChecklist({
        ...editingChecklist,
        items: [...editingChecklist.items, newItem],
      })
    }
  }

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (!editingChecklist) return

    const updatedItems = editingChecklist.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    setEditingChecklist({ ...editingChecklist, items: updatedItems })
  }

  const removeChecklistItem = (itemId: string) => {
    if (!editingChecklist) return

    const updatedItems = editingChecklist.items.filter(item => item.id !== itemId)
    setEditingChecklist({ ...editingChecklist, items: updatedItems })
  }

  const saveChecklist = () => {
    if (!editingChecklist || !editingChecklist.title.trim()) return

    const validItems = editingChecklist.items.filter(item => item.text.trim())
    if (validItems.length === 0) return

    const checklist: Checklist = {
      ...editingChecklist,
      items: validItems,
      created_at: editingChecklist.id ? editingChecklist.created_at : new Date().toISOString(),
    }

    let updatedChecklists
    if (checklists.find(c => c.id === checklist.id)) {
      updatedChecklists = checklists.map(c => (c.id === checklist.id ? checklist : c))
    } else {
      updatedChecklists = [checklist, ...checklists]
    }

    setChecklists(updatedChecklists)
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(updatedChecklists))
    setEditingChecklist(null)
  }

  const deleteChecklist = (id: string) => {
    const updatedChecklists = checklists.filter(checklist => checklist.id !== id)
    setChecklists(updatedChecklists)
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(updatedChecklists))
  }

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    const updatedChecklists = checklists.map(checklist =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            ),
          }
        : checklist
    )
    setChecklists(updatedChecklists)
    localStorage.setItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(updatedChecklists))
  }

  const startNewChecklist = () => {
    setEditingChecklist({
      id: Date.now().toString(),
      title: '',
      items: [{ id: Date.now().toString(), text: '', completed: false }],
      created_at: new Date().toISOString(),
    })
  }

  const startEditingChecklist = (checklist: Checklist) => {
    setEditingChecklist(checklist)
  }

  const cancelEditing = () => {
    setEditingChecklist(null)
  }

  return {
    checklists,
    editingChecklist,
    setEditingChecklist,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
    saveChecklist,
    deleteChecklist,
    toggleChecklistItem,
    startNewChecklist,
    startEditingChecklist,
    cancelEditing,
  }
}
