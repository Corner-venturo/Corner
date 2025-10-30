import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Save, X, FileText, Trash2, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChecklists } from './useChecklists'

export function Checklist() {
  const {
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
  } = useChecklists()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6">
        {/* 新增/編輯清單表單 */}
        <div className="w-1/2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingChecklist?.id ? '編輯清單' : '新增清單'}
            </h3>

            {editingChecklist ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">清單標題</label>
                  <Input
                    value={editingChecklist.title}
                    onChange={e =>
                      setEditingChecklist({ ...editingChecklist, title: e.target.value })
                    }
                    placeholder="清單標題"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">項目</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addChecklistItem(editingChecklist.id)}
                    >
                      <Plus size={14} className="mr-1" />
                      新增項目
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {editingChecklist.items.map(item => (
                      <div key={item.id} className="flex gap-2">
                        <Input
                          value={item.text}
                          onChange={e => updateChecklistItem(item.id, { text: e.target.value })}
                          placeholder="項目內容"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => removeChecklistItem(item.id)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveChecklist} className="flex-1">
                    <Save size={16} className="mr-2" />
                    儲存清單
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={startNewChecklist} className="w-full">
                <Plus size={16} className="mr-2" />
                建立新清單
              </Button>
            )}
          </Card>
        </div>

        {/* 清單列表 */}
        <div className="w-1/2">
          <div className="space-y-3">
            {checklists.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 text-morandi-secondary opacity-50" />
                <p className="text-morandi-secondary">還沒有任何清單</p>
              </Card>
            ) : (
              checklists.map(checklist => (
                <Card key={checklist.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-morandi-primary">{checklist.title}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => startEditingChecklist(checklist)}
                      >
                        <FileText size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:bg-morandi-red/10 hover:text-morandi-red"
                        onClick={() => deleteChecklist(checklist.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {checklist.items.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(checklist.id, item.id)}
                          className="rounded"
                        />
                        <span
                          className={cn(
                            'text-sm',
                            item.completed
                              ? 'line-through text-morandi-secondary'
                              : 'text-morandi-primary'
                          )}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-morandi-secondary mt-3">
                    {checklist.items.filter(item => item.completed).length} /{' '}
                    {checklist.items.length} 完成
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
