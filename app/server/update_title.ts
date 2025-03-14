import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import { createTitleSchema } from '~/types/schemas'

export const updateTitle = createServerFn({
  method: 'POST',
})
  .validator((d: unknown) => {
    return z
      .object({
        listing_id: z.number(),
        content: z.string(),
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
      // Just update the keywords_used field for an existing title
      const { data: updatedTitle, error: updateError } = await supabase
        .from('titles')
        .update({ keywords_used: data.keywords_used })
        .eq('id', data.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update title keywords: ${updateError.message}`)
      }

      return updatedTitle
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
      .from('titles')
      .select('version_number')
      .eq('listing_id', data.listing_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1

    // Set all existing versions to not current
    await supabase.from('titles').update({ is_current: false }).eq('listing_id', data.listing_id)

    // Insert new title
    const { data: newTitle, error: insertError } = await supabase
      .from('titles')
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
      throw new Error(`Failed to insert title: ${insertError.message}`)
    }

    // Update the product listing with the new current title
    const { error: updateError } = await supabase
      .from('product_listings')
      .update({ current_title_id: newTitle.id })
      .eq('id', data.listing_id)

    if (updateError) {
      throw new Error(`Failed to update product listing: ${updateError.message}`)
    }

    return newTitle
  })
