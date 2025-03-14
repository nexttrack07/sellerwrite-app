import * as React from 'react'

import { cn } from '~/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'textarea textarea-bordered w-full min-h-16',
        props['aria-invalid'] && 'textarea-error',
        props.disabled && 'textarea-disabled',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
