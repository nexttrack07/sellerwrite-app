import * as React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '~/utils'

export interface RadioCardOption {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
}

interface RadioCardGroupProps {
  options: RadioCardOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function RadioCardGroup({ options, value, onChange, className }: RadioCardGroupProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {options.map((option) => (
        <RadioCard
          key={option.id}
          option={option}
          isSelected={value === option.id}
          onSelect={() => onChange(option.id)}
        />
      ))}
    </div>
  )
}

interface RadioCardProps {
  option: RadioCardOption
  isSelected: boolean
  onSelect: () => void
}

function RadioCard({ option, isSelected, onSelect }: RadioCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-lg border p-4 cursor-pointer transition-all',
        'hover:border-primary/50 hover:shadow-sm',
        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card',
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-primary">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      )}

      <div className="mb-2 flex items-center gap-2">
        {option.icon && <div>{option.icon}</div>}
        <h3 className="font-medium">{option.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground">{option.description}</p>
    </div>
  )
}
