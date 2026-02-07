import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import '../styles/SessionNotification.css'

interface SessionNotificationProps {
  isVisible: boolean
  message: string
  sessionType: 'work' | 'break'
  onClose: () => void
  onStartNext?: () => void
  autoCloseDelay?: number
}

export const SessionNotification: React.FC<SessionNotificationProps> = ({
  isVisible,
  message,
  sessionType,
  onClose,
  onStartNext,
  autoCloseDelay = 5000
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Set up focus trap when notification is visible
  useFocusTrap({ 
    isEnabled: isVisible, 
    containerSelector: '.notification-popup'
  })

  const handleClose = useCallback(() => {
    setIsAnimating(false)
    
    // Clear any existing close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    
    // Wait for exit animation to complete
    closeTimeoutRef.current = setTimeout(() => {
      setShowNotification(false)
      onClose()
      closeTimeoutRef.current = null
    }, 300)
  }, [onClose])

  const handleStartNext = useCallback(() => {
    if (onStartNext) {
      onStartNext()
    }
    handleClose()
  }, [onStartNext, handleClose])

  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setShowNotification(true)
        // Trigger enter animation after a brief delay
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })

      // Auto-close after delay
      const autoCloseTimer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)

      return () => clearTimeout(autoCloseTimer)
    } else {
      // When isVisible becomes false, immediately reset internal state
      requestAnimationFrame(() => {
        setIsAnimating(false)
        setShowNotification(false)
      })
    }
  }, [isVisible, autoCloseDelay, handleClose])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Play notification sound and show browser notification
  useEffect(() => {
    if (isVisible) {
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Fomoduct - ${sessionType === 'work' ? 'Work' : 'Break'} Session`, {
          body: message,
          icon: '/favicon.ico'
        })
      }
    }
  }, [isVisible, message, sessionType])

  if (!showNotification) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`notification-backdrop ${isAnimating ? 'visible' : ''}`}
        onClick={handleClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
            e.preventDefault()
            handleClose()
          }
        }}
        aria-label="Close notification"
      />
      
      {/* Notification Popup */}
      <div
        className={`notification-popup ${isAnimating ? 'visible' : ''} ${sessionType}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        aria-describedby="notification-message"
      >
        <div className="notification-content">
          {/* Icon */}
          <div className="notification-icon">
            {sessionType === 'work' ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 id="notification-title" className="notification-title">
            {sessionType === 'work' ? '🎉 Work Session Complete!' : '☕ Break Time!'}
          </h2>

          {/* Message */}
          <p id="notification-message" className="notification-message">
            {message}
          </p>

          {/* Actions */}
          <div className="notification-actions">
            <button
              type="button"
              className="notification-btn primary"
              onClick={handleStartNext}
            >
              {sessionType === 'work' ? 'Start Break' : 'Start Work'}
            </button>
            <button
              type="button"
              className="notification-btn secondary"
              onClick={handleClose}
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          className="notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  )
}
