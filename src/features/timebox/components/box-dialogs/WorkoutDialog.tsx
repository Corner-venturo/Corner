'use client'

import { useState } from 'react'
import { Check, Dumbbell, Plus, X, Edit2, Trash2 } from 'lucide-react'
import { generateUUID } from '@/lib/utils/uuid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  useTimeboxScheduledBoxes,
  type TimeboxScheduledBox,
  type TimeboxBox,
  type WorkoutData,
  type WorkoutExercise,
  weekDayNames,
} from '../../hooks/useTimeboxData'
import { confirm } from '@/lib/ui/alert-dialog'

interface WorkoutDialogProps {
  scheduledBox: TimeboxScheduledBox
  box: TimeboxBox
  onClose: () => void
}

export default function WorkoutDialog({ scheduledBox, box, onClose }: WorkoutDialogProps) {
  const { update: updateScheduledBox, delete: deleteScheduledBox, items: scheduledBoxes } = useTimeboxScheduledBoxes()

  const [showAddExercise, setShowAddExercise] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [exerciseForm, setExerciseForm] = useState({
    equipment: '',
    weight: 0,
    reps: 0,
    sets: 3,
  })

  // 即時獲取最新的 scheduledBox 資料
  const currentScheduledBox = scheduledBoxes.find(sb => sb.id === scheduledBox.id) || scheduledBox
  const workoutData = (currentScheduledBox.data as unknown as WorkoutData) || { exercises: [] }

  const resetForm = () => {
    setExerciseForm({
      equipment: '',
      weight: 0,
      reps: 0,
      sets: 3,
    })
    setShowAddExercise(false)
    setEditingExerciseId(null)
  }

  const handleAddExercise = async () => {
    if (!exerciseForm.equipment.trim()) return

    setIsAdding(true)

    const newExercise: WorkoutExercise = {
      id: generateUUID(),
      equipment: exerciseForm.equipment,
      weight: exerciseForm.weight,
      reps: exerciseForm.reps,
      sets: exerciseForm.sets,
      setsCompleted: Array(exerciseForm.sets).fill(false),
      completedSetsTime: Array(exerciseForm.sets).fill(null),
    }

    const updatedData: WorkoutData = {
      exercises: [...(workoutData.exercises || []), newExercise],
    }

    await updateScheduledBox(scheduledBox.id, { data: updatedData as unknown as Record<string, unknown> })

    setTimeout(() => {
      resetForm()
      setIsAdding(false)
    }, 300)
  }

  const handleEditExercise = (exercise: WorkoutExercise) => {
    setExerciseForm({
      equipment: exercise.equipment,
      weight: exercise.weight,
      reps: exercise.reps,
      sets: exercise.sets,
    })
    setEditingExerciseId(exercise.id)
    setShowAddExercise(true)
  }

  const handleSaveEdit = async () => {
    if (!editingExerciseId) return

    setIsAdding(true)

    const updatedExercises = workoutData.exercises.map(ex =>
      ex.id === editingExerciseId
        ? { ...ex, ...exerciseForm }
        : ex
    )

    await updateScheduledBox(scheduledBox.id, {
      data: { exercises: updatedExercises },
    })

    setTimeout(() => {
      resetForm()
      setIsAdding(false)
    }, 300)
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    const confirmed = await confirm('確定要刪除此動作嗎？', {
      title: '刪除動作',
      type: 'warning',
    })
    if (!confirmed) return

    const updatedExercises = workoutData.exercises.filter(ex => ex.id !== exerciseId)
    await updateScheduledBox(scheduledBox.id, {
      data: { exercises: updatedExercises },
    })
  }

  const handleSetClick = async (exerciseId: string, setIndex: number) => {
    const updatedExercises = workoutData.exercises.map(ex => {
      if (ex.id !== exerciseId) return ex

      const newSetsCompleted = [...ex.setsCompleted]
      const newCompletedSetsTime = [...ex.completedSetsTime]

      newSetsCompleted[setIndex] = !newSetsCompleted[setIndex]
      newCompletedSetsTime[setIndex] = newSetsCompleted[setIndex]
        ? new Date().toISOString()
        : null

      return {
        ...ex,
        setsCompleted: newSetsCompleted,
        completedSetsTime: newCompletedSetsTime,
      }
    })

    await updateScheduledBox(scheduledBox.id, {
      data: { exercises: updatedExercises },
    })

    // 檢查是否全部完成
    setTimeout(async () => {
      const allCompleted = updatedExercises.every(ex =>
        ex.setsCompleted.every(completed => completed === true)
      )

      if (allCompleted && !currentScheduledBox.completed) {
        await updateScheduledBox(scheduledBox.id, { completed: true })
      }
    }, 100)
  }

  const handleDelete = async () => {
    const confirmed = await confirm(`確定要移除此訓練排程嗎？\n\n箱子：${box.name}`, {
      title: '移除訓練排程',
      type: 'warning',
    })
    if (!confirmed) return
    await deleteScheduledBox(scheduledBox.id)
    onClose()
  }

  const getTotalVolume = () => {
    if (!workoutData.exercises) return 0
    return workoutData.exercises.reduce((total, exercise) => {
      const completedSets = exercise.setsCompleted.filter(Boolean).length
      return total + (completedSets * exercise.weight * exercise.reps)
    }, 0)
  }

  const getTotalCompletedSets = () => {
    if (!workoutData.exercises) return 0
    return workoutData.exercises.reduce((total, exercise) => {
      return total + exercise.setsCompleted.filter(Boolean).length
    }, 0)
  }

  const getTotalSets = () => {
    if (!workoutData.exercises) return 0
    return workoutData.exercises.reduce((total, exercise) => {
      return total + exercise.sets
    }, 0)
  }

  const formatDateTime = (dayOfWeek: number, startTime: string) => {
    return `${weekDayNames[dayOfWeek]} ${startTime.substring(0, 5)}`
  }

  const totalCompletedSets = getTotalCompletedSets()
  const totalSets = getTotalSets()
  const isBoxCompleted = currentScheduledBox.completed

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5" />
            <span>{box.name}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {formatDateTime(scheduledBox.day_of_week, scheduledBox.start_time)}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 動作列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">訓練動作</h3>
              {!showAddExercise && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddExercise(true)}
                  className="text-morandi-gold border-morandi-gold/20 hover:bg-morandi-gold/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新增動作
                </Button>
              )}
            </div>

            {/* 新增/編輯表單 */}
            {showAddExercise && (
              <div className="bg-morandi-container/10 rounded-lg p-4 mb-4 border-2 border-morandi-gold/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-morandi-gold">
                    {editingExerciseId ? '編輯動作' : '新增動作'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="text-xs text-morandi-secondary">動作名稱 *</label>
                    <Input
                      value={exerciseForm.equipment}
                      onChange={(e) => setExerciseForm(prev => ({ ...prev, equipment: e.target.value }))}
                      placeholder="例: 槓鈴臥推"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-morandi-secondary">重量 (kg)</label>
                    <Input
                      type="number"
                      value={exerciseForm.weight || ''}
                      onChange={(e) => setExerciseForm(prev => ({
                        ...prev,
                        weight: e.target.value === '' ? 0 : Number(e.target.value)
                      }))}
                      className="mt-1"
                      min={0}
                      step={0.5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-morandi-secondary">次數</label>
                      <Input
                        type="number"
                        value={exerciseForm.reps || ''}
                        onChange={(e) => setExerciseForm(prev => ({
                          ...prev,
                          reps: e.target.value === '' ? 0 : Number(e.target.value)
                        }))}
                        className="mt-1"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-morandi-secondary">組數</label>
                      <Input
                        type="number"
                        value={exerciseForm.sets || ''}
                        onChange={(e) => setExerciseForm(prev => ({
                          ...prev,
                          sets: e.target.value === '' ? 1 : Number(e.target.value)
                        }))}
                        min={1}
                        max={10}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={editingExerciseId ? handleSaveEdit : handleAddExercise}
                  disabled={!exerciseForm.equipment.trim() || isAdding}
                  className={`w-full transition-all duration-300 ${
                    isAdding
                      ? 'bg-green-500 border-green-500 scale-105'
                      : 'bg-morandi-gold hover:bg-morandi-gold/90'
                  }`}
                  size="sm"
                >
                  {isAdding ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 animate-in zoom-in" />
                      已新增！
                    </span>
                  ) : (
                    editingExerciseId ? '儲存修改' : '新增'
                  )}
                </Button>
              </div>
            )}

            {/* 動作列表 */}
            {!workoutData.exercises || workoutData.exercises.length === 0 ? (
              <div className="text-center py-8 text-morandi-secondary">
                <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>尚未新增任何訓練動作</p>
                <p className="text-sm">點擊上方「新增動作」開始記錄</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutData.exercises.map((exercise, index) => {
                  const completedSets = exercise.setsCompleted.filter(Boolean).length
                  return (
                    <div
                      key={exercise.id}
                      className="bg-white rounded-lg border border-border p-4 hover:border-morandi-gold/20 transition-colors"
                    >
                      {/* 動作標題 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-morandi-secondary font-medium">
                              動作 {index + 1}
                            </span>
                            <h4 className="font-medium">{exercise.equipment}</h4>
                          </div>
                          <p className="text-sm text-morandi-secondary mt-1">
                            {exercise.weight}kg × {exercise.reps}次 × {exercise.sets}組
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-gold"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="h-8 w-8 p-0 text-morandi-secondary hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 組數進度 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-morandi-secondary">
                            完成進度: {completedSets}/{exercise.sets} 組
                          </span>
                          <span className="text-xs text-morandi-secondary">
                            訓練量: {(completedSets * exercise.weight * exercise.reps).toLocaleString()} kg
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {exercise.setsCompleted.map((completed, setIndex) => (
                            <button
                              key={setIndex}
                              onClick={() => handleSetClick(exercise.id, setIndex)}
                              className={`
                                relative w-12 h-12 rounded-lg border-2 transition-all duration-200
                                flex flex-col items-center justify-center
                                active:scale-95
                                ${completed
                                  ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105'
                                  : 'border-gray-200 hover:border-morandi-gold hover:bg-morandi-gold/5 bg-white hover:scale-105'
                                }
                              `}
                              title={exercise.completedSetsTime[setIndex]
                                ? `完成於 ${new Date(exercise.completedSetsTime[setIndex]!).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
                                : `點擊完成第 ${setIndex + 1} 組`
                              }
                            >
                              {completed ? (
                                <Check className="h-5 w-5 animate-in zoom-in duration-200" />
                              ) : (
                                <span className="text-sm font-semibold text-morandi-secondary">
                                  {setIndex + 1}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 統計 */}
          {workoutData.exercises && workoutData.exercises.length > 0 && (
            <div className="bg-morandi-container/10 rounded-lg p-4">
              <h3 className="font-medium mb-3">本次統計</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-morandi-secondary">總動作數:</span>
                  <p className="font-medium text-lg">{workoutData.exercises.length}</p>
                </div>
                <div>
                  <span className="text-morandi-secondary">完成組數:</span>
                  <p className="font-medium text-lg">{totalCompletedSets}/{totalSets}</p>
                </div>
                <div>
                  <span className="text-morandi-secondary">總訓練量:</span>
                  <p className="font-medium text-lg">{getTotalVolume().toLocaleString()} kg</p>
                </div>
              </div>
            </div>
          )}

          {/* 按鈕與完成狀態 */}
          <div className="pt-4 border-t space-y-3">
            {/* 完成狀態提示 */}
            {isBoxCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  此訓練已完成 ✓
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-500 border-red-300 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1" />
                移除排程
              </Button>
              <Button variant="outline" onClick={onClose}>
                關閉
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
