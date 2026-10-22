'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import type { BannerTone } from '@/lib/sim/types'
import { cn } from '@/lib/utils'

const toneClasses: Record<BannerTone, string> = {
  neutral: 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-black dark:text-neutral-300',
  info: 'border-amber-400/50 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200',
  success: 'border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-300',
  danger: 'border-rose-500/50 bg-rose-50 text-rose-900 dark:border-rose-500/50 dark:bg-rose-950/60 dark:text-rose-300',
}

interface StageCardProps {
  children: ReactNode
  message: string
  tone: BannerTone
  stepLabel: string
}

export function StageCard({ children, message, tone, stepLabel }: StageCardProps) {
  return (
    <section
      aria-label="Animation stage"
      className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors dark:border-neutral-900 dark:bg-neutral-950"
    >
      <div className="flex-1 p-4 sm:p-6">{children}</div>
      <div className="border-t border-neutral-200 p-3 sm:p-4 dark:border-neutral-900">
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
            toneClasses[tone],
          )}
        >
          <span className="shrink-0 rounded bg-neutral-200 px-2 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {stepLabel}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="min-w-0 text-pretty leading-relaxed"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export function stepLabelFor(started: boolean, index: number, total: number) {
  return started ? `Step ${index + 1}/${total}` : 'Ready'
}
