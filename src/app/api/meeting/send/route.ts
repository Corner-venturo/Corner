import { NextRequest, NextResponse } from 'next/server';

// 簡單的規則回應（測試用）
function getSimpleResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('金澤') || lowerMsg.includes('kanazawa')) {
    return '金澤團（TW261231A）目前有 15 人報名，預算 35000/人，成本 28000/人。需要我查詳細資料嗎？';
  }
  
  if (lowerMsg.includes('預算') || lowerMsg.includes('成本')) {
    return '根據財務資料，這個月預算執行率 85%，成本控制良好。';
  }
  
  if (lowerMsg.includes('查') || lowerMsg.includes('幫我')) {
    return '好的，我幫你查詢相關資料...（測試模式）';
  }
  
  if (lowerMsg.includes('?') || lowerMsg.includes('？')) {
    return '讓我想想...（測試模式：AI 整合中）';
  }
  
  return '我收到你的訊息了！（測試模式：會議室功能正常運作）';
}

export async function POST(req: NextRequest) {
  try {
    const { message, user } = await req.json();

    // 判斷是否需要 AI 回應
    const shouldRespond = 
      message.includes('@悠月') || 
      message.includes('?') || 
      message.includes('？') ||
      message.includes('幫我') ||
      message.includes('查') ||
      message.includes('建議') ||
      message.includes('金澤') ||
      message.includes('預算');

    if (!shouldRespond) {
      return NextResponse.json({ needsAI: false });
    }

    // 簡單回應（測試用）
    const aiResponse = getSimpleResponse(message);

    return NextResponse.json({
      needsAI: true,
      responses: [{
        aiId: 'yuzuki',
        aiName: '悠月',
        aiEmoji: '🌙',
        message: aiResponse,
      }],
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Meeting API error:', error);
    
    return NextResponse.json(
      { 
        error: '會議室系統錯誤',
        needsAI: false 
      },
      { status: 500 }
    );
  }
}
