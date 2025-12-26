'use client'

import { useState } from 'react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import {
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Send,
  Smile,
  Paperclip,
  MessageSquare,
  Users,
  MoreHorizontal,
  FileText,
  Receipt,
  CreditCard,
  ListTodo,
  Share2,
  X,
  Phone,
  Plane,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Demo 頻道群組
interface DemoChannelGroup {
  id: string
  name: string
  channels: DemoChannel[]
  isExpanded: boolean
}

interface DemoChannel {
  id: string
  name: string
  description: string
  unreadCount: number
  tourCode?: string
}

// Demo 訊息
interface DemoMessage {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: string
  reactions: { emoji: string; count: number; users: string[] }[]
  replyCount: number
  attachments?: { type: string; name: string }[]
}

// Demo 成員
interface DemoMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'online' | 'away' | 'offline'
}

// Demo 資料
const demoChannelGroups: DemoChannelGroup[] = [
  {
    id: 'g1',
    name: '一般頻道',
    isExpanded: true,
    channels: [
      { id: 'c1', name: '公告', description: '公司公告', unreadCount: 2 },
      { id: 'c2', name: '一般討論', description: '日常討論', unreadCount: 0 },
      { id: 'c3', name: '技術支援', description: '系統問題回報', unreadCount: 1 },
    ],
  },
  {
    id: 'g2',
    name: '旅遊團頻道',
    isExpanded: true,
    channels: [
      { id: 'c4', name: 'JP2501 北海道雪祭', description: '2025/02/05 出發', unreadCount: 5, tourCode: 'JP2501' },
      { id: 'c5', name: 'JP2502 京都賞櫻', description: '2025/03/28 出發', unreadCount: 0, tourCode: 'JP2502' },
      { id: 'c6', name: 'EU2503 瑞士深度', description: '2025/06/15 出發', unreadCount: 3, tourCode: 'EU2503' },
    ],
  },
  {
    id: 'g3',
    name: '部門頻道',
    isExpanded: false,
    channels: [
      { id: 'c7', name: '業務部', description: '業務討論', unreadCount: 0 },
      { id: 'c8', name: '財務部', description: '財務相關', unreadCount: 1 },
      { id: 'c9', name: 'OP部門', description: '作業部門', unreadCount: 0 },
    ],
  },
]

const demoMessages: DemoMessage[] = [
  {
    id: 'm1',
    userId: 'u1',
    userName: '陳業務',
    userAvatar: '陳',
    content: '各位好，JP2501 北海道雪祭團目前報名人數已達 18 人，還有 2 個名額！',
    timestamp: '09:30',
    reactions: [{ emoji: '👍', count: 3, users: ['王經理', '李助理', '張OP'] }],
    replyCount: 2,
  },
  {
    id: 'm2',
    userId: 'u2',
    userName: '王經理',
    userAvatar: '王',
    content: '太棒了！請確認一下機位是否已經 OK？',
    timestamp: '09:35',
    reactions: [],
    replyCount: 0,
  },
  {
    id: 'm3',
    userId: 'u1',
    userName: '陳業務',
    userAvatar: '陳',
    content: '機位已確認，長榮 BR116 去程、BR115 回程，20 個位子都已經訂好了。',
    timestamp: '09:40',
    reactions: [{ emoji: '✅', count: 2, users: ['王經理', '張OP'] }],
    replyCount: 0,
  },
  {
    id: 'm4',
    userId: 'u3',
    userName: '張OP',
    userAvatar: '張',
    content: '收到！我這邊已經開始準備行程確認單，預計今天下班前會完成。',
    timestamp: '10:15',
    reactions: [],
    replyCount: 1,
    attachments: [{ type: 'document', name: 'JP2501_行程確認單_draft.pdf' }],
  },
  {
    id: 'm5',
    userId: 'u4',
    userName: '李助理',
    userAvatar: '李',
    content: '提醒一下，有 3 位客人的護照下個月就要到期，需要請他們盡快更新。',
    timestamp: '10:45',
    reactions: [{ emoji: '⚠️', count: 1, users: ['陳業務'] }],
    replyCount: 3,
  },
]

const demoMembers: DemoMember[] = [
  { id: 'u1', name: '陳業務', role: '業務專員', avatar: '陳', status: 'online' },
  { id: 'u2', name: '王經理', role: '業務經理', avatar: '王', status: 'online' },
  { id: 'u3', name: '張OP', role: 'OP專員', avatar: '張', status: 'away' },
  { id: 'u4', name: '李助理', role: '行政助理', avatar: '李', status: 'online' },
  { id: 'u5', name: '林會計', role: '財務專員', avatar: '林', status: 'offline' },
]

export default function DemoWorkspacePage() {
  const [channelGroups, setChannelGroups] = useState(demoChannelGroups)
  const [selectedChannel, setSelectedChannel] = useState<DemoChannel>(demoChannelGroups[1].channels[0])
  const [showMemberSidebar, setShowMemberSidebar] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [showThread, setShowThread] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<DemoMessage | null>(null)

  const toggleGroup = (groupId: string) => {
    setChannelGroups(groups =>
      groups.map(g => (g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g))
    )
  }

  const handleSendMessage = () => {
    if (messageText.trim()) {
      alert(`DEMO 模式：發送訊息「${messageText}」`)
      setMessageText('')
    }
  }

  const openThread = (message: DemoMessage) => {
    setSelectedMessage(message)
    setShowThread(true)
  }

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="工作空間"
        breadcrumb={[
          { label: '首頁', href: '/demo' },
          { label: '工作空間', href: '/demo/workspace' },
        ]}
      />

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex border border-border rounded-lg bg-card shadow-sm overflow-hidden">
          {/* 頻道側邊欄 */}
          <div className="w-64 border-r border-border flex flex-col bg-morandi-container/30">
            {/* 工作空間標題 */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-morandi-primary">Corner 旅行社</h2>
                <Button variant="ghost" size="sm" onClick={() => alert('DEMO 模式：設定')}>
                  <Settings size={16} />
                </Button>
              </div>
            </div>

            {/* 頻道列表 */}
            <div className="flex-1 overflow-auto py-2">
              {channelGroups.map(group => (
                <div key={group.id} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full px-3 py-1.5 flex items-center gap-1 text-xs font-medium text-morandi-secondary hover:text-morandi-primary"
                  >
                    {group.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {group.name}
                  </button>

                  {group.isExpanded && (
                    <div className="space-y-0.5">
                      {group.channels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={cn(
                            'w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-morandi-container/50 transition-colors',
                            selectedChannel?.id === channel.id && 'bg-morandi-gold/10 text-morandi-gold'
                          )}
                        >
                          <Hash size={14} className="text-morandi-secondary" />
                          <span className="flex-1 text-left truncate">{channel.name}</span>
                          {channel.unreadCount > 0 && (
                            <span className="bg-morandi-red text-white text-xs px-1.5 py-0.5 rounded-full">
                              {channel.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 新增頻道 */}
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => alert('DEMO 模式：新增頻道')}
              >
                <Plus size={14} className="mr-1" />
                新增頻道
              </Button>
            </div>
          </div>

          {/* 聊天主區域 */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 頻道標題 */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-morandi-secondary" />
                <div>
                  <h3 className="font-semibold text-morandi-primary">{selectedChannel?.name}</h3>
                  <p className="text-xs text-morandi-secondary">{selectedChannel?.description}</p>
                </div>
                {selectedChannel?.tourCode && (
                  <span className="ml-2 px-2 py-0.5 bg-morandi-gold/10 text-morandi-gold text-xs rounded-full">
                    <Plane size={10} className="inline mr-1" />
                    {selectedChannel.tourCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => alert('DEMO 模式：電話')}>
                  <Phone size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMemberSidebar(!showMemberSidebar)}
                  className={showMemberSidebar ? 'bg-morandi-container' : ''}
                >
                  <Users size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => alert('DEMO 模式：更多設定')}>
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </div>

            {/* 訊息列表 */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {demoMessages.map(message => (
                <div key={message.id} className="group flex gap-3 hover:bg-morandi-container/30 p-2 rounded-lg -mx-2">
                  <div className="w-9 h-9 rounded-full bg-morandi-gold/20 flex items-center justify-center text-morandi-gold font-medium text-sm">
                    {message.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-morandi-primary text-sm">{message.userName}</span>
                      <span className="text-xs text-morandi-secondary">{message.timestamp}</span>
                    </div>
                    <p className="text-sm text-morandi-primary mt-0.5">{message.content}</p>

                    {/* 附件 */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 bg-morandi-container/50 rounded-lg border border-border"
                          >
                            <FileText size={16} className="text-morandi-secondary" />
                            <span className="text-sm text-morandi-primary">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 反應 & 回覆 */}
                    <div className="flex items-center gap-2 mt-2">
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          className="flex items-center gap-1 px-2 py-0.5 bg-morandi-container/50 rounded-full text-xs hover:bg-morandi-container"
                          onClick={() => alert(`DEMO 模式：${reaction.users.join(', ')} 按了 ${reaction.emoji}`)}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-morandi-secondary">{reaction.count}</span>
                        </button>
                      ))}
                      {message.replyCount > 0 && (
                        <button
                          onClick={() => openThread(message)}
                          className="flex items-center gap-1 text-xs text-morandi-gold hover:underline"
                        >
                          <MessageSquare size={12} />
                          {message.replyCount} 則回覆
                        </button>
                      )}
                    </div>

                    {/* 快捷操作 */}
                    <div className="hidden group-hover:flex items-center gap-1 mt-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => alert('DEMO：按讚')}>
                        <Smile size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openThread(message)}>
                        <MessageSquare size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => alert('DEMO：分享')}>
                        <Share2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 快捷操作列 */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2 bg-morandi-container/20">
              <span className="text-xs text-morandi-secondary mr-2">快捷操作：</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => alert('DEMO：分享訂單')}>
                <FileText size={12} className="mr-1" />
                分享訂單
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => alert('DEMO：新增收款')}>
                <Receipt size={12} className="mr-1" />
                新增收款
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => alert('DEMO：請款')}>
                <CreditCard size={12} className="mr-1" />
                請款
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => alert('DEMO：新增任務')}>
                <ListTodo size={12} className="mr-1" />
                新增任務
              </Button>
            </div>

            {/* 訊息輸入區 */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-2 bg-morandi-container/30 rounded-lg p-2 border border-border">
                <Button variant="ghost" size="sm" onClick={() => alert('DEMO：上傳檔案')}>
                  <Paperclip size={18} />
                </Button>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={`傳送訊息到 #${selectedChannel?.name}`}
                  className="flex-1 bg-transparent border-none resize-none text-sm focus:outline-none min-h-[36px] max-h-[120px]"
                  rows={1}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => alert('DEMO：表情符號')}>
                  <Smile size={18} />
                </Button>
                <Button size="sm" onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* 討論串面板 */}
          {showThread && selectedMessage && (
            <div className="w-80 border-l border-border flex flex-col bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-morandi-primary">討論串</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowThread(false)}>
                  <X size={16} />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {/* 原始訊息 */}
                <div className="pb-4 border-b border-border mb-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-morandi-gold/20 flex items-center justify-center text-morandi-gold font-medium text-sm">
                      {selectedMessage.userAvatar}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-morandi-primary text-sm">{selectedMessage.userName}</span>
                        <span className="text-xs text-morandi-secondary">{selectedMessage.timestamp}</span>
                      </div>
                      <p className="text-sm text-morandi-primary mt-1">{selectedMessage.content}</p>
                    </div>
                  </div>
                </div>

                {/* 回覆 */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-morandi-blue/20 flex items-center justify-center text-morandi-blue font-medium text-xs">
                      王
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-morandi-primary text-xs">王經理</span>
                        <span className="text-xs text-morandi-secondary">10:00</span>
                      </div>
                      <p className="text-sm text-morandi-primary mt-0.5">好的，我會跟進處理。</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-morandi-green/20 flex items-center justify-center text-morandi-green font-medium text-xs">
                      李
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-morandi-primary text-xs">李助理</span>
                        <span className="text-xs text-morandi-secondary">10:05</span>
                      </div>
                      <p className="text-sm text-morandi-primary mt-0.5">已經通知客戶了！</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 回覆輸入 */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2 bg-morandi-container/30 rounded-lg p-2 border border-border">
                  <input
                    type="text"
                    placeholder="回覆..."
                    className="flex-1 bg-transparent border-none text-sm focus:outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        alert('DEMO 模式：回覆討論串')
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => alert('DEMO 模式：回覆討論串')}>
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 成員側邊欄 */}
          {showMemberSidebar && !showThread && (
            <div className="w-64 border-l border-border flex flex-col bg-card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-morandi-primary">成員</h3>
                <p className="text-xs text-morandi-secondary">{demoMembers.length} 位成員</p>
              </div>
              <div className="flex-1 overflow-auto py-2">
                {demoMembers.map(member => (
                  <button
                    key={member.id}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-morandi-container/30 transition-colors"
                    onClick={() => alert(`DEMO 模式：查看 ${member.name} 的資料`)}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-morandi-gold/20 flex items-center justify-center text-morandi-gold font-medium text-sm">
                        {member.avatar}
                      </div>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
                          member.status === 'online' && 'bg-green-500',
                          member.status === 'away' && 'bg-amber-500',
                          member.status === 'offline' && 'bg-morandi-muted'
                        )}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-morandi-primary">{member.name}</p>
                      <p className="text-xs text-morandi-secondary">{member.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
