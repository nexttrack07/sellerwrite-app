import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const analyzeFeatures = createServerFn({
  method: 'POST',
})
  .validator((d: unknown) => {
    return z
      .object({
        features_id: z.number(),
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

    // Fetch the features first
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*, listing_id')
      .eq('id', data.features_id)
      .eq('is_current', true)
      .single()

    if (featuresError) {
      throw new Error(`Failed to fetch features: ${featuresError.message}`)
    }

    // Now fetch the product listing separately
    const { data: productListing, error: productListingError } = await supabase
      .from('product_listings')
      .select('user_id, asins')
      .eq('id', features.listing_id)
      .single()

    if (productListingError) {
      throw new Error(`Failed to fetch product listing: ${productListingError.message}`)
    }

    // Verify user owns these features
    if (productListing.user_id !== userData.user.id) {
      throw new Error('Unauthorized')
    }

    // Analyze the features using Anthropic API
    const asin = data.asin || (productListing.asins && productListing.asins[0]) || ''
    const analysis = await analyzeFeaturesWithAI(features.content, asin)

    // Update the features with the analysis
    const { data: updatedFeatures, error: updateError } = await supabase
      .from('features')
      .update({ analysis_data: analysis })
      .eq('id', data.features_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update features with analysis: ${updateError.message}`)
    }

    return {
      success: true,
      features: updatedFeatures,
      analysis,
    }
  })

// Helper function to analyze features with AI
async function analyzeFeaturesWithAI(features: string[], asin: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const featuresText = features.map((f) => `• ${f}`).join('\n')

  const prompt = `Analyze these Amazon product bullet points/features:
  
${featuresText}
  
  If you know the ASIN ${asin}, please consider any relevant product information.
  
  Provide an analysis in the following JSON format:
  {
    "score": 0-10 rating of the features' effectiveness,
    "pros": "What works well in these features",
    "cons": "What could be improved",
    "recommendations": "Specific recommendations for improvement",
    "keyword_usage": "Analysis of keyword usage in the features",
    "feature_by_feature": [
      {
        "feature": "The feature text",
        "analysis": "Analysis of this specific feature"
      }
    ]
  }`

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1500,
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
