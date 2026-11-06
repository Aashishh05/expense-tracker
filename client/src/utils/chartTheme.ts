import type { CSSProperties } from 'react';
import { useTheme } from './theme';

/**
 * SVG attributes can't take CSS var() values, so chart colors are read from
 * the computed style instead. Subscribing with useTheme() re-renders the
 * chart when the theme flips, re-reading fresh values.
 */
export function useChartVar(): (name: string, fallback: string) => string {
  useTheme();
  return (name, fallback) => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };
}

/** Tooltip card that follows the theme (surface + line + ink). */
export function useChartTooltip(): CSSProperties {
  const cssVar = useChartVar();
  return {
    borderRadius: 12,
    border: `1px solid ${cssVar('--line', '#e8dcbc')}`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    background: cssVar('--surface', '#fffcf4'),
    color: cssVar('--ink', '#2a1417'),
    fontSize: 13,
    padding: '8px 12px',
  };
}
