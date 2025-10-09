import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Template, GeneratedDocument, PaperSettings } from '@/types/template';

interface TemplateStore {
  // 狀態
  templates: Template[];
  documents: GeneratedDocument[];

  // 模板操作（統一使用 Promise）
  addTemplate: (template: Omit<Template, 'id' | 'version' | 'usageCount' | 'metadata' | 'isDeleted'>) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string, user_id: string) => Promise<void>;
  getTemplate: (id: string) => Template | undefined;
  duplicateTemplate: (id: string, newName: string) => Promise<Template>;

  // 文件操作
  addDocument: (document: Omit<GeneratedDocument, 'id' | 'createdAt'>) => Promise<GeneratedDocument>;
  getDocumentsByTemplate: (templateId: string) => GeneratedDocument[];

  // 工具函數
  incrementUsageCount: (templateId: string) => void;

  // 初始化預設模板
  initializeDefaultTemplates: () => void;
}

// 預設紙張設定
const DEFAULT_PAPER_SETTINGS: PaperSettings = {
  size: 'A4',
  orientation: 'portrait',
  margins: {
    top: 2.0,
    bottom: 2.0,
    left: 2.0,
    right: 2.0,
  },
  showGrid: true,
  showRuler: true,
};

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      documents: [],

      addTemplate: async (templateData) => {
        const newTemplate: Template = {
          ...templateData,
          id: crypto.randomUUID(),
          version: 1,
          usageCount: 0,
          isDeleted: false,
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: templateData.paperSettings ? 'user' : 'system',
          },
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return newTemplate;
      },

      updateTemplate: async (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  ...updates,
                  metadata: {
                    ...template.metadata,
                    updated_at: new Date().toISOString(),
                  },
                }
              : template
          ),
        }));
      },

      deleteTemplate: async (id, userId) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  isDeleted: true,
                  deleted_at: new Date().toISOString(),
                  deleted_by: user_id,
                }
              : template
          ),
        }));
      },

      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id && !t.isDeleted);
      },

      duplicateTemplate: async (id, newName) => {
        const original = get().getTemplate(id);
        if (!original) {
          throw new Error('Template not found');
        }

        const duplicated: Template = {
          ...original,
          id: crypto.randomUUID(),
          name: newName,
          version: 1,
          usageCount: 0,
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: original.metadata.created_by,
          },
        };

        set((state) => ({
          templates: [...state.templates, duplicated],
        }));

        return duplicated;
      },

      addDocument: async (documentData) => {
        const newDocument: GeneratedDocument = {
          ...documentData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          documents: [...state.documents, newDocument],
        }));

        // 增加模板使用次數
        get().incrementUsageCount(documentData.templateId);

        return newDocument;
      },

      getDocumentsByTemplate: (templateId) => {
        return get().documents.filter((doc) => doc.templateId === templateId);
      },

      incrementUsageCount: (templateId) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === templateId
              ? { ...template, usageCount: template.usageCount + 1 }
              : template
          ),
        }));
      },

      initializeDefaultTemplates: () => {
        const { templates } = get();
        if (templates.length === 0) {
          // 目前不自動建立預設模板
          // 等待使用者從設計器建立
          console.log('模板列表為空，等待使用者建立第一個模板');
        }
      },
    }),
    {
      name: 'template-storage',
    }
  )
);
