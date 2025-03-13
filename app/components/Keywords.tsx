import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '@/components/ui/button'
import { XIcon, EyeIcon, PencilIcon, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '~/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface KeywordUsage {
  keyword: string
  usedIn?: {
    title?: boolean
    features?: boolean
    description?: boolean
  }
}

export interface KeywordsProps {
  keywords: string[] | KeywordUsage[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onKeywordClick?: (keyword: string) => void
  onReExtract?: () => void
  isReExtracting?: boolean
  activeComponent?: 'title' | 'features' | 'description' | null
}

export function Keywords({
  keywords = [],
  onAddKeyword,
  onRemoveKeyword,
  onKeywordClick,
  onReExtract,
  isReExtracting,
  activeComponent,
}: KeywordsProps) {
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
  
  // Helper to check if a keyword is a string or KeywordUsage object
  const isKeywordObject = (keyword: string | KeywordUsage): keyword is KeywordUsage => {
    return typeof keyword !== 'string'
  }
  
  // Get keyword string regardless of type
  const getKeywordString = (keyword: string | KeywordUsage): string => {
    return isKeywordObject(keyword) ? keyword.keyword : keyword
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Keywords</CardTitle>
        <div className="flex gap-2">
          {onReExtract && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReExtract}
              disabled={isReExtracting}
              className="flex items-center"
            >
              {isReExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Re-extract</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleEditMode} className="h-8 w-8">
            {isEditMode ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
          </Button>
        </div>
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
          {keywords.map((keywordItem, index) => {
            const keywordString = getKeywordString(keywordItem)
            const keywordUsage = isKeywordObject(keywordItem) ? keywordItem.usedIn : undefined
            
            // Determine if this keyword is used in the active component
            const isUsedInActiveComponent = activeComponent && keywordUsage ? 
              keywordUsage[activeComponent] : false
              
            return (
              <li
                key={index}
                onClick={() => handleKeywordClick(keywordString)}
                className={cn(
                  'group flex items-center justify-between py-1.5 px-3 rounded-md border transition-all',
                  !isEditMode && 'cursor-pointer',
                  keywordString === selectedKeyword
                    ? 'border-blue-500 bg-primary/10'
                    : isUsedInActiveComponent
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:border-muted-foreground hover:bg-muted',
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm transition-colors',
                      keywordString === selectedKeyword 
                        ? 'text-foreground' 
                        : isUsedInActiveComponent
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {keywordString}
                  </span>
                  
                  {/* Show usage indicators if we have that data */}
                  {keywordUsage && (
                    <div className="flex gap-1">
                      <TooltipProvider>
                        {keywordUsage.title && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "h-4 px-1 text-[10px]",
                                  activeComponent === 'title' && "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                )}
                              >
                                T
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Used in Title</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {keywordUsage.features && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "h-4 px-1 text-[10px]",
                                  activeComponent === 'features' && "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                )}
                              >
                                F
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Used in Features</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {keywordUsage.description && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "h-4 px-1 text-[10px]",
                                  activeComponent === 'description' && "bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                )}
                              >
                                D
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Used in Description</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  )}
                </div>
                
                {isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent keyword click when removing
                      onRemoveKeyword(keywordString)
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
