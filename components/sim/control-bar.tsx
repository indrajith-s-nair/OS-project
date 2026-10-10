'use client'

import { FastForward, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { SPEEDS, type StepPlayer } from '@/hooks/use-step-player'
import { cn } from '@/lib/utils'

const secondaryButton =
  'h-9 border-slate-700 bg-black px-3 text-slate-200 hover:bg-neutral-800 hover:text-slate-100 dark:border-slate-700 dark:bg-black dark:hover:bg-neutral-800'

interface ControlBarProps {
  children: ReactNode
  player: StepPlayer
  disabled: boolean
}

export function ControlBar({ children, player, disabled }: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-neutral-950 p-3 sm:p-4">
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
        className="flex h-9 items-center gap-0.5 rounded-lg border border-slate-700 bg-black p-0.5"
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
                ? 'bg-neutral-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  )
}
