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

  // Display helper for scoring badges
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'destructive'
  }

  // Get the analysis data
  const analysisResult = analyzeListingMutation.data?.success ? analyzeListingMutation.data.analysis : null
  const analysisInProgress = productData && !analysisResult && analyzeListingMutation.status === 'pending'

  return (
    <div className="container py-10 mx-auto">
      {/* Search Form */}
      <div className="mb-10">
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
      </div>

      {/* Results Section */}
      {(fetchProductMutation.data?.success || analyzeListingMutation.data?.success) && (
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Information */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Product image - smaller size */}
                <div className="mb-6 mx-auto max-w-[250px]">
                  <AspectRatio ratio={1}>
                    <img
                      src={
                        productData?.mainImageUrl || (analyzeListingMutation.data?.listingData?.mainImageUrl as string)
                      }
                      alt="Product"
                      className="rounded-md object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>

                {/* Product title */}
                <h3 className="text-xl font-semibold mb-4">
                  {productData?.title || (analyzeListingMutation.data?.listingData?.title as string)}
                </h3>

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
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analyzeListingMutation.status === 'pending' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analyzing your product...</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={40} className="mb-2" />
                  <p className="text-muted-foreground">
                    Our AI is analyzing this listing against best practices. This may take a minute.
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
