import { useState, useEffect } from 'react'
import { Note } from './types'
import { STORAGE_KEYS } from './constants'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES)
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }
  }, [])

  const saveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      created_at: new Date().toISOString(),
    }

    const updatedNotes = [note, ...notes]
    setNotes(updatedNotes)
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes))
    setNewNote({ title: '', content: '' })
  }

  const updateNote = () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return

    const updatedNotes = notes.map(note =>
      note.id === editingNote.id
        ? { ...note, title: newNote.title, content: newNote.content }
        : note
    )
    setNotes(updatedNotes)
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes))
    setEditingNote(null)
    setNewNote({ title: '', content: '' })
  }

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id)
    setNotes(updatedNotes)
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes))
  }

  const startEditing = (note: Note) => {
    setEditingNote(note)
    setNewNote({ title: note.title, content: note.content })
  }

  const cancelEditing = () => {
    setEditingNote(null)
    setNewNote({ title: '', content: '' })
  }

  return {
    notes,
    newNote,
    setNewNote,
    editingNote,
    saveNote,
    updateNote,
    deleteNote,
    startEditing,
    cancelEditing,
  }
}
