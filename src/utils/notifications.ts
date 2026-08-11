import type { Task } from '../types'
import { isToday, isTomorrow } from './dates'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

export function checkAndFireAlerts(tasks: Task[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  tasks
    .filter(t => !t.done && (t.important || t.priority === 'high') && t.dueDate &&
      (isTomorrow(t.dueDate) || isToday(t.dueDate)))
    .forEach(t => {
      new Notification(
        `⚠ Important task due ${isTomorrow(t.dueDate!) ? 'tomorrow' : 'today'}`,
        { body: t.text, icon: '/icons/icon.svg', tag: `tf-alert-${t.id}` }
      )
    })
}

// ─── Reminder scheduling ─────────────────────────────────────────────────────
const _timers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleReminders(tasks: Task[]): void {
  _timers.forEach(t => clearTimeout(t)); _timers.clear()
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const now = Date.now()
  const TWO_DAYS = 48 * 60 * 60 * 1000
  tasks.filter(t => !t.done && t.reminder).forEach(t => {
    const at = new Date(t.reminder!).getTime()
    const delay = at - now
    if (delay > 0 && delay < TWO_DAYS) {
      _timers.set(t.id, setTimeout(() => {
        new Notification(`🔔 Reminder: ${t.text}`, {
          body: t.notes || (t.dueDate ? `Due: ${t.dueDate}` : ''),
          icon: '/icons/icon.svg',
          tag: `tf-reminder-${t.id}`,
        })
      }, delay))
    }
  })
}
