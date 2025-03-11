import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Loader2, BarChart2 } from 'lucide-react'
import { cn } from '~/utils'

export interface ListingData {
  id: number
  marketplace: string
  asins: string[]
  keywords: string[]
  style: string
  tone: number
  created_at: string
  title: string
  description: string
  bullet_points: string[]
  version_id: number
}

interface ListingContentTabProps {
  listing: ListingData
  onAnalyze: () => void
  isAnalyzing: boolean
  hideAnalyzeButton?: boolean
  highlightedKeyword?: string | null
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
  onAnalyze,
  isAnalyzing,
  hideAnalyzeButton,
  highlightedKeyword,
}: ListingContentTabProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            <HighlightedText text={listing.title} keyword={highlightedKeyword} />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bullet Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {listing.bullet_points.map((bullet, index) => (
              <li key={index}>
                <HighlightedText text={bullet} keyword={highlightedKeyword} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">
            <HighlightedText text={listing.description} keyword={highlightedKeyword} />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Marketplace</h3>
              <p>{listing.marketplace}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Style</h3>
              <p className="capitalize">{listing.style}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Tone</h3>
              <p>{listing.tone}/10</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
              <p>{new Date(listing.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
        {!hideAnalyzeButton && (
          <CardFooter>
            <Button onClick={onAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analyze Listing
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
