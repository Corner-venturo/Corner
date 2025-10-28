/**
 * 英靈招喚測驗題庫
 *
 * 6個階段，共120題
 * Phase 1: Q1-Q20   詩意感知篇
 * Phase 2: Q21-Q40  現實映照篇
 * Phase 3: Q41-Q60  內在對映篇
 * Phase 4: Q61-Q80  潛意識投射篇
 * Phase 5: Q81-Q100 靈魂整合篇
 * Phase 6: Q101-Q120 終境與覺醒篇
 */

export interface Question {
  id: number;
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  symbolism?: string;  // 象徵意涵
  energyCode?: string; // 能量代碼
}

export interface Phase {
  phase: number;
  title: string;
  description: string;
  questionRange: [number, number];
}

export const PHASES: Phase[] = [
  {
    phase: 1,
    title: '詩意感知篇',
    description: '探索你的感知與直覺',
    questionRange: [1, 20]
  },
  {
    phase: 2,
    title: '現實映照篇',
    description: '觀察你與現實的互動',
    questionRange: [21, 40]
  },
  {
    phase: 3,
    title: '內在對映篇',
    description: '深入你的內在世界',
    questionRange: [41, 60]
  },
  {
    phase: 4,
    title: '潛意識投射篇',
    description: '揭示潛意識的訊息',
    questionRange: [61, 80]
  },
  {
    phase: 5,
    title: '靈魂整合篇',
    description: '整合你的靈魂碎片',
    questionRange: [81, 100]
  },
  {
    phase: 6,
    title: '終境與覺醒篇',
    description: '邁向最終的覺醒',
    questionRange: [101, 120]
  }
];

// 示範題目結構（實際題目需要替換）
export const QUESTIONS: Question[] = [
  // Phase 1: 詩意感知篇 (Q1-Q20)
  {
    id: 1,
    phase: 1,
    question: '當清晨的第一道光照進房間，你會想到什麼？',
    options: {
      A: '新的一天，新的開始',
      B: '光的溫暖與希望',
      C: '時間的流逝',
      D: '靜謐與寧靜'
    },
    symbolism: '對新生的感知',
    energyCode: 'DAWN_LIGHT'
  },
  // ... 此處需要補充 Q2-Q20

  // Phase 2: 現實映照篇 (Q21-Q40)
  {
    id: 21,
    phase: 2,
    question: '面對一個困難的決定時，你傾向於？',
    options: {
      A: '相信直覺',
      B: '理性分析',
      C: '徵詢他人意見',
      D: '順其自然'
    },
    symbolism: '決策模式',
    energyCode: 'DECISION_PATH'
  },
  // ... 此處需要補充 Q22-Q40

  // Phase 3: 內在對映篇 (Q41-Q60)
  {
    id: 41,
    phase: 3,
    question: '你內心最深處的恐懼是什麼？',
    options: {
      A: '孤獨',
      B: '失敗',
      C: '失去控制',
      D: '被遺忘'
    },
    symbolism: '核心恐懼',
    energyCode: 'CORE_FEAR'
  },
  // ... 此處需要補充 Q42-Q60

  // Phase 4: 潛意識投射篇 (Q61-Q80)
  {
    id: 61,
    phase: 4,
    question: '在夢中，你最常出現的場景是？',
    options: {
      A: '飛翔天空',
      B: '探索未知之地',
      C: '與他人對話',
      D: '回到過去'
    },
    symbolism: '潛意識主題',
    energyCode: 'DREAM_REALM'
  },
  // ... 此處需要補充 Q62-Q80

  // Phase 5: 靈魂整合篇 (Q81-Q100)
  {
    id: 81,
    phase: 5,
    question: '如果可以與過去的自己對話，你會說什麼？',
    options: {
      A: '不要害怕，一切都會好的',
      B: '相信自己的選擇',
      C: '珍惜當下的每一刻',
      D: '勇敢面對挑戰'
    },
    symbolism: '自我對話',
    energyCode: 'SELF_DIALOGUE'
  },
  // ... 此處需要補充 Q82-Q100

  // Phase 6: 終境與覺醒篇 (Q101-Q120)
  {
    id: 101,
    phase: 6,
    question: '你認為生命的意義是什麼？',
    options: {
      A: '體驗與成長',
      B: '愛與連結',
      C: '創造與貢獻',
      D: '探索與覺醒'
    },
    symbolism: '生命哲學',
    energyCode: 'LIFE_PURPOSE'
  },
  // ... 此處需要補充 Q102-Q120
];

// 取得特定階段的題目
export function getQuestionsByPhase(phase: number): Question[] {
  return QUESTIONS.filter(q => q.phase === phase);
}

// 取得特定題目
export function getQuestionById(id: number): Question | undefined {
  return QUESTIONS.find(q => q.id === id);
}

// 計算完成百分比
export function calculateProgress(answeredCount: number): number {
  return Math.round((answeredCount / 120) * 100);
}
