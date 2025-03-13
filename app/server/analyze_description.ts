import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import Anthropic from '@anthropic-ai/sdk'

export const analyzeDescription = createServerFn({
  method: 'POST',
})
  .validator((d: unknown) => {
    return z
      .object({
        description_id: z.number(),
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

    // Fetch the description
    const { data: description, error: descriptionError } = await supabase
      .from('descriptions')
      .select('*, product_listings!inner(user_id, asins)')
      .eq('id', data.description_id)
      .single()

    if (descriptionError) {
      throw new Error(`Failed to fetch description: ${descriptionError.message}`)
    }

    // Verify user owns this description
    if (description.product_listings.user_id !== userData.user.id) {
      throw new Error('Unauthorized')
    }

    // Analyze the description using Anthropic API
    const asin = data.asin || (description.product_listings.asins && description.product_listings.asins[0]) || ''
    const analysis = await analyzeDescriptionWithAI(description.content, asin)

    // Update the description with the analysis
    const { data: updatedDescription, error: updateError } = await supabase
      .from('descriptions')
      .update({ analysis_data: analysis })
      .eq('id', data.description_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update description with analysis: ${updateError.message}`)
    }

    return {
      success: true,
      description: updatedDescription,
      analysis,
    }
  })

// Helper function to analyze description with AI
async function analyzeDescriptionWithAI(description: string, asin: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const prompt = `Analyze this Amazon product description:
  
"${description}"
  
  If you know the ASIN ${asin}, please consider any relevant product information.
  
  Provide an analysis in the following JSON format:
  {
    "score": 0-10 rating of the description's effectiveness,
    "pros": "What works well in this description",
    "cons": "What could be improved",
    "recommendations": "Specific recommendations for improvement",
    "keyword_usage": "Analysis of keyword usage in the description",
    "readability": "Analysis of readability and flow",
    "persuasiveness": "Analysis of persuasive elements"
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
