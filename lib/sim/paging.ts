import type { BannerTone } from './types'

export const PAGE_TABLE = [2, 5, 1, 6]
export const PHYSICAL_FRAMES = 8

export interface PagingCalc {
  logical: number
  pageSize: number
  page: number
  offset: number
  frame: number | null
  physical: number | null
}

export interface PagingStep {
  stage: number
  invalid: boolean
  calc: PagingCalc
  message: string
  tone: BannerTone
}

export function simulatePaging(logical: number, pageSize: number): PagingStep[] {
  const page = Math.floor(logical / pageSize)
  const offset = logical % pageSize
  const frame = page < PAGE_TABLE.length ? PAGE_TABLE[page] : null
  const physical = frame !== null ? frame * pageSize + offset : null
  const calc: PagingCalc = { logical, pageSize, page, offset, frame, physical }

  const steps: PagingStep[] = [
    {
      stage: 0,
      invalid: false,
      calc,
      message: `Logical address ${logical} with page size ${pageSize} bytes. Ready to translate.`,
      tone: 'neutral',
    },
    {
      stage: 1,
      invalid: false,
      calc,
      message: `Page Number = Math.floor(${logical} / ${pageSize}) = ${page}, Offset = ${logical} % ${pageSize} = ${offset}.`,
      tone: 'info',
    },
    {
      stage: 2,
      invalid: false,
      calc,
      message: `Using p = ${page} as an index into the page table.`,
      tone: 'info',
    },
  ]

  if (frame === null) {
    steps.push({
      stage: 3,
      invalid: true,
      calc,
      message: `TRAP: Page ${page} has no entry in the page table (valid pages: 0–${PAGE_TABLE.length - 1}). Invalid address.`,
      tone: 'danger',
    })
    return steps
  }

  steps.push(
    {
      stage: 3,
      invalid: false,
      calc,
      message: `Page table row ${page} -> Frame = ${frame}.`,
      tone: 'info',
    },
    {
      stage: 4,
      invalid: false,
      calc,
      message: `Frame ${frame} located in physical memory (addresses ${frame * pageSize}–${frame * pageSize + pageSize - 1}).`,
      tone: 'info',
    },
    {
      stage: 5,
      invalid: false,
      calc,
      message: `Physical Address = (${frame} * ${pageSize}) + ${offset} = ${physical}.`,
      tone: 'success',
    },
  )

  return steps
}
