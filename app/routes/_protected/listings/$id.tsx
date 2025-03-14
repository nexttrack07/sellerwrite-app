import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { toast } from 'sonner'
import { fetchListingComponents } from '~/server/fetch_listing_components'
import { analyzeTitle } from '~/server/analyze_title'
import { analyzeFeatures } from '~/server/analyze_features'
import { analyzeDescription } from '~/server/analyze_description'
import { updateTitle } from '~/server/update_title'
import { updateFeatures } from '~/server/update_features'
import { updateDescription } from '~/server/update_description'
import { extractKeywords } from '~/server/extract_keywords'
import { updateListing } from '~/server/update_listing'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ListingContentTab } from '~/components/listings/ListingContentTab'
import { TitleAnalysisTab } from '~/components/listings/TitleAnalysisTab'
import { FeaturesAnalysisTab } from '~/components/listings/FeaturesAnalysisTab'
import { DescriptionAnalysisTab } from '~/components/listings/DescriptionAnalysisTab'
import { ListingLoadingState } from '~/components/listings/ListingLoadingState'
import { ListingErrorState } from '~/components/listings/ListingErrorState'
import { Keywords } from '~/components/Keywords'

export const Route = createFileRoute('/_protected/listings/$id')({
  component: ListingDetailsPage,
})

function ListingDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [highlightedKeyword, setHighlightedKeyword] = useState<string | null>(null)
  const [activeComponent, setActiveComponent] = useState<'title' | 'features' | 'description' | null>(null)

  const fetchListingComponentsFn = useServerFn(fetchListingComponents)
  const analyzeTitleFn = useServerFn(analyzeTitle)
  const analyzeFeaturesFn = useServerFn(analyzeFeatures)
  const analyzeDescriptionFn = useServerFn(analyzeDescription)
  const updateTitleFn = useServerFn(updateTitle)
  const updateFeaturesFn = useServerFn(updateFeatures)
  const updateDescriptionFn = useServerFn(updateDescription)
  const extractKeywordsFn = useServerFn(extractKeywords)
  const updateListingFn = useServerFn(updateListing)

  const listingQuery = useQuery({
    queryKey: ['listing-components', id],
    queryFn: () => fetchListingComponentsFn({ data: { id: parseInt(id) } }),
  })

  const titleAnalysisQuery = useQuery({
    queryKey: ['title-analysis', listingQuery.data?.title?.id],
    queryFn: () => {
      if (!listingQuery.data?.title?.id) return null
      return listingQuery.data.title.analysis_data || null
    },
    enabled: !!listingQuery.data?.title?.id,
  })

  const featuresAnalysisQuery = useQuery({
    queryKey: ['features-analysis', listingQuery.data?.features?.id],
    queryFn: () => {
      if (!listingQuery.data?.features?.id) return null
      return listingQuery.data.features.analysis_data || null
    },
    enabled: !!listingQuery.data?.features?.id,
  })

  const descriptionAnalysisQuery = useQuery({
    queryKey: ['description-analysis', listingQuery.data?.description?.id],
    queryFn: () => {
      if (!listingQuery.data?.description?.id) return null
      return listingQuery.data.description.analysis_data || null
    },
    enabled: !!listingQuery.data?.description?.id,
  })

  const analyzeTitleMutation = useMutation({
    mutationFn: async () => {
      if (!listingQuery.data?.title?.id) {
        throw new Error('No title data available')
      }

      const result = await analyzeTitleFn({
        data: {
          title_id: listingQuery.data.title.id,
          asin: listingQuery.data.listing?.asins?.[0] || '',
        },
      })

      return result
    },
    onSuccess: () => {
      toast.success('Title analyzed successfully')
      queryClient.invalidateQueries({ queryKey: ['listing-components', id] })
      queryClient.invalidateQueries({ queryKey: ['title-analysis', listingQuery.data?.title?.id] })
    },
    onError: (error) => {
      toast.error('Failed to analyze title', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  const analyzeFeaturesMutation = useMutation({
    mutationFn: async () => {
      if (!listingQuery.data?.features?.id) {
        throw new Error('No features data available')
      }

      const result = await analyzeFeaturesFn({
        data: {
          features_id: listingQuery.data.features.id,
          asin: listingQuery.data.listing?.asins?.[0] || '',
        },
      })

      return result
    },
    onSuccess: () => {
      toast.success('Features analyzed successfully')
      queryClient.invalidateQueries({ queryKey: ['listing-components', id] })
      queryClient.invalidateQueries({ queryKey: ['features-analysis', listingQuery.data?.features?.id] })
    },
    onError: (error) => {
      toast.error('Failed to analyze features', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  const analyzeDescriptionMutation = useMutation({
    mutationFn: async () => {
      if (!listingQuery.data?.description?.id) {
        throw new Error('No description data available')
      }

      const result = await analyzeDescriptionFn({
        data: {
          description_id: listingQuery.data.description.id,
          asin: listingQuery.data.listing?.asins?.[0] || '',
        },
      })

      return result
    },
    onSuccess: () => {
      toast.success('Description analyzed successfully')
      queryClient.invalidateQueries({ queryKey: ['listing-components', id] })
      queryClient.invalidateQueries({ queryKey: ['description-analysis', listingQuery.data?.description?.id] })
    },
    onError: (error) => {
      toast.error('Failed to analyze description', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  const extractKeywordsMutation = useMutation({
    mutationFn: async () => {
      if (!listingQuery.data?.listing) {
        throw new Error('No listing data available')
      }

      console.log('Starting keyword extraction')
      console.log('Current title:', listingQuery.data.title)
      console.log('Current features:', listingQuery.data.features)
      console.log('Current description:', listingQuery.data.description)

      const extractedKeywords = new Set<string>()

      // Extract keywords from the title
      const titleResult = await extractKeywordsFn({
        data: {
          content: listingQuery.data.title?.content,
        },
      })

      if (titleResult.success && titleResult.keywords) {
        titleResult.keywords.forEach((keyword: { keyword: string }) => {
          extractedKeywords.add(keyword.keyword)
        })
      }

      // Extract keywords from the features
      const featuresResult = await extractKeywordsFn({
        data: {
          content: listingQuery.data.features?.content.join(' '),
        },
      })

      if (featuresResult.success && featuresResult.keywords) {
        featuresResult.keywords.forEach((keyword: { keyword: string }) => {
          extractedKeywords.add(keyword.keyword)
        })
      }

      // Extract keywords from the description
      const descriptionResult = await extractKeywordsFn({
        data: {
          content: listingQuery.data.description?.content,
        },
      })

      if (descriptionResult.success && descriptionResult.keywords) {
        descriptionResult.keywords.forEach((keyword: { keyword: string }) => {
          extractedKeywords.add(keyword.keyword)
        })
      }

      // Update the title, features, and description with the new keywords
      const keywordsArray = Array.from(extractedKeywords)

      // Track successful updates
      const updates: { component: string; success: boolean }[] = []

      try {
        // Update title if it exists
        if (listingQuery.data.title?.id) {
          const titleUpdateResult = await updateTitleFn({
            data: {
              listing_id: listingQuery.data.title.listing_id,
              content: listingQuery.data.title?.content,
              keywords_used: titleResult.keywords?.map((keyword) => keyword.keyword),
            },
          })
          console.log('Title update result:', titleUpdateResult)
          updates.push({ component: 'title', success: !!titleUpdateResult })
        }
      } catch (error) {
        console.error('Failed to update title keywords:', error)
        updates.push({ component: 'title', success: false })
      }

      try {
        // Update features if they exist
        if (listingQuery.data.features?.id) {
          const featuresUpdateResult = await updateFeaturesFn({
            data: {
              listing_id: listingQuery.data.features.listing_id,
              content: listingQuery.data.features?.content,
              keywords_used: featuresResult.keywords?.map((k) => k.keyword),
            },
          })
          console.log('Features update result:', featuresUpdateResult)
          updates.push({ component: 'features', success: !!featuresUpdateResult })
        }
      } catch (error) {
        console.error('Failed to update features keywords:', error)
        updates.push({ component: 'features', success: false })
      }

      try {
        // Update description if it exists
        if (listingQuery.data.description?.id) {
          const descriptionUpdateResult = await updateDescriptionFn({
            data: {
              listing_id: listingQuery.data.description.listing_id,
              content: listingQuery.data.description?.content,
              keywords_used: descriptionResult.keywords?.map((k) => k.keyword),
            },
          })
          console.log('Description update result:', descriptionUpdateResult)
          updates.push({ component: 'description', success: !!descriptionUpdateResult })
        }
      } catch (error) {
        console.error('Failed to update description keywords:', error)
        updates.push({ component: 'description', success: false })
      }

      // Check if any updates were successful
      const anySuccessful = updates.some((update) => update.success)
      if (!anySuccessful && updates.length > 0) {
        throw new Error('Failed to update any components with new keywords')
      }

      return {
        success: true,
        updates,
        keywordsCount: keywordsArray.length,
      }
    },
    onSuccess: (result) => {
      // Create a more detailed success message
      const successComponents = result.updates
        .filter((u) => u.success)
        .map((u) => u.component)
        .join(', ')

      toast.success(`${result.keywordsCount} keywords extracted and applied to ${successComponents}`, {
        duration: 5000,
      })

      // Invalidate and refetch the listing query
      queryClient.invalidateQueries({ queryKey: ['listing-components', id] })
    },
    onError: (error: Error) => {
      toast.error('Failed to re-extract keywords', {
        description: error.message || 'An unknown error occurred',
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

  const handleReExtractKeywords = () => {
    extractKeywordsMutation.mutate()
  }

  const handleEditTitle = () => {
    setActiveComponent('title')
    // Implement edit title functionality
  }

  const handleEditFeatures = () => {
    setActiveComponent('features')
    // Implement edit features functionality
  }

  const handleEditDescription = () => {
    setActiveComponent('description')
    // Implement edit description functionality
  }

  const handleAnalyzeTitle = () => {
    analyzeTitleMutation.mutate()
  }

  const handleAnalyzeFeatures = () => {
    analyzeFeaturesMutation.mutate()
  }

  const handleAnalyzeDescription = () => {
    analyzeDescriptionMutation.mutate()
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
        <div className="flex space-x-2">
          <Button
            onClick={handleAnalyzeTitle}
            disabled={analyzeTitleMutation.isPending || !listingQuery.data?.title?.id}
            variant="outline"
          >
            {analyzeTitleMutation.isPending ? 'Analyzing Title...' : 'Analyze Title'}
          </Button>
          <Button
            onClick={handleAnalyzeFeatures}
            disabled={analyzeFeaturesMutation.isPending || !listingQuery.data?.features?.id}
            variant="outline"
          >
            {analyzeFeaturesMutation.isPending ? 'Analyzing Features...' : 'Analyze Features'}
          </Button>
          <Button
            onClick={handleAnalyzeDescription}
            disabled={analyzeDescriptionMutation.isPending || !listingQuery.data?.description?.id}
            variant="outline"
          >
            {analyzeDescriptionMutation.isPending ? 'Analyzing Description...' : 'Analyze Description'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ASINs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {listingQuery.data?.listing?.asins?.map((asin: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {asin}
                  </Badge>
                ))}
                {(!listingQuery.data?.listing?.asins || listingQuery.data.listing.asins.length === 0) && (
                  <p className="text-muted-foreground text-sm">No ASINs available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Keywords
            title={listingQuery.data?.title}
            features={listingQuery.data?.features}
            description={listingQuery.data?.description}
            onAddKeyword={() => {}}
            onRemoveKeyword={(keyword: string) => {}}
            onKeywordClick={handleKeywordClick}
            onReExtract={handleReExtractKeywords}
            isReExtracting={extractKeywordsMutation.isPending}
            activeComponent={activeComponent}
          />
        </div>
        {/* Left Column - Listing Content */}
        <div className="col-span-2">
          <ListingContentTab
            listing={{
              id: listingQuery.data?.listing?.id || 0,
              marketplace: listingQuery.data?.listing?.marketplace || '',
              asins: listingQuery.data?.listing?.asins || [],
              created_at: listingQuery.data?.listing?.created_at || '',
              title: listingQuery.data?.title,
              features: listingQuery.data?.features,
              description: listingQuery.data?.description,
              style: listingQuery.data?.listing?.style,
              tone: listingQuery.data?.listing?.tone,
            }}
            onAnalyzeTitle={handleAnalyzeTitle}
            onAnalyzeFeatures={handleAnalyzeFeatures}
            onAnalyzeDescription={handleAnalyzeDescription}
            onEditTitle={handleEditTitle}
            onEditFeatures={handleEditFeatures}
            onEditDescription={handleEditDescription}
            isAnalyzingTitle={analyzeTitleMutation.isPending}
            isAnalyzingFeatures={analyzeFeaturesMutation.isPending}
            isAnalyzingDescription={analyzeDescriptionMutation.isPending}
            hideAnalyzeButtons={true}
            highlightedKeyword={highlightedKeyword}
            onSelect={setActiveComponent}
            activeComponent={activeComponent}
          />
        </div>

        {/* Right Column - Analysis */}
        <div className="space-y-6">
          {titleAnalysisQuery.data ? (
            <TitleAnalysisTab analysisData={titleAnalysisQuery.data} getScoreBadgeVariant={getScoreBadgeVariant} />
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No title analysis available. Click "Analyze Title" to generate insights.
                </p>
              </CardContent>
            </Card>
          )}

          {featuresAnalysisQuery.data ? (
            <FeaturesAnalysisTab
              analysisData={featuresAnalysisQuery.data}
              getScoreBadgeVariant={getScoreBadgeVariant}
            />
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No features analysis available. Click "Analyze Features" to generate insights.
                </p>
              </CardContent>
            </Card>
          )}

          {descriptionAnalysisQuery.data ? (
            <DescriptionAnalysisTab
              analysisData={descriptionAnalysisQuery.data}
              getScoreBadgeVariant={getScoreBadgeVariant}
            />
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No description analysis available. Click "Analyze Description" to generate insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
