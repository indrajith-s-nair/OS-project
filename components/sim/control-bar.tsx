'use client'

import { FastForward, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { SPEEDS, type StepPlayer } from '@/hooks/use-step-player'
import { cn } from '@/lib/utils'

const secondaryButton =
  'h-9 border-neutral-300 bg-white px-3 text-neutral-800 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-black dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-neutral-100'

interface ControlBarProps {
  children: ReactNode
  player: StepPlayer
  disabled: boolean
}

export function ControlBar({ children, player, disabled }: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 dark:border-neutral-900 dark:bg-neutral-950">
      {children}

      <Button
        onClick={player.simulate}
        disabled={disabled}
        className="h-9 bg-indigo-600 px-4 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
      >
        <Play aria-hidden="true" />
        Simulate
      </Button>

      <Button
        variant="outline"
        onClick={player.stepForward}
        disabled={disabled || player.atEnd}
        className={secondaryButton}
      >
        <StepForward aria-hidden="true" />
        Step Forward
      </Button>

      <Button variant="outline" onClick={player.toggleAuto} disabled={disabled} className={secondaryButton}>
        {player.playing ? <Pause aria-hidden="true" /> : <FastForward aria-hidden="true" />}
        {player.playing ? 'Pause' : 'Auto-Play'}
      </Button>

      <Button variant="outline" onClick={player.reset} className={secondaryButton}>
        <RotateCcw aria-hidden="true" />
        Reset
      </Button>

      <div
        role="group"
        aria-label="Playback speed"
        className="flex h-9 items-center gap-0.5 rounded-lg border border-neutral-300 bg-neutral-100 p-0.5 dark:border-neutral-800 dark:bg-black"
      >
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            aria-pressed={player.speed === speed}
            onClick={() => player.setSpeed(speed)}
            className={cn(
              'h-full rounded-md px-2.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              player.speed === speed
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
            )}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
