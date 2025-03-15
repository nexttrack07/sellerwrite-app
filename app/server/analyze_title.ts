import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const analyzeTitle = createServerFn({
  method: 'POST',
})
  .validator((d: unknown) => {
    return z
      .object({
        title_id: z.number(),
        asin: z.string().optional(),
      })
      .parse(d)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user?.id) {
      throw new Error('User not authenticated')
    }

    // Fetch the title first
    const { data: title, error: titleError } = await supabase
      .from('titles')
      .select('*, listing_id')
      .eq('id', data.title_id)
      .eq('is_current', true)
      .single()

    if (titleError) {
      throw new Error(`Failed to fetch title: ${titleError.message}`)
    }

    // Now fetch the product listing separately
    const { data: productListing, error: productListingError } = await supabase
      .from('product_listings')
      .select('user_id, asins')
      .eq('id', title.listing_id)
      .single()

    if (productListingError) {
      throw new Error(`Failed to fetch product listing: ${productListingError.message}`)
    }

    // Verify user owns this title
    if (productListing.user_id !== userData.user.id) {
      throw new Error('Unauthorized')
    }

    // Analyze the title using Anthropic API
    const asin = data.asin || (productListing.asins && productListing.asins[0]) || ''
    const analysis = await analyzeTitleWithAI(title.content, asin)

    // Update the title with the analysis
    const { data: updatedTitle, error: updateError } = await supabase
      .from('titles')
      .update({ analysis_data: analysis })
      .eq('id', data.title_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update title with analysis: ${updateError.message}`)
    }

    return {
      success: true,
      title: updatedTitle,
      analysis,
    }
  })

// Helper function to analyze title with AI
async function analyzeTitleWithAI(title: string, asin: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const prompt = `Analyze this Amazon product title: "${title}"
  
  If you know the ASIN ${asin}, please consider any relevant product information.
  
  Provide an analysis in the following JSON format:
  {
    "score": 0-10 rating of the title's effectiveness,
    "pros": "What works well in this title",
    "cons": "What could be improved",
    "recommendations": "Specific recommendations for improvement"
  }`

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  // Extract and parse the JSON from the response
  const content = (response.content[0] as any).text
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*?}/)

  if (jsonMatch) {
    const jsonText = jsonMatch[0].replace(/```json\n/, '').replace(/\n```$/, '')
    return JSON.parse(jsonText)
  }

  throw new Error('Failed to parse AI analysis response')
}
