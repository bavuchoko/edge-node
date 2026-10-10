import {
  createInitialState,
  layoutColumns,
  type GraphEdgeInput,
  type GraphState,
  type NodeData,
} from './graph'

/** Built-in card fields, plus extra data only the custom integration card uses. */
export type DemoNodeData = NodeData & {
  integration?: {
    service: string
    channel: string
    recipients: number
    lastMessage: string
  }
}

export function createDemoGraph(): GraphState<DemoNodeData> {
  const nodes = layoutColumns<DemoNodeData>([
    {
      id: 'betaflight',
      column: 0,
      row: 0,
      data: {
        title: 'Betaflight Configurator',
        subtitle: '… / TeamCity Plugins',
        status: 'success',
        stats: '#12: 121 statements, 473 branches uncovered',
        badge: 'master',
        details: [
          { label: 'Build', value: '#12 · 4m 12s' },
          { label: 'Commit', value: 'a3f9c21 — Fix serial port reconnect' },
          { label: 'Triggered by', value: 'VCS push (master)' },
          { label: 'Finished', value: '2026-10-10 14:32' },
        ],
      },
    },
    {
      id: 'absa-root',
      column: 0,
      row: 1,
      data: {
        title: 'ABSA OSS Root POM',
        subtitle: '… / TeamCity Plugins',
        status: 'success',
        stats: '#11070: 112 statements, 406 branches uncovered',
        badge: 'master',
        details: [
          { label: 'Build', value: '#11070 · 1m 48s' },
          { label: 'Commit', value: '7d01be4 — Bump plugin versions' },
          { label: 'Triggered by', value: 'Schedule (nightly)' },
          { label: 'Finished', value: '2026-10-10 03:05' },
        ],
      },
    },
    {
      id: 'auto-release',
      column: 1,
      row: 0,
      data: {
        title: 'Auto Release',
        subtitle: '… / Release Pipeline',
        status: 'success',
        stats: '#48: 0 statements, 0 branches uncovered',
        badge: 'master',
        details: [
          { label: 'Build', value: '#48 · 52s' },
          { label: 'Version', value: '2.4.0' },
          { label: 'Triggered by', value: 'Snapshot dependency' },
          { label: 'Finished', value: '2026-10-10 14:40' },
        ],
      },
    },
    {
      id: 'publish-npm',
      column: 2,
      row: 0,
      data: {
        title: 'Publish NPM',
        subtitle: '… / Artifacts',
        status: 'error',
        stats: '#9: 34 statements, 12 branches uncovered',
        badge: 'master',
        details: [
          { label: 'Build', value: '#9 · 38s' },
          { label: 'Error', value: 'npm ERR! 403 — token lacks publish scope' },
          { label: 'Triggered by', value: 'Auto Release #48' },
          { label: 'Finished', value: '2026-10-10 14:41' },
        ],
      },
    },
    {
      id: 'publish-docs',
      column: 2,
      row: 1,
      data: {
        title: 'Publish Docs',
        subtitle: '… / Artifacts',
        status: 'success',
        stats: '#9: 8 statements, 2 branches uncovered',
        badge: 'master',
        details: [
          { label: 'Build', value: '#9 · 1m 05s' },
          { label: 'Target', value: 'gh-pages' },
          { label: 'Triggered by', value: 'Auto Release #48' },
          { label: 'Finished', value: '2026-10-10 14:42' },
        ],
      },
    },
    {
      id: 'notify',
      column: 3,
      row: 0,
      data: {
        title: 'Notify Slack',
        status: 'idle',
        integration: {
          service: 'Slack',
          channel: '#releases',
          recipients: 42,
          lastMessage: 'Auto Release 2.4.0 published to npm and docs.',
        },
      },
    },
  ])

  // `target` depends on `source`; optional edges are soft (ordering-only) dependencies.
  // `label` is drawn on the line. While one end is hovered, the other end's card shows
  // its relation: `relation` on the target ("target … source"),
  // `inverseRelation` on the source ("source … target").
  const edges: GraphEdgeInput[] = [
    {
      source: 'betaflight',
      target: 'auto-release',
      label: 'artifact',
      relation: 'Builds from',
      inverseRelation: 'Built into',
    },
    {
      source: 'absa-root',
      target: 'auto-release',
      label: 'parent POM',
      relation: 'Inherits from',
      inverseRelation: 'Parent of',
    },
    {
      source: 'auto-release',
      target: 'publish-npm',
      label: 'on tag',
      relation: 'Runs on',
      inverseRelation: 'Triggers',
    },
    {
      source: 'auto-release',
      target: 'publish-docs',
      kind: 'optional',
      relation: 'Runs on',
      inverseRelation: 'Triggers',
    },
    { source: 'publish-npm', target: 'notify', relation: 'Reports on', inverseRelation: 'Notifies via' },
    {
      source: 'publish-docs',
      target: 'notify',
      kind: 'optional',
      relation: 'Reports on',
      inverseRelation: 'Notifies via',
    },
  ]

  return createInitialState(nodes, edges, { x: 48, y: 64, zoom: 0.95 })
}
