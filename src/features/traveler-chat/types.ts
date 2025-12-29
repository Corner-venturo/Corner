/**
 * 旅伴通訊中心類型定義
 */

export interface TourConversation {
  conversation_id: string
  conversation_type: 'tour_announcement' | 'tour_support'
  tour_id: string
  tour_code: string
  tour_name: string
  departure_date: string
  is_open: boolean
  open_at: string | null
  unread_count: number
  last_message_at: string | null
  last_message_preview: string | null
  member_count: number
  traveler_count: number
}

export interface ConversationMessage {
  id: string
  sender_id: string | null
  type: 'text' | 'image' | 'file' | 'system' | 'location'
  content: string
  attachments: Array<{
    type: string
    url: string
    name?: string
  }>
  reply_to_id: string | null
  reactions: Record<string, string[]>
  metadata: {
    sender_type?: 'traveler' | 'employee'
    employee_id?: string
    action?: string
  } | null
  created_at: string
  edited_at: string | null
}

export interface ConversationMember {
  id: string
  user_id: string | null
  employee_id: string | null
  member_type: 'traveler' | 'employee'
  role: 'owner' | 'admin' | 'member'
  last_read_at: string | null
  is_muted: boolean
  joined_at: string
}

export interface TravelerInfo {
  id: string
  name: string
  avatar_url: string | null
}

export interface EmployeeInfo {
  id: string
  display_name: string
  avatar_url: string | null
}

export interface ConversationDetail {
  conversation: {
    id: string
    type: string
    name: string
    tour_id: string
    is_open: boolean
    open_at: string | null
    tours: {
      id: string
      tour_code: string
      name: string
      departure_date: string
    } | null
  }
  messages: ConversationMessage[]
  members: ConversationMember[]
  travelers: TravelerInfo[]
  employees: EmployeeInfo[]
}

// 按團分組的對話
export interface TourGroup {
  tourId: string
  tourCode: string
  tourName: string
  departureDate: string
  isOpen: boolean
  openAt: string | null
  conversations: TourConversation[]
  totalUnread: number
}
