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
        'flex h-9 min-w-0 items-stretch overflow-hidden rounded-lg border border-slate-700 bg-black focus-within:ring-2 focus-within:ring-indigo-500/50',
        invalid && 'border-rose-500',
        className,
      )}
    >
      <label
        htmlFor={id}
        className="flex shrink-0 items-center border-r border-slate-700 bg-neutral-950 px-3 text-xs font-medium text-slate-400"
      >
        {label}
      </label>
      <Input
        id={id}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 rounded-none border-0 bg-transparent font-mono text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
      />
    </div>
  )
}
