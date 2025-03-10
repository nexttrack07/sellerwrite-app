import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'

// Server function to fetch a listing by ID
export const fetchListing = createServerFn()
  .validator((input: unknown) => {
    return z
      .object({
        id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
      })
      .parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // First, fetch the basic listing data
    const { data: listing, error: listingError } = await supabase
      .from('product_listings')
      .select('id, marketplace, asins, keywords, style, tone, created_at')
      .eq('id', data.id)
      .single()

    if (listingError) {
      throw new Error(`Failed to fetch listing: ${listingError.message}`)
    }

    if (!listing) {
      throw new Error('Listing not found')
    }

    // Then, fetch the active version separately
    const { data: versions, error: versionsError } = await supabase
      .from('listing_versions')
      .select('id, title, description, bullet_points')
      .eq('listing_id', data.id)
      .eq('is_current', true)
      .order('id', { ascending: false })
      .limit(1)

    if (versionsError) {
      throw new Error(`Failed to fetch listing version: ${versionsError.message}`)
    }

    if (!versions || versions.length === 0) {
      throw new Error('No active version found for this listing')
    }

    const version = versions[0]

    // Combine the data
    return {
      id: listing.id,
      marketplace: listing.marketplace,
      asins: listing.asins,
      keywords: listing.keywords,
      style: listing.style,
      tone: listing.tone,
      created_at: listing.created_at,
      title: version.title,
      description: version.description,
      bullet_points: version.bullet_points,
      version_id: version.id,
    }
  })
