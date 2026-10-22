'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LabeledInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  className?: string
}

export function LabeledInput({ id, label, value, onChange, invalid, className }: LabeledInputProps) {
  return (
    <div
      className={cn(
        'flex h-9 min-w-0 items-stretch overflow-hidden rounded-lg border border-neutral-300 bg-white transition-colors focus-within:ring-2 focus-within:ring-indigo-500/50 dark:border-neutral-800 dark:bg-black',
        invalid && 'border-rose-500',
        className,
      )}
    >
      <label
        htmlFor={id}
        className="flex shrink-0 items-center border-r border-neutral-300 bg-neutral-100 px-3 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
      >
        {label}
      </label>
      <Input
        id={id}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 rounded-none border-0 bg-transparent font-mono text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent dark:text-neutral-200 dark:placeholder:text-neutral-500"
      />
    </div>
  )
}
