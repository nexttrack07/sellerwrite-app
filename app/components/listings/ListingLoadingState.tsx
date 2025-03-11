import React from 'react'
import { Loader2 } from 'lucide-react'

export function ListingLoadingState() {
  return (
    <div className="container max-w-5xl py-8">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading listing details...</span>
      </div>
    </div>
  )
}
