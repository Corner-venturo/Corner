'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIMER_INTERVAL, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '@/lib/constants'

export function TimerWidget() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, TIMER_INTERVAL)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / SECONDS_PER_HOUR)
    const mins = Math.floor((s % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
    const secs = s % SECONDS_PER_MINUTE
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full">
      <div className="h-full rounded-2xl border border-white/70 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-white/80 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header with Icon */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-slate-200/60 to-blue-100/60',
                'ring-2 ring-white/50 ring-offset-1 ring-offset-white/20'
              )}
            >
              <Clock className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                計時器
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                精準計時，掌握每分每秒
              </p>
            </div>
          </div>

          {/* Timer Display */}
          <div className="rounded-xl bg-white/70 p-8 shadow-md border border-white/40 flex-1 flex items-center justify-center">
            <div className="text-center w-full">
              <div className="text-5xl font-mono font-bold text-morandi-primary tracking-wider drop-shadow-sm">
                {formatTime(seconds)}
              </div>
              <div className="text-xs text-morandi-secondary/90 mt-3 font-semibold flex items-center justify-center gap-2">
                {isRunning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></span>
                    <span>計時中...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-morandi-muted"></span>
                    <span>已暫停</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            <Button
              size="sm"
              className={cn(
                'flex-1 rounded-xl transition-all duration-200 font-semibold',
                isRunning
                  ? 'bg-white/90 border-2 border-white/60 text-morandi-primary hover:bg-white hover:shadow-md'
                  : 'bg-morandi-gold text-white hover:bg-morandi-gold-hover shadow-md hover:shadow-lg'
              )}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '暫停' : '開始'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSeconds(0)
                setIsRunning(false)
              }}
              className="bg-white/90 border-2 border-white/60 hover:bg-red-50 hover:text-red-600 hover:border-red-400 hover:shadow-md transition-all rounded-xl font-semibold"
            >
              重設
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
