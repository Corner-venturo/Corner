'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface BreathingExerciseProps {
  onComplete: () => void
  onSkip: () => void
}

export function BreathingExercise({ onComplete, onSkip }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [count, setCount] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const totalCycles = 3

  useEffect(() => {
    if (cycleCount >= totalCycles) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }

    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + 1

        // 吸氣 4 秒
        if (phase === 'inhale' && next >= 4) {
          setPhase('hold')
          return 0
        }
        // 屏息 4 秒
        if (phase === 'hold' && next >= 4) {
          setPhase('exhale')
          return 0
        }
        // 呼氣 4 秒
        if (phase === 'exhale' && next >= 4) {
          setCycleCount(c => c + 1)
          setPhase('inhale')
          return 0
        }

        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, count, cycleCount, onComplete])

  const phaseText = {
    inhale: '深深吸氣',
    hold: '暫停呼吸',
    exhale: '緩緩呼氣',
  }

  const circleScale = {
    inhale: 1.5,
    hold: 1.5,
    exhale: 0.8,
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onSkip()}>
      <DialogContent level={1} className="max-w-none w-screen h-screen bg-black/80 border-none flex items-center justify-center p-0">
        <div className="text-center">
          <motion.div
            className="w-64 h-64 mx-auto mb-8 rounded-full bg-gradient-to-br from-morandi-gold/30 to-morandi-gold/10 border-2 border-morandi-gold/20"
            animate={{
              scale: circleScale[phase],
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
            }}
          />

          {cycleCount < totalCycles ? (
            <>
              <motion.h2
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-light text-white mb-4"
              >
                {phaseText[phase]}
              </motion.h2>

              <p className="text-white/60 text-lg">
                {cycleCount + 1} / {totalCycles}
              </p>

              <p className="text-white/40 text-sm mt-8">讓我們先深呼吸，準備好進入顯化的旅程</p>
            </>
          ) : (
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl font-light text-white mb-4"
            >
              完成
            </motion.h2>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
