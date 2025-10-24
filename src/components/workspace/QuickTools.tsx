'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calculator,
  DollarSign,
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  created_at: string;
}

export function QuickTools() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'currency' | 'notes' | 'checklist'>('calculator');

  // Calculator state
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Currency converter state
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('TWD');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates] = useState({
    USD: { TWD: 31.5, EUR: 0.85, JPY: 110 },
    TWD: { USD: 0.032, EUR: 0.027, JPY: 3.5 },
    EUR: { USD: 1.18, TWD: 37.1, JPY: 129 },
    JPY: { USD: 0.009, TWD: 0.29, EUR: 0.008 }
  });

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Checklist state
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklist, setNewChecklist] = useState({ title: '', items: [] as ChecklistItem[] });
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('venturo-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }

    const savedChecklists = localStorage.getItem('venturo-checklists');
    if (savedChecklists) {
      setChecklists(JSON.parse(savedChecklists));
    }
  }, []);

  // Calculator functions
  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '×': return firstValue * secondValue;
      case '÷': return firstValue / secondValue;
      case '=': return secondValue;
      default: return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(`${parseFloat(newValue.toFixed(7))}`);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clearCalculator = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  // Currency converter functions
  const convertCurrency = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (fromCurrency === toCurrency) {
      setConvertedAmount(amountNum);
      return;
    }

    const rate = (exchangeRates as unknown)[fromCurrency]?.[toCurrency];
    if (rate) {
      setConvertedAmount(amountNum * rate);
    }
  };

  // Notes functions
  const saveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      created_at: new Date().toISOString()
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('venturo-notes', JSON.stringify(updatedNotes));
    setNewNote({ title: '', content: '' });
  };

  const updateNote = () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === editingNote.id
        ? { ...note, title: newNote.title, content: newNote.content }
        : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('venturo-notes', JSON.stringify(updatedNotes));
    setEditingNote(null);
    setNewNote({ title: '', content: '' });
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('venturo-notes', JSON.stringify(updatedNotes));
  };

  // Checklist functions
  const addChecklistItem = (checklistId: string) => {
    if (editingChecklist && editingChecklist.id === checklistId) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: '',
        completed: false
      };
      setEditingChecklist({
        ...editingChecklist,
        items: [...editingChecklist.items, newItem]
      });
    }
  };

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    if (!editingChecklist) return;

    const updatedItems = editingChecklist.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setEditingChecklist({ ...editingChecklist, items: updatedItems });
  };

  const removeChecklistItem = (itemId: string) => {
    if (!editingChecklist) return;

    const updatedItems = editingChecklist.items.filter(item => item.id !== itemId);
    setEditingChecklist({ ...editingChecklist, items: updatedItems });
  };

  const saveChecklist = () => {
    if (!editingChecklist || !editingChecklist.title.trim()) return;

    const validItems = editingChecklist.items.filter(item => item.text.trim());
    if (validItems.length === 0) return;

    const checklist: Checklist = {
      ...editingChecklist,
      items: validItems,
      created_at: editingChecklist.id ? editingChecklist.created_at : new Date().toISOString()
    };

    let updatedChecklists;
    if (checklists.find(c => c.id === checklist.id)) {
      updatedChecklists = checklists.map(c => c.id === checklist.id ? checklist : c);
    } else {
      updatedChecklists = [checklist, ...checklists];
    }

    setChecklists(updatedChecklists);
    localStorage.setItem('venturo-checklists', JSON.stringify(updatedChecklists));
    setEditingChecklist(null);
  };

  const deleteChecklist = (id: string) => {
    const updatedChecklists = checklists.filter(checklist => checklist.id !== id);
    setChecklists(updatedChecklists);
    localStorage.setItem('venturo-checklists', JSON.stringify(updatedChecklists));
  };

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    const updatedChecklists = checklists.map(checklist =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          }
        : checklist
    );
    setChecklists(updatedChecklists);
    localStorage.setItem('venturo-checklists', JSON.stringify(updatedChecklists));
  };

  const tabs = [
    { id: 'calculator', label: '計算機', icon: Calculator },
    { id: 'currency', label: '匯率', icon: DollarSign },
    { id: 'notes', label: '筆記', icon: FileText },
    { id: 'checklist', label: '清單', icon: CheckSquare }
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* 工具選項卡 */}
      <div className="border-b border-border bg-white p-4">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-morandi-gold text-white"
                    : "text-morandi-secondary hover:bg-morandi-container/20 hover:text-morandi-primary"
                )}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 工具內容區域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 計算機 */}
        {activeTab === 'calculator' && (
          <div className="max-w-sm mx-auto">
            <Card className="p-4">
              <div className="mb-4">
                <div className="bg-morandi-container/10 p-4 rounded-lg text-right text-2xl font-mono">
                  {display}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={clearCalculator} className="col-span-2">C</Button>
                <Button variant="outline" onClick={() => inputOperation('÷')}>÷</Button>
                <Button variant="outline" onClick={() => inputOperation('×')}>×</Button>

                <Button variant="outline" onClick={() => inputNumber('7')}>7</Button>
                <Button variant="outline" onClick={() => inputNumber('8')}>8</Button>
                <Button variant="outline" onClick={() => inputNumber('9')}>9</Button>
                <Button variant="outline" onClick={() => inputOperation('-')}>-</Button>

                <Button variant="outline" onClick={() => inputNumber('4')}>4</Button>
                <Button variant="outline" onClick={() => inputNumber('5')}>5</Button>
                <Button variant="outline" onClick={() => inputNumber('6')}>6</Button>
                <Button variant="outline" onClick={() => inputOperation('+')} className="row-span-2">+</Button>

                <Button variant="outline" onClick={() => inputNumber('1')}>1</Button>
                <Button variant="outline" onClick={() => inputNumber('2')}>2</Button>
                <Button variant="outline" onClick={() => inputNumber('3')}>3</Button>

                <Button variant="outline" onClick={() => inputNumber('0')} className="col-span-2">0</Button>
                <Button variant="outline" onClick={() => inputNumber('.')}>.</Button>
                <Button onClick={performCalculation} className="bg-morandi-gold hover:bg-morandi-gold-hover">=</Button>
              </div>
            </Card>
          </div>
        )}

        {/* 匯率轉換器 */}
        {activeTab === 'currency' && (
          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">匯率轉換</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">金額</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="輸入金額"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">從</label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="USD">美元 (USD)</option>
                      <option value="TWD">台幣 (TWD)</option>
                      <option value="EUR">歐元 (EUR)</option>
                      <option value="JPY">日圓 (JPY)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">到</label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md"
                    >
                      <option value="USD">美元 (USD)</option>
                      <option value="TWD">台幣 (TWD)</option>
                      <option value="EUR">歐元 (EUR)</option>
                      <option value="JPY">日圓 (JPY)</option>
                    </select>
                  </div>
                </div>

                <Button onClick={convertCurrency} className="w-full">
                  轉換
                </Button>

                {convertedAmount !== null && (
                  <div className="bg-morandi-container/10 p-4 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-morandi-primary">
                      {convertedAmount.toFixed(2)} {toCurrency}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 筆記 */}
        {activeTab === 'notes' && (
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
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingNote(null);
                            setNewNote({ title: '', content: '' });
                          }}
                        >
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
                              onClick={() => {
                                setEditingNote(note);
                                setNewNote({ title: note.title, content: note.content });
                              }}
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
        )}

        {/* 清單 */}
        {activeTab === 'checklist' && (
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
                          onChange={(e) => setEditingChecklist({ ...editingChecklist, title: e.target.value })}
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
                                onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
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
                        <Button
                          variant="outline"
                          onClick={() => setEditingChecklist(null)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEditingChecklist({
                        id: Date.now().toString(),
                        title: '',
                        items: [{ id: Date.now().toString(), text: '', completed: false }],
                        created_at: new Date().toISOString()
                      })}
                      className="w-full"
                    >
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
                              onClick={() => setEditingChecklist(checklist)}
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
                              <span className={cn(
                                "text-sm",
                                item.completed
                                  ? "line-through text-morandi-secondary"
                                  : "text-morandi-primary"
                              )}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs text-morandi-secondary mt-3">
                          {checklist.items.filter(item => item.completed).length} / {checklist.items.length} 完成
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}