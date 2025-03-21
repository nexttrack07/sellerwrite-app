import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Loader2, BarChart2, Edit } from 'lucide-react'
import { cn } from '~/utils'

export interface ListingComponentData {
  id: number
  content: string | string[]
  version_number: number
  is_current: boolean
  created_at: string
  analysis_data?: any
}

export interface ListingData {
  id: number
  marketplace: string
  asins: string[]
  style?: string
  tone?: number
  created_at: string
  current_title_id?: number
  current_features_id?: number
  current_description_id?: number
  title?: ListingComponentData
  features?: ListingComponentData
  description?: ListingComponentData
}

interface ListingContentTabProps {
  listing: ListingData
  onAnalyzeTitle?: () => void
  onAnalyzeFeatures?: () => void
  onAnalyzeDescription?: () => void
  onEditTitle?: () => void
  onEditFeatures?: () => void
  onEditDescription?: () => void
  isAnalyzingTitle?: boolean
  isAnalyzingFeatures?: boolean
  isAnalyzingDescription?: boolean
  hideAnalyzeButtons?: boolean
  highlightedKeyword?: string | null
  activeComponent?: 'title' | 'features' | 'description' | null
  onSelect?: (component: 'title' | 'features' | 'description') => void
}

const HighlightedText = ({ text, keyword }: { text: string; keyword: string | null | undefined }) => {
  if (!keyword) return <>{text}</>

  const parts = text.split(new RegExp(`(${keyword})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <span key={i} className="bg-yellow-100 dark:bg-teal-700 rounded px-0.5">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function ListingContentTab({
  listing,
  onAnalyzeTitle,
  onAnalyzeFeatures,
  onAnalyzeDescription,
  onEditTitle,
  onEditFeatures,
  onEditDescription,
  isAnalyzingTitle = false,
  isAnalyzingFeatures = false,
  isAnalyzingDescription = false,
  hideAnalyzeButtons = false,
  highlightedKeyword,
  activeComponent,
  onSelect,
}: ListingContentTabProps) {
  return (
    <div className="space-y-4">
      <Card
        onClick={() => onSelect && onSelect('title')}
        className={cn(
          'transition-colors cursor-pointer',
          activeComponent === 'title' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 border-border',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Title</CardTitle>
          <div className="flex space-x-2">
            {onEditTitle && (
              <Button variant="ghost" size="icon" onClick={onEditTitle} title="Edit Title">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            <HighlightedText
              text={(listing.title?.content as string) || 'No title available'}
              keyword={highlightedKeyword}
            />
          </p>
        </CardContent>
        {!hideAnalyzeButtons && onAnalyzeTitle && (
          <CardFooter>
            <Button onClick={onAnalyzeTitle} disabled={isAnalyzingTitle} className="w-full">
              {isAnalyzingTitle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Title...
                </>
              ) : (
                <>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analyze Title
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card
        onClick={() => onSelect && onSelect('features')}
        className={cn(
          'transition-colors cursor-pointer',
          activeComponent === 'features' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 border-border',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bullet Points</CardTitle>
          <div className="flex space-x-2">
            {onEditFeatures && (
              <Button variant="ghost" size="icon" onClick={onEditFeatures} title="Edit Features">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {((listing.features?.content as string[]) || []).map((bullet, index) => (
              <li key={index}>
                <HighlightedText text={bullet} keyword={highlightedKeyword} />
              </li>
            ))}
            {(!listing.features?.content || (listing.features.content as string[]).length === 0) && (
              <li>No bullet points available</li>
            )}
          </ul>
        </CardContent>
        {!hideAnalyzeButtons && onAnalyzeFeatures && (
          <CardFooter>
            <Button onClick={onAnalyzeFeatures} disabled={isAnalyzingFeatures} className="w-full">
              {isAnalyzingFeatures ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Features...
                </>
              ) : (
                <>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analyze Features
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card
        onClick={() => onSelect && onSelect('description')}
        className={cn(
          'transition-colors cursor-pointer',
          activeComponent === 'description' ? 'border-primary bg-primary/5' : 'hover:border-primary/50 border-border',
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Description</CardTitle>
          <div className="flex space-x-2">
            {onEditDescription && (
              <Button variant="ghost" size="icon" onClick={onEditDescription} title="Edit Description">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">
            <HighlightedText
              text={(listing.description?.content as string) || 'No description available'}
              keyword={highlightedKeyword}
            />
          </p>
        </CardContent>
        {!hideAnalyzeButtons && onAnalyzeDescription && (
          <CardFooter>
            <Button onClick={onAnalyzeDescription} disabled={isAnalyzingDescription} className="w-full">
              {isAnalyzingDescription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Description...
                </>
              ) : (
                <>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analyze Description
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
