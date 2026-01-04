'use client'

import { useState } from 'react'
import {
  Plus,
  X,
  CheckCircle,
  Circle,
  ClipboardList,
  BarChart3,
  Save,
} from 'lucide-react'
import { EXERCISES, MUSCLE_GROUPS } from '@/data/fitness/exercises'
import { ExerciseIcon, MuscleGroupIcon } from './components/ExerciseIcons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDateCompactPadded } from '@/lib/utils/format-date'

interface WorkoutSet {
  setNumber: number
  weight: number
  reps: number
  completed: boolean
}

interface WorkoutExercise {
  exerciseId: number
  exerciseName: string
  sets: WorkoutSet[]
}

import { FitnessLayout } from './components/FitnessLayout'

export default function FitnessPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])

  // 新增動作到訓練清單
  const addExercise = (exerciseId: number, exerciseName: string) => {
    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId,
        exerciseName,
        sets: [
          { setNumber: 1, weight: 0, reps: 0, completed: false },
          { setNumber: 2, weight: 0, reps: 0, completed: false },
          { setNumber: 3, weight: 0, reps: 0, completed: false },
        ],
      },
    ])
    setShowExercisePicker(false)
    setSelectedCategory(null)
  }

  // 移除動作
  const removeExercise = (index: number) => {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index))
  }

  // 更新組數資料
  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps' | 'completed',
    value: number | boolean
  ) => {
    const updated = [...workoutExercises]
    updated[exerciseIndex].sets[setIndex] = {
      ...updated[exerciseIndex].sets[setIndex],
      [field]: value,
    }
    setWorkoutExercises(updated)
  }

  // 新增一組
  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises]
    const currentSets = updated[exerciseIndex].sets
    updated[exerciseIndex].sets = [
      ...currentSets,
      {
        setNumber: currentSets.length + 1,
        weight: currentSets[currentSets.length - 1]?.weight || 0,
        reps: currentSets[currentSets.length - 1]?.reps || 0,
        completed: false,
      },
    ]
    setWorkoutExercises(updated)
  }

  // 計算總訓練容量
  const calculateTotalVolume = () => {
    return workoutExercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return set.completed ? sum + set.weight * set.reps : sum
      }, 0)
      return total + exerciseVolume
    }, 0)
  }

  // 篩選動作
  const filteredExercises = selectedCategory
    ? EXERCISES.filter((ex) => ex.category === selectedCategory)
    : EXERCISES

  return (
    <FitnessLayout activeTab="workout">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Corner Fitness</h1>
          <div className="text-sm text-muted-foreground">
            {formatDateCompactPadded(new Date())}
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* 訓練部位選擇 */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            選擇訓練部位
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {MUSCLE_GROUPS.map(group => (
              <Button
                key={group.id}
                variant="outline"
                onClick={() => {
                  setSelectedCategory(group.id)
                  setShowExercisePicker(true)
                }}
                className={cn(
                  'flex flex-col items-center justify-center p-4 h-auto hover:border-primary transition-colors',
                  selectedCategory === group.id && 'border-primary bg-primary/10'
                )}
              >
                <MuscleGroupIcon groupId={group.id} className="w-6 h-6 mb-1" />
                <span className="text-xs text-muted-foreground">{group.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 今日訓練 */}
        {workoutExercises.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              ━━━ 今日訓練 ━━━
            </h2>

            <div className="space-y-4">
              {workoutExercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex} className="p-4 shadow-sm">
                  {/* 動作標題 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ExerciseIcon
                        iconName={
                          EXERCISES.find(ex => ex.id === exercise.exerciseId)?.icon ||
                          'dumbbell'
                        }
                        className="w-5 h-5"
                      />
                      <h3 className="font-medium text-foreground">{exercise.exerciseName}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => removeExercise(exerciseIndex)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* 組數表格 */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium">
                      <div className="text-center">組數</div>
                      <div className="text-center">重量</div>
                      <div className="text-center">次數</div>
                      <div className="text-center">完成</div>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                        <div className="flex items-center justify-center text-sm text-foreground font-medium">
                          {set.setNumber}
                        </div>
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={e =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'weight',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={e =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'reps',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="次"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateSet(exerciseIndex, setIndex, 'completed', !set.completed)
                          }
                          className="flex items-center justify-center"
                        >
                          {set.completed ? (
                            <CheckCircle className="w-5 h-5 text-morandi-green" />
                          ) : (
                            <Circle className="w-5 h-5 text-border" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* 新增組數按鈕 */}
                  <Button
                    variant="outline"
                    onClick={() => addSet(exerciseIndex)}
                    className="w-full mt-3 py-2 text-sm"
                  >
                    + 新增組數
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 新增動作按鈕 */}
        <Button
          variant="outline"
          onClick={() => setShowExercisePicker(true)}
          className="w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增動作
        </Button>

        {/* 訓練統計 */}
        {workoutExercises.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              訓練統計
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">總容量</span>
                <span className="font-bold text-foreground">
                  {calculateTotalVolume().toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">完成組數</span>
                <span className="font-medium text-foreground">
                  {workoutExercises.reduce(
                    (total, ex) => total + ex.sets.filter(s => s.completed).length,
                    0
                  )}{' '}
                  組
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 完成訓練按鈕 */}
        {workoutExercises.length > 0 && (
          <Button
            variant="default"
            size="lg"
            className="w-full shadow-md active:scale-95 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            完成訓練
          </Button>
        )}
      </div>

      {/* 動作選擇對話框 */}
      <Dialog open={showExercisePicker} onOpenChange={(open) => {
        setShowExercisePicker(open)
        if (!open) setSelectedCategory(null)
      }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden p-0 rounded-t-3xl sm:rounded-xl">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
            <DialogHeader className="flex-row items-center justify-between">
              <DialogTitle className="text-lg font-bold text-foreground">選擇訓練動作</DialogTitle>
            </DialogHeader>

            {/* 部位篩選 */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              <Button
                onClick={() => setSelectedCategory(null)}
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs whitespace-nowrap"
              >
                全部
              </Button>
              {MUSCLE_GROUPS.map(group => (
                <Button
                  key={group.id}
                  onClick={() => setSelectedCategory(group.id)}
                  variant={selectedCategory === group.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <MuscleGroupIcon groupId={group.id} className="w-3.5 h-3.5" />
                  {group.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
            {filteredExercises.map(exercise => (
              <Button
                key={exercise.id}
                variant="outline"
                onClick={() => addExercise(exercise.id, exercise.name)}
                className="w-full justify-start h-auto p-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExerciseIcon iconName={exercise.icon} className="w-6 h-6" />
                  <span className="text-sm font-medium text-foreground">
                    {exercise.name}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </FitnessLayout>
  )
}
