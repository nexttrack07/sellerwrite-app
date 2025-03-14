import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import { createFeaturesSchema } from '~/types/schemas'

export const updateFeatures = createServerFn({
  method: 'POST',
})
  .validator((d: unknown) => {
    return z
      .object({
        listing_id: z.number(),
        content: z.array(z.string()),
        keywords_used: z.array(z.string()).optional(),
      })
      .parse(d)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user?.id) {
      throw new Error('User not authenticated')
    }

    // Check if this is just a keywords update
    if ('id' in data) {
      // Just update the keywords_used field for an existing features
      const { data: updatedFeatures, error: updateError } = await supabase
        .from('features')
        .update({ keywords_used: data.keywords_used })
        .eq('id', data.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update features keywords: ${updateError.message}`)
      }

      return updatedFeatures
    }

    // Full update with content
    // Verify user owns this listing
    const { data: listing, error: listingError } = await supabase
      .from('product_listings')
      .select('id')
      .eq('id', data.listing_id)
      .eq('user_id', userData.user.id)
      .single()

    if (listingError) {
      throw new Error(`Unauthorized or listing not found: ${listingError.message}`)
    }

    // Get the latest version number
    const { data: latestVersion, error: versionError } = await supabase
      .from('features')
      .select('version_number')
      .eq('listing_id', data.listing_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1

    // Set all existing versions to not current
    await supabase.from('features').update({ is_current: false }).eq('listing_id', data.listing_id)

    // Insert new features
    const { data: newFeatures, error: insertError } = await supabase
      .from('features')
      .insert({
        listing_id: data.listing_id,
        content: data.content,
        version_number: newVersionNumber,
        is_current: true,
        keywords_used: data.keywords_used || [],
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert features: ${insertError.message}`)
    }

    // Update the product listing with the new current features
    const { error: updateError } = await supabase
      .from('product_listings')
      .update({ current_features_id: newFeatures.id })
      .eq('id', data.listing_id)

    if (updateError) {
      throw new Error(`Failed to update product listing: ${updateError.message}`)
    }

    return newFeatures
  })
