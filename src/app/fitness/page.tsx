'use client'

import { useState } from 'react'
import {
  Plus,
  X,
  Clock,
  CheckCircle,
  Circle,
  ClipboardList,
  BarChart3,
  Save,
} from 'lucide-react'
import { EXERCISES, MUSCLE_GROUPS } from '@/data/fitness/exercises'
import { ExerciseIcon, MuscleGroupIcon } from './components/ExerciseIcons'

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
  const [restTimer, setRestTimer] = useState(90) // 90秒休息時間

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
      <div className="sticky top-0 z-10 bg-[#FEFEFE] border-b border-[#EDE8E0] px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#3D2914]">Corner Fitness</h1>
          <div className="text-sm text-[#6B5D52]">
            {new Date().toLocaleDateString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* 訓練部位選擇 */}
        <div>
          <h2 className="text-sm font-medium text-[#6B5D52] mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            選擇訓練部位
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedCategory(group.id)
                  setShowExercisePicker(true)
                }}
                className="flex flex-col items-center justify-center p-4 bg-[#FEFEFE] border border-[#EDE8E0] rounded-xl hover:border-[#C9A961] transition-colors"
                style={{
                  backgroundColor:
                    selectedCategory === group.id ? `${group.color}20` : '#FEFEFE',
                }}
              >
                <MuscleGroupIcon groupId={group.id} className="w-6 h-6 mb-1" />
                <span className="text-xs text-[#6B5D52]">{group.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 今日訓練 */}
        {workoutExercises.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[#6B5D52] mb-3">
              ━━━ 今日訓練 ━━━
            </h2>

            <div className="space-y-4">
              {workoutExercises.map((exercise, exerciseIndex) => (
                <div
                  key={exerciseIndex}
                  className="bg-[#FEFEFE] border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_8px_rgba(61,41,20,0.08)]"
                >
                  {/* 動作標題 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ExerciseIcon
                        iconName={
                          EXERCISES.find((ex) => ex.id === exercise.exerciseId)
                            ?.icon || 'dumbbell'
                        }
                        className="w-5 h-5"
                      />
                      <h3 className="font-medium text-[#3D2914]">
                        {exercise.exerciseName}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeExercise(exerciseIndex)}
                      className="text-[#9E8F81] hover:text-[#C9A961]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 組數表格 */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs text-[#9E8F81] font-medium">
                      <div className="text-center">組數</div>
                      <div className="text-center">重量</div>
                      <div className="text-center">次數</div>
                      <div className="text-center">完成</div>
                    </div>

                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-2">
                        <div className="flex items-center justify-center text-sm text-[#6B5D52] font-medium">
                          {set.setNumber}
                        </div>
                        <input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'weight',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-lg px-2 py-1.5 text-sm text-center text-[#3D2914] focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'reps',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-lg px-2 py-1.5 text-sm text-center text-[#3D2914] focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/20"
                          placeholder="次"
                        />
                        <button
                          onClick={() =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'completed',
                              !set.completed
                            )
                          }
                          className="flex items-center justify-center"
                        >
                          {set.completed ? (
                            <CheckCircle className="w-5 h-5 text-[#A8B4A5]" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#E0D8CC]" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 新增組數按鈕 */}
                  <button
                    onClick={() => addSet(exerciseIndex)}
                    className="w-full mt-3 py-2 text-sm text-[#6B5D52] hover:text-[#C9A961] border border-[#E0D8CC] rounded-lg hover:bg-[#FAF8F5] transition-colors"
                  >
                    + 新增組數
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 新增動作按鈕 */}
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full py-3 text-sm text-[#6B5D52] border border-[#E0D8CC] rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增動作
        </button>

        {/* 訓練統計 */}
        {workoutExercises.length > 0 && (
          <div className="bg-[#FEFEFE] border border-[#EDE8E0] rounded-2xl p-4">
            <h3 className="text-sm font-medium text-[#6B5D52] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              訓練統計
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">總容量</span>
                <span className="font-bold text-[#3D2914]">
                  {calculateTotalVolume().toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9E8F81]">完成組數</span>
                <span className="font-medium text-[#3D2914]">
                  {workoutExercises.reduce(
                    (total, ex) =>
                      total + ex.sets.filter((s) => s.completed).length,
                    0
                  )}{' '}
                  組
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 完成訓練按鈕 */}
        {workoutExercises.length > 0 && (
          <button className="w-full bg-[#C9A961] text-white px-6 py-4 rounded-xl shadow-md hover:bg-[#B89850] active:scale-95 transition-all font-medium flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            完成訓練
          </button>
        )}
      </div>

      {/* 動作選擇對話框 */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-[#FAF8F5] rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FEFEFE] border-b border-[#EDE8E0] px-4 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#3D2914]">
                  選擇訓練動作
                </h2>
                <button
                  onClick={() => {
                    setShowExercisePicker(false)
                    setSelectedCategory(null)
                  }}
                  className="text-[#9E8F81]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 部位篩選 */}
              <div className="mt-3 flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                    selectedCategory === null
                      ? 'bg-[#C9A961] text-white'
                      : 'bg-[#FEFEFE] text-[#6B5D52] border border-[#E0D8CC]'
                  }`}
                >
                  全部
                </button>
                {MUSCLE_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedCategory(group.id)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                      selectedCategory === group.id
                        ? 'bg-[#C9A961] text-white'
                        : 'bg-[#FEFEFE] text-[#6B5D52] border border-[#E0D8CC]'
                    }`}
                  >
                    {group.emoji} {group.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise.id, exercise.name)}
                  className="w-full bg-[#FEFEFE] border border-[#EDE8E0] rounded-xl p-4 text-left hover:border-[#C9A961] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{exercise.emoji}</span>
                    <span className="text-sm font-medium text-[#3D2914]">
                      {exercise.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </FitnessLayout>
  )
}
