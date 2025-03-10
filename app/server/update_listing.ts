import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'

// Schema for listing update
export const updateListingSchema = z.object({
  id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  bullet_points: z.array(z.string()).min(1, 'At least one bullet point is required'),
})

// Server function to update a listing
export const updateListing = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    return z
      .object({
        data: updateListingSchema,
      })
      .parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // Get non-empty bullet points only
    const nonEmptyBulletPoints = data.data.bullet_points.filter((point) => point.trim() !== '')

    // Create a new version with is_current=true
    const { data: newVersion, error: versionError } = await supabase
      .from('listing_versions')
      .insert({
        listing_id: data.data.id,
        title: data.data.title,
        description: data.data.description,
        bullet_points: nonEmptyBulletPoints,
        is_current: true,
        version_number: 1,
      })
      .select()
      .single()

    if (versionError) {
      throw new Error(`Failed to create new version: ${versionError.message}`)
    }

    // Set all other versions to inactive
    const { error: updateError } = await supabase
      .from('listing_versions')
      .update({ is_current: false })
      .eq('listing_id', data.data.id)
      .neq('id', newVersion.id)

    if (updateError) {
      throw new Error(`Failed to update version statuses: ${updateError.message}`)
    }

    return { success: true, version: newVersion }
  })
