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

    // 1. First, set all existing versions to is_current=false
    const { error: updateError } = await supabase
      .from('listing_versions')
      .update({ is_current: false })
      .eq('listing_id', data.data.id)

    if (updateError) {
      throw new Error(`Failed to update version statuses: ${updateError.message}`)
    }

    // 2. Get the latest version number
    const { data: versions, error: versionsError } = await supabase
      .from('listing_versions')
      .select('version_number')
      .eq('listing_id', data.data.id)
      .order('version_number', { ascending: false })
      .limit(1)

    if (versionsError) {
      throw new Error(`Failed to get latest version: ${versionsError.message}`)
    }

    // Calculate the next version number
    const latestVersion = versions && versions.length > 0 ? versions[0].version_number : 0
    const nextVersionNumber = latestVersion + 1

    // 3. Create a new version with is_current=true and incremented version number
    const { data: newVersion, error: versionError } = await supabase
      .from('listing_versions')
      .insert({
        listing_id: data.data.id,
        title: data.data.title,
        description: data.data.description,
        bullet_points: nonEmptyBulletPoints,
        is_current: true,
        version_number: nextVersionNumber,
      })
      .select()
      .single()

    if (versionError) {
      throw new Error(`Failed to create new version: ${versionError.message}`)
    }

    return { success: true, version: newVersion }
  })
