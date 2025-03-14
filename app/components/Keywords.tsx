import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '@/components/ui/button'
import { XIcon, EyeIcon, PencilIcon, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '~/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface KeywordUsage {
  keyword: string
  usedIn: {
    title: boolean
    features: boolean
    description: boolean
  }
}

export interface KeywordsProps {
  // We'll use the listing components directly to extract keywords
  title?: { keywords_used?: string[] | null }
  features?: { keywords_used?: string[] | null }
  description?: { keywords_used?: string[] | null }
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onKeywordClick?: (keyword: string) => void
  onReExtract?: () => void
  isReExtracting?: boolean
  activeComponent?: 'title' | 'features' | 'description' | null
  maxHeight?: string | number
}

export function Keywords({
  title,
  features,
  description,
  onAddKeyword,
  onRemoveKeyword,
  onKeywordClick,
  onReExtract,
  isReExtracting,
  activeComponent,
  maxHeight = '600px',
}: KeywordsProps) {
  const [keywordInput, setKeywordInput] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  // Derive keyword usage from the components
  const keywordUsage = useMemo(() => {
    const result: KeywordUsage[] = []
    const keywordMap = new Map<string, KeywordUsage>()

    // Helper function to safely check if a keyword is in an array
    const isKeywordInArray = (keyword: string, arr?: string[] | null): boolean => {
      if (!arr || !Array.isArray(arr)) return false
      return arr.includes(keyword)
    }

    // Process title keywords
    const titleKeywords = title?.keywords_used || []
    if (Array.isArray(titleKeywords)) {
      titleKeywords.forEach((keyword) => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            keyword,
            usedIn: { title: true, features: false, description: false },
          })
        } else {
          const usage = keywordMap.get(keyword)!
          usage.usedIn.title = true
        }
      })
    }

    // Process features keywords
    const featuresKeywords = features?.keywords_used || []
    if (Array.isArray(featuresKeywords)) {
      featuresKeywords.forEach((keyword) => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            keyword,
            usedIn: { title: false, features: true, description: false },
          })
        } else {
          const usage = keywordMap.get(keyword)!
          usage.usedIn.features = true
        }
      })
    }

    // Process description keywords
    const descriptionKeywords = description?.keywords_used || []
    if (Array.isArray(descriptionKeywords)) {
      descriptionKeywords.forEach((keyword) => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, {
            keyword,
            usedIn: { title: false, features: false, description: true },
          })
        } else {
          const usage = keywordMap.get(keyword)!
          usage.usedIn.description = true
        }
      })
    }

    // Convert map to array
    const keywordsArray = Array.from(keywordMap.values())

    // Sort keywords: first by whether they're used in the active component, then alphabetically
    return keywordsArray.sort((a, b) => {
      // If there's an active component, prioritize keywords used in that component
      if (activeComponent) {
        const aUsedInActive = a.usedIn[activeComponent]
        const bUsedInActive = b.usedIn[activeComponent]

        if (aUsedInActive && !bUsedInActive) return -1
        if (!aUsedInActive && bUsedInActive) return 1
      }

      // If both keywords have the same priority (both used or both not used in active component),
      // sort alphabetically
      return a.keyword.localeCompare(b.keyword)
    })
  }, [title, features, description, activeComponent])

  // For debugging
  useEffect(() => {
    console.log('Title keywords:', title?.keywords_used)
    console.log('Features keywords:', features?.keywords_used)
    console.log('Description keywords:', description?.keywords_used)
    console.log('Processed keyword usage:', keywordUsage)
  }, [title, features, description, keywordUsage])

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

  // Reset selected keyword when active component changes
  useEffect(() => {
    setSelectedKeyword(null)
  }, [activeComponent])

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

        {keywordUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keywords found</p>
        ) : (
          <div
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100 pr-1"
            style={{ maxHeight }}
          >
            <AnimatePresence initial={false}>
              <motion.ul className="space-y-1">
                {keywordUsage.map((keywordItem, index) => {
                  // Determine if this keyword is used in the active component
                  const isUsedInActiveComponent = activeComponent && keywordItem.usedIn[activeComponent]

                  return (
                    <motion.li
                      key={keywordItem.keyword}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        opacity: { duration: 0.2 },
                      }}
                      onClick={() => handleKeywordClick(keywordItem.keyword)}
                      className={cn(
                        'group flex items-center justify-between py-1.5 px-3 rounded-md border transition-all',
                        !isEditMode && 'cursor-pointer',
                        keywordItem.keyword === selectedKeyword
                          ? 'border-primary bg-primary/5'
                          : isUsedInActiveComponent
                            ? 'border-primary bg-primary/5'
                            : 'border hover:border-muted-foreground hover:bg-muted',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm transition-colors',
                            keywordItem.keyword === selectedKeyword
                              ? 'text-foreground'
                              : isUsedInActiveComponent
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {keywordItem.keyword}
                        </span>

                        {/* Show usage indicators */}
                        <div className="flex gap-1">
                          <TooltipProvider>
                            {keywordItem.usedIn.title && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'h-4 px-1 text-[10px]',
                                      activeComponent === 'title' &&
                                        'bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400',
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
                            {keywordItem.usedIn.features && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'h-4 px-1 text-[10px]',
                                      activeComponent === 'features' &&
                                        'bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400',
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
                            {keywordItem.usedIn.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'h-4 px-1 text-[10px]',
                                      activeComponent === 'description' &&
                                        'bg-green-100 border-green-500 text-green-700 dark:bg-green-950/30 dark:text-green-400',
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
                      </div>

                      {isEditMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent keyword click when removing
                            onRemoveKeyword(keywordItem.keyword)
                          }}
                        >
                          <XIcon className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      )}
                    </motion.li>
                  )
                })}
              </motion.ul>
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
