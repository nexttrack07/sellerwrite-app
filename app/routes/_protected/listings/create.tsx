import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { Style, styleSchema } from '~/types/schemas'
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
import { RadioCardGroup, RadioCardOption } from '~/components/ui/radio-card-group'
import { Target, Wrench, Cpu, Crown, Compass } from 'lucide-react'

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
    title: 'Product Details',
    description: 'Describe your product',
  },
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

// Define the copywriting style options
const copywritingStyles: RadioCardOption[] = [
  {
    id: 'benefit-focused',
    title: 'Benefit-Focused',
    description: "Emphasizes how the product improves the customer's life or solves their problems.",
    icon: <Target className="h-4 w-4" />,
  },
  {
    id: 'problem-solution',
    title: 'Problem-Solution',
    description: 'Directly addresses a pain point and positions the product as the solution.',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 'technical',
    title: 'Technical/Specification',
    description: 'Focuses on detailed specifications and technical features of the product.',
    icon: <Cpu className="h-4 w-4" />,
  },
  {
    id: 'premium',
    title: 'Premium/Luxury',
    description: 'Highlights quality, craftsmanship, and exclusivity to justify premium pricing.',
    icon: <Crown className="h-4 w-4" />,
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle-Oriented',
    description: 'Connects the product to specific activities, interests, or identity of the target audience.',
    icon: <Compass className="h-4 w-4" />,
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
    productDetails,
    setProductDetails,
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
        return <ProductDetailsStep />
      case 1:
        return <ASINInputStep />
      case 2:
        return <KeywordsStep />
      case 3:
        return <StyleSelectionStep />
      case 4:
        return <GenerationStep />
      case 5:
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
function ProductDetailsStep() {
  const { productDetails, setProductDetails } = useListingStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProductDetails({ ...productDetails, [name]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Describe Your Product</CardTitle>
        <CardDescription>
          Help us understand your product better to create a more targeted and effective listing. This information
          guides our AI in generating the most relevant content for your specific product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5">
          <div className="space-y-2">
            <label htmlFor="productType" className="text-sm font-medium">
              What is your product? <span className="text-muted-foreground">(required)</span>
            </label>
            <Input
              id="productType"
              name="productType"
              placeholder="e.g., Yoga mat, Coffee maker, Wireless headphones"
              value={productDetails.productType || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              What category does your product belong to? <span className="text-muted-foreground">(required)</span>
            </label>
            <Input
              id="category"
              name="category"
              placeholder="e.g., Fitness Equipment, Kitchen Appliances, Electronics"
              value={productDetails.category || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="uniqueFeatures" className="text-sm font-medium">
              What unique features does your product have compared to competitors?
            </label>
            <Textarea
              id="uniqueFeatures"
              name="uniqueFeatures"
              placeholder="Describe what makes your product stand out from similar products"
              value={productDetails.uniqueFeatures || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="keyFeatures" className="text-sm font-medium">
              What key features should be highlighted in your listing?
            </label>
            <Textarea
              id="keyFeatures"
              name="keyFeatures"
              placeholder="List the most important features customers should know about"
              value={productDetails.keyFeatures || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="targetAudience" className="text-sm font-medium">
              Who is your target audience or ideal customer?
            </label>
            <Input
              id="targetAudience"
              name="targetAudience"
              placeholder="e.g., Fitness enthusiasts, Home cooks, Professionals who travel"
              value={productDetails.targetAudience || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Important</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                The more specific information you provide here, the better your listing will be. These details will be
                used alongside any ASINs you add in the next step to create a comprehensive and targeted product
                listing.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

        {/* Add keyword information note */}
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">About These Keywords</h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                The extracted keywords include <strong>long-tail variations</strong> (more specific, multi-word phrases)
                that cover both broad and phrase match keyword types. Using these specific variations in your listing
                can help capture targeted search traffic while maintaining relevance to your product.
              </p>
            </div>
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

        {/* Keywords list - Make it fixed height and scrollable */}
        <div className="relative">
          {keywordsLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKeywords.length > 0 ? (
            <div className="h-[400px] overflow-y-auto pr-2">
              <KeywordsList
                keywords={filteredKeywords}
                onToggle={toggleKeywordSelection}
                onRemove={removeKeyword}
                asins={asins}
              />
            </div>
          ) : (
            <div className="text-center py-8 h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">
                {keywords.length > 0
                  ? 'No keywords match your search'
                  : 'No keywords extracted yet. Add ASINs in the previous step.'}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StyleSelectionStep() {
  // Use the store for style selection
  const { listingStyle, setListingStyle } = useListingStore()

  // Use listingStyle from the store instead of local state
  const selectedStyle = listingStyle || 'benefit-focused'

  // Update the store when style changes
  const handleStyleChange = (style: string) => {
    setListingStyle(style as Style)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Listing Style</CardTitle>
        <CardDescription>
          Choose the style and tone for your listing. This affects how your listing will be written.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Choose a Copywriting Style</h2>
            <p className="text-muted-foreground mb-4">
              Select a style that best fits your product and target audience.
            </p>

            <RadioCardGroup
              options={copywritingStyles}
              value={selectedStyle}
              onChange={handleStyleChange}
              className="mt-4"
            />
          </div>

          {/* Example of the selected style */}
          <div className="bg-muted/30 p-4 rounded-md">
            <h3 className="font-medium mb-2">
              Example Title in {copywritingStyles.find((s) => s.id === selectedStyle)?.title} Style:
            </h3>
            <p className="text-sm">
              {selectedStyle === 'benefit-focused' &&
                '"Memory Foam Pillow for Neck Pain Relief - Orthopedic Support for Better Sleep with Cooling Gel Technology"'}
              {selectedStyle === 'problem-solution' &&
                '"No-Drip Shower Caddy with Rust-Proof Guarantee - Solves Bathroom Storage Problems with 5 Adjustable Shelves"'}
              {selectedStyle === 'technical' &&
                '"1080p Wireless Security Camera, 360° Pan/Tilt, 2-Way Audio, Night Vision, Motion Detection, IP65 Waterproof"'}
              {selectedStyle === 'premium' &&
                '"Handcrafted Italian Leather Wallet for Men - Full-Grain RFID Blocking Bifold with Gift Box"'}
              {selectedStyle === 'lifestyle' &&
                '"Portable Espresso Maker for Camping, Travel & Office - Compact Coffee Companion for Adventure Enthusiasts"'}
            </p>
          </div>
        </div>
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
