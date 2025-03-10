import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import { styleSchema } from '~/types/schemas'

// Schema for creating a new listing
export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  bullet_points: z.array(z.string()).min(1, 'At least one bullet point is required'),
  asins: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  marketplace: z.string().default('amazon.com'),
  style: styleSchema.default('professional'),
  tone: z.number().min(1).max(10).default(5),
})

// Server function to create a new listing
export const createListing = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    return z
      .object({
        data: createListingSchema,
      })
      .parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`)
    }

    // Step 1: Create the product listing
    const { data: listing, error: listingError } = await supabase
      .from('product_listings')
      .insert({
        asins: data.data.asins,
        keywords: data.data.keywords,
        marketplace: data.data.marketplace,
        style: data.data.style,
        tone: data.data.tone,
        user_id: userData.user.id,
      })
      .select()
      .single()

    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`)
    }

    // Step 2: Create the listing version
    const { data: version, error: versionError } = await supabase
      .from('listing_versions')
      .insert({
        listing_id: listing.id,
        title: data.data.title,
        description: data.data.description,
        bullet_points: data.data.bullet_points,
        is_current: true,
        version_number: 1,
      })
      .select()
      .single()

    if (versionError) {
      throw new Error(`Failed to create listing version: ${versionError.message}`)
    }

    return {
      success: true,
      listing_id: listing.id,
      version_id: version.id,
    }
  })
