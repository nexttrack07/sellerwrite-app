import React from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

interface ListingErrorStateProps {
  onGoBack: () => void
}

export function ListingErrorState({ onGoBack }: ListingErrorStateProps) {
  return (
    <div className="container max-w-5xl py-8">
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The listing you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={onGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
