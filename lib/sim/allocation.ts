import type { BannerTone } from './types'

export type FitStrategy = 'first' | 'best' | 'worst'

export interface MemorySegment {
  id: string
  label: string
  size: number
  owner: string | null
}

export interface QueuedProcess {
  name: string
  size: number
  status: 'waiting' | 'active' | 'allocated' | 'rejected'
  blockLabel?: string
}

export type SegmentTone = 'reject' | 'fit' | 'candidate' | 'scan'

export interface AllocationStep {
  segments: MemorySegment[]
  processes: QueuedProcess[]
  pointerId: string | null
  highlight: { id: string; tone: SegmentTone } | null
  candidate: { label: string; size: number } | null
  candidateVersion: number
  message: string
  tone: BannerTone
}

export function simulateAllocation(
  blockSizes: number[],
  processSizes: number[],
  strategy: FitStrategy,
): AllocationStep[] {
  let segments: MemorySegment[] = blockSizes.map((size, i) => ({
    id: `b${i}`,
    label: `Block ${i}`,
    size,
    owner: null,
  }))
  const processes: QueuedProcess[] = processSizes.map((size, i) => ({
    name: `P${i + 1}`,
    size,
    status: 'waiting',
  }))

  const steps: AllocationStep[] = []
  let candidateVersion = 0

  const push = (partial: Partial<AllocationStep> & { message: string }) => {
    steps.push({
      segments: segments.map((s) => ({ ...s })),
      processes: processes.map((p) => ({ ...p })),
      pointerId: null,
      highlight: null,
      candidate: null,
      candidateVersion,
      tone: 'neutral',
      ...partial,
    })
  }

  push({
    message: `Ready: ${blockSizes.length} free blocks in memory, ${processSizes.length} processes waiting in the queue.`,
  })

  for (const process of processes) {
    process.status = 'active'
    push({ message: `${process.name} (${process.size}KB) is next in the queue.`, tone: 'info' })

    const freeSegments = segments.filter((s) => s.owner === null)
    let chosen: MemorySegment | null = null
    let candidate: MemorySegment | null = null

    for (const seg of freeSegments) {
      const fits = seg.size >= process.size

      if (strategy === 'first') {
        if (!fits) {
          push({
            pointerId: seg.id,
            highlight: { id: seg.id, tone: 'reject' },
            message: `Checking ${seg.label} (Size: ${seg.size}KB) -> ${seg.size}KB is smaller than ${process.size}KB. Skipping.`,
            tone: 'danger',
          })
          continue
        }
        push({
          pointerId: seg.id,
          highlight: { id: seg.id, tone: 'fit' },
          message: `Checking ${seg.label} (Size: ${seg.size}KB) -> ${seg.size}KB is >= ${process.size}KB. First fit found!`,
          tone: 'success',
        })
        chosen = seg
        break
      }

      const currentCandidate = candidate ? { label: candidate.label, size: candidate.size } : null

      if (!fits) {
        push({
          pointerId: seg.id,
          highlight: { id: seg.id, tone: 'reject' },
          candidate: currentCandidate,
          message: `Checking ${seg.label} (Size: ${seg.size}KB) -> Too small for ${process.name} (${process.size}KB).`,
          tone: 'danger',
        })
        continue
      }

      const isBetter =
        candidate === null ||
        (strategy === 'best' ? seg.size < candidate.size : seg.size > candidate.size)

      if (isBetter) {
        candidate = seg
        candidateVersion++
        push({
          pointerId: seg.id,
          highlight: { id: seg.id, tone: 'candidate' },
          candidate: { label: seg.label, size: seg.size },
          message:
            strategy === 'best'
              ? `Checking ${seg.label} (Size: ${seg.size}KB) -> Fits with ${seg.size - process.size}KB leftover. New best hole.`
              : `Checking ${seg.label} (Size: ${seg.size}KB) -> Fits with ${seg.size - process.size}KB leftover. New largest hole.`,
          tone: 'info',
        })
      } else {
        push({
          pointerId: seg.id,
          highlight: { id: seg.id, tone: 'scan' },
          candidate: currentCandidate,
          message:
            strategy === 'best'
              ? `Checking ${seg.label} (Size: ${seg.size}KB) -> Fits, but leaves more space than ${candidate!.label} (${candidate!.size}KB).`
              : `Checking ${seg.label} (Size: ${seg.size}KB) -> Fits, but is not larger than ${candidate!.label} (${candidate!.size}KB).`,
          tone: 'neutral',
        })
      }
    }

    if (strategy !== 'first' && candidate) {
      chosen = candidate
      push({
        pointerId: candidate.id,
        highlight: { id: candidate.id, tone: 'fit' },
        candidate: { label: candidate.label, size: candidate.size },
        message:
          strategy === 'best'
            ? `Scan complete. Best fit for ${process.name} is ${candidate.label} (${candidate.size}KB).`
            : `Scan complete. Worst fit (largest hole) for ${process.name} is ${candidate.label} (${candidate.size}KB).`,
        tone: 'success',
      })
    }

    if (!chosen) {
      process.status = 'rejected'
      push({
        message: `No free hole can hold ${process.name} (${process.size}KB). ${process.name} must wait.`,
        tone: 'danger',
      })
      continue
    }

    const target = chosen
    const leftover = target.size - process.size
    const allocated: MemorySegment = { ...target, size: process.size, owner: process.name }
    const replacement: MemorySegment[] = [allocated]
    if (leftover > 0) {
      replacement.push({ id: `${target.id}h`, label: `${target.label}'`, size: leftover, owner: null })
    }
    const index = segments.findIndex((s) => s.id === target.id)
    segments = [...segments.slice(0, index), ...replacement, ...segments.slice(index + 1)]
    process.status = 'allocated'
    process.blockLabel = target.label

    push({
      highlight: { id: allocated.id, tone: 'fit' },
      message:
        leftover > 0
          ? `Split ${target.label}: ${process.size}KB allocated to ${process.name}, ${leftover}KB remains as a free hole.`
          : `${target.label} is an exact fit. ${process.size}KB allocated to ${process.name}.`,
      tone: 'success',
    })
  }

  const allocatedCount = processes.filter((p) => p.status === 'allocated').length
  const freeMemory = segments.filter((s) => s.owner === null).reduce((sum, s) => sum + s.size, 0)
  push({
    message: `Simulation complete: ${allocatedCount} of ${processes.length} processes allocated. Free memory remaining: ${freeMemory}KB.`,
    tone: allocatedCount === processes.length ? 'success' : 'neutral',
  })

  return steps
}
