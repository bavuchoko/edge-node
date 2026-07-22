import type { CSSProperties } from 'react'

export type GraphTheme = {
  background?: string
  /** Dot grid overlay color. Set to 'transparent' to hide. */
  gridColor?: string
  gridSize?: number
  node?: {
    background?: string
    border?: string
    borderHover?: string
    borderSelected?: string
    title?: string
    subtitle?: string
    shadow?: string
    radius?: number
    handle?: string
    handleActive?: string
    badgeBackground?: string
    badgeText?: string
    statusSuccess?: string
    statusError?: string
    statusIdle?: string
  }
  edge?: {
    color?: string
    hoverColor?: string
    selectedColor?: string
    width?: number
    hoverWidth?: number
    selectedWidth?: number
    /** Invisible hit area width in screen px */
    hitWidth?: number
    draftColor?: string
    draftWidth?: number
    draftDash?: string
  }
  hud?: {
    color?: string
  }
}

export type ResolvedGraphTheme = {
  background: string
  gridColor: string
  gridSize: number
  node: {
    background: string
    border: string
    borderHover: string
    borderSelected: string
    title: string
    subtitle: string
    shadow: string
    radius: number
    handle: string
    handleActive: string
    badgeBackground: string
    badgeText: string
    statusSuccess: string
    statusError: string
    statusIdle: string
  }
  edge: {
    color: string
    hoverColor: string
    selectedColor: string
    width: number
    hoverWidth: number
    selectedWidth: number
    hitWidth: number
    draftColor: string
    draftWidth: number
    draftDash: string
  }
  hud: {
    color: string
  }
}

export const defaultGraphTheme: ResolvedGraphTheme = {
  background: '#141414',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  gridSize: 24,
  node: {
    background: '#1e1e1e',
    border: '#2e2e2e',
    borderHover: '#3f3f46',
    borderSelected: '#60a5fa',
    title: '#f9fafb',
    subtitle: '#6b7280',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    radius: 6,
    handle: '#9ca3af',
    handleActive: '#2563eb',
    badgeBackground: '#2563eb',
    badgeText: '#eff6ff',
    statusSuccess: '#22c55e',
    statusError: '#ef4444',
    statusIdle: '#9ca3af',
  },
  edge: {
    color: '#6b7280',
    hoverColor: '#9ca3af',
    selectedColor: '#93c5fd',
    width: 2,
    hoverWidth: 2.75,
    selectedWidth: 3,
    hitWidth: 32,
    draftColor: '#60a5fa',
    draftWidth: 2,
    draftDash: '6 4',
  },
  hud: {
    color: '#6b7280',
  },
}

export function resolveGraphTheme(partial?: GraphTheme): ResolvedGraphTheme {
  return {
    background: partial?.background ?? defaultGraphTheme.background,
    gridColor: partial?.gridColor ?? defaultGraphTheme.gridColor,
    gridSize: partial?.gridSize ?? defaultGraphTheme.gridSize,
    node: {
      ...defaultGraphTheme.node,
      ...partial?.node,
    },
    edge: {
      ...defaultGraphTheme.edge,
      ...partial?.edge,
    },
    hud: {
      ...defaultGraphTheme.hud,
      ...partial?.hud,
    },
  }
}

export function themeToCssVars(theme: ResolvedGraphTheme): CSSProperties {
  return {
    ['--graph-bg' as string]: theme.background,
    ['--graph-grid-color' as string]: theme.gridColor,
    ['--graph-grid-size' as string]: `${theme.gridSize}px`,
    ['--graph-node-bg' as string]: theme.node.background,
    ['--graph-node-border' as string]: theme.node.border,
    ['--graph-node-border-hover' as string]: theme.node.borderHover,
    ['--graph-node-border-selected' as string]: theme.node.borderSelected,
    ['--graph-node-title' as string]: theme.node.title,
    ['--graph-node-subtitle' as string]: theme.node.subtitle,
    ['--graph-node-shadow' as string]: theme.node.shadow,
    ['--graph-node-radius' as string]: `${theme.node.radius}px`,
    ['--graph-node-handle' as string]: theme.node.handle,
    ['--graph-node-handle-active' as string]: theme.node.handleActive,
    ['--graph-node-badge-bg' as string]: theme.node.badgeBackground,
    ['--graph-node-badge-text' as string]: theme.node.badgeText,
    ['--graph-status-success' as string]: theme.node.statusSuccess,
    ['--graph-status-error' as string]: theme.node.statusError,
    ['--graph-status-idle' as string]: theme.node.statusIdle,
    ['--graph-edge-color' as string]: theme.edge.color,
    ['--graph-edge-hover-color' as string]: theme.edge.hoverColor,
    ['--graph-edge-selected-color' as string]: theme.edge.selectedColor,
    ['--graph-edge-width' as string]: String(theme.edge.width),
    ['--graph-edge-hover-width' as string]: String(theme.edge.hoverWidth),
    ['--graph-edge-selected-width' as string]: String(theme.edge.selectedWidth),
    ['--graph-edge-draft-color' as string]: theme.edge.draftColor,
    ['--graph-edge-draft-width' as string]: String(theme.edge.draftWidth),
    ['--graph-edge-draft-dash' as string]: theme.edge.draftDash,
    ['--graph-hud-color' as string]: theme.hud.color,
  }
}
