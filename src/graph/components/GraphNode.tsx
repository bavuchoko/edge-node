import { useEffect, useRef, type ReactNode } from 'react'
import type { DependencyRole } from '../dependencies'
import type { GraphNode as GraphNodeModel, NodeStatus } from '../types'

type GraphNodeProps = {
  node: GraphNodeModel
  selected: boolean
  /**
   * `true`: the node can be selected, dragged and connected.
   * `false`: view mode — clicking expands/collapses its details instead.
   */
  editable: boolean
  /** Position relative to the hovered node's dependency chain. */
  role?: DependencyRole
  dimmed?: boolean
  onSelect: (id: string) => void
  onHoverChange: (id: string, hovered: boolean) => void
  onDragStart: (id: string, event: React.PointerEvent) => void
  onSourceHandleDown: (id: string, event: React.PointerEvent) => void
  onSizeChange: (id: string, size: { width: number; height: number }) => void
  expanded: boolean
  onToggleExpanded: (id: string) => void
  /** Custom detail body; defaults to `data.details` as label/value rows. */
  renderDetails?: (node: GraphNodeModel) => ReactNode
}

/** Pointer travel (screen px) beyond which a press counts as a drag, not a click. */
const CLICK_SLOP = 4

function DefaultDetails({ node }: { node: GraphNodeModel }) {
  const details = node.data.details ?? []
  return (
    <dl className="graph-node__detail-list">
      {details.map((row) => (
        <div key={row.label} className="graph-node__detail-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
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
  expanded,
  onToggleExpanded,
  renderDetails,
}: GraphNodeProps) {
  const { data } = node
  const ref = useRef<HTMLDivElement>(null)
  const pressStart = useRef<{ x: number; y: number } | null>(null)
  const expandable = !editable && (Boolean(renderDetails) || (data.details?.length ?? 0) > 0)
  const detailsId = `graph-node-details-${node.id}`
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
      }${dimmed ? ' is-dimmed' : ''}${expanded ? ' is-expanded' : ''}${
        expandable ? ' is-expandable' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
      }}
      data-node-id={node.id}
      onPointerEnter={() => onHoverChange(node.id, true)}
      onPointerLeave={() => onHoverChange(node.id, false)}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-handle]')) return
        // Keep the canvas from panning so a click here can open details.
        event.stopPropagation()
        pressStart.current = { x: event.clientX, y: event.clientY }
        if (!editable) return
        onSelect(node.id)
        onDragStart(node.id, event)
      }}
      onClick={(event) => {
        const start = pressStart.current
        pressStart.current = null
        if (!expandable || !start) return
        const target = event.target as HTMLElement
        if (target.closest('[data-handle], .graph-node__details, .graph-node__toggle')) return
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP) return
        onToggleExpanded(node.id)
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
          <div className="graph-node__header-end">
            {role === 'upstream' || role === 'downstream' ? (
              <span className={`graph-node__role graph-node__role--${role}`}>
                {role === 'upstream' ? 'Dependency' : 'Dependent'}
              </span>
            ) : null}
            {expandable ? (
              <button
                type="button"
                className="graph-node__toggle"
                aria-expanded={expanded}
                aria-controls={detailsId}
                aria-label={expanded ? `Hide ${data.title} details` : `Show ${data.title} details`}
                onClick={() => onToggleExpanded(node.id)}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
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

      {expandable && expanded ? (
        <div id={detailsId} className="graph-node__details">
          {renderDetails ? renderDetails(node) : <DefaultDetails node={node} />}
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
