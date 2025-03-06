import React, { useState } from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'
import { XIcon } from 'lucide-react'

interface KeywordsProps {
  keywords: string[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (index: number) => void
}

export function Keywords({ keywords, onAddKeyword, onRemoveKeyword }: KeywordsProps) {
  const [keywordInput, setKeywordInput] = useState('')

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      onAddKeyword(keywordInput.trim())
      setKeywordInput('')
    }
  }

  return (
    <Card>
      <CardContent>
        <div>
          <Label htmlFor="keywords" className="text-lg font-semibold mb-2">
            Add Keywords
          </Label>
          <div className="flex mt-1">
            <Input
              id="keywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Enter keyword"
              className="flex-grow"
            />
            <Button type="button" onClick={handleAddKeyword} className="ml-2">
              Add
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {keywords.map((keyword, index) => (
            <Badge key={index} variant="outline" className="group">
              {keyword}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => onRemoveKeyword(index)}
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
