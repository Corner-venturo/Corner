// Canvas and documents management store
import { create } from 'zustand';
import type { PersonalCanvas, RichDocument } from './types';

interface CanvasState {
  personalCanvases: PersonalCanvas[];
  richDocuments: RichDocument[];
  activeCanvasTab: string;

  // Canvas operations
  createPersonalCanvas: (canvas: Omit<PersonalCanvas, 'id' | 'created_at' | 'updated_at'>) => Promise<PersonalCanvas>;
  loadPersonalCanvases: (userId?: string, workspaceId?: string) => Promise<void>;
  setActiveCanvasTab: (tab: string) => void;

  // Document operations
  loadRichDocuments: (canvasId?: string) => Promise<void>;
  createRichDocument: (document: Partial<RichDocument>) => Promise<void>;
  updateRichDocument: (id: string, updates: Partial<RichDocument>) => Promise<void>;
  deleteRichDocument: (id: string) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  personalCanvases: [],
  richDocuments: [],
  activeCanvasTab: 'canvas',

  createPersonalCanvas: async (canvas) => {
    const newCanvas: PersonalCanvas = {
      ...canvas,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    set((state) => ({
      personalCanvases: [...state.personalCanvases, newCanvas]
    }));
    return newCanvas;
  },

  loadPersonalCanvases: async (userId?: string, workspaceId?: string) => {
    console.log('loadPersonalCanvases stub', userId, workspaceId);
  },

  setActiveCanvasTab: (tab) => {
    set({ activeCanvasTab: tab });
  },

  loadRichDocuments: async (canvasId?: string) => {
    console.log('loadRichDocuments stub', canvasId);
  },

  createRichDocument: async (document) => {
    const newDoc: RichDocument = {
      id: Date.now().toString(),
      canvas_id: document.canvas_id || '',
      title: document.title || 'Untitled',
      content: document.content || '',
      tags: document.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      richDocuments: [...state.richDocuments, newDoc]
    }));
  },

  updateRichDocument: async (id, updates) => {
    set((state) => ({
      richDocuments: state.richDocuments.map(doc =>
        doc.id === id ? { ...doc, ...updates, updated_at: new Date().toISOString() } : doc
      )
    }));
  },

  deleteRichDocument: async (id) => {
    set((state) => ({
      richDocuments: state.richDocuments.filter(doc => doc.id !== id)
    }));
  },
}));
