import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils'

const toggleVariants = cva('btn', {
  variants: {
    variant: {
      default: '',
      outline: 'btn-outline',
    },
    size: {
      default: '',
      sm: 'btn-sm',
      lg: 'btn-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), props.pressed && 'btn-active', className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
