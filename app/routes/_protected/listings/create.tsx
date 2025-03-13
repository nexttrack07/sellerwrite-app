import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Style, styleSchema } from '~/types/schemas'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { ArrowLeft, ArrowRight, Loader2, Search, Hash, X } from 'lucide-react'
import { useListingStore } from '~/store/listingStore'
import { KeywordsList } from '~/components/KeywordsList'
import { RadioCardGroup, RadioCardOption } from '~/components/ui/radio-card-group'
import { Target, Wrench, Cpu, Crown, Compass } from 'lucide-react'
import { Stepper, type StepItem } from '~/components/Stepper'
import { toast } from 'sonner'

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

// Define keyword density options
const keywordDensityOptions: RadioCardOption[] = [
  {
    id: 'low',
    title: 'Low',
    description: 'Subtle keyword usage for natural flow',
    icon: <Hash className="h-4 w-4" />,
  },
  {
    id: 'medium',
    title: 'Medium',
    description: 'Balanced keyword usage',
    icon: <Hash className="h-4 w-4" />,
  },
  {
    id: 'high',
    title: 'High',
    description: 'Maximum keyword optimization',
    icon: <Hash className="h-4 w-4" />,
  },
]

export const Route = createFileRoute('/_protected/listings/create')({
  component: CreateListingPage,
})

function CreateListingPage() {
  const {
    currentStep,
    setCurrentStep,
    asins,
    keywords,
    keywordsLoading,
    removeKeyword,
    toggleKeywordSelection,
    productDetails,
    setProductDetails,
    generateListing,
    contentLoading,
    resetStore,
    listingStyle,
    setListingStyle,
  } = useListingStore()

  const navigate = useNavigate()

  const goToNextStep = () => {
    if (currentStep === 0) {
      const productDetailsStep = document.getElementById('product-details-step')
      if (productDetailsStep) {
        // For now, we'll rely on the component saving on change
      }
    }
    setCurrentStep(currentStep + 1)
  }

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleStepClick = (step: number) => {
    if (step <= currentStep + 1) {
      setCurrentStep(step)
    }
  }

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
      default:
        return null
    }
  }

  return (
    <div className="container max-w-5xl py-8 px-6 mx-auto">
      <Stepper steps={createListingSteps} currentStep={currentStep} onStepClick={handleStepClick} />
      <div className="mt-8">{renderStepContent()}</div>
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {currentStep < createListingSteps.length - 1 ? (
          <Button onClick={goToNextStep}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

// Placeholder components for each step
function ProductDetailsStep() {
  const { productDetails, setProductDetails } = useListingStore()

  // Add state for product name
  const [name, setName] = useState(productDetails.name || '')

  // Add state for specific product questions
  const [uniqueFeatures, setUniqueFeatures] = useState(productDetails.uniqueFeatures || '')
  const [keyHighlights, setKeyHighlights] = useState(productDetails.keyHighlights || '')
  const [targetAudience, setTargetAudience] = useState(productDetails.targetAudience || '')
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState(productDetails.competitiveAdvantage || '')

  // Update the handleChange function for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name: fieldName, value } = e.target

    switch (fieldName) {
      case 'name':
        setName(value)
        break
      case 'uniqueFeatures':
        setUniqueFeatures(value)
        break
      case 'keyHighlights':
        setKeyHighlights(value)
        break
      case 'targetAudience':
        setTargetAudience(value)
        break
      case 'competitiveAdvantage':
        setCompetitiveAdvantage(value)
        break
      default:
        // Handle other fields
        setProductDetails({
          ...productDetails,
          [fieldName]: value,
        })
    }
  }

  // Save data whenever it changes
  useEffect(() => {
    setProductDetails({
      ...productDetails,
      name,
      uniqueFeatures,
      keyHighlights,
      targetAudience,
      competitiveAdvantage,
    })
  }, [name, uniqueFeatures, keyHighlights, targetAudience, competitiveAdvantage])

  return (
    <Card id="product-details-step">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Tell us about your product to create a better listing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Name (Required) */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            placeholder="Enter your product name"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            This is the basic name of your product (e.g., "Wireless Headphones", "Yoga Mat")
          </p>
        </div>

        {/* Product Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Product Category <span className="text-red-500">*</span>
          </label>
          <Input
            id="category"
            name="category"
            value={productDetails.category || ''}
            onChange={handleChange}
            placeholder="e.g., Electronics, Kitchen, Fitness"
            required
          />
        </div>

        {/* Unique Features (Optional) */}
        <div>
          <label htmlFor="uniqueFeatures" className="block text-sm font-medium mb-1">
            What makes your product unique?
          </label>
          <Textarea
            id="uniqueFeatures"
            name="uniqueFeatures"
            value={uniqueFeatures}
            onChange={handleChange}
            placeholder="Describe any unique features or innovations your product offers"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Helps us highlight what sets your product apart
          </p>
        </div>

        {/* Key Highlights (Optional) */}
        <div>
          <label htmlFor="keyHighlights" className="block text-sm font-medium mb-1">
            What are the key things to highlight about your product?
          </label>
          <Textarea
            id="keyHighlights"
            name="keyHighlights"
            value={keyHighlights}
            onChange={handleChange}
            placeholder="List the most important features or benefits customers should know"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: These will be emphasized in your listing</p>
        </div>

        {/* Target Audience (Optional) */}
        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">
            Who is your target audience?
          </label>
          <Textarea
            id="targetAudience"
            name="targetAudience"
            value={targetAudience}
            onChange={handleChange}
            placeholder="Describe your ideal customers and how they'll use your product"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Helps tailor the listing to appeal to your specific audience
          </p>
        </div>

        {/* Competitive Advantage (Optional) */}
        <div>
          <label htmlFor="competitiveAdvantage" className="block text-sm font-medium mb-1">
            What differentiates your product from competitors?
          </label>
          <Textarea
            id="competitiveAdvantage"
            name="competitiveAdvantage"
            value={competitiveAdvantage}
            onChange={handleChange}
            placeholder="Explain how your product is better than similar products on the market"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional: Helps position your product effectively against competition
          </p>
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
          Enter the ASIN(s) of products you want to use for getting keywords. We'll extract relevant keywords to help
          optimize your listing.
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

export const GenerationStep = () => {
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [titleDensity, setTitleDensity] = useState('medium')
  const [bulletsDensity, setBulletsDensity] = useState('medium')
  const [descriptionDensity, setDescriptionDensity] = useState('medium')

  const { asins, keywords, listingStyle, listingTone, productDetails, generateListing, resetStore } = useListingStore()

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const result = await generateListing({
        keywordDensity: {
          title: titleDensity,
          bullets: bulletsDensity,
          description: descriptionDensity,
        },
      })

      // Show success message
      toast.success('Listing created successfully!')
      
      // Reset the store
      resetStore()
      
      // Navigate to the listing detail page
      if (result?.listingId) {
        navigate({ to: '/listings/$id', params: { id: result.listingId.toString() } })
      }
    } catch (error) {
      console.error('Error generating listing:', error)
      toast.error('Failed to generate listing')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Listing Content</CardTitle>
        <CardDescription>Configure keyword density and generate your listing content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Keyword Density */}
        <div>
          <h3 className="text-lg font-medium mb-2">Title Keyword Density</h3>
          <p className="text-sm text-muted-foreground mb-3">Control how many keywords appear in your product title</p>
          <RadioCardGroup
            options={keywordDensityOptions}
            value={titleDensity}
            onChange={setTitleDensity}
            className="grid-cols-3 gap-2"
            size="small"
          />
        </div>

        {/* Bullet Points Keyword Density */}
        <div>
          <h3 className="text-lg font-medium mb-2">Bullet Points Keyword Density</h3>
          <p className="text-sm text-muted-foreground mb-3">Control how many keywords appear in your bullet points</p>
          <RadioCardGroup
            options={keywordDensityOptions}
            value={bulletsDensity}
            onChange={setBulletsDensity}
            className="grid-cols-3 gap-2"
            size="small"
          />
        </div>

        {/* Description Keyword Density */}
        <div>
          <h3 className="text-lg font-medium mb-2">Description Keyword Density</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Control how many keywords appear in your product description
          </p>
          <RadioCardGroup
            options={keywordDensityOptions}
            value={descriptionDensity}
            onChange={setDescriptionDensity}
            className="grid-cols-3 gap-2"
            size="small"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-6">
        <Button size="lg" className="w-full max-w-md" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate Listing Content</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
