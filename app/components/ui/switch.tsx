import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '~/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn('toggle', props.checked && 'toggle-primary', props.disabled && 'toggle-disabled', className)}
      {...props}
    >
      {/* daisyUI toggle doesn't need a separate thumb element */}
    </SwitchPrimitive.Root>
  )
}

export { Switch }
