import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { styleSchema } from '~/types/schemas'
import { getSupabaseServerClient } from '~/utils/supabase'
import { useState } from 'react'
import { z } from 'zod'
import { useMutation } from '~/hooks/useMutation'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Asins } from '~/components/Asins'
import { Keywords } from '~/components/Keywords'
import { ListingDetails } from '~/components/ListingDetails'

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

  const handleAddAsin = (asin: string) => {
    setFormData({
      ...formData,
      asins: [...formData.asins, asin],
    })
  }

  const handleRemoveAsin = (index: number) => {
    setFormData({
      ...formData,
      asins: formData.asins.filter((_, i) => i !== index),
    })
  }

  const handleAddKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: [...formData.keywords, keyword],
    })
  }

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index),
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
    <div className="container mx-auto p-4 flex flex-wrap flex-col md:flex-row gap-4">
      <div className="flex w-full">
        <Asins asins={formData.asins} onAddAsin={handleAddAsin} onRemoveAsin={handleRemoveAsin} />
      </div>
      <Keywords keywords={formData.keywords} onAddKeyword={handleAddKeyword} onRemoveKeyword={handleRemoveKeyword} />

      <Card className="flex-1">
        <form onSubmit={handleSubmit}>
          <CardContent>
            <ListingDetails
              title={formData.title}
              bulletPoints={formData.bullet_points}
              description={formData.description}
              marketplace={formData.marketplace}
              onTitleChange={handleInputChange}
              onBulletPointChange={handleBulletPointChange}
              onDescriptionChange={handleInputChange}
            />
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
