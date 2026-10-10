import { useEffect, useRef } from 'react'
import type { DependencyRole } from '../dependencies'
import type { GraphNode as GraphNodeModel, NodeStatus } from '../types'

type GraphNodeProps = {
  node: GraphNodeModel
  selected: boolean
  /** When false, the node can't be selected, dragged or connected (hover still works). */
  editable: boolean
  /** Position relative to the hovered node's dependency chain. */
  role?: DependencyRole
  dimmed?: boolean
  onSelect: (id: string) => void
  onHoverChange: (id: string, hovered: boolean) => void
  onDragStart: (id: string, event: React.PointerEvent) => void
  onSourceHandleDown: (id: string, event: React.PointerEvent) => void
  onSizeChange: (id: string, size: { width: number; height: number }) => void
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (status === 'success') {
    return (
      <span className="graph-node__status graph-node__status--success" aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M4.8 8.2l2.1 2.1 4.3-4.4"
            fill="none"
            stroke="#0d1a12"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="graph-node__status graph-node__status--error" aria-hidden>
        <svg viewBox="0 0 16 16" width="14" height="14">
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M8 4.5v4.2M8 11.2h.01"
            fill="none"
            stroke="#1a0d0d"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
    )
  }
  return (
    <span className="graph-node__status graph-node__status--idle" aria-hidden>
      <svg viewBox="0 0 16 16" width="14" height="14">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function GraphNode({
  node,
  selected,
  editable,
  role,
  dimmed = false,
  onSelect,
  onHoverChange,
  onDragStart,
  onSourceHandleDown,
  onSizeChange,
}: GraphNodeProps) {
  const { data } = node
  const ref = useRef<HTMLDivElement>(null)
  const statusClass =
    data.status === 'success'
      ? 'is-success'
      : data.status === 'error'
        ? 'is-error'
        : 'is-idle'

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const report = () => {
      const width = Math.ceil(el.offsetWidth)
      const height = Math.ceil(el.offsetHeight)
      if (width > 0 && height > 0) {
        onSizeChange(node.id, { width, height })
      }
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [node.id, onSizeChange])

  return (
    <div
      ref={ref}
      className={`graph-node ${statusClass}${selected ? ' is-selected' : ''}${
        role && role !== 'focus' ? ` is-${role}` : ''
      }${dimmed ? ' is-dimmed' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
      }}
      data-node-id={node.id}
      onPointerEnter={() => onHoverChange(node.id, true)}
      onPointerLeave={() => onHoverChange(node.id, false)}
      onPointerDown={(event) => {
        if (!editable) return
        if ((event.target as HTMLElement).closest('[data-handle]')) return
        event.stopPropagation()
        onSelect(node.id)
        onDragStart(node.id, event)
      }}
    >
      <button
        type="button"
        className="graph-node__handle graph-node__handle--target"
        data-handle="target"
        data-node-id={node.id}
        aria-label={`Connect to ${data.title}`}
        aria-hidden={!editable || undefined}
        tabIndex={editable ? undefined : -1}
        onPointerDown={(event) => event.stopPropagation()}
      />

      <div className="graph-node__header">
        <div className="graph-node__header-row">
          <StatusIcon status={data.status} />
          {role === 'upstream' || role === 'downstream' ? (
            <span className={`graph-node__role graph-node__role--${role}`}>
              {role === 'upstream' ? 'Dependency' : 'Dependent'}
            </span>
          ) : null}
        </div>
        {data.stats ? (
          <p className="graph-node__stats">{data.stats}</p>
        ) : null}
      </div>

      <h3 className="graph-node__title">{data.title}</h3>
      {data.subtitle ? (
        <p className="graph-node__subtitle">{data.subtitle}</p>
      ) : null}

      {data.badge ? (
        <div className="graph-node__footer">
          <span className="graph-node__badge">{data.badge}</span>
        </div>
      ) : null}

      <button
        type="button"
        className="graph-node__handle graph-node__handle--source"
        data-handle="source"
        data-node-id={node.id}
        aria-label={`Connect from ${data.title}`}
        aria-hidden={!editable || undefined}
        tabIndex={editable ? undefined : -1}
        onPointerDown={(event) => {
          if (editable) onSourceHandleDown(node.id, event)
        }}
      />
    </div>
  )
}
