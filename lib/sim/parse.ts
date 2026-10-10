export function parseNumberList(
  input: string,
  { min = 0, maxItems = 30 }: { min?: number; maxItems?: number } = {},
): number[] | null {
  const parts = input.split(/[\s,]+/).filter(Boolean)
  if (parts.length === 0 || parts.length > maxItems) return null
  const numbers = parts.map(Number)
  if (numbers.some((n) => !Number.isInteger(n) || n < min)) return null
  return numbers
}

export function parseInteger(input: string, min: number, max: number): number | null {
  if (input.trim() === '') return null
  const value = Number(input)
  if (!Number.isInteger(value) || value < min || value > max) return null
  return value
}
