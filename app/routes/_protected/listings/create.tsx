import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { styleSchema } from '~/types/schemas'
import { getSupabaseServerClient } from '~/utils/supabase'
import { useState } from 'react'
import { z } from 'zod'
import { useMutation } from '~/hooks/useMutation'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Textarea } from '~/components/ui/textarea'
import { XIcon, ArrowLeftIcon } from 'lucide-react'

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

function CreateListingPage() {
  const [formData, setFormData] = useState<CreateCombinedInput>({
    marketplace: '',
    asins: [],
    keywords: [],
    style: 'professional',
    tone: 5,
    title: '',
    description: '',
    bullet_points: ['', '', '', '', ''], // Initialize with 5 empty strings
  })

  // Inputs for array fields
  const [asinsInput, setAsinsInput] = useState('')
  const [keywordsInput, setKeywordsInput] = useState('')

  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const createListingMutation = useMutation({
    fn: useServerFn(createListing),
    onSuccess: () => {
      // Navigate back to listings page after successful creation
      navigate({ to: '/listings' })
    },
  })

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

  // Handlers for array fields
  const handleAsinsAdd = () => {
    if (asinsInput.trim()) {
      setFormData({
        ...formData,
        asins: [...formData.asins, asinsInput.trim()],
      })
      setAsinsInput('')
    }
  }

  const handleKeywordsAdd = () => {
    if (keywordsInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordsInput.trim()],
      })
      setKeywordsInput('')
    }
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
        setError('An unexpected error occurred.')
      }
    }
  }

  return (
    <div className="p-6 flex flex-wrap gap-8">
      <div className="w-full flex">
        <Card>
          <CardContent>
            <div>
              <Label htmlFor="asins" className="text-lg font-semibold mb-2">
                Add ASINs
              </Label>
              <div className="flex mt-1">
                <Input
                  id="asins"
                  value={asinsInput}
                  onChange={(e) => setAsinsInput(e.target.value)}
                  placeholder="Enter ASIN"
                  className="flex-grow"
                />
                <Button type="button" onClick={handleAsinsAdd} className="ml-2">
                  Add
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {formData.asins.map((asin, index) => (
                <Badge key={index} variant="default" className="group p-2 px-3">
                  {asin}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        asins: formData.asins.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex-1" />
      </div>
      <div className="space-y-4">
        <Card>
          <CardContent>
            <div>
              <Label htmlFor="keywords" className="text-lg font-semibold mb-2">
                Add Keywords
              </Label>
              <div className="flex mt-1">
                <Input
                  id="keywords"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Enter keyword"
                  className="flex-grow"
                />
                <Button type="button" onClick={handleKeywordsAdd} className="ml-2">
                  Add
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {formData.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="group">
                  {keyword}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        keywords: formData.keywords.filter((_, i) => i !== index),
                      })
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2 border-b pb-1">Listing Details</h3>
              </div>

              <div className="col-span-1">
                <Label htmlFor="marketplace">Marketplace</Label>
                <Input
                  id="marketplace"
                  name="marketplace"
                  value="USA"
                  placeholder="e.g., Amazon, eBay, etc."
                  className="mt-1"
                  disabled
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="bullet_points">Bullet Points</Label>
                <div className="space-y-2 mt-2">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div key={index} className="flex items-center">
                      <span className="mr-2 text-muted-foreground">•</span>
                      <Input
                        id={`bullet_point_${index}`}
                        value={formData.bullet_points[index] || ''}
                        onChange={(e) => handleBulletPointChange(index, e.target.value)}
                        placeholder={`Bullet point ${index + 1}`}
                        className="flex-grow"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate({ to: '/listings' })}>
              Cancel
            </Button>
            <Button type="submit" disabled={createListingMutation.status === 'pending'}>
              {createListingMutation.status === 'pending' ? 'Creating...' : 'Create Listing'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
