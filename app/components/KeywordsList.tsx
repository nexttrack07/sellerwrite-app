import React from 'react'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Button } from '~/components/ui/button'
import { X, Tag, TrendingUp, Users } from 'lucide-react'
import type { Keyword } from '~/store/listingStore'

interface KeywordsListProps {
  keywords: Keyword[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  asins: string[]
}

export function KeywordsList({ keywords, onToggle, onRemove, asins }: KeywordsListProps) {
  // Group keywords by their text (case-insensitive) to identify duplicates across ASINs
  const keywordsByText = keywords.reduce(
    (acc, keyword) => {
      const lowerText = keyword.text.toLowerCase()
      if (!acc[lowerText]) {
        acc[lowerText] = []
      }
      acc[lowerText].push(keyword)
      return acc
    },
    {} as Record<string, Keyword[]>,
  )

  // Sort keywords by:
  // 1. Selected status (selected first)
  // 2. Frequency across ASINs (more frequent first)
  // 3. Search volume if available
  const sortedKeywords = Object.values(keywordsByText)
    .sort((a, b) => {
      // Check if any keyword in group a is selected vs any in group b
      const aSelected = a.some((k) => k.selected)
      const bSelected = b.some((k) => k.selected)

      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1

      // Sort by number of sources (frequency)
      if (a.length !== b.length) return b.length - a.length

      // Sort by search volume if available
      const aVolume = parseInt(a[0].searchVolume || '0')
      const bVolume = parseInt(b[0].searchVolume || '0')
      if (aVolume !== bVolume) return bVolume - aVolume

      // Alphabetical as fallback
      return a[0].text.localeCompare(b[0].text)
    })
    .map((group) => group[0]) // Take the first keyword from each group for display

  return (
    <div className="space-y-1.5">
      {sortedKeywords.map((keyword) => {
        const group = keywordsByText[keyword.text.toLowerCase()]
        const sources = new Set(group.map((k) => k.sourceAsin).filter(Boolean) as string[])
        const isMultiSource = sources.size > 1

        return (
          <div
            key={keyword.id}
            className={`flex items-center justify-between p-2 border rounded-md ${
              keyword.selected ? 'border-primary/30 bg-primary/5' : 'border-muted-foreground/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={keyword.selected}
                onCheckedChange={() => onToggle(keyword.id)}
                id={`keyword-${keyword.id}`}
              />
              <div>
                <label htmlFor={`keyword-${keyword.id}`} className="font-medium cursor-pointer text-sm">
                  {keyword.text}
                </label>

                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  {/* Source information - more compact */}
                  {isMultiSource ? (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 py-0 h-5">
                      <Tag className="h-3 w-3" />
                      <span className="text-xs">{sources.size} ASINs</span>
                    </Badge>
                  ) : keyword.sourceAsin ? (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 py-0 h-5">
                      <Tag className="h-3 w-3" />
                      <span className="text-xs truncate max-w-[80px]">{keyword.sourceAsin}</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs py-0 h-5">
                      Custom
                    </Badge>
                  )}

                  {/* Metrics if available - more compact */}
                  {keyword.searchVolume && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 py-0 h-5">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">{keyword.searchVolume}</span>
                    </Badge>
                  )}

                  {keyword.competition && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 py-0 h-5">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{keyword.competition}</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(keyword.id)}
              className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
