import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/_protected/analyze')({
  component: RouteComponent,
})

function RouteComponent() {
  const [asin, setAsin] = useState('')

  return (
    <div className="container mx-auto p-6 flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Enter the ASIN of the product you want to analyze</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input type="text" placeholder="ASIN" value={asin} onChange={(e) => setAsin(e.target.value)} />
          <Button>Analyze</Button>
        </CardContent>
      </Card>
    </div>
  )
}
