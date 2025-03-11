import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { toast } from 'sonner'
import { fetchListing } from '~/server/fetch_listing'
import { analyzeListing } from '~/server/analyze_listing'
import { saveAnalysis, fetchAnalysis } from '~/server/analysis_storage'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ListingContentTab } from '~/components/listings/ListingContentTab'
import { ListingAnalysisTab } from '~/components/listings/ListingAnalysisTab'
import { ListingLoadingState } from '~/components/listings/ListingLoadingState'
import { ListingErrorState } from '~/components/listings/ListingErrorState'
import { Keywords } from '~/components/Keywords'

export const Route = createFileRoute('/_protected/listings/$id')({
  component: ListingDetailsPage,
})

function ListingDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [highlightedKeyword, setHighlightedKeyword] = useState<string | null>(null)

  const fetchListingFn = useServerFn(fetchListing)
  const fetchAnalysisFn = useServerFn(fetchAnalysis)
  const analyzeListingFn = useServerFn(analyzeListing)
  const saveAnalysisFn = useServerFn(saveAnalysis)

  const listingQuery = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingFn({ data: { id: parseInt(id) } }),
  })

  const analysisQuery = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => {
      if (!listingQuery.data) return null
      const result = await fetchAnalysisFn({
        data: {
          listing_id: listingQuery.data.id,
          version_id: listingQuery.data.version_id,
        },
      })
      return result.exists ? result.analysis.analysis_data : null
    },
    enabled: !!listingQuery.data,
  })

  const analyzeListingMutation = useMutation({
    mutationFn: async () => {
      if (!listingQuery.data) {
        throw new Error('No listing data available')
      }

      const result = await analyzeListingFn({
        data: {
          asin: listingQuery.data.asins?.[0] || '',
          productData: {
            title: listingQuery.data.title,
            description: listingQuery.data.description,
            bulletPoints: listingQuery.data.bullet_points,
          },
        },
      })

      if (result.success && result.analysis) {
        await saveAnalysisFn({
          data: {
            listing_id: listingQuery.data.id,
            version_id: listingQuery.data.version_id,
            analysis_data: result.analysis,
          },
        })
      }

      return result.analysis
    },
    onSuccess: (analysisData) => {
      toast.success('Listing analyzed and saved successfully')
      analysisQuery.refetch()
    },
    onError: (error) => {
      toast.error('Failed to analyze listing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  const getScoreBadgeVariant = (score: number): 'success' | 'warning' | 'destructive' => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'destructive'
  }

  const handleGoBack = () => {
    navigate({ to: '/listings' })
  }

  const handleKeywordClick = (keyword: string) => {
    setHighlightedKeyword(highlightedKeyword === keyword ? null : keyword)
  }

  if (listingQuery.isLoading) {
    return <ListingLoadingState />
  }

  if (listingQuery.isError || !listingQuery.data) {
    return <ListingErrorState onGoBack={handleGoBack} />
  }

  return (
    <div className="mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={handleGoBack} className="mr-4">
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Listing Details</h1>
        </div>
        <Button onClick={() => analyzeListingMutation.mutate()} disabled={analyzeListingMutation.isPending}>
          {analyzeListingMutation.isPending ? 'Analyzing...' : 'Analyze Listing'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ASINs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {listingQuery.data?.asins.map((asin: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {asin}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Keywords
            keywords={listingQuery.data?.keywords}
            onAddKeyword={() => {}}
            onRemoveKeyword={() => {}}
            onKeywordClick={handleKeywordClick}
          />
        </div>
        {/* Left Column - Listing Content */}
        <div className="col-span-2">
          <ListingContentTab
            listing={listingQuery.data}
            onAnalyze={() => analyzeListingMutation.mutate()}
            isAnalyzing={analyzeListingMutation.isPending}
            hideAnalyzeButton={true}
            highlightedKeyword={highlightedKeyword}
          />
        </div>

        {/* Right Column - Analysis */}
        <div>
          {analysisQuery.data ? (
            <ListingAnalysisTab analysisData={analysisQuery.data} getScoreBadgeVariant={getScoreBadgeVariant} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  No analysis data available. Click "Analyze Listing" to generate insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
