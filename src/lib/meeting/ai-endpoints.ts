// AI Endpoints 設定
// 所有 OpenClaw 都在同一個網域（Tailscale 或內網）

export interface AIEndpoint {
  id: string;
  name: string;
  url: string;
  emoji: string;
  triggers: string[]; // 觸發關鍵字
}

export const AI_ENDPOINTS: AIEndpoint[] = [
  {
    id: 'yuzuki',
    name: '悠月',
    url: 'http://100.89.92.46:3067',
    emoji: '🌙',
    triggers: ['@悠月', '@yuzuki', '查詢', '幫我', '建議'],
  },
  // 未來加入其他 AI
  // {
  //   id: 'carson-ai',
  //   name: 'Carson AI',
  //   url: 'http://100.x.x.x:3067',
  //   emoji: '💼',
  //   triggers: ['@Carson', '業務', '客戶'],
  // },
  // {
  //   id: 'accounting-ai',
  //   name: '會計 AI',
  //   url: 'http://100.x.x.x:3067',
  //   emoji: '💰',
  //   triggers: ['@會計', '財務', '預算', '成本'],
  // },
];

/**
 * 判斷訊息應該觸發哪些 AI
 */
export function getTriggeredAIs(message: string): AIEndpoint[] {
  return AI_ENDPOINTS.filter(ai => 
    ai.triggers.some(trigger => 
      message.includes(trigger)
    )
  );
}

/**
 * 呼叫單一 AI
 */
export async function callAI(
  endpoint: AIEndpoint, 
  message: string,
  context?: string
): Promise<string> {
  try {
    const response = await fetch(`${endpoint.url}/api/sessions/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionKey: 'meeting',
        message: context ? `${context}\n\n${message}` : message,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI ${endpoint.name} 回應失敗`);
    }

    const data = await response.json();
    return data.reply || `${endpoint.emoji} ${endpoint.name} 正在思考...`;

  } catch (error) {
    console.error(`呼叫 ${endpoint.name} 失敗:`, error);
    return `⚠️ 無法連接 ${endpoint.name}`;
  }
}

/**
 * 同時呼叫多個 AI
 */
export async function callMultipleAIs(
  endpoints: AIEndpoint[],
  message: string,
  context?: string
): Promise<Record<string, string>> {
  const promises = endpoints.map(async (endpoint) => ({
    id: endpoint.id,
    response: await callAI(endpoint, message, context),
  }));

  const results = await Promise.all(promises);
  
  return results.reduce((acc, { id, response }) => {
    acc[id] = response;
    return acc;
  }, {} as Record<string, string>);
}
