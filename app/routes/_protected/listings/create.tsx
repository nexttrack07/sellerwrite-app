import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { styleSchema } from '~/types/schemas'
import { getSupabaseServerClient } from '~/utils/supabase'
import { useState, useMemo } from 'react'
import { z } from 'zod'
import { useMutation } from '~/hooks/useMutation'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Asins } from '~/components/Asins'
import { Keywords } from '~/components/Keywords'
import { ListingDetails } from '~/components/ListingDetails'
import { Stepper, type StepItem } from '~/components/Stepper'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { ArrowLeft, ArrowRight, Loader2, X, Search } from 'lucide-react'
import { useListingStore } from '~/store/listingStore'
import { KeywordsList } from '~/components/KeywordsList'

// Combined schema for both product listing and listing version
const createCombinedSchema = z.object({
  // Product listing fields
  marketplace: z.string().min(1, 'Marketplace is required'),
  asins: z.array(z.string()),
  keywords: z.array(z.string()),
  style: styleSchema,
  tone: z.number().min(1).max(10),

  // Version fields
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  bullet_points: z.array(z.string()).min(1, 'At least one bullet point is required'),
})

type CreateCombinedInput = z.infer<typeof createCombinedSchema>

export const createListing = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    return z
      .object({
        data: createCombinedSchema,
      })
      .parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // Get non-empty bullet points only
    const nonEmptyBulletPoints = data.data.bullet_points.filter((point) => point.trim() !== '')

    // 1. First insert the product listing
    const { data: listingData, error: listingError } = await supabase
      .from('product_listings')
      .insert({
        marketplace: data.data.marketplace,
        asins: data.data.asins,
        keywords: data.data.keywords,
        style: data.data.style,
        tone: data.data.tone,
      })
      .select()
      .single()

    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`)
    }

    // 2. Then insert the version using the listing ID
    const { error: versionError } = await supabase.from('listing_versions').insert({
      product_listing_id: listingData.id,
      title: data.data.title,
      description: data.data.description,
      bullet_points: nonEmptyBulletPoints,
      is_active: true,
    })

    if (versionError) {
      throw new Error(`Failed to create listing version: ${versionError.message}`)
    }

    return listingData
  })

export const Route = createFileRoute('/_protected/listings/create')({
  component: CreateListingPage,
})

// Define the steps for listing creation
const createListingSteps: StepItem[] = [
  {
    title: 'Add ASIN(s)',
    description: 'Extract keywords from product',
  },
  {
    title: 'Keywords',
    description: 'Add/Remove relevant keywords',
  },
  {
    title: 'Style',
    description: 'Pick your listing style',
  },
  {
    title: 'Generate',
    description: 'Create your listing draft',
  },
  {
    title: 'Review',
    description: 'Review and make edits',
  },
]

function CreateListingPage() {
  // Use the store
  const {
    currentStep,
    setCurrentStep,
    asins,
    asinLoadingStatus,
    asinErrors,
    keywords,
    keywordsLoading,
    listingStyle,
    listingTone,
    generatedContent,
    contentLoading,
    addAsin,
    removeAsin,
    addKeyword,
    removeKeyword,
    toggleKeywordSelection,
    setListingStyle,
    setListingTone,
    generateListing,
    updateGeneratedContent,
  } = useListingStore()

  const [formData, setFormData] = useState<CreateCombinedInput>({
    marketplace: 'USA',
    asins: [],
    keywords: [],
    style: 'professional',
    tone: 5,
    title: '',
    description: '',
    bullet_points: ['', '', '', '', ''], // Initialize with 5 empty strings
  })

  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const createListingMutation = useMutation({
    fn: useServerFn(createListing),
    onSuccess: () => {
      navigate({ to: '/listings' })
    },
  })

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleStepClick = (step: number) => {
    // Only allow navigation to steps we've completed or the next one
    if (step <= currentStep + 1) {
      setCurrentStep(step)
    }
  }

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ASINInputStep />
      case 1:
        return <KeywordsStep />
      case 2:
        return <StyleSelectionStep />
      case 3:
        return <GenerationStep />
      case 4:
        return <ReviewStep />
      default:
        return null
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'tone' ? parseInt(value, 10) : value,
    })
  }

  // Handle bullet point changes
  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...formData.bullet_points]
    newBulletPoints[index] = value
    setFormData({
      ...formData,
      bullet_points: newBulletPoints,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate the form data before submitting
      createCombinedSchema.parse(formData)

      // Call the mutation to create the listing
      createListingMutation.mutate({ data: formData })
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Format and display validation errors
        const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        setError(errorMessages)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }

  return (
    <div className="container max-w-5xl py-10 mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Amazon Listing</h1>

      {/* Stepper */}
      <Stepper steps={createListingSteps} currentStep={currentStep} onStepClick={handleStepClick} className="mb-10" />

      {/* Step Content */}
      <div className="mb-8">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        <Button onClick={goToNextStep} disabled={currentStep === createListingSteps.length - 1}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Placeholder components for each step
function ASINInputStep() {
  const { asins, asinLoadingStatus, asinErrors, addAsin, removeAsin } = useListingStore()
  const [inputValue, setInputValue] = useState('')

  const handleAddASINs = () => {
    // Split by newlines, commas, or spaces and process each ASIN
    const asinList = inputValue
      .split(/[\n,\s]+/)
      .map((asin) => asin.trim())
      .filter((asin) => asin.length > 0)

    // Process each ASIN
    asinList.forEach((asin) => {
      addAsin(asin)
    })

    // Clear the input
    setInputValue('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Amazon ASINs</CardTitle>
        <CardDescription>
          Enter the ASIN(s) of products you want to analyze. We'll extract relevant keywords to help optimize your
          listing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="asins" className="block text-sm font-medium mb-1">
              ASINs
            </label>
            <Textarea
              id="asins"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter one or more ASINs, each on a new line (e.g., B01DFKC2SO)"
              className="min-h-24"
            />
            <div className="flex justify-end mt-2">
              <Button onClick={handleAddASINs}>Add ASINs</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keywords will be extracted from the title, bullet points, and description of each ASIN's listing.
              Including competitor products can help identify additional relevant keywords.
            </p>
          </div>

          {/* Display added ASINs */}
          {asins.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium">Added ASINs:</h3>
              <div className="space-y-2">
                {asins.map((asin) => (
                  <div key={asin} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <span>{asin}</span>
                      {asinLoadingStatus[asin] === 'loading' && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      {asinLoadingStatus[asin] === 'error' && (
                        <span className="ml-2 text-xs text-red-500">{asinErrors[asin]}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsin(asin)}
                      disabled={asinLoadingStatus[asin] === 'loading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-1">Pro Tip</h4>
            <p className="text-xs text-muted-foreground">
              For best results, include 3-5 ASINs: your main product and a few top competitors. This ensures
              comprehensive keyword coverage while maintaining relevance.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KeywordsStep() {
  const { keywords, keywordsLoading, asins, addKeyword, removeKeyword, toggleKeywordSelection } = useListingStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  // Filter keywords based on search term
  const filteredKeywords = useMemo(() => {
    if (!searchTerm.trim()) return keywords

    return keywords.filter((keyword) => keyword.text.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [keywords, searchTerm])

  // Stats about keywords
  const stats = useMemo(() => {
    const total = keywords.length
    const selected = keywords.filter((k) => k.selected).length
    const fromAsins = asins.reduce(
      (acc, asin) => {
        acc[asin] = keywords.filter((k) => k.sourceAsin === asin).length
        return acc
      },
      {} as Record<string, number>,
    )
    const manual = keywords.filter((k) => k.sourceAsin === null).length

    return { total, selected, fromAsins, manual }
  }, [keywords, asins])

  // Handle adding a new keyword
  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim())
      setNewKeyword('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review and Edit Keywords</CardTitle>
        <CardDescription>
          We've extracted these keywords from the ASINs you provided. Add, remove, or edit keywords to optimize your
          listing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Keyword stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/40 rounded p-3">
            <p className="text-sm font-medium">Total Keywords</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <p className="text-sm font-medium">Selected</p>
            <p className="text-2xl font-bold">{stats.selected}</p>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <p className="text-sm font-medium">From ASINs</p>
            <p className="text-2xl font-bold">{stats.total - stats.manual}</p>
          </div>
          <div className="bg-muted/40 rounded p-3">
            <p className="text-sm font-medium">Custom Added</p>
            <p className="text-2xl font-bold">{stats.manual}</p>
          </div>
        </div>

        {/* Add new keyword */}
        <div className="flex space-x-2">
          <Input
            placeholder="Add a custom keyword..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
          />
          <Button onClick={handleAddKeyword}>Add</Button>
        </div>

        {/* Search keywords */}
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Keywords list */}
        {keywordsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredKeywords.length > 0 ? (
          <KeywordsList
            keywords={filteredKeywords}
            onToggle={toggleKeywordSelection}
            onRemove={removeKeyword}
            asins={asins}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {keywords.length > 0
              ? 'No keywords match your search'
              : 'No keywords extracted yet. Add ASINs in the previous step.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StyleSelectionStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Listing Style</CardTitle>
        <CardDescription>
          Choose the style and tone for your listing. This affects how your listing will be written.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Style selection options would go here</p>
      </CardContent>
    </Card>
  )
}

function GenerationStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Listing</CardTitle>
        <CardDescription>
          We'll now generate your Amazon listing based on the keywords and style you've selected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Generation UI with progress indicator would go here</p>
      </CardContent>
    </Card>
  )
}

function ReviewStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Listing</CardTitle>
        <CardDescription>
          Review the generated listing content and make any final edits before exporting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Listing preview and editing UI would go here</p>
      </CardContent>
      <CardFooter>
        <Button className="ml-auto">Export Listing</Button>
      </CardFooter>
    </Card>
  )
}
