import * as React from 'react'

import { cn } from '~/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'input input-bordered w-full',
        props['aria-invalid'] && 'input-error',
        props.disabled && 'input-disabled',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
