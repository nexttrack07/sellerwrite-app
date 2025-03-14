import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils'

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-primary',
      destructive: 'btn-error',
      outline: 'btn-outline',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      link: 'btn-link',
    },
    size: {
      default: '',
      sm: 'btn-sm',
      lg: 'btn-lg',
      icon: 'btn-square',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
