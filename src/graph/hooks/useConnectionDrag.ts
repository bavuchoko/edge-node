import { useCallback, useEffect, useRef } from 'react'
import type { NodeId, Point } from '../types'

type UseConnectionDragArgs = {
  clientToWorld: (clientX: number, clientY: number) => Point
  onStart: (sourceId: NodeId, pointer: Point) => void
  onMove: (pointer: Point) => void
  onComplete: (targetId: NodeId) => void
  onCancel: () => void
}

export function useConnectionDrag({
  clientToWorld,
  onStart,
  onMove,
  onComplete,
  onCancel,
}: UseConnectionDragArgs) {
  const clientToWorldRef = useRef(clientToWorld)
  const onMoveRef = useRef(onMove)
  const onCompleteRef = useRef(onComplete)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    clientToWorldRef.current = clientToWorld
    onMoveRef.current = onMove
    onCompleteRef.current = onComplete
    onCancelRef.current = onCancel
  })

  const startFromHandle = useCallback(
    (sourceId: NodeId, event: React.PointerEvent) => {
      event.stopPropagation()
      event.preventDefault()

      const pointer = clientToWorldRef.current(event.clientX, event.clientY)
      onStart(sourceId, pointer)

      const onWindowMove = (e: PointerEvent) => {
        onMoveRef.current(clientToWorldRef.current(e.clientX, e.clientY))
      }

      const onWindowUp = (e: PointerEvent) => {
        window.removeEventListener('pointermove', onWindowMove)
        window.removeEventListener('pointerup', onWindowUp)
        window.removeEventListener('pointercancel', onWindowUp)

        const el = document.elementFromPoint(e.clientX, e.clientY)
        const handle = el?.closest('[data-handle="target"]') as HTMLElement | null
        const targetId = handle?.dataset.nodeId
        if (targetId) {
          onCompleteRef.current(targetId)
        } else {
          onCancelRef.current()
        }
      }

      window.addEventListener('pointermove', onWindowMove)
      window.addEventListener('pointerup', onWindowUp)
      window.addEventListener('pointercancel', onWindowUp)
    },
    [onStart],
  )

  return { startFromHandle }
}
