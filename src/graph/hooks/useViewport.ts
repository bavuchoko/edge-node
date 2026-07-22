import { useCallback, useEffect, useRef, useState } from 'react'
import { screenToWorld } from '../geometry'
import type { Point, Viewport } from '../types'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5

type UseViewportArgs = {
  viewport: Viewport
  onViewportChange: (viewport: Viewport) => void
}

export function useViewport({ viewport, onViewportChange }: UseViewportArgs) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport
  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange

  const panStart = useRef<{
    pointerId: number
    screen: Point
    viewport: Viewport
  } | null>(null)

  const getOrigin = useCallback((): Point => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }, [])

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      return screenToWorld(
        { x: clientX, y: clientY },
        getOrigin(),
        viewportRef.current,
      )
    },
    [getOrigin],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const current = viewportRef.current
      const origin = getOrigin()
      const mouseX = event.clientX - origin.x
      const mouseY = event.clientY - origin.y

      const zoomFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, current.zoom * zoomFactor),
      )
      if (nextZoom === current.zoom) return

      const worldX = (mouseX - current.x) / current.zoom
      const worldY = (mouseY - current.y) / current.zoom
      onViewportChangeRef.current({
        zoom: nextZoom,
        x: mouseX - worldX * nextZoom,
        y: mouseY - worldY * nextZoom,
      })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [getOrigin])

  const startPan = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    panStart.current = {
      pointerId: event.pointerId,
      screen: { x: event.clientX, y: event.clientY },
      viewport: { ...viewportRef.current },
    }
    setIsPanning(true)
  }, [])

  const movePan = useCallback((event: React.PointerEvent) => {
    const start = panStart.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.screen.x
    const dy = event.clientY - start.screen.y
    onViewportChangeRef.current({
      ...start.viewport,
      x: start.viewport.x + dx,
      y: start.viewport.y + dy,
    })
  }, [])

  const endPan = useCallback((event: React.PointerEvent) => {
    const start = panStart.current
    if (!start || start.pointerId !== event.pointerId) return
    panStart.current = null
    setIsPanning(false)
    try {
      ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
  }, [])

  return {
    containerRef,
    isPanning,
    clientToWorld,
    getOrigin,
    startPan,
    movePan,
    endPan,
  }
}
