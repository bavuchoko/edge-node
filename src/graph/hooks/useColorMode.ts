import { useCallback, useState, useSyncExternalStore } from 'react'
import type { GraphColorMode } from '../theme'

export type ColorModePreference = GraphColorMode | 'system'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

function subscribeSystemColorMode(onChange: () => void) {
  const media = window.matchMedia(LIGHT_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSystemColorMode(): GraphColorMode {
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

function getServerColorMode(): GraphColorMode {
  return 'dark'
}

/** Current OS color scheme, updated live. Returns `'dark'` during SSR. */
export function useSystemColorMode(): GraphColorMode {
  return useSyncExternalStore(subscribeSystemColorMode, getSystemColorMode, getServerColorMode)
}

function isColorModePreference(value: unknown): value is ColorModePreference {
  return value === 'dark' || value === 'light' || value === 'system'
}

function readStoredMode(storageKey: string | undefined): ColorModePreference | null {
  if (!storageKey || typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(storageKey)
    return isColorModePreference(stored) ? stored : null
  } catch {
    return null
  }
}

function writeStoredMode(storageKey: string | undefined, mode: ColorModePreference) {
  if (!storageKey || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, mode)
  } catch {
    // storage unavailable (private mode, blocked cookies) — keep in-memory only
  }
}

type UseColorModeOptions = {
  /** Used when nothing is stored yet. Defaults to `'system'`. */
  defaultMode?: ColorModePreference
  /** localStorage key to persist the choice under. Omit to skip persistence. */
  storageKey?: string
}

/**
 * Color mode state for a `GraphCanvas` host: tracks the user's preference,
 * resolves `'system'` against the OS setting and optionally persists it.
 */
export function useColorMode({ defaultMode = 'system', storageKey }: UseColorModeOptions = {}) {
  const [mode, setModeState] = useState<ColorModePreference>(
    () => readStoredMode(storageKey) ?? defaultMode,
  )
  const systemMode = useSystemColorMode()
  const resolvedMode: GraphColorMode = mode === 'system' ? systemMode : mode

  const setMode = useCallback(
    (next: ColorModePreference) => {
      setModeState(next)
      writeStoredMode(storageKey, next)
    },
    [storageKey],
  )

  const toggle = useCallback(() => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark')
  }, [resolvedMode, setMode])

  return { mode, resolvedMode, setMode, toggle }
}
