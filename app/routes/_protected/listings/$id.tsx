import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Loader2, Save, ArrowLeft, Tag, Edit2, Check, X, Brain, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { KeywordsList } from '~/components/KeywordsList'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '~/components/ui/accordion'
import { Progress } from '~/components/ui/progress'

// Import server functions from server folder
import { fetchListing } from '~/server/fetch_listing'
import { updateListing, updateListingSchema } from '~/server/update_listing'
import { analyzeListing } from '~/server/analyze_listing'
import { fetchAnalysis, saveAnalysis } from '~/server/analysis_storage'

// Define the listing type
interface Listing {
  id: number
  marketplace: string
  asins: string[]
  keywords: string[]
  style: string
  tone: number | null
  created_at: string
  title: string
  description: string
  bullet_points: string[]
  version_id: number
}

// Define the keyword type
interface Keyword {
  id: string
  text: string
  sourceAsin: string | null
  selected: boolean
}

export const Route = createFileRoute('/_protected/listings/$id')({
  component: ListingDetailsPage,
})

function ListingDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  // Use React Query for data fetching instead of manual state management
  const fetchListingFn = useServerFn(fetchListing)
  const updateListingFn = useServerFn(updateListing)
  const analyzeListingFn = useServerFn(analyzeListing)
  const fetchAnalysisFn = useServerFn(fetchAnalysis)
  const saveAnalysisFn = useServerFn(saveAnalysis)

  // Use React Query to fetch the listing data
  const {
    data: listing,
    isLoading,
    isError,
    error,
  } = useQuery<Listing, Error, Listing>({
    queryKey: ['listing', id],
    queryFn: () => fetchListingFn({ data: { id } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })

  // Update the query to check for existing analysis
  const { data: existingAnalysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['listing-analysis', id, listing?.version_id],
    queryFn: () => {
      // Make sure we have the required data before making the query
      if (!id || !listing?.version_id) {
        return Promise.resolve({ success: false, exists: false, error: null, analysis: null })
      }

      // Make sure we're passing the data in the correct structure
      return fetchAnalysisFn({
        data: {
          listing_id: Number(id),
          version_id: listing.version_id,
        },
      })
    },
    // Only enable the query when we have both id and version_id
    enabled: !!id && !!listing?.version_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Handle error with useEffect instead
  useEffect(() => {
    if (isError && error) {
      toast.error('Failed to load listing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
      console.error('Error fetching listing:', error)
    }
  }, [isError, error])

  const queryClient = useQueryClient()

  // Editable state - initialize from listing data when available
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bulletPoints, setBulletPoints] = useState<string[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  // Initialize form state when listing data is loaded
  useEffect(() => {
    if (listing) {
      setTitle(listing.title)
      setDescription(listing.description)
      setBulletPoints(listing.bullet_points?.length ? listing.bullet_points : ['', '', '', '', ''])

      const keywordObjects = (listing.keywords || []).map((keyword: string, index: number) => ({
        id: `keyword-${index}`,
        text: keyword,
        sourceAsin: null,
        selected: true,
      }))
      setKeywords(keywordObjects)
      setSelectedKeywords(listing.keywords || [])
    }
  }, [listing]) // Only run when listing changes

  // Handle bullet point changes
  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...bulletPoints]
    newBulletPoints[index] = value
    setBulletPoints(newBulletPoints)
  }

  // Toggle keyword selection
  const toggleKeyword = (id: string) => {
    const updatedKeywords = keywords.map((k) => (k.id === id ? { ...k, selected: !k.selected } : k))
    setKeywords(updatedKeywords)

    // Update selected keywords list
    const selected = updatedKeywords.filter((k) => k.selected).map((k) => k.text)
    setSelectedKeywords(selected)
  }

  // Remove keyword
  const removeKeyword = (id: string) => {
    const updatedKeywords = keywords.filter((k) => k.id !== id)
    setKeywords(updatedKeywords)

    // Update selected keywords list
    const selected = updatedKeywords.filter((k) => k.selected).map((k) => k.text)
    setSelectedKeywords(selected)
  }

  // Update listing mutation using React Query's useMutation
  const updateListingMutation = useMutation({
    mutationFn: (formData: { data: typeof updateListingSchema._type }) => updateListingFn({ data: formData }),
    onSuccess: () => {
      toast.success('Listing updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['listing', id] })
    },
    onError: (error) => {
      toast.error('Failed to update listing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  // Handle saving changes
  const handleSave = () => {
    const updateData = {
      id: listing!.id,
      title: title,
      description: description,
      bullet_points: bulletPoints.filter((bp) => bp.trim() !== ''),
    }

    updateListingMutation.mutate({ data: updateData })
  }

  // Add a separate state for the analysis data
  const [analysisData, setAnalysisData] = useState<any>(null)

  // Analysis mutation using React Query's useMutation
  const analyzeListingMutation = useMutation({
    mutationFn: () => {
      // Make sure we have a listing
      if (!listing) {
        throw new Error('No listing data available')
      }

      // Structure the data correctly for analyze_listing.ts
      return analyzeListingFn({
        data: {
          asin: listing.asins?.[0] || '', // Use the first ASIN if available
          productData: {
            title: listing.title,
            description: listing.description,
            bulletPoints: listing.bullet_points,
          },
        },
      })
    },
    onSuccess: async (result) => {
      // Save the analysis to the database
      if (result.success && result.analysis && listing) {
        try {
          await saveAnalysisFn({
            data: {
              listing_id: listing.id,
              version_id: listing.version_id,
              analysis_data: result.analysis,
            },
          })

          toast.success('Listing analyzed and saved successfully')
        } catch (error) {
          console.error('Failed to save analysis:', error)
          toast.error('Analysis completed but failed to save')
        }
      } else {
        toast.success('Listing analyzed successfully')
      }

      // Update our state
      if (result.analysis) {
        setAnalysisData(result.analysis)
      }
    },
    onError: (error) => {
      toast.error('Failed to analyze listing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    },
  })

  // Handle analyzing the listing
  const handleAnalyzeListing = () => {
    analyzeListingMutation.mutate()
  }

  // Handle applying optimized content
  // Add this helper function
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'destructive'
  }

  // First, add these missing variables and functions
  const [simulatedProgress, setSimulatedProgress] = useState(0)

  // Add this function to get analysis status message
  const getAnalysisStatusMessage = () => {
    if (simulatedProgress < 30) return 'Examining keywords and title structure...'
    if (simulatedProgress < 60) return 'Analyzing product bullets and description...'
    if (simulatedProgress < 85) return 'Evaluating competitor differentiation...'
    return 'Finalizing analysis and preparing recommendations...'
  }

  // Add this effect to simulate progress when analyzing
  useEffect(() => {
    if (analyzeListingMutation.isPending) {
      setSimulatedProgress(0)
      const interval = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 500)

      return () => clearInterval(interval)
    } else {
      setSimulatedProgress(100)
    }
  }, [analyzeListingMutation.isPending])

  // Update the handleLoadAnalysis function with a more specific type assertion
  const handleLoadAnalysis = () => {
    // Type guard to check if analysis exists
    if (!existingAnalysis || !existingAnalysis.exists || !('analysis' in existingAnalysis)) {
      return
    }

    // Type assertion for the analysis structure
    const analysisObj = existingAnalysis.analysis as { analysis_data: Record<string, any> }

    // Now TypeScript knows the structure
    setAnalysisData(analysisObj.analysis_data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <p className="text-muted-foreground">Listing not found</p>
        <Button onClick={() => navigate({ to: '/listings' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Listing' : 'Listing Details'}</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Make changes to your listing' : 'View and manage your listing'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/listings' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateListingMutation.isPending}>
                {updateListingMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Listing
            </Button>
          )}
        </div>
      </div>

      {/* Listing summary card */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Basic listing info - now takes full width */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{listing.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Created on {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* ASINs */}
                <div>
                  <h3 className="text-sm font-medium mb-2">ASINs</h3>
                  <div className="flex flex-wrap gap-2">
                    {(listing.asins || []).map((asin: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {asin}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Marketplace and Style */}
                <div className="flex gap-2 items-center">
                  <Badge variant="secondary">{listing.marketplace}</Badge>
                  <Badge>{listing.style}</Badge>
                  {listing.tone !== null && <Badge variant="outline">Tone: {listing.tone}/10</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New grid layout with main content and analysis side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content tabs - takes 2/3 of the width on large screens */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="content">Listing Content</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Listing Content</CardTitle>
                  <CardDescription>
                    {isEditing
                      ? 'Edit your listing content below. All fields are required.'
                      : 'View your current listing content. Click Edit to make changes.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title
                    </label>
                    {isEditing ? (
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter product title"
                      />
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-md">
                        <p className="text-lg font-medium">{title}</p>
                      </div>
                    )}
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bullet Points</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        {bulletPoints.map((bullet, index) => (
                          <Input
                            key={index}
                            value={bullet}
                            onChange={(e) => handleBulletPointChange(index, e.target.value)}
                            placeholder={`Bullet point ${index + 1}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-md">
                        <ul className="list-disc pl-5 space-y-2">
                          {(listing.bullet_points || []).map((bullet: string, index: number) => (
                            <li key={index}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description"
                        rows={6}
                      />
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-md">
                        <p className="whitespace-pre-line">{description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords Tab */}
            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Keywords
                  </CardTitle>
                  <CardDescription>These keywords are used to optimize your listing for Amazon search.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Keywords stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/40 rounded p-3">
                      <p className="text-sm font-medium">Total Keywords</p>
                      <p className="text-2xl font-bold">{keywords.length}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-3">
                      <p className="text-sm font-medium">Selected</p>
                      <p className="text-2xl font-bold">{selectedKeywords.length}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-3">
                      <p className="text-sm font-medium">From ASINs</p>
                      <p className="text-2xl font-bold">{(listing.asins || []).length}</p>
                    </div>
                  </div>

                  {/* Keywords list */}
                  <div className="h-[400px] overflow-y-auto pr-2">
                    <KeywordsList
                      keywords={keywords}
                      onToggle={toggleKeyword}
                      onRemove={removeKeyword}
                      asins={listing.asins || []}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Analysis section - takes 1/3 of the width on large screens */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Listing Analysis
                </CardTitle>
                {/* Add redo button - only enabled if there's a version mismatch */}
                {existingAnalysis?.exists && existingAnalysis.success && existingAnalysis.analysis && (
                  <Button
                    variant="outline"
                    size="icon"
                    title="Re-analyze listing"
                    // Only enable if the current version doesn't match the analyzed version
                    disabled={listing.version_id === existingAnalysis.analysis.version_id}
                    onClick={handleAnalyzeListing}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription>Analyze your listing to get optimization recommendations and insights.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Analysis state management */}
              {analyzeListingMutation.isPending ? (
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
              ) : analysisData ? (
                <>
                  {/* Overall Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Listing Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold">{analysisData.overall_score.toFixed(1)}/10</h3>
                        <Badge variant={getScoreBadgeVariant(analysisData.overall_score)}>
                          {analysisData.overall_score >= 8
                            ? 'Excellent'
                            : analysisData.overall_score >= 6
                              ? 'Good'
                              : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <Progress value={analysisData.overall_score * 10} />
                    </CardContent>
                  </Card>
                  <br />

                  {/* Category Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {Object.entries(analysisData)
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
              ) : (
                // Empty state with analyze button
                <div className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4" />

                  {existingAnalysis?.exists ? (
                    // Analysis exists but isn't loaded yet
                    <>
                      <h3 className="text-lg font-medium mb-2">Analysis Available</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        This listing version has already been analyzed. Click below to view the analysis.
                      </p>
                      <Button onClick={handleLoadAnalysis} disabled={isLoadingAnalysis}>
                        {isLoadingAnalysis ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            View Analysis
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    // No analysis exists yet
                    <>
                      <h3 className="text-lg font-medium mb-2">No analysis yet</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        Analyze your listing to get optimization recommendations and insights based on Amazon best
                        practices.
                      </p>
                      <Button onClick={handleAnalyzeListing} disabled={analyzeListingMutation.isPending}>
                        {analyzeListingMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Analyze Listing
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
