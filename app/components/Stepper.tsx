import React from 'react'
import { cn } from '~/utils'
import { Check } from 'lucide-react'

export interface StepItem {
  title: string
  description?: string
}

interface StepperProps {
  steps: StepItem[]
  currentStep: number
  onStepClick?: (step: number) => void
  className?: string
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <ul className="relative flex flex-col md:flex-row gap-2">
        {steps.map((step, index) => {
          const isActive = currentStep === index
          const isCompleted = currentStep > index

          return (
            <li
              key={index}
              className={cn(
                'md:shrink md:basis-0 flex-1 group flex gap-x-4 md:block',
                onStepClick ? 'cursor-pointer' : '',
              )}
              onClick={() => onStepClick && onStepClick(index)}
            >
              <div className="min-w-10 min-h-10 flex flex-col items-center md:w-full md:inline-flex md:flex-wrap md:flex-row text-xs align-middle">
                {/* Circle indicator */}
                <span
                  className={cn(
                    'size-10 flex justify-center items-center shrink-0 rounded-full border-2 text-sm font-medium',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                </span>

                {/* Connecting line - vertical on mobile, horizontal on desktop */}
                <div
                  className={cn(
                    'mt-2 w-px h-full md:mt-0 md:ms-2 md:w-full md:h-px md:flex-1 group-last:hidden',
                    isCompleted ? 'bg-primary' : 'bg-muted',
                  )}
                ></div>
              </div>

              {/* Step content */}
              <div className="grow md:grow-0 md:mt-3 pb-5">
                <span
                  className={cn(
                    'block text-sm font-medium',
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <p
                    className={cn('text-sm md:block', isActive ? 'text-muted-foreground' : 'text-muted-foreground/70')}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
