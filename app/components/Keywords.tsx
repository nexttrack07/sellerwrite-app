import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { XIcon, EyeIcon, PencilIcon } from 'lucide-react'
import { cn } from '~/utils'

interface KeywordsProps {
  keywords: string[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (index: number) => void
  onKeywordClick?: (keyword: string) => void
}

export function Keywords({ keywords, onAddKeyword, onRemoveKeyword, onKeywordClick }: KeywordsProps) {
  const [keywordInput, setKeywordInput] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      onAddKeyword(keywordInput.trim())
      setKeywordInput('')
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
    setSelectedKeyword(null) // Reset selection when toggling mode
  }

  const handleKeywordClick = (keyword: string) => {
    if (isEditMode) return // Disable click in edit mode
    setSelectedKeyword(keyword === selectedKeyword ? null : keyword)
    onKeywordClick?.(keyword)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Keywords</CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleEditMode} className="h-8 w-8">
          {isEditMode ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditMode && (
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Enter keyword"
                className="flex-grow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddKeyword()
                  }
                }}
              />
              <Button type="button" onClick={handleAddKeyword}>
                Add
              </Button>
            </div>
          </div>
        )}
        <ul className="space-y-1">
          {keywords.map((keyword, index) => (
            <li
              key={index}
              onClick={() => handleKeywordClick(keyword)}
              className={cn(
                'group flex items-center justify-between py-1.5 px-3 rounded-md border transition-all',
                !isEditMode && 'cursor-pointer',
                keyword === selectedKeyword
                  ? 'border-blue-500 bg-primary/10'
                  : 'border-border hover:border-muted-foreground hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'text-sm transition-colors',
                  keyword === selectedKeyword ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {keyword}
              </span>
              {isEditMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent keyword click when removing
                    onRemoveKeyword(index)
                  }}
                >
                  <XIcon className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
