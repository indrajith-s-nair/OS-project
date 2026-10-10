'use client'

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { ControlBar } from '@/components/sim/control-bar'
import { LabeledInput } from '@/components/sim/labeled-input'
import { StageCard, stepLabelFor } from '@/components/sim/stage-card'
import { useStepPlayer } from '@/hooks/use-step-player'
import {
  type AllocationStep,
  type FitStrategy,
  type QueuedProcess,
  type SegmentTone,
  simulateAllocation,
} from '@/lib/sim/allocation'
import { parseNumberList } from '@/lib/sim/parse'
import { cn } from '@/lib/utils'

const DEFAULT_BLOCKS = '100, 500, 200, 300, 600'
const DEFAULT_PROCESSES = '212, 417, 112, 426'
const STACK_HEIGHT = 360
const MIN_BLOCK_HEIGHT = 30
const spring = { type: 'spring', stiffness: 260, damping: 28 } as const

const segmentToneClasses: Record<SegmentTone, string> = {
  reject: 'border-rose-500 bg-rose-950/80 text-rose-300',
  fit: 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
  candidate: 'border-amber-400 text-amber-300',
  scan: 'border-amber-400/60',
}

const processStatusClasses: Record<QueuedProcess['status'], string> = {
  waiting: 'border-slate-700 bg-neutral-950 text-slate-300',
  active: 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
  allocated: 'border-indigo-500 bg-indigo-950/80 text-indigo-200',
  rejected: 'border-rose-500 bg-rose-950/80 text-rose-300',
}

export function AllocationView({ strategy }: { strategy: FitStrategy }) {
  const [blocksInput, setBlocksInput] = useState(DEFAULT_BLOCKS)
  const [processInput, setProcessInput] = useState(DEFAULT_PROCESSES)

  const blocks = parseNumberList(blocksInput, { min: 1, maxItems: 10 })
  const processes = parseNumberList(processInput, { min: 1, maxItems: 10 })
  const error = !blocks
    ? 'Blocks must be 1–10 comma-separated positive whole numbers (KB).'
    : !processes
      ? 'Processes must be 1–10 comma-separated positive whole numbers (KB).'
      : null

  const player = useStepPlayer(() =>
    blocks && processes ? simulateAllocation(blocks, processes, strategy) : null,
  )

  const step: AllocationStep | null =
    player.step ?? (blocks && processes ? simulateAllocation(blocks, processes, strategy)[0] : null)

  return (
    <div className="flex flex-col gap-4">
      <ControlBar player={player} disabled={error !== null}>
        <LabeledInput
          id={`${strategy}-blocks`}
          label="Blocks (KB)"
          value={blocksInput}
          onChange={setBlocksInput}
          invalid={!blocks}
          className="w-full sm:w-72"
        />
        <LabeledInput
          id={`${strategy}-processes`}
          label="Processes (KB)"
          value={processInput}
          onChange={setProcessInput}
          invalid={!processes}
          className="w-full sm:w-64"
        />
      </ControlBar>

      <StageCard
        message={error ?? step?.message ?? ''}
        tone={error ? 'danger' : (step?.tone ?? 'neutral')}
        stepLabel={stepLabelFor(player.started, player.index, player.total)}
      >
        {step ? <AllocationStage step={step} strategy={strategy} /> : null}
      </StageCard>
    </div>
  )
}

function AllocationStage({ step, strategy }: { step: AllocationStep; strategy: FitStrategy }) {
  const totalMemory = step.segments.reduce((sum, s) => sum + s.size, 0)

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-2 pl-8">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Memory</h3>
          {strategy !== 'first' ? (
            <CandidateBadge
              strategy={strategy}
              candidate={step.candidate}
              version={step.candidateVersion}
            />
          ) : null}
        </div>

        <LayoutGroup id={`alloc-${strategy}`}>
          <ul className="flex flex-col gap-1.5" aria-label="Memory blocks">
            <AnimatePresence initial={false}>
              {step.segments.map((seg) => {
                const height = Math.max(MIN_BLOCK_HEIGHT, (seg.size / totalMemory) * STACK_HEIGHT)
                const tone = step.highlight?.id === seg.id ? step.highlight.tone : null
                const isAllocated = seg.owner !== null
                return (
                  <motion.li
                    key={seg.id}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                  >
                    <div className="flex w-6 shrink-0 justify-center" aria-hidden="true">
                      {step.pointerId === seg.id ? (
                        <motion.div layoutId={`pointer-${strategy}`} transition={spring}>
                          <ChevronRight className="size-6 fill-amber-400/20 text-amber-400" />
                        </motion.div>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'flex h-full w-full min-w-0 items-center justify-between gap-3 rounded-md border-2 px-3 text-xs transition-colors duration-300 sm:w-80',
                        isAllocated
                          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-200'
                          : 'border-dashed border-slate-700 bg-neutral-900 text-slate-400',
                        tone && segmentToneClasses[tone],
                      )}
                    >
                      <span className="truncate font-medium">
                        {seg.label}
                        {isAllocated ? <span className="ml-2 font-semibold">{seg.owner}</span> : null}
                        {!isAllocated ? <span className="ml-2 opacity-70">free</span> : null}
                      </span>
                      <span className="shrink-0 font-mono">{seg.size}KB</span>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      </div>

      <div className="flex flex-col gap-3 lg:w-60">
        <h3 className="flex min-h-7 items-center text-xs font-medium uppercase tracking-wider text-slate-400">
          Process Queue
        </h3>
        <ul className="flex flex-wrap gap-2 lg:flex-col" aria-label="Process queue">
          {step.processes.map((p) => (
            <motion.li
              key={p.name}
              animate={{ scale: p.status === 'active' ? 1.05 : 1 }}
              transition={spring}
              className={cn(
                'flex items-center justify-between gap-3 rounded-full border-2 px-3.5 py-1.5 text-xs transition-colors duration-300',
                processStatusClasses[p.status],
              )}
            >
              <span className="font-semibold">{p.name}</span>
              <span className="font-mono">{p.size}KB</span>
              {p.status === 'allocated' ? <span className="opacity-80">{`→ ${p.blockLabel}`}</span> : null}
              {p.status === 'rejected' ? <span className="opacity-80">waiting</span> : null}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CandidateBadge({
  strategy,
  candidate,
  version,
}: {
  strategy: Exclude<FitStrategy, 'first'>
  candidate: AllocationStep['candidate']
  version: number
}) {
  return (
    <motion.span
      key={candidate ? version : 'none'}
      initial={candidate ? { scale: 1.15, boxShadow: '0 0 0 6px rgba(251, 191, 36, 0.35)' } : false}
      animate={{ scale: 1, boxShadow: '0 0 0 0px rgba(251, 191, 36, 0)' }}
      transition={{ duration: 0.6 }}
      className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300"
    >
      {strategy === 'best' ? 'Current Best Hole: ' : 'Current Largest Hole: '}
      <span className="font-mono">{candidate ? `${candidate.label} (${candidate.size}KB)` : 'None'}</span>
    </motion.span>
  )
}
