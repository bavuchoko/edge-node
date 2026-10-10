import type { KeyboardEvent } from 'react'
import type { EdgeKind, EdgePatch, GraphEdge, Point } from '../types'

type EdgeEditorProps = {
  edge: GraphEdge
  /** Display names of the connected nodes, used to caption the relation fields. */
  sourceName: string
  targetName: string
  /** Anchor in canvas-relative screen px (edge midpoint). */
  position: Point
  /** Focus the label field on mount — used right after the edge is drawn. */
  autoFocus?: boolean
  onChange: (patch: EdgePatch) => void
  onDelete: () => void
  onClose: () => void
}

const KINDS: Array<{ kind: EdgeKind; title: string; dash?: string }> = [
  { kind: 'required', title: 'Required' },
  { kind: 'optional', title: 'Optional', dash: '3 3' },
]

export function EdgeEditor({
  edge,
  sourceName,
  targetName,
  position,
  autoFocus = false,
  onChange,
  onDelete,
  onClose,
}: EdgeEditorProps) {
  const kind = edge.kind ?? 'required'

  const closeOnEnterOrEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="graph-edge-editor"
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="graph-edge-editor__row">
        <div className="graph-edge-editor__kinds" role="radiogroup" aria-label="Line style">
          {KINDS.map((option) => (
            <button
              key={option.kind}
              type="button"
              role="radio"
              aria-checked={kind === option.kind}
              className={`graph-edge-editor__kind${kind === option.kind ? ' is-active' : ''}`}
              onClick={() => onChange({ kind: option.kind })}
            >
              <svg width="18" height="6" viewBox="0 0 18 6" aria-hidden>
                <line
                  x1="1"
                  y1="3"
                  x2="17"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={option.dash}
                />
              </svg>
              {option.title}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="graph-edge-editor__delete"
          aria-label="Delete connection"
          title="Delete connection"
          onClick={onDelete}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <label className="graph-edge-editor__field">
        <span>Label</span>
        <input
          type="text"
          placeholder="Text on the line"
          maxLength={40}
          value={edge.label ?? ''}
          autoFocus={autoFocus}
          onChange={(event) => onChange({ label: event.target.value })}
          onKeyDown={closeOnEnterOrEscape}
        />
      </label>

      {/* Laid out like the graph: source on the left, target on the right. Each
          input holds that node's relation, shown on its card while the other is hovered. */}
      <fieldset className="graph-edge-editor__relations">
        <legend>Relation</legend>
        <label
          className="graph-edge-editor__relation"
          title={`${sourceName}'s relation — shown on it while ${targetName} is hovered`}
        >
          <span>{sourceName}</span>
          <input
            type="text"
            placeholder="e.g. hosts"
            maxLength={40}
            value={edge.inverseRelation ?? ''}
            onChange={(event) => onChange({ inverseRelation: event.target.value })}
            onKeyDown={closeOnEnterOrEscape}
          />
        </label>
        <svg className="graph-edge-editor__arrow" width="16" height="10" viewBox="0 0 16 10" aria-hidden>
          <path
            d="M1 5h13M10 1l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <label
          className="graph-edge-editor__relation"
          title={`${targetName}'s relation — shown on it while ${sourceName} is hovered`}
        >
          <span>{targetName}</span>
          <input
            type="text"
            placeholder="e.g. runs on"
            maxLength={40}
            value={edge.relation ?? ''}
            onChange={(event) => onChange({ relation: event.target.value })}
            onKeyDown={closeOnEnterOrEscape}
          />
        </label>
      </fieldset>
    </div>
  )
}
