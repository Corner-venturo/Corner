// 顯化魔法相關類型定義

export interface ManifestationEntry {
  id: string
  user_id: string
  chapter_number: number
  desire?: string
  body_sensations?: string[]
  dialogue?: string
  small_action?: string
  gratitude?: string
  magic_phrases?: string[]
  vision_board?: VisionBoardData
  shared_wish?: string
  notes?: string
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface VisionBoardData {
  images?: VisionBoardImage[]
  texts?: VisionBoardText[]
  background?: string
}

export interface VisionBoardImage {
  id: string
  url: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface VisionBoardText {
  id: string
  content: string
  position: { x: number; y: number }
  style?: {
    fontSize?: number
    color?: string
    fontWeight?: string
  }
}

export interface ChapterExercise {
  type:
    | 'desire_input'
    | 'body_scan'
    | 'dialogue'
    | 'action'
    | 'gratitude'
    | 'magic_phrase'
    | 'vision_board'
    | 'sharing'
  instructions: string[]
  fields: ExerciseField[]
}

export type ExerciseField =
  | 'body_sensations'
  | 'desire'
  | 'dialogue'
  | 'small_action'
  | 'gratitude'
  | 'magic_phrases'
  | 'vision_board'
  | 'shared_wish'
  | 'notes'

export interface Chapter {
  id: number
  title: string
  subtitle?: string
  quote: string
  content: string
  exercise: ChapterExercise
  icon?: string
  color?: string
}

export interface ManifestationProgress {
  user_id: string
  total_entries: number
  completed_entries: number
  chapters_started: number[]
  last_activity: string
}
