import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Progress } from '~/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { useServerFn } from '@tanstack/react-start'
import { analyzeListing, fetchProductData } from '~/server/analyze_listing'
import type { ListingAnalysis } from '~/types/analytics'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { useMutation } from '~/hooks/useMutation'
import { toast } from 'sonner'

export const Route = createFileRoute('/_protected/analyze')({
  component: AnalyzePage,
})

function AnalyzePage() {
  const [asin, setAsin] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [productData, setProductData] = useState<any>(null)

  // Product data fetch mutation
  const fetchProductMutation = useMutation({
    fn: useServerFn(fetchProductData),
  })

  // Analysis mutation - happens after product data is fetched
  const analyzeListingMutation = useMutation({
    fn: useServerFn(analyzeListing),
  })

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
          data: {
            asin,
            productData: fetchProductMutation.data.productData,
          },
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

  // Monitor analysis status changes
  useEffect(() => {
    if (analyzeListingMutation.status === 'pending') {
      toast.loading('Analyzing Amazon listing...', {
        id: 'analyze-toast',
        description: `AI is evaluating your listing...`,
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
      console.error(analyzeListingMutation.error?.message)
    }
  }, [analyzeListingMutation.status, analyzeListingMutation.data, analyzeListingMutation.error])

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
      fetchProductMutation.mutate({
        data: { asin },
      })
    } catch (error) {
      console.error('Product fetch error:', error)
      toast.error('Failed to fetch product', {
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
      setIsAnalyzing(false)
    }
  }

  // Determine badge color based on score
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'default'
    if (score >= 6) return 'secondary'
    return 'destructive'
  }

  // Get the analysis data
  const analysisResult = analyzeListingMutation.data?.success ? analyzeListingMutation.data.analysis : null
  const analysisInProgress = productData && !analysisResult && analyzeListingMutation.status === 'pending'

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Amazon Listing Analyzer</CardTitle>
          <CardDescription>Enter an Amazon ASIN to analyze the listing for optimization opportunities</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            type="text"
            placeholder="ASIN (e.g., B01DFKC2SO)"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            className="flex-1"
            maxLength={10}
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
        </CardContent>
      </Card>

      {/* Product Information (shown immediately when available) */}
      {productData && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Product Info Column */}
          <div className="md:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full">
                  <AspectRatio ratio={1}>
                    <img
                      src={productData.mainImageUrl}
                      alt={productData.title}
                      className="rounded-md object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>
                <h3 className="text-lg font-semibold line-clamp-2">{productData.title}</h3>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Column - Shows loading state when analysis is in progress */}
          <div className="md:col-span-8 space-y-6">
            {analysisInProgress ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis in Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="mb-4">Our AI is analyzing your product listing...</p>
                    <Progress className="w-full mb-4" value={undefined} />
                    <p className="text-sm text-muted-foreground">This typically takes 15-30 seconds</p>
                  </div>
                </CardContent>
              </Card>
            ) : analysisResult ? (
              <>
                {/* Overall Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{analysisResult.overall_score.toFixed(1)}/10</span>
                      <Badge variant={getScoreBadgeVariant(analysisResult.overall_score)}>
                        {analysisResult.overall_score >= 8
                          ? 'Excellent'
                          : analysisResult.overall_score >= 6
                            ? 'Good'
                            : 'Needs Improvement'}
                      </Badge>
                    </div>
                    <Progress value={analysisResult.overall_score * 10} />
                  </CardContent>
                </Card>

                {/* Category Scores */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {Object.entries(analysisResult)
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
