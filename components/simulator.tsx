'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

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
  const [isDark, setIsDark] = useState(true)
  const active = ALGORITHMS.find((a) => a.id === activeId) ?? ALGORITHMS[0]

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div
      className={cn(
        'min-h-dvh bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-black dark:text-neutral-200',
        isDark && 'dark',
      )}
    >
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur transition-colors dark:border-neutral-900 dark:bg-black/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <nav aria-label="Algorithms" className="min-w-0 flex-1">
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
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100',
                    )}
                  >
                    {algorithm.label}
                  </button>
                )
              })}
            </div>
          </nav>

          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          >
            {isDark ? (
              <Sun className="size-4.5 transition-transform hover:rotate-45" aria-hidden="true" />
            ) : (
              <Moon className="size-4.5 transition-transform hover:-rotate-12" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main
        id={`panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${active.id}`}
        className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {active.title}
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
            {active.description}
          </p>
        </div>
        <AlgorithmPanel key={active.id} id={active.id} />
      </main>
    </div>
  )
}
