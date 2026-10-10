'use client'

import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useState } from 'react'

import { ControlBar } from '@/components/sim/control-bar'
import { LabeledInput } from '@/components/sim/labeled-input'
import { StageCard, stepLabelFor } from '@/components/sim/stage-card'
import { useStepPlayer } from '@/hooks/use-step-player'
import { parseInteger, parseNumberList } from '@/lib/sim/parse'
import { type ReplacementPolicy, type ReplacementStep, simulateReplacement } from '@/lib/sim/replacement'
import { cn } from '@/lib/utils'

const DEFAULT_REFERENCE = '7, 0, 1, 2, 0, 3, 0, 4, 2, 3'
const DEFAULT_FRAMES = '3'
const spring = { type: 'spring', stiffness: 300, damping: 26 } as const

export function ReplacementView({ policy }: { policy: ReplacementPolicy }) {
  const [referenceInput, setReferenceInput] = useState(DEFAULT_REFERENCE)
  const [framesInput, setFramesInput] = useState(DEFAULT_FRAMES)

  const reference = parseNumberList(referenceInput, { min: 0, maxItems: 30 })
  const frameCount = parseInteger(framesInput, 1, 8)
  const error = !reference
    ? 'Reference string must be 1–30 comma-separated whole numbers.'
    : frameCount === null
      ? 'Number of frames must be a whole number from 1 to 8.'
      : null

  const player = useStepPlayer(() =>
    reference && frameCount !== null ? simulateReplacement(reference, frameCount, policy) : null,
  )
  const step: ReplacementStep | null =
    player.step ??
    (reference && frameCount !== null ? simulateReplacement(reference, frameCount, policy)[0] : null)

  return (
    <div className="flex flex-col gap-4">
      <ControlBar player={player} disabled={error !== null}>
        <LabeledInput
          id={`${policy}-reference`}
          label="Reference String"
          value={referenceInput}
          onChange={setReferenceInput}
          invalid={!reference}
          className="w-full sm:w-80"
        />
        <LabeledInput
          id={`${policy}-frames`}
          label="Number of Frames"
          value={framesInput}
          onChange={setFramesInput}
          invalid={frameCount === null}
          className="w-full sm:w-48"
        />
      </ControlBar>

      <StageCard
        message={error ?? step?.message ?? ''}
        tone={error ? 'danger' : (step?.tone ?? 'neutral')}
        stepLabel={stepLabelFor(player.started, player.index, player.total)}
      >
        {step ? <ReplacementStage step={step} policy={policy} /> : null}
      </StageCard>
    </div>
  )
}

function ReplacementStage({ step, policy }: { step: ReplacementStep; policy: ReplacementPolicy }) {
  const processed = step.hits + step.faults
  const hitRate = processed ? ((step.hits / processed) * 100).toFixed(1) : '0.0'

  return (
    <div className="flex flex-col gap-8">
      <Conveyor reference={step.reference} step={step} />
      <Frames step={step} policy={policy} />
      <dl className="grid grid-cols-3 gap-3 sm:mx-auto sm:w-full sm:max-w-md">
        <Counter label="Hits" value={step.hits} className="border-emerald-500/50 text-emerald-300" />
        <Counter label="Faults" value={step.faults} className="border-rose-500/50 text-rose-300" />
        <Counter label="Hit Rate %" value={hitRate} className="border-slate-700 text-slate-100" />
      </dl>
    </div>
  )
}

function Conveyor({ reference, step }: { reference: number[]; step: ReplacementStep }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Reference String</h3>
      <ol className="flex flex-wrap gap-2 pt-1" aria-label="Reference string">
        {reference.map((page, i) => {
          const active = i === step.current
          const result = step.results[i]
          const inTrace = step.trace !== null && i >= step.trace.from && i <= step.trace.to
          const traceTarget = step.trace?.target === i
          return (
            <motion.li
              key={i}
              animate={{ scale: active ? 1.1 : 1, y: active ? -4 : 0 }}
              transition={spring}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex size-11 flex-col items-center justify-center rounded-lg border-2 transition-colors duration-300',
                'border-slate-700 bg-black text-slate-300',
                result === 'hit' && 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
                result === 'fault' && 'border-rose-500 bg-rose-950/80 text-rose-300',
                active && 'ring-2 ring-amber-400 bg-neutral-800 text-amber-300',
                inTrace && 'border-amber-400/50 bg-amber-400/10',
                traceTarget && 'border-amber-300 bg-amber-400/25 text-amber-200',
              )}
            >
              <span className="font-mono text-sm font-semibold leading-none">{page}</span>
              <span className="mt-1 font-mono text-[9px] leading-none text-slate-500">{i + 1}</span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}

function Frames({ step, policy }: { step: ReplacementStep; policy: ReplacementPolicy }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Frames</h3>
      <LayoutGroup id={`frames-${policy}`}>
        <ul className="flex flex-wrap justify-center gap-4" aria-label="Memory frames">
          {step.frames.map((page, f) => {
            const tone = step.highlight?.frame === f ? step.highlight.tone : null
            const ahead = step.lookahead[f]
            return (
              <li key={f} className="flex w-32 flex-col items-center gap-2">
                {policy === 'fifo' ? (
                  <div className="flex h-5 items-center">
                    {step.victimPointer === f ? (
                      <motion.div
                        layoutId="fifo-victim"
                        transition={spring}
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-400"
                      >
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                        Oldest / Victim
                      </motion.div>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={cn(
                    'relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border-2 transition-colors duration-300',
                    page === null
                      ? 'border-dashed border-slate-700 bg-neutral-900 text-slate-400'
                      : 'border-indigo-500 bg-indigo-950/80 text-indigo-200',
                    tone === 'hit' && 'border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-lg shadow-emerald-500/20',
                    tone === 'fault' && 'border-rose-500 bg-rose-950/80 text-rose-300 shadow-lg shadow-rose-500/20',
                    tone === 'victim' && 'animate-pulse border-rose-500 bg-rose-950/80 text-rose-300',
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {page !== null ? (
                      <motion.span
                        key={`page-${page}`}
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={spring}
                        className="font-mono text-3xl font-semibold"
                      >
                        {page}
                      </motion.span>
                    ) : (
                      <motion.span key="empty" exit={{ opacity: 0 }} className="text-xs">
                        empty
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-xs text-slate-400">{`Frame ${f}`}</span>

                {policy === 'lru' ? (
                  <span className="text-center text-[11px] text-slate-400">
                    {'Last Used: '}
                    <motion.span
                      key={`${step.ages[f]}`}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      className={cn('font-mono', step.ages[f] === 0 ? 'text-emerald-300' : 'text-slate-200')}
                    >
                      {step.ages[f] === null ? '—' : `${step.ages[f]} steps ago`}
                    </motion.span>
                  </span>
                ) : null}

                {policy === 'optimal' ? (
                  <div className="flex min-h-10 items-start justify-center">
                    <AnimatePresence>
                      {ahead ? (
                        <motion.span
                          key="ahead"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-center text-[11px] text-amber-300"
                        >
                          {ahead.steps === null ? 'Never used again (∞)' : `Next used in +${ahead.steps} steps`}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </LayoutGroup>
    </div>
  )
}

function Counter({ label, value, className }: { label: string; value: number | string; className: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-1 rounded-lg border bg-black px-3 py-2.5', className)}>
      <dt className="text-[11px] uppercase tracking-wider text-slate-400">{label}</dt>
      <dd>
        <motion.span
          key={value}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          className="inline-block font-mono text-xl font-semibold"
        >
          {value}
        </motion.span>
      </dd>
    </div>
  )
}
