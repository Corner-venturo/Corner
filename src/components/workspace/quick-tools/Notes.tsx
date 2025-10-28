import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, X, Trash2 } from 'lucide-react';
import { useNotes } from './useNotes';

export function Notes() {
  const {
    notes,
    newNote,
    setNewNote,
    editingNote,
    saveNote,
    updateNote,
    deleteNote,
    startEditing,
    cancelEditing
  } = useNotes();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6">
        {/* 新增/編輯筆記表單 */}
        <div className="w-1/2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingNote ? '編輯筆記' : '新增筆記'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">標題</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="筆記標題"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">內容</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="筆記內容"
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingNote ? updateNote : saveNote}
                  className="flex-1"
                  disabled={!newNote.title.trim() || !newNote.content.trim()}
                >
                  <Save size={16} className="mr-2" />
                  {editingNote ? '更新' : '儲存'}
                </Button>
                {editingNote && (
                  <Button variant="outline" onClick={cancelEditing}>
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 筆記列表 */}
        <div className="w-1/2">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-morandi-secondary opacity-50" />
                <p className="text-morandi-secondary">還沒有任何筆記</p>
              </Card>
            ) : (
              notes.map(note => (
                <Card key={note.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-morandi-primary">{note.title}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => startEditing(note)}
                      >
                        <FileText size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:bg-morandi-red/10 hover:text-morandi-red"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-morandi-secondary line-clamp-3">
                    {note.content}
                  </p>
                  <p className="text-xs text-morandi-secondary mt-2">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
