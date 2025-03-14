import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Progress } from '~/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { useServerFn } from '@tanstack/react-start'
import { analyzeListing } from '~/server/analyze_listing'
import { fetchProductData } from '~/server/fetch_product'
import { extractKeywords } from '~/server/extract_keywords'
import type { ListingAnalysis } from '~/types/analytics'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Search, Brain, Tag, Save } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { KeywordsTable } from '~/components/KeywordsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useNavigate } from '@tanstack/react-router'
import { createListing } from '~/server/create_listing'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

export const Route = createFileRoute('/_protected/analyze')({
  component: AnalyzePage,
})

function AnalyzePage() {
  const [asin, setAsin] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [productData, setProductData] = useState<any>(null)

  // Add simulated progress state
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Get the server functions
  const fetchProductFn = useServerFn(fetchProductData)
  const analyzeListingFn = useServerFn(analyzeListing)
  const extractKeywordsFn = useServerFn(extractKeywords)
  const createListingFn = useServerFn(createListing)

  // Product data fetch mutation
  const fetchProductMutation = useMutation({
    mutationFn: (data: any) => fetchProductFn({ data }),
  })

  // Analysis mutation - using server function
  const analyzeListingMutation = useMutation({
    mutationFn: (data: any) => analyzeListingFn({ data }),
  })

  // Keyword extraction mutation - using server function
  const extractKeywordsMutation = useMutation({
    mutationFn: (data: any) => extractKeywordsFn({ data }),
  })

  // Add mutation for saving the listing
  const saveListingMutation = useMutation({
    mutationFn: (data: any) => createListingFn({ data }),
    onSuccess: (result) => {
      toast.success('Listing saved successfully!')
      // Navigate to the listing details page
      navigate({ to: '/listings/$id', params: { id: result.listing_id.toString() } })
    },
    onError: (error: Error) => {
      toast.error('Failed to save listing', {
        description: error.message || 'An unknown error occurred',
      })
      console.error(error)
    },
  })

  const navigate = useNavigate()

  // Reset all state and clear analysis
  const resetAnalysis = () => {
    setAsin('')
    setProductData(null)
    setIsAnalyzing(false)
    setSimulatedProgress(0)

    // Clear any running intervals
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }

    // Still need page refresh for the mutations
    if (fetchProductMutation.status !== 'idle') {
      window.location.reload()
    }
  }

  // Monitor product fetch status changes
  useEffect(() => {
    if (fetchProductMutation.status === 'pending') {
      toast.loading('Fetching product data...', {
        id: 'product-toast',
        description: `Getting product information for ASIN: ${asin}`,
      })
    } else if (fetchProductMutation.status === 'success') {
      if (fetchProductMutation.data?.success) {
        toast.success('Product data loaded!', {
          id: 'product-toast',
          description: 'Now starting analysis...',
        })
        setProductData(fetchProductMutation.data.productData)

        // Once we have product data, start the analysis
        analyzeListingMutation.mutate({
          asin,
          productData: fetchProductMutation.data.productData,
        })

        // Also start the keyword extraction
        extractKeywordsMutation.mutate({
          title: fetchProductMutation.data.productData.title,
          description: fetchProductMutation.data.productData.optimizedDescription,
          bulletPoints: fetchProductMutation.data.productData.featureBullets,
        })
      } else if (fetchProductMutation.data?.error) {
        toast.error('Failed to fetch product', {
          id: 'product-toast',
          description: fetchProductMutation.data.message || 'Unable to retrieve product information.',
        })
        console.error(fetchProductMutation.data.message)
      }
    } else if (fetchProductMutation.status === 'error') {
      toast.error('Product fetch failed', {
        id: 'product-toast',
        description: fetchProductMutation.error?.message || 'Unable to retrieve product data.',
      })
      console.error(fetchProductMutation.error?.message)
    }
  }, [fetchProductMutation.status, fetchProductMutation.data, fetchProductMutation.error, asin])

  // Simulated progress bar effect
  useEffect(() => {
    // Start the simulated progress when analysis begins
    if (analyzeListingMutation.status === 'pending' && !progressInterval.current) {
      // Reset progress
      setSimulatedProgress(10)

      // Set up interval to increment progress
      progressInterval.current = setInterval(() => {
        setSimulatedProgress((current) => {
          // Progress gets slower as we approach "completion"
          if (current < 30) return current + 2 // Fast at first
          if (current < 50) return current + 1 // Medium speed
          if (current < 75) return current + 0.5 // Slower
          if (current < 90) return current + 0.2 // Very slow
          return current // Stop at 90%
        })
      }, 500)
    }

    // Clear interval when analysis completes or fails
    if (analyzeListingMutation.status !== 'pending' && progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null

      // Jump to 100% when complete
      if (analyzeListingMutation.status === 'success') {
        setSimulatedProgress(100)
      }
    }

    // Clean up on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [analyzeListingMutation.status])

  // Monitor analysis status changes
  useEffect(() => {
    if (analyzeListingMutation.status === 'pending') {
      toast.loading('Analyzing your product...', {
        id: 'analyze-toast',
        description: 'Our AI is evaluating your listing against best practices',
      })
    } else if (analyzeListingMutation.status === 'success') {
      if (analyzeListingMutation.data?.success) {
        toast.success('Analysis complete!', {
          id: 'analyze-toast',
          description: 'Product listing has been analyzed successfully.',
        })
      } else if (analyzeListingMutation.data?.error) {
        toast.error('Analysis failed', {
          id: 'analyze-toast',
          description: analyzeListingMutation.data.message || 'Unable to analyze this product listing.',
        })
        console.error(analyzeListingMutation.data.message)
      }
    } else if (analyzeListingMutation.status === 'error') {
      toast.error('Analysis failed', {
        id: 'analyze-toast',
        description: analyzeListingMutation.error?.message || 'Something went wrong during analysis.',
      })
      console.error(analyzeListingMutation.error)
    }
  }, [analyzeListingMutation.status, analyzeListingMutation.data, analyzeListingMutation.error])

  // Monitor keyword extraction status
  useEffect(() => {
    if (extractKeywordsMutation.status === 'pending') {
      toast.loading('Extracting keywords...', {
        id: 'keywords-toast',
        description: 'Finding optimal keywords for your listing',
      })
    } else if (extractKeywordsMutation.status === 'success') {
      if (extractKeywordsMutation.data?.success) {
        toast.success('Keywords extracted!', {
          id: 'keywords-toast',
          description: 'Found potential keywords for your listing',
        })
      } else if (extractKeywordsMutation.data?.error) {
        toast.error('Keyword extraction failed', {
          id: 'keywords-toast',
          description: extractKeywordsMutation.data.message || 'Unable to extract keywords',
        })
      }
    } else if (extractKeywordsMutation.status === 'error') {
      toast.error('Keyword extraction failed', {
        id: 'keywords-toast',
        description: extractKeywordsMutation.error?.message || 'Something went wrong',
      })
    }
  }, [extractKeywordsMutation.status, extractKeywordsMutation.data, extractKeywordsMutation.error])

  // Handle form submission - First fetch product data
  const handleAnalyze = async () => {
    if (!asin.trim() || asin.length !== 10) {
      toast.error('Invalid ASIN', {
        description: 'Please enter a valid 10-character ASIN.',
      })
      return
    }

    setIsAnalyzing(true)
    setProductData(null)

    try {
      fetchProductMutation.mutate({ asin })
    } catch (error) {
      console.error('Product fetch error:', error)
      toast.error('Failed to fetch product', {
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
      setIsAnalyzing(false)
    }
  }

  // Display helper for scoring badges
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'destructive'
  }

  // Get the analysis data
  const analysisResult = analyzeListingMutation.data?.success ? analyzeListingMutation.data.analysis : null
  const analysisInProgress = productData && !analysisResult && analyzeListingMutation.status === 'pending'

  // Determine image source
  const productImage = productData?.mainImageUrl || (analyzeListingMutation.data?.listingData?.mainImageUrl as string)
  const productTitle = productData?.title || (analyzeListingMutation.data?.listingData?.title as string)

  // Analysis status messages based on progress
  const getAnalysisStatusMessage = () => {
    if (simulatedProgress < 30) return 'Examining keywords and title structure...'
    if (simulatedProgress < 60) return 'Analyzing product bullets and description...'
    if (simulatedProgress < 85) return 'Evaluating competitor differentiation...'
    return 'Finalizing analysis and preparing recommendations...'
  }

  // Helper to get badge color based on competition
  const getCompetitionBadgeVariant = (competition: string) => {
    switch (competition.toLowerCase()) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  // Helper to get badge color based on volume
  const getVolumeBadgeVariant = (volume: string) => {
    switch (volume.toLowerCase()) {
      case 'high':
        return 'success'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Fix the handleSave function to properly source data
  const handleSave = () => {
    // Check if we have product data
    if (!productData) {
      toast.error('No product data available')
      return
    }

    // Check if we have analysis data
    if (!analyzeListingMutation.data?.success || !analyzeListingMutation.data.analysis) {
      toast.error('No analysis data available')
      return
    }

    const analysis = analyzeListingMutation.data.analysis

    // Get the title from the product data
    const title = productData.title

    // Get the description and bullet points from the analysis
    const description = productData.optimizedDescription

    // Filter out any empty bullet points
    const nonEmptyBulletPoints = productData.featureBullets.filter(
      (point: string) => typeof point === 'string' && point.trim() !== '',
    )

    // Validate required fields
    if (!title) {
      toast.error('Missing product title')
      return
    }

    if (!description) {
      toast.error('Missing product description')
      return
    }

    if (!nonEmptyBulletPoints.length) {
      toast.error('At least one bullet point is required')
      return
    }

    // Prepare the data for saving
    const listingData = {
      title: title,
      description: description,
      bullet_points: nonEmptyBulletPoints,
      asins: [asin],
      keywords:
        extractKeywordsMutation.data?.keywords
          ?.map((k) => (typeof k === 'string' ? k : k.keyword || ''))
          .filter(Boolean) || [],
      marketplace: 'amazon.com',
      style: 'professional',
      tone: 5,
    }

    console.log('Saving listing data:', listingData)

    // Save the listing
    saveListingMutation.mutate({ data: listingData })
  }

  return (
    <div className="container px-6 py-10 max-w-7xl mx-auto">
      {/* Conditional Rendering: Search Form or Product Image Card */}
      <div className="mb-10">
        {!productData ? (
          <Card>
            <CardHeader>
              <CardTitle>Analyze an Amazon Listing</CardTitle>
              <CardDescription>Enter a valid 10-character Amazon ASIN below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={asin}
                  onChange={(e) => setAsin(e.target.value.trim())}
                  placeholder="Example: B01DFKC2SO"
                  className="max-w-md"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={
                    fetchProductMutation.status === 'pending' ||
                    analyzeListingMutation.status === 'pending' ||
                    !asin.trim() ||
                    asin.length !== 10
                  }
                >
                  {fetchProductMutation.status === 'pending'
                    ? 'Fetching...'
                    : analyzeListingMutation.status === 'pending'
                      ? 'Analyzing...'
                      : 'Analyze'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Product Thumbnail - much smaller */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <AspectRatio ratio={1}>
                    {productImage ? (
                      <img src={productImage} alt={productTitle} className="rounded-md object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </AspectRatio>
                </div>

                {/* Product ASIN & Brief Info */}
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate">{productTitle}</div>
                  <div className="text-xs text-muted-foreground">ASIN: {asin}</div>
                </div>

                {/* Save button with tooltip - only when analysis is complete */}
                {analyzeListingMutation.data?.success && analyzeListingMutation.data.analysis && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSave}
                          disabled={saveListingMutation.isPending}
                          className="ml-auto flex-shrink-0"
                          size="sm"
                        >
                          {saveListingMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Save to your listings for viewing and editing later</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Reset Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetAnalysis}
                  className="flex-shrink-0"
                  aria-label="Clear and start over"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Section */}
      {(fetchProductMutation.data?.success || analyzeListingMutation.data?.success) && (
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs for Product Info and Keywords - on the left side */}
          <div className="col-span-2">
            <Tabs defaultValue="product" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="product">Product Information</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>

              {/* Product Information Tab */}
              <TabsContent value="product">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Product title */}
                    <h3 className="text-xl font-semibold mb-4">{productTitle}</h3>

                    {/* Feature bullets */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-lg mb-2">Key Features</h4>
                      <ul className="list-disc pl-5 text-sm space-y-2">
                        {(
                          productData?.featureBullets ||
                          analyzeListingMutation.data?.listingData?.featureBullets ||
                          []
                        ).map((bullet: string, index: number) => (
                          <li key={index}>{bullet}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Product description */}
                    <div>
                      <h4 className="font-semibold text-lg mb-2">Description</h4>
                      <p className="text-muted-foreground text-sm">
                        {productData?.optimizedDescription ||
                          (analyzeListingMutation.data?.listingData?.optimizedDescription as string)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Keywords Tab */}
              <TabsContent value="keywords">
                {extractKeywordsMutation.data?.success && extractKeywordsMutation.data.keywords ? (
                  <KeywordsTable keywords={extractKeywordsMutation.data.keywords as any} />
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-10">
                      {extractKeywordsMutation.status === 'pending' ? (
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                          <p className="text-muted-foreground">Extracting keywords...</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No keywords available yet</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Analysis Results - on the right side */}
          <div className="space-y-6">
            {analyzeListingMutation.status === 'pending' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing your product...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={simulatedProgress} className="mb-3" />
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <p className="text-muted-foreground font-medium">{getAnalysisStatusMessage()}</p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Our AI is examining your listing against industry best practices. This may take up to a minute.
                  </p>
                </CardContent>
              </Card>
            ) : analyzeListingMutation.data?.success && analyzeListingMutation.data.analysis ? (
              <>
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Listing Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold">
                        {analyzeListingMutation.data.analysis.overall_score.toFixed(1)}/10
                      </h3>
                      <Badge variant={getScoreBadgeVariant(analyzeListingMutation.data.analysis.overall_score)}>
                        {analyzeListingMutation.data.analysis.overall_score >= 8
                          ? 'Excellent'
                          : analyzeListingMutation.data.analysis.overall_score >= 6
                            ? 'Good'
                            : 'Needs Improvement'}
                      </Badge>
                    </div>
                    <Progress value={analyzeListingMutation.data.analysis.overall_score * 10} />
                  </CardContent>
                </Card>

                {/* Category Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {Object.entries(analyzeListingMutation.data.analysis)
                        .filter(([key]) => key !== 'overall_score')
                        .map(([category, data]) => (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger>
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getScoreBadgeVariant((data as any).score)}>
                                    {(data as any).score}/10
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <div>
                                  <h4 className="font-semibold text-green-600 dark:text-green-400">Strengths</h4>
                                  <p>{(data as any).pros}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-red-600 dark:text-red-400">
                                    Areas for Improvement
                                  </h4>
                                  <p>{(data as any).cons}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-blue-600 dark:text-blue-400">Recommendations</h4>
                                  <p>{(data as any).recommendations}</p>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
