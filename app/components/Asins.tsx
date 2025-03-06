import React, { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'
import { XIcon } from 'lucide-react'

interface AsinsProps {
  asins: string[]
  onAddAsin: (asin: string) => void
  onRemoveAsin: (index: number) => void
}

export function Asins({ asins, onAddAsin, onRemoveAsin }: AsinsProps) {
  const [asinInput, setAsinInput] = useState('')

  const handleAddAsin = () => {
    if (asinInput.trim()) {
      onAddAsin(asinInput.trim())
      setAsinInput('')
    }
  }

  return (
    <Card>
      <CardContent>
        <div>
          <Label htmlFor="asins" className="text-lg font-semibold mb-2">
            Add ASINs
          </Label>
          <div className="flex mt-1">
            <Input
              id="asins"
              value={asinInput}
              onChange={(e) => setAsinInput(e.target.value)}
              placeholder="Enter ASIN"
              className="flex-grow"
            />
            <Button type="button" onClick={handleAddAsin} className="ml-2">
              Add
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {asins.map((asin, index) => (
            <Badge key={index} variant="default" className="group p-2 px-3">
              {asin}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => onRemoveAsin(index)}
              >
                <XIcon className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
