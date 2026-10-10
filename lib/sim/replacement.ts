import type { BannerTone } from './types'

export type ReplacementPolicy = 'fifo' | 'lru' | 'optimal'

export interface ReplacementStep {
  reference: number[]
  current: number
  frames: (number | null)[]
  ages: (number | null)[]
  victimPointer: number
  highlight: { frame: number; tone: 'hit' | 'fault' | 'victim' } | null
  results: ('hit' | 'fault' | null)[]
  hits: number
  faults: number
  lookahead: ({ steps: number | null } | null)[]
  trace: { from: number; to: number; target: number | null } | null
  message: string
  tone: BannerTone
}

export function simulateReplacement(
  reference: number[],
  frameCount: number,
  policy: ReplacementPolicy,
): ReplacementStep[] {
  const frames: (number | null)[] = Array(frameCount).fill(null)
  const ages: (number | null)[] = Array(frameCount).fill(null)
  const results: ('hit' | 'fault' | null)[] = Array(reference.length).fill(null)
  let lookahead: ({ steps: number | null } | null)[] = Array(frameCount).fill(null)
  let victimPointer = 0
  let hits = 0
  let faults = 0
  let current = -1
  const steps: ReplacementStep[] = []

  const push = (partial: Partial<ReplacementStep> & { message: string }) => {
    steps.push({
      reference,
      current,
      frames: [...frames],
      ages: [...ages],
      victimPointer,
      highlight: null,
      results: [...results],
      hits,
      faults,
      lookahead: [...lookahead],
      trace: null,
      tone: 'neutral',
      ...partial,
    })
  }

  push({ message: `Ready: ${reference.length} page requests, ${frameCount} empty frames.` })

  reference.forEach((page, i) => {
    current = i

    if (policy === 'lru') {
      for (let f = 0; f < frameCount; f++) {
        if (ages[f] !== null) ages[f] = (ages[f] as number) + 1
      }
      push({ message: `Request page ${page}. All frame age counters tick up (+1).`, tone: 'info' })
    } else {
      push({ message: `Request page ${page}. Checking frames...`, tone: 'info' })
    }

    const hitFrame = frames.indexOf(page)
    if (hitFrame !== -1) {
      hits++
      results[i] = 'hit'
      if (policy === 'lru') ages[hitFrame] = 0
      push({
        highlight: { frame: hitFrame, tone: 'hit' },
        message:
          policy === 'lru'
            ? `Hit! Page ${page} is in Frame ${hitFrame}. Its counter resets to 0.`
            : `Hit! Page ${page} is already in Frame ${hitFrame}.`,
        tone: 'success',
      })
      return
    }

    faults++
    results[i] = 'fault'
    const emptyFrame = frames.indexOf(null)
    let target: number

    if (policy === 'fifo') {
      target = victimPointer
      push({
        highlight: { frame: target, tone: 'fault' },
        message:
          frames[target] === null
            ? `Page fault! Page ${page} is not in memory. Victim pointer is at empty Frame ${target}.`
            : `Page fault! Victim pointer at Frame ${target} evicts page ${frames[target]} (oldest).`,
        tone: 'danger',
      })
    } else if (emptyFrame !== -1) {
      target = emptyFrame
      push({
        highlight: { frame: target, tone: 'fault' },
        message: `Page fault! Page ${page} is not in memory. Frame ${target} is empty.`,
        tone: 'danger',
      })
    } else if (policy === 'lru') {
      target = 0
      for (let f = 1; f < frameCount; f++) {
        if ((ages[f] as number) > (ages[target] as number)) target = f
      }
      push({
        highlight: { frame: target, tone: 'victim' },
        message: `Page fault! Frame ${target} (page ${frames[target]}, last used ${ages[target]} steps ago) is least recently used -> victim.`,
        tone: 'danger',
      })
    } else {
      push({
        message: `Page fault! All frames are full. Looking ahead for each loaded page's next use...`,
        tone: 'danger',
      })
      for (let f = 0; f < frameCount; f++) {
        const next = reference.indexOf(frames[f] as number, i + 1)
        const distance = next === -1 ? null : next - i
        lookahead[f] = { steps: distance }
        push({
          trace: { from: i + 1, to: next === -1 ? reference.length - 1 : next, target: next === -1 ? null : next },
          message:
            distance === null
              ? `Page ${frames[f]} (Frame ${f}): never used again (∞).`
              : `Page ${frames[f]} (Frame ${f}): next used in +${distance} steps.`,
          tone: 'info',
        })
      }
      target = 0
      const distanceOf = (f: number) => lookahead[f]?.steps ?? Number.POSITIVE_INFINITY
      for (let f = 1; f < frameCount; f++) {
        if (distanceOf(f) > distanceOf(target)) target = f
      }
      push({
        highlight: { frame: target, tone: 'victim' },
        message: `Frame ${target} (page ${frames[target]}) has the farthest next use -> victim.`,
        tone: 'danger',
      })
    }

    const evicted = frames[target]
    frames[target] = page
    if (policy === 'lru') ages[target] = 0
    if (policy === 'fifo') victimPointer = (target + 1) % frameCount
    lookahead = Array(frameCount).fill(null)

    const loadedMessage =
      evicted === null
        ? `Loaded page ${page} into Frame ${target}.`
        : `Evicted page ${evicted}; loaded page ${page} into Frame ${target}.`
    push({
      highlight: { frame: target, tone: 'fault' },
      message:
        policy === 'fifo'
          ? `${loadedMessage} Victim pointer -> Frame ${victimPointer}.`
          : policy === 'lru'
            ? `${loadedMessage} Its counter resets to 0.`
            : loadedMessage,
      tone: 'danger',
    })
  })

  current = reference.length
  const hitRate = reference.length ? ((hits / reference.length) * 100).toFixed(1) : '0.0'
  push({
    message: `Simulation complete: ${hits} hits, ${faults} faults, hit rate ${hitRate}%.`,
    tone: 'neutral',
  })

  return steps
}
