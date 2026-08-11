export type Priority    = 'none' | 'low' | 'medium' | 'high'
export type Recurrence  = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ViewMode    = 'list' | 'day' | 'week' | 'month'
export type FileStatus  = 'none' | 'connected' | 'prompt'

export type Task = {
  id: string
  text: string
  done: boolean
  pinned: boolean
  important: boolean      // kept for backwards-compat; synced with priority === 'high'
  priority: Priority
  dueDate: string | null  // 'YYYY-MM-DD' or null = unscheduled
  recurrence: Recurrence
  notes: string
  photos: string[]        // base64 data URLs
  reminder: string | null // 'YYYY-MM-DDTHH:mm' for browser notification
  createdAt: string
}
