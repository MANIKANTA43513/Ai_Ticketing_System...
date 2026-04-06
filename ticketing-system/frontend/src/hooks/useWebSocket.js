import { useEffect, useRef, useState, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.host

export function useWebSocket(onMessage) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const retryRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    // In dev, use vite proxy; in prod use VITE_WS_URL
    const wsUrl = import.meta.env.VITE_WS_URL
      ? `${import.meta.env.VITE_WS_URL}/ws`
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`

    const apiUrl = import.meta.env.VITE_API_URL
    const wsTarget = apiUrl
      ? apiUrl.replace(/^http/, 'ws') + '/ws'
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`

    try {
      const ws = new WebSocket(wsTarget)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        clearTimeout(retryRef.current)
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onMessageRef.current(data)
        } catch {}
      }

      ws.onclose = () => {
        setConnected(false)
        retryRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      retryRef.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return connected
}
