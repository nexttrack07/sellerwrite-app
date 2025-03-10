import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'

// Server function to save a listing analysis
export const saveAnalysis = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    return z
      .object({
        listing_id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
        version_id: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
        analysis_data: z.record(z.any()), // JSONB data for the analysis results
      })
      .parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // Check if an analysis already exists for this version
    const { data: existingAnalysis, error: checkError } = await supabase
      .from('listing_analyses')
      .select('id')
      .eq('listing_id', data.listing_id)
      .eq('version_id', data.version_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no analysis exists
      throw new Error(`Failed to check for existing analysis: ${checkError.message}`)
    }

    // If an analysis already exists, update it
    if (existingAnalysis) {
      const { data: updatedAnalysis, error: updateError } = await supabase
        .from('listing_analyses')
        .update({
          analysis_data: data.analysis_data,
        })
        .eq('id', existingAnalysis.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update analysis: ${updateError.message}`)
      }

      return {
        success: true,
        analysis: updatedAnalysis,
      }
    }

    // Otherwise, create a new analysis
    const { data: newAnalysis, error: insertError } = await supabase
      .from('listing_analyses')
      .insert({
        listing_id: data.listing_id,
        version_id: data.version_id,
        analysis_data: data.analysis_data,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to save analysis: ${insertError.message}`)
    }

    return {
      success: true,
      analysis: newAnalysis,
    }
  })

// Server function to fetch a listing analysis
export const fetchAnalysis = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    console.log('input', input)
    return z
      .object({
        listing_id: z.number(),
        version_id: z.number(),
      })
      .parse(input)
  })
  .handler(async ({ data }): Promise<{ success: boolean; exists: boolean; error: string | null; analysis: any }> => {
    const supabase = await getSupabaseServerClient()

    console.log('data', data)
    // Add additional validation
    if (!data.listing_id || !data.version_id) {
      return {
        success: false,
        exists: false,
        error: 'Missing required fields: listing_id and version_id',
        analysis: null,
      }
    }

    // Get the analysis for the specified listing and version
    const { data: analysis, error } = await supabase
      .from('listing_analyses')
      .select('*')
      .eq('listing_id', data.listing_id)
      // Get the latest analysis
      .order('created_at', { ascending: false })
      // Limit to just one row
      .limit(1)
      .maybeSingle() // Use maybeSingle instead of single

    console.log('error', error)

    if (error) {
      if (error.code === 'PGRST116') {
        // No analysis found
        return {
          success: true,
          exists: false,
          error: null,
          analysis: null,
        }
      }
      throw new Error(`Failed to fetch analysis: ${error.message}`)
    }

    return {
      success: true,
      exists: true,
      error: null,
      analysis,
    }
  })
