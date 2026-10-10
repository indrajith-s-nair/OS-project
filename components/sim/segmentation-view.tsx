'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, OctagonAlert } from 'lucide-react'
import { useRef, useState } from 'react'

import { ConnectorArrows } from '@/components/sim/connector-arrows'
import { ControlBar } from '@/components/sim/control-bar'
import { LabeledInput } from '@/components/sim/labeled-input'
import { StageCard, stepLabelFor } from '@/components/sim/stage-card'
import { useStepPlayer } from '@/hooks/use-step-player'
import { parseInteger } from '@/lib/sim/parse'
import {
  PHYSICAL_MEMORY_SIZE,
  SEGMENT_TABLE,
  type SegmentationStep,
  simulateSegmentation,
} from '@/lib/sim/segmentation'
import { cn } from '@/lib/utils'

const pop = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0 },
  transition: { type: 'spring', stiffness: 320, damping: 24 },
} as const

export function SegmentationView() {
  const [segmentInput, setSegmentInput] = useState('2')
  const [offsetInput, setOffsetInput] = useState('53')

  const segment = parseInteger(segmentInput, 0, 99)
  const offset = parseInteger(offsetInput, 0, 99999)
  const error =
    segment === null
      ? 'Segment number must be a whole number from 0 to 99.'
      : offset === null
        ? 'Offset must be a whole number from 0 to 99999.'
        : null

  const player = useStepPlayer(() =>
    segment !== null && offset !== null ? simulateSegmentation(segment, offset) : null,
  )
  const step: SegmentationStep | null =
    player.step ?? (segment !== null && offset !== null ? simulateSegmentation(segment, offset)[0] : null)

  return (
    <div className="flex flex-col gap-4">
      <ControlBar player={player} disabled={error !== null}>
        <LabeledInput
          id="seg-number"
          label="Segment Number"
          value={segmentInput}
          onChange={setSegmentInput}
          invalid={segment === null}
          className="w-full sm:w-48"
        />
        <LabeledInput
          id="seg-offset"
          label="Offset"
          value={offsetInput}
          onChange={setOffsetInput}
          invalid={offset === null}
          className="w-full sm:w-40"
        />
      </ControlBar>

      <StageCard
        message={error ?? step?.message ?? ''}
        tone={error ? 'danger' : (step?.tone ?? 'neutral')}
        stepLabel={stepLabelFor(player.started, player.index, player.total)}
      >
        {step ? <SegmentationStage step={step} /> : null}
      </StageCard>
    </div>
  )
}

function SegmentationStage({ step }: { step: SegmentationStep }) {
  const { stage, calc, trap } = step
  const containerRef = useRef<HTMLDivElement>(null)
  const segmentCellRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const mathRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={containerRef}
      className="relative"
      animate={trap ? { x: [0, -12, 12, -9, 9, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ConnectorArrows
        containerRef={containerRef}
        connections={[
          {
            id: `s-${calc.segment}`,
            from: () => segmentCellRef.current,
            to: () => rowRefs.current[calc.segment] ?? null,
            color: '#22d3ee',
            visible: stage >= 1 && !trap,
            mode: 'left-loop',
          },
          {
            id: `m-${calc.physical}`,
            from: () => mathRef.current,
            to: () => markerRef.current,
            color: '#34d399',
            visible: stage >= 5,
          },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-14 lg:pl-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Logical Address</h3>
            <div className="grid w-56 grid-cols-2 overflow-hidden rounded-lg border-2 border-slate-700">
              <div
                ref={segmentCellRef}
                className="flex flex-col items-center gap-1 border-r-2 border-slate-700 bg-cyan-950/60 p-2.5 text-cyan-300"
              >
                <span className="text-[11px] uppercase tracking-wider opacity-80">Segment (s)</span>
                <span className="font-mono text-xl font-semibold">{calc.segment}</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-purple-950/60 p-2.5 text-purple-300">
                <span className="text-[11px] uppercase tracking-wider opacity-80">Offset (d)</span>
                <span className="font-mono text-xl font-semibold">{calc.offset}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Segment Table</h3>
            <ol className="flex w-full flex-col gap-1.5 sm:w-72" aria-label="Segment table">
              <li className="grid grid-cols-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">
                <span>Segment</span>
                <span>Base</span>
                <span>Limit</span>
              </li>
              {SEGMENT_TABLE.map((entry, i) => {
                const active = i === calc.segment && stage >= 1 && !trap
                const activeTrap = i === calc.segment && trap
                return (
                  <li
                    key={i}
                    ref={(el) => {
                      rowRefs.current[i] = el
                    }}
                    className={cn(
                      'grid grid-cols-3 rounded-md border-2 px-3 py-2 font-mono text-sm transition-colors duration-300',
                      active
                        ? 'border-amber-400 bg-amber-400/10 text-slate-200'
                        : activeTrap
                          ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                          : 'border-slate-800 bg-black text-slate-400',
                    )}
                  >
                    <span>{i}</span>
                    <span className={cn(active && 'font-semibold text-amber-300')}>{entry.base}</span>
                    <span className={cn(active && 'font-semibold text-amber-300')}>{entry.limit}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Comparator</h3>
          <div className="flex min-h-48 flex-col gap-3 rounded-xl border border-dashed border-slate-700 bg-black/60 p-4">
            <AnimatePresence>
              {stage >= 2 && calc.limit !== null ? (
                <motion.div
                  key="question"
                  {...pop}
                  className="rounded-lg border-2 border-slate-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-slate-200"
                >
                  {`Offset (${calc.offset}) < Limit (${calc.limit})?`}
                </motion.div>
              ) : null}

              {stage >= 3 && !trap ? (
                <motion.div
                  key="legal"
                  {...pop}
                  className="flex items-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-950/80 px-3 py-2 font-mono text-sm text-emerald-300"
                >
                  <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
                  {`${calc.offset} < ${calc.limit} (Legal access)`}
                </motion.div>
              ) : null}

              {trap ? (
                <motion.div
                  key="trap"
                  role="alert"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    boxShadow: [
                      '0 0 0 0px rgba(244, 63, 94, 0.5)',
                      '0 0 0 10px rgba(244, 63, 94, 0)',
                    ],
                  }}
                  transition={{ boxShadow: { duration: 1.2, repeat: Infinity }, default: { duration: 0.3 } }}
                  className="flex items-start gap-2 rounded-lg border-2 border-rose-500 bg-rose-950/80 px-3 py-3 text-sm text-rose-300"
                >
                  <OctagonAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">TRAP: Addressing Error (Segmentation Fault)</span>
                    <span className="font-mono text-xs opacity-80">
                      {calc.limit !== null
                        ? `${calc.offset} >= ${calc.limit}`
                        : `Segment ${calc.segment} does not exist`}
                    </span>
                  </div>
                </motion.div>
              ) : null}

              {stage >= 4 && !trap ? (
                <motion.div
                  key="math"
                  ref={mathRef}
                  {...pop}
                  className="rounded-lg border-2 border-indigo-500 bg-indigo-950/80 px-3 py-2 font-mono text-sm text-indigo-200"
                >
                  {`Physical Address = ${calc.base} + ${calc.offset} = ${calc.physical}`}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Physical Memory</h3>
          <div className="flex gap-3">
            <div className="flex h-[340px] flex-col justify-between font-mono text-[10px] text-slate-500">
              <span>0</span>
              <span>{PHYSICAL_MEMORY_SIZE}</span>
            </div>
            <div className="relative h-[340px] w-24 rounded-md border-2 border-slate-700 bg-black">
              {SEGMENT_TABLE.map((entry, i) => {
                const active = i === calc.segment && stage >= 1 && !trap
                return (
                  <div
                    key={i}
                    className={cn(
                      'absolute inset-x-0 border-y-2 transition-colors duration-300',
                      active && stage >= 5
                        ? 'border-emerald-500 bg-emerald-950/80'
                        : active
                          ? 'border-amber-400 bg-amber-400/15'
                          : 'border-indigo-500 bg-indigo-950/80',
                    )}
                    style={{
                      top: `${(entry.base / PHYSICAL_MEMORY_SIZE) * 100}%`,
                      height: `${(entry.limit / PHYSICAL_MEMORY_SIZE) * 100}%`,
                    }}
                  />
                )
              })}
              {stage >= 5 && calc.physical !== null ? (
                <motion.div
                  ref={markerRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-x-0 h-0.5 bg-emerald-300"
                  style={{ top: `${(calc.physical / PHYSICAL_MEMORY_SIZE) * 100}%` }}
                />
              ) : null}
            </div>
            <div className="relative h-[340px] w-28 font-mono text-[10px]">
              {SEGMENT_TABLE.map((entry, i) => (
                <span
                  key={i}
                  className="absolute left-0 text-slate-400"
                  style={{ top: `${(entry.base / PHYSICAL_MEMORY_SIZE) * 100}%` }}
                >
                  {`Seg ${i}: ${entry.base}–${entry.base + entry.limit}`}
                </span>
              ))}
              {stage >= 5 && calc.physical !== null ? (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-0 font-semibold text-emerald-300"
                  style={{ top: `calc(${(calc.physical / PHYSICAL_MEMORY_SIZE) * 100}% + 10px)` }}
                >
                  {`-> ${calc.physical}`}
                </motion.span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
