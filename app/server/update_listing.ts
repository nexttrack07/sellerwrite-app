import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import { updateProductListingSchema } from '~/types/schemas'

// Schema for listing update
export const updateListingSchema = z.object({
  keywords: z.array(z.string()),
})

// Server function to update a listing
export const updateListing = createServerFn()
  .validator((input: unknown) =>
    z
      .object({
        id: z.number(),
        data: updateProductListingSchema,
      })
      .parse(input),
  )
  .handler(async ({ data: { id, data } }) => {
    try {
      const supabase = await getSupabaseServerClient()

      const { data: updatedListing, error } = await supabase
        .from('product_listings')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return {
        success: true,
        data: updatedListing,
      }
    } catch (error: any) {
      console.error('Error updating listing:', error)
      return {
        success: false,
        error: true,
        message: error.message || 'Failed to update listing',
      }
    }
  })
