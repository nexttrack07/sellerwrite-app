import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils'

const alertVariants = cva('alert', {
  variants: {
    variant: {
      default: 'alert-info',
      destructive: 'alert-error',
      success: 'alert-success',
      warning: 'alert-warning',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('font-medium', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('text-sm opacity-80', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
