'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'

import { ConnectorArrows } from '@/components/sim/connector-arrows'
import { ControlBar } from '@/components/sim/control-bar'
import { LabeledInput } from '@/components/sim/labeled-input'
import { StageCard, stepLabelFor } from '@/components/sim/stage-card'
import { useStepPlayer } from '@/hooks/use-step-player'
import { PAGE_TABLE, PHYSICAL_FRAMES, type PagingStep, simulatePaging } from '@/lib/sim/paging'
import { parseInteger } from '@/lib/sim/parse'
import { cn } from '@/lib/utils'

const reveal = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export function PagingView() {
  const [logicalInput, setLogicalInput] = useState('13')
  const [pageSizeInput, setPageSizeInput] = useState('4')

  const logical = parseInteger(logicalInput, 0, 99999)
  const pageSize = parseInteger(pageSizeInput, 1, 4096)
  const error =
    logical === null
      ? 'Logical address must be a whole number from 0 to 99999.'
      : pageSize === null
        ? 'Page size must be a whole number from 1 to 4096 bytes.'
        : null

  const player = useStepPlayer(() =>
    logical !== null && pageSize !== null ? simulatePaging(logical, pageSize) : null,
  )
  const step: PagingStep | null =
    player.step ?? (logical !== null && pageSize !== null ? simulatePaging(logical, pageSize)[0] : null)

  return (
    <div className="flex flex-col gap-4">
      <ControlBar player={player} disabled={error !== null}>
        <LabeledInput
          id="paging-logical"
          label="Logical Address"
          value={logicalInput}
          onChange={setLogicalInput}
          invalid={logical === null}
          className="w-full sm:w-52"
        />
        <LabeledInput
          id="paging-page-size"
          label="Page Size (bytes)"
          value={pageSizeInput}
          onChange={setPageSizeInput}
          invalid={pageSize === null}
          className="w-full sm:w-52"
        />
      </ControlBar>

      <StageCard
        message={error ?? step?.message ?? ''}
        tone={error ? 'danger' : (step?.tone ?? 'neutral')}
        stepLabel={stepLabelFor(player.started, player.index, player.total)}
      >
        {step ? <PagingStage step={step} /> : null}
      </StageCard>
    </div>
  )
}

function PagingStage({ step }: { step: PagingStep }) {
  const { stage, calc, invalid } = step
  const containerRef = useRef<HTMLDivElement>(null)
  const pageCellRef = useRef<HTMLSpanElement>(null)
  const rowFrameRefs = useRef<(HTMLSpanElement | null)[]>([])
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const frameRefs = useRef<(HTMLLIElement | null)[]>([])

  const pageOfFrame = (frame: number) => PAGE_TABLE.indexOf(frame)

  return (
    <div ref={containerRef} className="relative">
      <ConnectorArrows
        containerRef={containerRef}
        connections={[
          {
            id: `p-${calc.page}`,
            from: () => pageCellRef.current,
            to: () => rowRefs.current[calc.page] ?? null,
            color: '#22d3ee',
            visible: stage >= 2 && !invalid,
          },
          {
            id: `f-${calc.frame}`,
            from: () => rowFrameRefs.current[calc.page] ?? null,
            to: () => (calc.frame !== null ? frameRefs.current[calc.frame] : null),
            color: '#fbbf24',
            visible: stage >= 4,
          },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-20">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Logical Address</h3>
            <p className="font-mono text-3xl font-semibold text-slate-100">{calc.logical}</p>
          </div>

          <div className="grid max-w-xs grid-cols-2 overflow-hidden rounded-lg border-2 border-slate-700">
            <div
              className={cn(
                'flex flex-col items-center gap-1 border-r-2 border-slate-700 p-3 transition-colors duration-300',
                stage >= 1 ? 'bg-cyan-950/60 text-cyan-300' : 'bg-black text-slate-500',
              )}
            >
              <span className="text-[11px] uppercase tracking-wider opacity-80">Page Number (p)</span>
              <span className="font-mono text-2xl font-semibold">{stage >= 1 ? calc.page : '?'}</span>
            </div>
            <div
              className={cn(
                'flex flex-col items-center gap-1 p-3 transition-colors duration-300',
                stage >= 1 ? 'bg-purple-950/60 text-purple-300' : 'bg-black text-slate-500',
              )}
            >
              <span className="text-[11px] uppercase tracking-wider opacity-80">Offset (d)</span>
              <span className="font-mono text-2xl font-semibold">{stage >= 1 ? calc.offset : '?'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 font-mono text-sm">
            <AnimatePresence>
              {stage >= 1 ? (
                <motion.p key="page" {...reveal} className="text-cyan-300">
                  <span ref={pageCellRef} className="pr-2">
                    {`Page Number = Math.floor(${calc.logical} / ${calc.pageSize}) = ${calc.page}`}
                  </span>
                </motion.p>
              ) : null}
              {stage >= 1 ? (
                <motion.p key="offset" {...reveal} className="text-purple-300">
                  {`Offset = ${calc.logical} % ${calc.pageSize} = ${calc.offset}`}
                </motion.p>
              ) : null}
              {stage >= 5 && calc.frame !== null ? (
                <motion.p
                  key="physical"
                  {...reveal}
                  className="mt-2 rounded-lg border-2 border-emerald-500 bg-emerald-950/80 px-3 py-2 text-emerald-300"
                >
                  {`Physical Address = (${calc.frame} * ${calc.pageSize}) + ${calc.offset} = ${calc.physical}`}
                </motion.p>
              ) : null}
              {invalid ? (
                <motion.p
                  key="invalid"
                  {...reveal}
                  className="mt-2 rounded-lg border-2 border-rose-500 bg-rose-950/80 px-3 py-2 text-rose-300"
                >
                  {`TRAP: Page ${calc.page} is not in the page table`}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Page Table</h3>
          <ol className="flex w-full flex-col gap-1.5 lg:w-48" aria-label="Page table">
            {PAGE_TABLE.map((frame, page) => {
              const active = page === calc.page
              return (
                <li
                  key={page}
                  ref={(el) => {
                    rowRefs.current[page] = el
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md border-2 px-3 py-2 font-mono text-sm transition-colors duration-300',
                    active && stage >= 3
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                      : active && stage >= 2
                        ? 'border-cyan-400/70 bg-neutral-800 text-slate-200'
                        : 'border-slate-800 bg-black text-slate-400',
                  )}
                >
                  <span>{`Page ${page}`}</span>
                  <span
                    ref={(el) => {
                      rowFrameRefs.current[page] = el
                    }}
                  >
                    {`-> Frame ${frame}`}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">Physical Memory</h3>
          <ol className="flex w-full flex-col gap-1 lg:w-60" aria-label="Physical memory frames">
            {Array.from({ length: PHYSICAL_FRAMES }, (_, frame) => {
              const target = frame === calc.frame && stage >= 4
              const page = pageOfFrame(frame)
              const start = frame * calc.pageSize
              return (
                <li
                  key={frame}
                  ref={(el) => {
                    frameRefs.current[frame] = el
                  }}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-md border-2 px-3 py-1.5 text-xs transition-colors duration-300',
                    target
                      ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                      : page !== -1
                        ? 'border-indigo-500/60 bg-indigo-950/50 text-indigo-200'
                        : 'border-dashed border-slate-700 bg-neutral-900 text-slate-400',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{`Frame ${frame}`}</span>
                    <span className="opacity-80">{page !== -1 ? `Page ${page}` : 'free'}</span>
                    <span className="font-mono opacity-70">{`${start}–${start + calc.pageSize - 1}`}</span>
                  </div>
                  {target && calc.pageSize <= 16 ? (
                    <div className="flex gap-1" aria-label={`Bytes of frame ${frame}`}>
                      {Array.from({ length: calc.pageSize }, (_, byte) => (
                        <span
                          key={byte}
                          className={cn(
                            'flex h-5 flex-1 items-center justify-center rounded-sm font-mono text-[10px] transition-colors duration-300',
                            stage >= 5 && byte === calc.offset
                              ? 'bg-purple-500 text-white'
                              : 'bg-emerald-900/60 text-emerald-300/70',
                          )}
                        >
                          {start + byte}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
