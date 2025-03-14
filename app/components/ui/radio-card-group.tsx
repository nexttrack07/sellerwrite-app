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
  size?: 'default' | 'small'
}

export function RadioCardGroup({ options, value, onChange, className, size = 'default' }: RadioCardGroupProps) {
  return (
    <div className={cn('grid gap-4', size === 'small' ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3', className)}>
      {options.map((option) => (
        <RadioCard
          key={option.id}
          option={option}
          isSelected={value === option.id}
          onSelect={() => onChange(option.id)}
          size={size}
        />
      ))}
    </div>
  )
}

interface RadioCardProps {
  option: RadioCardOption
  isSelected: boolean
  onSelect: () => void
  size?: 'default' | 'small'
}

function RadioCard({ option, isSelected, onSelect, size = 'default' }: RadioCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-lg border cursor-pointer transition-all',
        size === 'small' ? 'p-2 text-sm' : 'p-4',
        'hover:border-primary hover:shadow-sm',
        isSelected ? 'border-primary bg-primary bg-opacity-5 shadow-sm' : 'border-base-300 bg-base-100',
      )}
    >
      {isSelected && (
        <div className={cn('absolute text-primary', size === 'small' ? 'top-1 right-1' : 'top-3 right-3')}>
          <CheckCircle2 className={size === 'small' ? 'h-3 w-3' : 'h-5 w-5'} />
        </div>
      )}

      <div className={cn('flex items-center gap-2', size === 'small' ? 'mb-0.5' : 'mb-2')}>
        {option.icon && <div>{option.icon}</div>}
        <h3 className={cn('font-medium', size === 'small' ? 'text-sm' : '')}>{option.title}</h3>
      </div>

      {size !== 'small' && <p className="text-sm text-base-content text-opacity-70">{option.description}</p>}
    </div>
  )
}
