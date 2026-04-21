'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { APP_API_URL } from '@/config'
import {
  emitNewOrderReceived,
  NewOrderNotificationPayload,
} from '@/shared/notifications/admin-notification-events'

const MAX_TRACKED_EVENT_IDS = 100
const MAX_RECONNECT_DELAY_MS = 15000

type UseAdminNotificationStreamOptions = {
  onNewOrder?: (payload: NewOrderNotificationPayload) => void
}

export type AdminNotificationItem = {
  payload: NewOrderNotificationPayload
  receivedAt: string
  read: boolean
}

const normalizeBaseUrl = (baseUrl?: string) => {
  if (!baseUrl) return null
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

const MAX_RECENT_NOTIFICATIONS = 20

const isTokenExpired = (token: string) => {
  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) return true
    const normalizedPayloadSegment = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalizedPayloadSegment)) as { exp?: number }
    if (!payload.exp) return true
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export const useAdminNotificationStream = (options: UseAdminNotificationStreamOptions = {}) => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const onNewOrderRef = useRef(options.onNewOrder)
  const reconnectAttemptRef = useRef(0)
  const connectRef = useRef<() => void>(() => {})
  const sourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dedupeQueueRef = useRef<string[]>([])
  const dedupeSetRef = useRef<Set<string>>(new Set())

  const streamUrl = useMemo(() => {
    const baseUrl = normalizeBaseUrl(APP_API_URL)
    if (!baseUrl) return null
    return `${baseUrl}/api/data/notifications/stream`
  }, [])

  const clearReconnectTimer = useCallback(() => {
    if (!reconnectTimerRef.current) return
    clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = null
  }, [])

  const closeStream = useCallback(() => {
    clearReconnectTimer()
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
  }, [clearReconnectTimer])

  const rememberEventId = useCallback((eventId: string) => {
    if (dedupeSetRef.current.has(eventId)) return
    dedupeSetRef.current.add(eventId)
    dedupeQueueRef.current.push(eventId)
    if (dedupeQueueRef.current.length > MAX_TRACKED_EVENT_IDS) {
      const staleId = dedupeQueueRef.current.shift()
      if (staleId) dedupeSetRef.current.delete(staleId)
    }
  }, [])

  useEffect(() => {
    onNewOrderRef.current = options.onNewOrder
  }, [options.onNewOrder])

  const handleNewOrder = useCallback((payload: NewOrderNotificationPayload) => {
    if (payload.eventId && dedupeSetRef.current.has(payload.eventId)) {
      return
    }
    if (payload.eventId) {
      rememberEventId(payload.eventId)
    }
    setNotifications((prev) => {
      const next = [
        {
          payload,
          receivedAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]
      return next.slice(0, MAX_RECENT_NOTIFICATIONS)
    })
    emitNewOrderReceived(payload)
    onNewOrderRef.current?.(payload)
  }, [rememberEventId])

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimer()
    reconnectAttemptRef.current += 1
    const delayMs = Math.min(
      1000 * Math.pow(2, reconnectAttemptRef.current - 1),
      MAX_RECONNECT_DELAY_MS,
    )
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null
      connectRef.current()
    }, delayMs)
  }, [clearReconnectTimer])

  const connect = useCallback(() => {
    if (!streamUrl) return
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) return
    if (isTokenExpired(accessToken)) {
      closeStream()
      return
    }

    closeStream()

    const eventSource = new EventSource(
      `${streamUrl}?accessToken=${encodeURIComponent(accessToken)}`,
    )
    sourceRef.current = eventSource

    eventSource.onopen = () => {
      reconnectAttemptRef.current = 0
    }

    eventSource.addEventListener('order.created', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as NewOrderNotificationPayload
        if (event.lastEventId && !payload.eventId) {
          payload.eventId = event.lastEventId
        }
        handleNewOrder(payload)
      } catch {
        // Ignore malformed payloads and keep stream alive.
      }
    })

    eventSource.onerror = () => {
      closeStream()
      const currentToken = localStorage.getItem('accessToken')
      if (!currentToken || isTokenExpired(currentToken)) {
        return
      }
      scheduleReconnect()
    }
  }, [closeStream, handleNewOrder, scheduleReconnect, streamUrl])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const unreadCount = useMemo(
    () => notifications.reduce((total, item) => total + (item.read ? 0 : 1), 0),
    [notifications],
  )

  const resetUnreadCount = useCallback(() => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.read
          ? item
          : {
              ...item,
              read: true,
            },
      ),
    )
  }, [])

  useEffect(() => {
    connect()
    return () => closeStream()
  }, [closeStream, connect])

  return {
    notifications,
    unreadCount,
    resetUnreadCount,
    reconnect: connect,
  }
}
