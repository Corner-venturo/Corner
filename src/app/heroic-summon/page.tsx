'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ChevronRight, RotateCcw, BookOpen, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PHASES, QUESTIONS, getQuestionById, calculateProgress } from '@/data/heroic-summon-questions';
import type { Question } from '@/data/heroic-summon-questions';

export default function HeroicSummonPage() {
  const { user } = useAuthStore();
  const [started, setStarted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const currentPhaseData = PHASES.find(p => p.phase === currentPhase);
  const phaseQuestions = QUESTIONS.filter(q => q.phase === currentPhase);
  const currentQuestion = phaseQuestions[currentQuestionIndex];
  const totalAnswered = Object.keys(answers).length;
  const progress = calculateProgress(totalAnswered);

  const handleAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return;

    // 儲存答案
    setAnswers({
      ...answers,
      [currentQuestion.id]: selectedAnswer
    });

    // 移到下一題
    if (currentQuestionIndex < phaseQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // 階段完成
      if (currentPhase < 6) {
        // 進入下一階段
        setCurrentPhase(currentPhase + 1);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
      } else {
        // 測驗完成
        setShowResult(true);
      }
    }
  };

  const handleReset = () => {
    if (confirm('確定要重新開始測驗嗎？所有進度將會清除。')) {
      setStarted(false);
      setCurrentPhase(1);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  // 開始測驗畫面
  if (!started) {
    return (
      <>
        <ResponsiveHeader
          title="英靈招喚"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '英靈招喚', href: '/heroic-summon' },
          ]}
        />

        <div className="space-y-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-morandi-gold to-morandi-gold-hover rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">靈魂英靈測驗</h1>
            <p className="text-morandi-secondary mb-8 max-w-2xl mx-auto">
              透過 120 題精心設計的問題，探索你內在的靈魂原型。
              測驗分為 6 個階段，每個階段深入挖掘你不同面向的特質。
            </p>

            {/* 階段介紹 */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {PHASES.map((phase) => (
                <div
                  key={phase.phase}
                  className="p-4 border border-border rounded-lg text-left hover:border-morandi-gold/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-morandi-gold/10 flex items-center justify-center text-morandi-gold font-bold">
                      {phase.phase}
                    </div>
                    <h3 className="font-semibold">{phase.title}</h3>
                  </div>
                  <p className="text-sm text-morandi-secondary">
                    {phase.description}
                  </p>
                  <p className="text-xs text-morandi-muted mt-2">
                    Q{phase.questionRange[0]}-Q{phase.questionRange[1]} (20題)
                  </p>
                </div>
              ))}
            </div>

            {/* 測驗說明 */}
            <div className="bg-morandi-container/30 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-morandi-gold" />
                <h3 className="font-semibold">測驗說明</h3>
              </div>
              <ul className="space-y-2 text-sm text-morandi-secondary">
                <li>• 共 120 題，分為 6 個階段</li>
                <li>• 每題有 A、B、C、D 四個選項</li>
                <li>• 請依照直覺選擇最符合的答案</li>
                <li>• 沒有對錯，只有最真實的你</li>
                <li>• 完成後可查看你的英靈類型與能量側寫</li>
              </ul>
            </div>

            <Button
              size="lg"
              onClick={() => setStarted(true)}
              className="bg-gradient-to-r from-morandi-gold to-morandi-gold-hover text-white px-8"
            >
              開始測驗
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
        </div>
      </>
    );
  }

  // 結果畫面
  if (showResult) {
    return (
      <>
        <ResponsiveHeader
          title="測驗結果"
          breadcrumb={[
            { label: '首頁', href: '/' },
            { label: '英靈招喚', href: '/heroic-summon' },
            { label: '結果', href: '/heroic-summon' },
          ]}
        />

        <div className="space-y-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-morandi-gold to-morandi-gold-hover rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">測驗完成！</h1>
            <p className="text-morandi-secondary mb-8">
              你已經完成全部 120 題測驗。正在分析你的靈魂原型...
            </p>

            {/* 這裡之後會加入結果分析 */}
            <div className="bg-morandi-container/30 rounded-lg p-6 mb-8">
              <p className="text-sm text-morandi-secondary">
                測驗結果分析功能開發中...
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 w-4 h-4" />
                重新測驗
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                返回首頁
              </Button>
            </div>
          </Card>
        </div>
        </div>
      </>
    );
  }

  // 測驗進行中畫面
  return (
    <>
      <ResponsiveHeader
        title="英靈招喚測驗"
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '英靈招喚', href: '/heroic-summon' },
        ]}
        actions={
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="mr-2 w-4 h-4" />
            重新開始
          </Button>
        }
      />

      <div className="space-y-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 進度條 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{currentPhaseData?.title}</h3>
              <p className="text-sm text-morandi-secondary">
                第 {currentPhase} 階段 / 共 6 階段
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-morandi-gold">{progress}%</p>
              <p className="text-xs text-morandi-secondary">
                {totalAnswered} / 120 題
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* 題目卡片 */}
        {currentQuestion && (
          <Card className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-morandi-gold">
                  Q{currentQuestion.id}
                </span>
                <span className="text-xs text-morandi-muted">
                  / 階段 {currentPhase} 的第 {currentQuestionIndex + 1} 題
                </span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                {currentQuestion.question}
              </h2>
              {currentQuestion.symbolism && (
                <p className="text-sm text-morandi-secondary">
                  象徵：{currentQuestion.symbolism}
                </p>
              )}
            </div>

            {/* 選項 */}
            <div className="space-y-3 mb-8">
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={cn(
                    'w-full p-4 text-left border-2 rounded-lg transition-all',
                    selectedAnswer === option
                      ? 'border-morandi-gold bg-morandi-gold/5'
                      : 'border-border hover:border-morandi-gold/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-semibold',
                      selectedAnswer === option
                        ? 'bg-morandi-gold text-white'
                        : 'bg-morandi-container text-morandi-secondary'
                    )}>
                      {option}
                    </div>
                    <span>{currentQuestion.options[option]}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 下一題按鈕 */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-morandi-secondary">
                階段進度：{currentQuestionIndex + 1} / {phaseQuestions.length}
              </p>
              <Button
                onClick={handleAnswer}
                disabled={!selectedAnswer}
                className="bg-morandi-gold hover:bg-morandi-gold-hover"
              >
                {currentQuestionIndex === phaseQuestions.length - 1
                  ? currentPhase === 6
                    ? '完成測驗'
                    : '進入下一階段'
                  : '下一題'}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
      </div>
    </>
  );
}
