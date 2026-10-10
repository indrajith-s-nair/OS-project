import type { BannerTone } from './types'

export const SEGMENT_TABLE = [
  { base: 1400, limit: 400 },
  { base: 6300, limit: 400 },
  { base: 4300, limit: 400 },
]
export const PHYSICAL_MEMORY_SIZE = 8000

export interface SegmentationCalc {
  segment: number
  offset: number
  base: number | null
  limit: number | null
  physical: number | null
}

export interface SegmentationStep {
  stage: number
  trap: boolean
  calc: SegmentationCalc
  message: string
  tone: BannerTone
}

export function simulateSegmentation(segment: number, offset: number): SegmentationStep[] {
  const entry = SEGMENT_TABLE[segment] ?? null
  const calc: SegmentationCalc = {
    segment,
    offset,
    base: entry?.base ?? null,
    limit: entry?.limit ?? null,
    physical: entry && offset < entry.limit ? entry.base + offset : null,
  }

  const steps: SegmentationStep[] = [
    {
      stage: 0,
      trap: false,
      calc,
      message: `Logical address <s, d> = <${segment}, ${offset}>. Ready to translate.`,
      tone: 'neutral',
    },
  ]

  if (!entry) {
    steps.push({
      stage: 3,
      trap: true,
      calc,
      message: `TRAP: Segment ${segment} does not exist in the segment table. Addressing error.`,
      tone: 'danger',
    })
    return steps
  }

  steps.push(
    {
      stage: 1,
      trap: false,
      calc,
      message: `Segment ${segment} -> Table row ${segment}: Base = ${entry.base}, Limit = ${entry.limit}.`,
      tone: 'info',
    },
    {
      stage: 2,
      trap: false,
      calc,
      message: `Comparing: Offset (${offset}) < Limit (${entry.limit})?`,
      tone: 'info',
    },
  )

  if (offset >= entry.limit) {
    steps.push({
      stage: 3,
      trap: true,
      calc,
      message: `${offset} >= ${entry.limit}. TRAP: Addressing Error (Segmentation Fault). Execution halted.`,
      tone: 'danger',
    })
    return steps
  }

  steps.push(
    {
      stage: 3,
      trap: false,
      calc,
      message: `${offset} < ${entry.limit} (Legal access).`,
      tone: 'success',
    },
    {
      stage: 4,
      trap: false,
      calc,
      message: `Physical Address = ${entry.base} + ${offset} = ${entry.base + offset}.`,
      tone: 'info',
    },
    {
      stage: 5,
      trap: false,
      calc,
      message: `Accessing byte ${entry.base + offset} inside Segment ${segment} in physical memory.`,
      tone: 'success',
    },
  )

  return steps
}
