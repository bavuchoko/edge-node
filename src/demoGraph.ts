import {
  createInitialState,
  layoutColumns,
  type GraphEdgeInput,
  type GraphState,
} from './graph'

export function createDemoGraph(): GraphState {
  const nodes = layoutColumns([
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
      },
    },
    {
      id: 'notify',
      column: 3,
      row: 0,
      data: {
        title: 'Notify Slack',
        subtitle: '… / Integrations',
        status: 'idle',
        stats: 'Waiting for upstream',
        badge: 'master',
      },
    },
  ])

  // `target` depends on `source`; optional edges are soft (ordering-only) dependencies.
  const edges: GraphEdgeInput[] = [
    { source: 'betaflight', target: 'auto-release', label: 'artifact' },
    { source: 'absa-root', target: 'auto-release', label: 'parent POM' },
    { source: 'auto-release', target: 'publish-npm', label: 'on tag' },
    { source: 'auto-release', target: 'publish-docs', kind: 'optional' },
    { source: 'publish-npm', target: 'notify' },
    { source: 'publish-docs', target: 'notify', kind: 'optional' },
  ]

  return createInitialState(nodes, edges, { x: 48, y: 64, zoom: 0.95 })
}
