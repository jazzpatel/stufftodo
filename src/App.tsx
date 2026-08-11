import React, { useCallback, useEffect, useRef, useState } from 'react'
import { registerSW, tryAutoLoad, openAndLoadFile, saveToFile, queryStoredHandlePermission } from './fileHandler'
import type { Task, ViewMode, FileStatus } from './types'
import { today } from './utils/dates'
import { newTask, normalizeTask } from './utils/taskUtils'
import { requestNotificationPermission, checkAndFireAlerts, scheduleReminders } from './utils/notifications'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'
import { TopBar }      from './components/TopBar'
import { BottomBar }   from './components/BottomBar'
import { Drawer }      from './components/Drawer'
import { FileBanner }  from './components/FileBanner'
import { CalendarNav } from './components/CalendarNav'
import { TaskModal }   from './components/TaskModal'
import { ListView }    from './views/ListView'
import { DayView }     from './views/DayView'
import { WeekView }    from './views/WeekView'
import { MonthView }   from './views/MonthView'

export default function App() {
  const { tasks, setTasks, addTask, updateTask, deleteTask, toggleDone, reschedule } = useTasks()
  const { dark, toggle: toggleDark } = useTheme()

  const [query,      setQuery]      = useState('')
  const [view,       setView]       = useState<ViewMode>('list')
  const [selDate,    setSelDate]    = useState(today())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fileStatus, setFileStatus] = useState<FileStatus>('none')
  const [modalTask,  setModalTask]  = useState<Task | null>(null)
  const [isNewTask,  setIsNewTask]  = useState(false)

  const autoSave   = useRef(false)
  const searchRef  = useRef<HTMLInputElement>(null)
  const draggingId = useRef<string | null>(null)

  // ─── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    registerSW()
    requestNotificationPermission().catch(() => {})
    ;(async () => {
      const perm = await queryStoredHandlePermission()
      if (perm === 'granted') {
        const data = await tryAutoLoad()
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (Array.isArray(parsed)) setTasks(parsed.map(normalizeTask))
          } catch { /* ignore malformed JSON */ }
        }
        autoSave.current = true
        setFileStatus('connected')
      } else if (perm === 'prompt') {
        setFileStatus('prompt')
      }
    })()
  }, [setTasks])

  // ─── Side-effects on task changes ───────────────────────────────────────────
  useEffect(() => { checkAndFireAlerts(tasks); scheduleReminders(tasks) }, [tasks])
  useEffect(() => {
    if (!autoSave.current) return
    saveToFile(JSON.stringify(tasks, null, 2)).catch(console.warn)
  }, [tasks])

  // ─── File operations ─────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setDrawerOpen(false)
    const data = await openAndLoadFile()
    if (!data) return
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        setTasks(parsed.map(normalizeTask))
        autoSave.current = true
        setFileStatus('connected')
      }
    } catch { alert('Invalid TaskFlow file.') }
  }, [setTasks])

  const handleExport = useCallback(async () => {
    setDrawerOpen(false)
    await saveToFile(JSON.stringify(tasks, null, 2), true)
    autoSave.current = true
    setFileStatus('connected')
  }, [tasks])

  // ─── Task operations ─────────────────────────────────────────────────────────
  const quickAdd = (text: string, dueDate: string | null) =>
    addTask({ ...newTask(dueDate), text })

  const openNew  = (dueDate?: string | null) => { setModalTask(newTask(dueDate ?? null)); setIsNewTask(true) }
  const openEdit = (task: Task)              => { setModalTask({ ...task });               setIsNewTask(false) }

  const handleModalSave = (updated: Task) => {
    if (isNewTask) addTask(updated); else updateTask(updated)
    setModalTask(null)
  }
  const handleModalDelete = () => {
    if (modalTask) deleteTask(modalTask.id)
    setModalTask(null)
  }

  // ─── Drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggingId.current = id; e.dataTransfer.effectAllowed = 'move'
  }
  const handleDrop = (date: string | null) => {
    if (!draggingId.current) return
    reschedule(draggingId.current, date)
    draggingId.current = null
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {modalTask && (
        <TaskModal
          task={modalTask} isNew={isNewTask}
          onSave={handleModalSave}
          onDelete={isNewTask ? undefined : handleModalDelete}
          onClose={() => setModalTask(null)}
        />
      )}

      <Drawer
        open={drawerOpen} fileStatus={fileStatus} dark={dark}
        onClose={() => setDrawerOpen(false)}
        onImport={handleImport} onExport={handleExport} onToggleDark={toggleDark}
      />

      <TopBar
        onMenu={() => setDrawerOpen(o => !o)}
        searchRef={searchRef} query={query} onSearch={setQuery}
      />

      {fileStatus === 'none' && <FileBanner onImport={handleImport} onExport={handleExport} />}

      {view !== 'list' && <CalendarNav view={view} date={selDate} onChange={setSelDate} />}

      <main className="content">
        {view === 'list' && (
          <ListView tasks={tasks} query={query}
            onToggleDone={toggleDone} onOpen={openEdit}
            onQuickAdd={quickAdd} onNewTask={openNew} />
        )}
        {view === 'day' && (
          <DayView tasks={tasks} date={selDate} query={query}
            onToggleDone={toggleDone} onOpen={openEdit}
            onQuickAdd={quickAdd} onNewTask={openNew}
            onDragStart={handleDragStart} onDrop={handleDrop}
            onSelectDay={setSelDate} />
        )}
        {view === 'week' && (
          <WeekView tasks={tasks} baseDate={selDate}
            onToggleDone={toggleDone} onOpen={openEdit}
            onNewTask={openNew}
            onDragStart={handleDragStart} onDrop={handleDrop} />
        )}
        {view === 'month' && (
          <MonthView tasks={tasks} baseDate={selDate}
            onSelectDay={d => { setSelDate(d); setView('day') }} />
        )}
      </main>

      <BottomBar
        view={view}
        onView={v => { setView(v); if (v !== 'list') setSelDate(today()) }}
        onSearch={() => { searchRef.current?.focus(); searchRef.current?.select() }}
        onMenu={() => setDrawerOpen(o => !o)}
      />
    </div>
  )
}
