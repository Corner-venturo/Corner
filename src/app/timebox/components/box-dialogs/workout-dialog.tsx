'use client'

import { useState, useEffect } from 'react'
import { useTimeboxStore, WorkoutData, ScheduledBox } from '@/stores/timebox-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, Clock, Dumbbell, Trash2 } from 'lucide-react'

interface WorkoutDialogProps {
  scheduledBox: ScheduledBox
  onClose: () => void
}

export default function WorkoutDialog({ scheduledBox, onClose }: WorkoutDialogProps) {
  const { boxes, toggleSetCompletion, toggleBoxCompletion, removeScheduledBox } = useTimeboxStore()
  const [editingBox, setEditingBox] = useState(false)
  const [boxData, setBoxData] = useState({
    name: '',
    equipment: '',
    weight: 0,
    reps: 0,
    sets: 3
  })

  const box = boxes.find(b => b.id === scheduledBox.boxId)

  // 載入現有資料
  useEffect(() => {
    if (box) {
      setBoxData({
        name: box.name,
        equipment: box.equipment || '',
        weight: box.weight || 0,
        reps: box.reps || 0,
        sets: box.sets || 3
      })
    }
  }, [box])

  // 獲取組別完成狀態
  const getWorkoutProgress = () => {
    const workoutData = scheduledBox.data as WorkoutData
    if (!workoutData || !workoutData.setsCompleted) {
      // 初始化狀態
      return Array(boxData.sets).fill(false).map((_, index) => ({
        completed: false,
        completedAt: null,
        setNumber: index + 1
      }))
    }

    return workoutData.setsCompleted.map((completed, index) => ({
      completed,
      completedAt: workoutData.completedSetsTime?.[index] || null,
      setNumber: index + 1
    }))
  }

  // 點擊組別完成
  const handleSetComplete = (setIndex: number) => {
    toggleSetCompletion(scheduledBox.id, setIndex)
  }

  // 標記整個訓練完成
  const handleComplete = () => {
    if (!scheduledBox.completed) {
      toggleBoxCompletion(scheduledBox.id)
    }
    onClose()
  }

  // 刪除排程
  const handleDelete = () => {
    const confirmMessage = `確定要移除此訓練排程嗎？\n\n箱子：${box?.name}\n動作：${boxData.equipment}\n重量：${boxData.weight}kg x ${boxData.reps}次 x ${boxData.sets}組`;

    if (!confirm(confirmMessage)) {
      return;
    }

    removeScheduledBox(scheduledBox.id);
    onClose();
  }

  // 計算總訓練量
  const getTotalVolume = () => {
    const completedSets = getWorkoutProgress().filter(set => set.completed).length
    return completedSets * (boxData.weight * boxData.reps)
  }

  if (!box) return null

  const formatDateTime = (dayOfWeek: number, startTime: string) => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${days[dayOfWeek]} ${startTime}`
  }

  const workoutProgress = getWorkoutProgress()
  const completedSets = workoutProgress.filter(set => set.completed).length

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5" />
            <span>{box.name}</span>
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {formatDateTime(scheduledBox.dayOfWeek, scheduledBox.startTime)}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 運動資訊 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-morandi-secondary">器材:</span>
                <p className="font-medium">{boxData.equipment || '未設定'}</p>
              </div>
              <div>
                <span className="text-morandi-secondary">重量:</span>
                <p className="font-medium">{boxData.weight} kg</p>
              </div>
              <div>
                <span className="text-morandi-secondary">次數:</span>
                <p className="font-medium">{boxData.reps} 次</p>
              </div>
              <div>
                <span className="text-morandi-secondary">組數:</span>
                <p className="font-medium">{boxData.sets} 組</p>
              </div>
            </div>
          </div>

          {/* 進度追蹤 */}
          <div>
            <h3 className="font-medium mb-3 flex items-center justify-between">
              <span>進度追蹤</span>
              <span className="text-sm text-morandi-secondary">
                {completedSets}/{boxData.sets} 組完成
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {workoutProgress.map((setProgress, index) => (
                <Button
                  key={index}
                  variant={setProgress.completed ? "default" : "outline"}
                  className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                    setProgress.completed ? 'bg-morandi-green text-white' : ''
                  }`}
                  onClick={() => handleSetComplete(index)}
                >
                  <div className="flex items-center space-x-1">
                    {setProgress.completed && <Check className="h-4 w-4" />}
                    <span className="font-medium">第 {setProgress.setNumber} 組</span>
                  </div>

                  {setProgress.completed && setProgress.completedAt && (
                    <div className="flex items-center text-xs opacity-80">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(setProgress.completedAt).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 統計 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <h3 className="font-medium mb-2">本次統計</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-morandi-secondary">已完成重量:</span>
                <p className="font-medium">{getTotalVolume().toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-morandi-secondary">完成率:</span>
                <p className="font-medium">{Math.round((completedSets / boxData.sets) * 100)}%</p>
              </div>
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-morandi-red border-morandi-red hover:bg-morandi-red/10"
            >
              <Trash2 size={16} className="mr-1" />
              移除排程
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                關閉
              </Button>
              {completedSets === boxData.sets && !scheduledBox.completed && (
                <Button onClick={handleComplete} className="bg-morandi-gold hover:bg-morandi-gold/90">
                  標記完成
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}