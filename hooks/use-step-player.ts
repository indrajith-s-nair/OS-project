'use client'

import { useEffect, useState } from 'react'

export const SPEEDS = [1, 1.5, 2] as const
export type Speed = (typeof SPEEDS)[number]

const BASE_DELAY_MS = 1300

export function useStepPlayer<T>(build: () => T[] | null) {
  const [steps, setSteps] = useState<T[] | null>(null)
  const [index, setIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  const total = steps?.length ?? 0
  const atEnd = steps !== null && index >= total - 1
  const playing = isAutoPlaying && !atEnd

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setIndex((i) => i + 1), BASE_DELAY_MS / speed)
    return () => clearTimeout(timer)
  }, [playing, index, speed])

  const start = (autoPlay: boolean) => {
    const built = build()
    if (!built) return
    setSteps(built)
    setIndex(autoPlay ? 0 : Math.min(1, built.length - 1))
    setIsAutoPlaying(autoPlay)
  }

  return {
    step: steps ? steps[index] : null,
    index,
    total,
    started: steps !== null,
    atEnd,
    playing,
    speed,
    setSpeed,
    simulate: () => start(true),
    stepForward: () => {
      setIsAutoPlaying(false)
      if (!steps) start(false)
      else if (!atEnd) setIndex((i) => i + 1)
    },
    toggleAuto: () => {
      if (!steps || atEnd) start(true)
      else setIsAutoPlaying((p) => !p)
    },
    reset: () => {
      setSteps(null)
      setIndex(0)
      setIsAutoPlaying(false)
    },
  }
}

export type StepPlayer = ReturnType<typeof useStepPlayer>
