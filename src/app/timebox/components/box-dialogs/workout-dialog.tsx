'use client'

import { useState, useEffect } from 'react'

import { Check, Clock, Dumbbell, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTimeboxStore, WorkoutData, ScheduledBox } from '@/stores/timebox-store'

interface WorkoutDialogProps {
  scheduledBox: ScheduledBox
  onClose: () => void
}

export default function WorkoutDialog({ scheduledBox, onClose }: WorkoutDialogProps) {
  const { boxes, toggleSetCompletion, toggleBoxCompletion, removeScheduledBox, updateBox } = useTimeboxStore()
  const [isEditing, setIsEditing] = useState(false)
  const [boxData, setBoxData] = useState({
    name: '',
    equipment: '',
    weight: 0,
    reps: 0,
    sets: 3,
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
        sets: box.sets || 3,
      })
    }
  }, [box])

  // 儲存修改
  const handleSave = () => {
    if (box) {
      updateBox(box.id, {
        equipment: boxData.equipment,
        weight: boxData.weight,
        reps: boxData.reps,
        sets: boxData.sets,
      })
    }
    setIsEditing(false)
  }

  // 獲取組別完成狀態
  const getWorkoutProgress = () => {
    const workoutData = scheduledBox.data as WorkoutData
    if (!workoutData || !workoutData.setsCompleted) {
      // 初始化狀態
      return Array(boxData.sets)
        .fill(false)
        .map((_, index) => ({
          completed: false,
          completedAt: null,
          setNumber: index + 1,
        }))
    }

    return workoutData.setsCompleted.map((completed, index) => ({
      completed,
      completedAt: workoutData.completedSetsTime?.[index] || null,
      setNumber: index + 1,
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
    const confirmMessage = `確定要移除此訓練排程嗎？\n\n箱子：${box?.name}\n動作：${boxData.equipment}\n重量：${boxData.weight}kg x ${boxData.reps}次 x ${boxData.sets}組`

    if (!confirm(confirmMessage)) {
      return
    }

    removeScheduledBox(scheduledBox.id)
    onClose()
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
          {/* 運動資訊 - 一列顯示可編輯 */}
          <div className="bg-morandi-container/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">訓練參數</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="text-morandi-gold"
              >
                {isEditing ? '儲存' : '編輯'}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-morandi-secondary">器材</label>
                {isEditing ? (
                  <Input
                    value={boxData.equipment}
                    onChange={(e) => setBoxData(prev => ({ ...prev, equipment: e.target.value }))}
                    placeholder="例: 槓鈴"
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{boxData.equipment || '未設定'}</p>
                )}
              </div>

              <div className="w-24">
                <label className="text-xs text-morandi-secondary">重量 (kg)</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={boxData.weight}
                    onChange={(e) => setBoxData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{boxData.weight} kg</p>
                )}
              </div>

              <div className="w-20">
                <label className="text-xs text-morandi-secondary">次數</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={boxData.reps}
                    onChange={(e) => setBoxData(prev => ({ ...prev, reps: Number(e.target.value) }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{boxData.reps}</p>
                )}
              </div>

              <div className="w-20">
                <label className="text-xs text-morandi-secondary">組數</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={boxData.sets}
                    onChange={(e) => setBoxData(prev => ({ ...prev, sets: Number(e.target.value) }))}
                    min={1}
                    max={10}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{boxData.sets}</p>
                )}
              </div>
            </div>
          </div>

          {/* 進度追蹤 - 橫向框框 */}
          <div>
            <h3 className="font-medium mb-3 flex items-center justify-between">
              <span>完成進度</span>
              <span className="text-sm text-morandi-secondary">
                {completedSets}/{boxData.sets} 組
              </span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {workoutProgress.map((setProgress, index) => (
                <button
                  key={index}
                  onClick={() => handleSetComplete(index)}
                  className={`
                    relative w-14 h-14 rounded-lg border-2 transition-all
                    flex flex-col items-center justify-center
                    ${setProgress.completed
                      ? 'bg-morandi-green border-morandi-green text-white shadow-md'
                      : 'border-morandi-container hover:border-morandi-gold bg-white'
                    }
                  `}
                  title={setProgress.completedAt
                    ? `完成於 ${new Date(setProgress.completedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
                    : `點擊完成第 ${setProgress.setNumber} 組`
                  }
                >
                  {setProgress.completed ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-semibold text-morandi-secondary">
                      {setProgress.setNumber}
                    </span>
                  )}

                  {setProgress.completed && setProgress.completedAt && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-morandi-secondary whitespace-nowrap">
                      {new Date(setProgress.completedAt).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 完成時間提示的額外空間 */}
            <div className="h-5"></div>
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
                <Button
                  onClick={handleComplete}
                  className="bg-morandi-gold hover:bg-morandi-gold/90"
                >
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
