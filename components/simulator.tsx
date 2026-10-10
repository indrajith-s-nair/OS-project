'use client'

import { useState } from 'react'

import { AllocationView } from '@/components/sim/allocation-view'
import { PagingView } from '@/components/sim/paging-view'
import { ReplacementView } from '@/components/sim/replacement-view'
import { SegmentationView } from '@/components/sim/segmentation-view'
import { cn } from '@/lib/utils'

const ALGORITHMS = [
  {
    id: 'first-fit',
    label: 'First Fit',
    title: 'First Fit Memory Allocation',
    description:
      'Scans memory from the top and places each process into the first free hole that is large enough.',
  },
  {
    id: 'best-fit',
    label: 'Best Fit',
    title: 'Best Fit Memory Allocation',
    description:
      'Checks every free hole and picks the smallest one that still fits, leaving the least wasted space.',
  },
  {
    id: 'worst-fit',
    label: 'Worst Fit',
    title: 'Worst Fit Memory Allocation',
    description:
      'Checks every free hole and picks the largest one, leaving the biggest possible leftover fragment.',
  },
  {
    id: 'paging',
    label: 'Paging',
    title: 'Paging (Address Translation)',
    description:
      'Splits a logical address into a page number and offset, then uses the page table to find the physical frame.',
  },
  {
    id: 'segmentation',
    label: 'Segmentation',
    title: 'Segmentation (Base & Limit Translation)',
    description:
      "Checks the offset against the segment's limit, then adds it to the segment's base to get the physical address.",
  },
  {
    id: 'fifo',
    label: 'FIFO',
    title: 'FIFO Page Replacement',
    description: 'When all frames are full, replaces the page that has been in memory the longest.',
  },
  {
    id: 'lru',
    label: 'LRU',
    title: 'LRU (Least Recently Used) Page Replacement',
    description: 'When all frames are full, replaces the page that has gone unused for the longest time.',
  },
  {
    id: 'optimal',
    label: 'Optimal',
    title: 'Optimal Page Replacement',
    description: 'When all frames are full, replaces the page that will not be needed for the longest time.',
  },
] as const

type AlgorithmId = (typeof ALGORITHMS)[number]['id']

function AlgorithmPanel({ id }: { id: AlgorithmId }) {
  switch (id) {
    case 'first-fit':
      return <AllocationView strategy="first" />
    case 'best-fit':
      return <AllocationView strategy="best" />
    case 'worst-fit':
      return <AllocationView strategy="worst" />
    case 'paging':
      return <PagingView />
    case 'segmentation':
      return <SegmentationView />
    case 'fifo':
      return <ReplacementView policy="fifo" />
    case 'lru':
      return <ReplacementView policy="lru" />
    case 'optimal':
      return <ReplacementView policy="optimal" />
  }
}

export function Simulator() {
  const [activeId, setActiveId] = useState<AlgorithmId>('first-fit')
  const active = ALGORITHMS.find((a) => a.id === activeId) ?? ALGORITHMS[0]

  return (
    <div className="min-h-dvh bg-black text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-black/90 backdrop-blur">
        <nav aria-label="Algorithms" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div role="tablist" aria-label="Memory management algorithms" className="flex flex-wrap gap-1.5">
            {ALGORITHMS.map((algorithm) => {
              const selected = algorithm.id === activeId
              return (
                <button
                  key={algorithm.id}
                  id={`tab-${algorithm.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${algorithm.id}`}
                  onClick={() => setActiveId(algorithm.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    selected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-neutral-950 hover:text-slate-100',
                  )}
                >
                  {algorithm.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main
        id={`panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${active.id}`}
        className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            {active.title}
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">{active.description}</p>
        </div>
        <AlgorithmPanel key={active.id} id={active.id} />
      </main>
    </div>
  )
}
