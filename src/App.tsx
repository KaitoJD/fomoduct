import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { SettingsMenu, SessionNotification, Header, Dock } from './components'

// Task interface
interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

function App() {
  const [time, setTime] = useState(25 * 60) // 25 minutes
  const [isRunning, setIsRunning] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState(0) // Track completed work sessions
  const [isBreakTime, setIsBreakTime] = useState(false) // Track if currently in break
  
  // Notification state
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationSessionType, setNotificationSessionType] = useState<'work' | 'break'>('work')
  
  // Settings state
  const [workDuration, setWorkDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4)

  // Task tracker state
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState('')

  // Use refs to access latest state values in the interval callback
  const timeRef = useRef(time)
  const isBreakTimeRef = useRef(isBreakTime)
  const currentSessionRef = useRef(currentSession)
  const workDurationRef = useRef(workDuration)
  const shortBreakDurationRef = useRef(shortBreakDuration)
  const longBreakDurationRef = useRef(longBreakDuration)
  const sessionsBeforeLongBreakRef = useRef(sessionsBeforeLongBreak)
  
  // Refs for DOM elements
  const timerSectionRef = useRef<HTMLElement>(null)
  const timerDisplayRef = useRef<HTMLDivElement>(null)

  // Update refs when state changes
  useEffect(() => {
    timeRef.current = time
    isBreakTimeRef.current = isBreakTime
    currentSessionRef.current = currentSession
    workDurationRef.current = workDuration
    shortBreakDurationRef.current = shortBreakDuration
    longBreakDurationRef.current = longBreakDuration
    sessionsBeforeLongBreakRef.current = sessionsBeforeLongBreak
  }, [time, isBreakTime, currentSession, workDuration, shortBreakDuration, longBreakDuration, sessionsBeforeLongBreak])

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const currentTime = timeRef.current
      
      if (currentTime === 0) {
        // Timer finished - pause timer and show notification
        setIsRunning(false)
        
        if (isBreakTimeRef.current) {
          // Break finished, prepare for next work session
          setIsBreakTime(false)
          setTime(workDurationRef.current * 60)
          setNotificationSessionType('break')
          setNotificationMessage(`Break time is over! Ready to start your next work session?`)
        } else {
          // Work session finished, prepare for break
          const completedSessions = currentSessionRef.current + 1
          setCurrentSession(completedSessions)
          setIsBreakTime(true)
          setNotificationSessionType('work')
          
          // Determine if it's time for long break and set timer accordingly
          if (completedSessions % sessionsBeforeLongBreakRef.current === 0) {
            setTime(longBreakDurationRef.current * 60)
            setNotificationMessage(`Great job! You've completed ${completedSessions} work sessions. Time for a long break!`)
          } else {
            setTime(shortBreakDurationRef.current * 60)
            setNotificationMessage(`Work session completed! You've earned a short break.`)
          }
        }
        
        // Show notification after session transition
        setShowNotification(true)
      } else {
        setTime(prev => prev - 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning]) // Only depend on isRunning

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleSettings = () => {
    setIsSettingsOpen(prev => !prev)
  }

  const updateWorkDuration = useCallback((minutes: number) => {
    setWorkDuration(minutes)
    if (!isRunning && !isBreakTime) {
      setTime(minutes * 60)
    }
  }, [isRunning, isBreakTime])

  const resetTimer = () => {
    setTime(workDuration * 60)
    setIsRunning(false)
    setIsBreakTime(false)
    setCurrentSession(0)
    // Reset notification state
    resetNotificationState()
  }

  const getCurrentPhase = () => {
    if (!isBreakTime) return 'Work Session'
    const isLongBreak = currentSession % sessionsBeforeLongBreak === 0
    return isLongBreak ? 'Long Break' : 'Short Break'
  }

  // Helper function to reset notification state
  const resetNotificationState = useCallback(() => {
    setShowNotification(false)
    setNotificationMessage('')
    setNotificationSessionType('work')
  }, [])

  const handleNotificationClose = useCallback(() => {
    resetNotificationState()
  }, [resetNotificationState])

  const handleStartNextSession = useCallback(() => {
    // Reset notification state and start the timer
    // The timer and session state are already prepared when the previous session ended
    resetNotificationState()
    setIsRunning(true)
  }, [resetNotificationState])

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Reset notification when timer starts
  useEffect(() => {
    if (isRunning) {
      resetNotificationState()
    }
  }, [isRunning, resetNotificationState])

  // Navigation handler for timer focus
  const handleTimerNavigation = useCallback(() => {
    // Focus on the timer section for accessibility
    if (timerSectionRef.current) {
      timerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Focus on the timer display for screen readers
      if (timerDisplayRef.current) {
        timerDisplayRef.current.focus()
      }
    }
  }, [])

  // Task management functions
  const handleAddTask = () => {
    if (!newTaskText.trim()) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date(),
    }

    setTasks(prev => [...prev, newTask])
    setNewTaskText('')
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskText(task.text)
  }

  const handleUpdateTask = () => {
    if (!editingTaskText.trim() || !editingTaskId) return

    setTasks(prev =>
      prev.map(task =>
        task.id === editingTaskId ? { ...task, text: editingTaskText.trim() } : task
      )
    )
    setEditingTaskId(null)
    setEditingTaskText('')
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const handleToggleTaskCompletion = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  return (
    <div className="app">
      <div className="content-wrapper">
        {/* Header */}
        <Header />

        {/* Bottom Dock Navigation */}
        <Dock
          isMenuOpen={isSettingsOpen}
          onToggleMenu={toggleSettings}
          onTimerClick={handleTimerNavigation}
        />

        <SettingsMenu
          isOpen={isSettingsOpen}
          onClose={toggleSettings}
          workDuration={workDuration}
          shortBreakDuration={shortBreakDuration}
          longBreakDuration={longBreakDuration}
          sessionsBeforeLongBreak={sessionsBeforeLongBreak}
          onWorkDurationChange={updateWorkDuration}
          onShortBreakChange={setShortBreakDuration}
          onLongBreakChange={setLongBreakDuration}
          onSessionsChange={setSessionsBeforeLongBreak}
        />

        <main ref={timerSectionRef} className={`timer-section ${isSettingsOpen ? 'menu-open' : ''}`}>
          <div className="panels-container">
            {/* Timer Panel */}
            <div className="timer-panel">
              <div className="app-card timer-card">
                <div className="session-info">
                  <div className="current-phase">{getCurrentPhase()}</div>
                  <div className="session-counter">
                    Session {currentSession + (isBreakTime ? 0 : 1)} • Completed: {currentSession}
                  </div>
                </div>
                <div ref={timerDisplayRef} className="timer-display" tabIndex={-1} aria-label={`Timer: ${formatTime(time)}`} aria-live="polite">
                  {formatTime(time)}
                </div>
                <div className="timer-controls">
                  <button 
                    type="button"
                    className={`control-btn primary ${isRunning ? 'pause' : 'start'}`}
                    onClick={() => setIsRunning(!isRunning)}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </button>
                  <button 
                    type="button"
                    className="control-btn secondary reset"
                    onClick={resetTimer}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Task Tracker Panel */}
            <div className="task-panel" role="region" aria-labelledby="task-tracker-heading">
              <div className="app-card task-card">
                <div className="task-header">
                  <h3 id="task-tracker-heading">Task Tracker</h3>
                </div>
                <div className="task-content">
                  <div className="task-list">
                    {tasks.length === 0 ? (
                      <div className="task-item placeholder">
                        <div className="task-checkbox"></div>
                        <div className="task-text">Add your first task...</div>
                      </div>
                    ) : (
                      tasks.map(task => (
                        <div key={task.id} className="task-item">
                          <div className="task-checkbox">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTaskCompletion(task.id)}
                              aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                            />
                          </div>
                          <div className="task-text" style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.text}
                          </div>
                          <div className="task-actions">
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() => handleEditTask(task)}
                              aria-label={`Edit task ${task.text}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label={`Delete task ${task.text}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="task-input">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      placeholder="What do you need to do?"
                      aria-label="New task input"
                    />
                    <button
                      type="button"
                      className="add-task-btn"
                      onClick={handleAddTask}
                      aria-label="Add new task"
                    >
                      Add Task
                    </button>
                  </div>
                  {editingTaskId && (
                    <div className="task-edit">
                      <input
                        type="text"
                        value={editingTaskText}
                        onChange={e => setEditingTaskText(e.target.value)}
                        placeholder="Edit your task"
                        aria-label="Edit task input"
                      />
                      <button
                        type="button"
                        className="update-task-btn"
                        onClick={handleUpdateTask}
                        aria-label="Update task"
                      >
                        Update Task
                      </button>
                    </div>
                  )}
                  <div className="task-stats">
                    <div className="stat-item">
                      <span className="stat-label">Today's Tasks</span>
                      <span className="stat-value">{tasks.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Completed</span>
                      <span className="stat-value">{tasks.filter(task => task.completed).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Session Notification */}
        <SessionNotification
          isVisible={showNotification}
          message={notificationMessage}
          sessionType={notificationSessionType}
          onClose={handleNotificationClose}
          onStartNext={handleStartNextSession}
          autoCloseDelay={8000}
        />
      </div>
    </div>
  )
}

export default App