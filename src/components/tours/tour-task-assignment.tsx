'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StarRating } from '@/components/ui/star-rating'
import { EnhancedTable } from '@/components/ui/enhanced-table'
import { Tour, Todo } from '@/stores/types'
import { useTodoStore } from '@/stores'
import { taskTemplates, calculateDeadlineFromDeparture } from '@/lib/task-templates'
import { cn } from '@/lib/utils'
import { Plus, Eye, Calendar, User, CheckCircle, Clock } from 'lucide-react'

interface TourTaskAssignmentProps {
  tour: Tour
}

const employees = [
  { id: '1', name: '張經理', role: '主管' },
  { id: '2', name: '李助理', role: 'OP' },
  { id: '3', name: '王財務', role: '財務' },
  { id: '4', name: '陳業務', role: '業務' },
]

export function TourTaskAssignment({ tour }: TourTaskAssignmentProps) {
  const router = useRouter()
  const { items: todos, create: addTodo } = useTodoStore()
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [taskForm, setTaskForm] = useState({
    title: '',
    assignee: '',
    deadline: '',
    priority: 3 as 1 | 2 | 3 | 4 | 5,
    sub_tasks: [''] as string[],
  })

  // 獲取與此旅遊團相關的任務
  const tourTasks = todos.filter(todo =>
    todo.related_items.some(item => item.type === 'group' && item.id === tour.id)
  )

  useEffect(() => {
    // 根據出發日期設定預設期限
    if (tour.departure_date) {
      const defaultDeadline = calculateDeadlineFromDeparture(tour.departure_date, -7)
      setTaskForm(prev => ({ ...prev, deadline: defaultDeadline }))
    }
  }, [tour.departure_date])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)

    if (templateId && taskTemplates[templateId]) {
      const template = taskTemplates[templateId]
      const deadline = calculateDeadlineFromDeparture(
        tour.departure_date,
        template.defaultDeadlineDays
      )

      setTaskForm({
        title: template.title,
        assignee: '',
        deadline,
        priority: template.defaultPriority,
        sub_tasks: [...template.sub_tasks, ''], // 加一個空欄位供自訂
      })
    }
  }

  const handleSubTaskChange = (index: number, value: string) => {
    const newSubTasks = [...taskForm.sub_tasks]
    newSubTasks[index] = value
    setTaskForm(prev => ({ ...prev, sub_tasks: newSubTasks }))
  }

  const addSubTask = () => {
    setTaskForm(prev => ({
      ...prev,
      sub_tasks: [...prev.sub_tasks, ''],
    }))
  }

  const removeSubTask = (index: number) => {
    if (taskForm.sub_tasks.length > 1) {
      const newSubTasks = taskForm.sub_tasks.filter((_, i) => i !== index)
      setTaskForm(prev => ({ ...prev, sub_tasks: newSubTasks }))
    }
  }

  const handleCreateTask = () => {
    if (!taskForm.title.trim() || !taskForm.assignee) return

    const sub_tasks = taskForm.sub_tasks
      .filter((task: string) => task.trim())
      .map((task: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        title: task.trim(),
        done: false,
      }))

    const newTodo: Partial<Todo> = {
      title: taskForm.title,
      priority: taskForm.priority,
      deadline: taskForm.deadline,
      status: 'pending' as const,
      creator: '1',
      assignee: taskForm.assignee,
      visibility: ['1', taskForm.assignee],
      related_items: [
        {
          type: 'group' as const,
          id: tour.id,
          title: tour.name,
        },
      ],
      sub_tasks,
      notes: [
        {
          timestamp: new Date().toISOString(),
          content: `從旅遊團「${tour.name}」指派的任務`,
          author_id: '1',
          author_name: '系統',
        },
      ],
      enabled_quick_actions: [],
    }

    addTodo(newTodo as unknown as Parameters<typeof addTodo>[0])

    // 重置表單
    setTaskForm({
      title: '',
      assignee: '',
      deadline: calculateDeadlineFromDeparture(tour.departure_date, -7),
      priority: 3,
      sub_tasks: [''],
    })
    setSelectedTemplate('')
  }

  const getStatusLabel = (status: Todo['status']) => {
    const statusMap = {
      pending: '待辦',
      in_progress: '進行中',
      completed: '完成',
      cancelled: '取消',
    }
    return statusMap[status]
  }

  const getStatusColor = (status: Todo['status']) => {
    const colorMap = {
      pending: 'text-morandi-muted',
      in_progress: 'text-blue-600',
      completed: 'text-green-600',
      cancelled: 'text-morandi-red',
    }
    return colorMap[status]
  }

  const getEmployeeName = (employee_id: string) => {
    return employees.find(emp => emp.id === employee_id)?.name || '未指派'
  }

  const getProgressInfo = (todo: Todo) => {
    const completed = todo.sub_tasks.filter(task => task.done).length
    const total = todo.sub_tasks.length
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }

  // 任務列表表格欄位
  const taskColumns = [
    {
      key: 'title',
      label: '任務標題',
      sortable: true,
      render: (_value: unknown, todo: Todo) => (
        <div className="flex items-center gap-2">
          <StarRating value={todo.priority} readonly size="sm" />
          <span className="font-medium text-morandi-primary">{todo.title}</span>
        </div>
      ),
    },
    {
      key: 'assignee',
      label: '負責人',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-morandi-secondary" />
          <span className="text-morandi-primary">{getEmployeeName(String(value))}</span>
        </div>
      ),
    },
    {
      key: 'deadline',
      label: '期限',
      sortable: true,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-morandi-secondary" />
          <span className="text-sm text-morandi-primary">
            {value ? new Date(String(value)).toLocaleDateString() : '未設定'}
          </span>
        </div>
      ),
    },
    {
      key: 'progress',
      label: '進度',
      render: (_value: unknown, todo: Todo) => {
        const { completed, total, percentage } = getProgressInfo(todo)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-morandi-container/30 rounded-full h-2">
              <div
                className="bg-morandi-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-morandi-secondary">
              {completed}/{total}
            </span>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: '狀態',
      render: (value: unknown) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-sm font-medium',
            getStatusColor(value as Todo['status'])
          )}
        >
          {value === 'completed' && <CheckCircle size={14} />}
          {value === 'in_progress' && <Clock size={14} />}
          {getStatusLabel(value as Todo['status'])}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_value: unknown, todo: Todo) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            router.push(`/todos?expand=${todo.id}`)
          }}
        >
          <Eye size={14} className="mr-1" />
          查看
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 快速指派區 */}
      <div className="border border-border rounded-lg p-6 bg-morandi-container/10">
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">快速指派任務</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：基本資訊 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                選擇任務模板
              </label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇預設模板或自訂任務" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">自訂任務</SelectItem>
                  <SelectItem value="pre-tour">行前準備</SelectItem>
                  <SelectItem value="documents">文件準備</SelectItem>
                  <SelectItem value="booking">訂房訂車</SelectItem>
                  <SelectItem value="collection">收款作業</SelectItem>
                  <SelectItem value="cost-control">成本控制</SelectItem>
                  <SelectItem value="quality-check">品質檢查</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">
                任務標題
              </label>
              <Input
                value={taskForm.title}
                onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={`例：準備${tour.name}相關資料`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-2">指派給</label>
              <Select
                value={taskForm.assignee}
                onValueChange={value => setTaskForm(prev => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇負責人" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">期限</label>
                <DatePicker
                  value={taskForm.deadline}
                  onChange={(date) => setTaskForm(prev => ({ ...prev, deadline: date }))}
                  placeholder="選擇日期"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-2">
                  緊急度
                </label>
                <StarRating
                  value={taskForm.priority}
                  onChange={value =>
                    setTaskForm(prev => ({ ...prev, priority: value as 1 | 2 | 3 | 4 | 5 }))
                  }
                />
              </div>
            </div>
          </div>

          {/* 右側：子任務清單 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-morandi-primary">子任務清單</label>
              <Button size="sm" variant="outline" onClick={addSubTask}>
                <Plus size={14} className="mr-1" />
                新增
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {taskForm.sub_tasks.map((subTask, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={subTask}
                    onChange={e => handleSubTaskChange(index, e.target.value)}
                    placeholder={`子任務 ${index + 1}`}
                    className="text-sm"
                  />
                  {taskForm.sub_tasks.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSubTask(index)}
                      className="px-2"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleCreateTask}
            disabled={!taskForm.title.trim() || !taskForm.assignee}
            className="px-6"
          >
            建立並指派任務
          </Button>
        </div>
      </div>

      {/* 已指派任務列表 */}
      <div className="border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-morandi-primary">
            此團已指派的任務 ({tourTasks.length})
          </h3>
          <div className="text-sm text-morandi-secondary">
            出發日期：{new Date(tour.departure_date).toLocaleDateString()}
          </div>
        </div>

        {tourTasks.length > 0 ? (
          <EnhancedTable
            columns={taskColumns as unknown as Parameters<typeof EnhancedTable>[0]['columns']}
            data={tourTasks}
            initialPageSize={15}
            showFilters={false}
          />
        ) : (
          <div className="text-center py-8 text-morandi-muted">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>尚未指派任何任務</p>
            <p className="text-sm">使用上方表單開始指派任務給團隊成員</p>
          </div>
        )}
      </div>
    </div>
  )
}
