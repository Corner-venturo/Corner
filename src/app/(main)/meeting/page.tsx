'use client';

import { useState, useEffect, useRef } from 'react';
import { AI_ENDPOINTS } from '@/lib/meeting/ai-endpoints';
import { MEETING_LABELS } from './constants/labels'

interface Message {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isAI?: boolean;
}

interface AIResponse {
  aiId: string;
  aiName: string;
  aiEmoji: string;
  message: string;
}

export default function MeetingRoomPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket 連線（稍後實作）
  useEffect(() => {
    // TODO: 連接 WebSocket server
    setIsConnected(true);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const messageText = input;
    const newMessage: Message = {
      id: Date.now().toString(),
      user: 'William',
      message: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // 呼叫 API 檢查是否需要 AI 回應
    try {
      const response = await fetch('/api/meeting/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          user: 'William',
        }),
      });

      const data = await response.json();

      if (data.needsAI && data.responses) {
        // 處理多個 AI 回應
        data.responses.forEach((aiResponse: AIResponse, index: number) => {
          const aiMessage: Message = {
            id: (Date.now() + index + 1).toString(),
            user: `${aiResponse.aiEmoji} ${aiResponse.aiName}`,
            message: aiResponse.message,
            timestamp: new Date(data.timestamp),
            isAI: true,
          };
          setMessages(prev => [...prev, aiMessage]);
        });
      }
    } catch (error) {
      console.error('發送訊息失敗:', error);
      // 顯示錯誤訊息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        user: '系統',
        message: '⚠️ 無法連接到 AI 系統',
        timestamp: new Date(),
        isAI: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const endMeeting = async () => {
    if (!confirm('確定要結束會議並生成摘要嗎？')) return;

    try {
      const response = await fetch('/api/meeting/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();

      if (data.success) {
        // 顯示摘要
        alert(`會議摘要已生成：\n\n${data.summary}`);
        
        // 可以選擇清空訊息或跳轉
        // setMessages([]);
      } else {
        alert('摘要生成失敗，請稍後再試');
      }
    } catch (error) {
      console.error('結束會議失敗:', error);
      alert('無法生成摘要，請檢查系統連線');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* 左側：成員列表 */}
      <aside className="w-64 bg-gray-800 p-4 border-r border-[var(--border)]">
        <h2 className="text-white text-lg font-bold mb-4">👥 在線成員</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>William (你)</span>
          </div>
          
          {/* 動態顯示所有 AI */}
          {AI_ENDPOINTS.map(ai => (
            <div key={ai.id} className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{ai.emoji} {ai.name} (AI)</span>
            </div>
          ))}
          
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Carson (離線)</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="text-sm text-gray-400">
            連線狀態: {isConnected ? '🟢 已連線' : '🔴 未連線'}
          </div>
        </div>
      </aside>

      {/* 右側：聊天區域 */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 p-4 border-b border-[var(--border)]">
          <h1 className="text-white text-xl font-bold">💬 Venturo 團隊會議室</h1>
        </header>

        {/* 訊息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p>{MEETING_LABELS.LABEL_203}</p>
              <p className="text-sm mt-2">{MEETING_LABELS.LABEL_8633}</p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.isAI ? 'bg-blue-900/20' : ''} p-3 rounded`}
            >
              <div className="flex-shrink-0">
                {msg.isAI ? (
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    🌙
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
                    {msg.user[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{msg.user}</span>
                  <span className="text-gray-500 text-xs">
                    {msg.timestamp.toLocaleTimeString('zh-TW', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-gray-300">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入框 */}
        <div className="border-t border-[var(--border)] p-4 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={MEETING_LABELS.LABEL_8571}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {MEETING_LABELS.SENDING_8105}
            </button>
            <button
              onClick={endMeeting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {MEETING_LABELS.LABEL_5569}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            💡 提示：可以用 @悠月、@會計 等呼叫 AI，或直接問問題
          </div>
        </div>
      </main>
    </div>
  );
}
