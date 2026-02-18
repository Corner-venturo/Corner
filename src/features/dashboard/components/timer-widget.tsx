'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIMER_INTERVAL, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '@/lib/constants'
import { DASHBOARD_LABELS } from './constants/labels'

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
      <div className="h-full rounded-2xl border border-border/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:border-border/80 bg-gradient-to-br from-muted via-card to-status-info-bg">
        <div className="p-5 space-y-4 h-full flex flex-col">
          {/* Header with Icon */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-full p-2.5 text-white shadow-lg shadow-black/10',
                'bg-gradient-to-br from-morandi-container/60 to-status-info-bg',
                'ring-2 ring-border/50 ring-offset-1 ring-offset-background/20'
              )}
            >
              <Clock className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-morandi-primary leading-tight tracking-wide">
                {DASHBOARD_LABELS.CALCULATING_3504}
              </p>
              <p className="text-xs text-morandi-secondary/90 mt-1.5 leading-relaxed">
                {DASHBOARD_LABELS.CALCULATING_3838}
              </p>
            </div>
          </div>

          {/* Timer Display */}
          <div className="rounded-xl bg-card/70 p-8 shadow-md border border-border/40 flex-1 flex items-center justify-center">
            <div className="text-center w-full">
              <div className="text-5xl font-mono font-bold text-morandi-primary tracking-wider drop-shadow-sm">
                {formatTime(seconds)}
              </div>
              <div className="text-xs text-morandi-secondary/90 mt-3 font-semibold flex items-center justify-center gap-2">
                {isRunning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shadow-sm"></span>
                    <span>{DASHBOARD_LABELS.CALCULATING_7093}</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-morandi-muted"></span>
                    <span>{DASHBOARD_LABELS.LABEL_5402}</span>
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
                  ? 'bg-card/90 border-2 border-border/60 text-morandi-primary hover:bg-card hover:shadow-md'
                  : 'bg-morandi-gold text-white hover:bg-morandi-gold-hover shadow-md hover:shadow-lg'
              )}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? DASHBOARD_LABELS.stop : DASHBOARD_LABELS.start}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSeconds(0)
                setIsRunning(false)
              }}
              className="bg-card/90 border-2 border-border/60 hover:bg-status-danger-bg hover:text-status-danger hover:border-status-danger hover:shadow-md transition-all rounded-xl font-semibold"
            >
              {DASHBOARD_LABELS.RESET}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
