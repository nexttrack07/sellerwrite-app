import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Badge } from '~/components/ui/badge'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import { Loader2, Save, ArrowLeft, Tag, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { KeywordsList } from '~/components/KeywordsList'

// Import server functions from server folder
import { fetchListing } from '~/server/fetch_listing'
import { updateListing, updateListingSchema } from '~/server/update_listing'

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

  // Handle error with useEffect instead
  useEffect(() => {
    if (isError && error) {
      toast.error('Failed to load listing', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
      console.error('Error fetching listing:', error)
    }
  }, [isError, error])

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
  const updateListingMutation = useMutation<
    { success: boolean; version: any },
    Error,
    { data: typeof updateListingSchema._type }
  >({
    mutationFn: (variables) => updateListingFn(variables),
    onSuccess: () => {
      toast.success('Listing updated successfully')
      setIsEditing(false)
    },
    onError: (error: Error) => {
      toast.error('Failed to update listing', {
        description: error.message || 'Unknown error occurred',
      })
    },
  })

  // Handle saving changes
  const handleSave = () => {
    // Filter out empty bullet points
    const nonEmptyBulletPoints = bulletPoints.filter((point) => point.trim() !== '')

    if (nonEmptyBulletPoints.length === 0) {
      toast.error('At least one bullet point is required')
      return
    }

    updateListingMutation.mutate({
      data: {
        id: Number(id), // Ensure id is a number
        title,
        description,
        bullet_points: bulletPoints,
      },
    })
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
    <div className="container mx-auto py-6 max-w-5xl">
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
              {/* Product image if available */}
              {listing.asins && listing.asins.length > 0 && (
                <div className="w-full md:w-1/4">
                  <AspectRatio ratio={1 / 1} className="bg-muted rounded-md overflow-hidden">
                    <div className="flex items-center justify-center h-full text-muted-foreground">Product Image</div>
                  </AspectRatio>
                </div>
              )}

              {/* Basic listing info */}
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

      {/* Main content tabs */}
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
  )
}
