'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export function TimerWidget() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: unknown;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full border border-morandi-gold/20 shadow-sm rounded-2xl hover:shadow-md hover:border-morandi-gold/20 transition-all duration-200">
      <div className="bg-morandi-container px-4 py-3 border-b border-morandi-gold/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-morandi-gold" />
          <h3 className="font-semibold text-sm text-morandi-primary">計時器</h3>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center min-h-0">
        <div className="bg-white rounded-2xl p-8 border border-morandi-gold/20 shadow-sm mb-6">
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-morandi-primary tracking-wider">
              {formatTime(seconds)}
            </div>
            <div className="text-xs text-morandi-muted mt-3 font-medium">
              {isRunning ? '計時中...' : '已暫停'}
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            size="lg"
            className={`flex-1 rounded-xl transition-all duration-200 ${
              isRunning
                ? 'bg-white border border-morandi-gold/20 text-morandi-primary hover:border-morandi-gold'
                : 'bg-gradient-to-r from-[#B5986A] to-[#D4C4A8] text-white border-0 shadow-lg active:scale-95'
            }`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '暫停' : '開始'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setSeconds(0);
              setIsRunning(false);
            }}
            className="bg-white border-morandi-gold/20 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all rounded-xl"
          >
            重設
          </Button>
        </div>
      </div>
    </Card>
  );
}
