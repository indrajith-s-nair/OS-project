'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

import type { BannerTone } from '@/lib/sim/types'
import { cn } from '@/lib/utils'

const toneClasses: Record<BannerTone, string> = {
  neutral: 'border-slate-700 bg-black text-slate-300',
  info: 'border-amber-400/40 bg-amber-400/5 text-amber-200',
  success: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
  danger: 'border-rose-500/50 bg-rose-950/60 text-rose-300',
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
      className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-neutral-950"
    >
      <div className="flex-1 p-4 sm:p-6">{children}</div>
      <div className="border-t border-slate-800 p-3 sm:p-4">
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
            toneClasses[tone],
          )}
        >
          <span className="shrink-0 rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs text-slate-300">
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
