'use client'

import { motion } from 'framer-motion'
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface Connection {
  id: string
  from: () => HTMLElement | null
  to: () => HTMLElement | null
  color: string
  visible: boolean
  mode?: 'auto' | 'left-loop'
}

interface ConnectorArrowsProps {
  containerRef: RefObject<HTMLElement | null>
  connections: Connection[]
}

const ARROW_GAP = 6

function buildPath(a: DOMRect, b: DOMRect, c: DOMRect, mode: Connection['mode']) {
  if (mode === 'left-loop') {
    const x1 = a.left - c.left
    const y1 = a.top + a.height / 2 - c.top
    const x2 = b.left - c.left - ARROW_GAP
    const y2 = b.top + b.height / 2 - c.top
    const bulge = Math.min(x1, x2) - 36
    return `M ${x1} ${y1} C ${bulge} ${y1}, ${bulge} ${y2}, ${x2} ${y2}`
  }

  if (b.left >= a.right - 4) {
    const x1 = a.right - c.left
    const y1 = a.top + a.height / 2 - c.top
    const x2 = b.left - c.left - ARROW_GAP
    const y2 = b.top + b.height / 2 - c.top
    const dx = Math.max(24, (x2 - x1) / 2)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  const x1 = a.left + a.width / 2 - c.left
  const y1 = a.bottom - c.top
  const x2 = b.left + b.width / 2 - c.left
  const y2 = b.top - c.top - ARROW_GAP
  const dy = Math.max(24, (y2 - y1) / 2)
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`
}

export function ConnectorArrows({ containerRef, connections }: ConnectorArrowsProps) {
  const [paths, setPaths] = useState<Record<string, string>>({})
  const connectionsRef = useRef(connections)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const c = container.getBoundingClientRect()
    const next: Record<string, string> = {}
    for (const conn of connectionsRef.current) {
      if (!conn.visible) continue
      const from = conn.from()
      const to = conn.to()
      if (!from || !to) continue
      next[conn.id] = buildPath(from.getBoundingClientRect(), to.getBoundingClientRect(), c, conn.mode)
    }
    setPaths((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(next)
      const same = prevKeys.length === nextKeys.length && nextKeys.every((k) => prev[k] === next[k])
      return same ? prev : next
    })
  }, [containerRef])

  useLayoutEffect(() => {
    connectionsRef.current = connections
    measure()
    const settle = setTimeout(measure, 450)
    return () => clearTimeout(settle)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [containerRef, measure])

  const colors = Array.from(new Set(connections.map((c) => c.color)))

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible stroke-neutral-300 transition-colors lg:block dark:stroke-neutral-700"
    >
      <defs>
        {colors.map((color) => (
          <marker
            key={color}
            id={`arrow-${color.replace('#', '')}`}
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        ))}
      </defs>
      {connections.map((conn) =>
        conn.visible && paths[conn.id] ? (
          <motion.path
            key={conn.id}
            d={paths[conn.id]}
            fill="none"
            stroke={conn.color}
            strokeWidth={2}
            strokeLinecap="round"
            className="stroke-neutral-300 dark:stroke-neutral-700"
            markerEnd={`url(#arrow-${conn.color.replace('#', '')})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        ) : null,
      )}
    </svg>
  )
}
