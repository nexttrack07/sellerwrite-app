import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getSupabaseServerClient } from '~/utils/supabase'
import { styleSchema } from '~/types/schemas'
import { fetchAI } from '~/utils/ai'

// Schema for keyword density settings
const keywordDensitySchema = z.object({
  title: z.enum(['low', 'medium', 'high']),
  bullets: z.enum(['low', 'medium', 'high']),
  description: z.enum(['low', 'medium', 'high']),
})

// Schema for generating a listing
const generateListingSchema = z.object({
  // Product details
  productName: z.string(),
  productCategory: z.string(),
  productDescription: z.string(),
  uniqueFeatures: z.string().optional(),
  keyHighlights: z.string().optional(),
  targetAudience: z.string().optional(),
  competitiveAdvantage: z.string().optional(),

  // ASINs and keywords
  asins: z.array(z.string()),
  keywords: z.array(z.string()),

  // Style and tone
  style: styleSchema,
  tone: z.number().min(1).max(10),

  // Keyword density settings
  keywordDensity: keywordDensitySchema,
})

export const generateListing = createServerFn({
  method: 'POST',
})
  .validator((input: unknown) => {
    return generateListingSchema.parse(input)
  })
  .handler(async ({ data }) => {
    const supabase = await getSupabaseServerClient()

    // Add more detailed logging
    try {
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }

      // 1. Prepare the prompt for Claude
      const selectedKeywords = data.keywords.join(', ')
      const densityGuide = `
        Title Keyword Density: ${data.keywordDensity.title}
        Bullet Points Keyword Density: ${data.keywordDensity.bullets}
        Description Keyword Density: ${data.keywordDensity.description}
      `

      const prompt = `
        Generate an Amazon product listing for the following product:
        
        Product Name: ${data.productName}
        Product Category: ${data.productCategory}
        
        ${data.uniqueFeatures ? `Unique Features: ${data.uniqueFeatures}` : ''}
        ${data.keyHighlights ? `Key Highlights: ${data.keyHighlights}` : ''}
        ${data.targetAudience ? `Target Audience: ${data.targetAudience}` : ''}
        ${data.competitiveAdvantage ? `Competitive Advantage: ${data.competitiveAdvantage}` : ''}
        
        Style: ${data.style}
        Tone (1-10, where 10 is most enthusiastic): ${data.tone}
        
        Important Keywords to Include: ${selectedKeywords}
        
        Keyword Density Settings:
        ${densityGuide}
        
        Please generate:
        1. A compelling product title (max 200 characters)
        2. 5 bullet points highlighting key features and benefits
        3. A product description (200-300 words)
        
        Format your response as a JSON object with the following structure:
        {
          "title": "Your generated title here",
          "bullet_points": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
          "description": "Your generated description here"
        }
      `

      // 2. Call Claude API
      console.log('Preparing to call Claude API with prompt:', prompt.substring(0, 100) + '...')
      const aiResponse = await fetchAI({
        prompt,
        temperature: 0.7,
        max_tokens: 1500,
      })
      console.log('Received AI response, length:', aiResponse.length)

      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the AI response')
      }

      const generatedContent = JSON.parse(jsonMatch[0])

      // Validate the structure
      if (!generatedContent.title || !generatedContent.bullet_points || !generatedContent.description) {
        throw new Error('AI response missing required fields')
      }

      // 4. Save to database
      // First insert the product listing
      const { data: listingData, error: listingError } = await supabase
        .from('product_listings')
        .insert({
          marketplace: 'USA', // Default to USA
          asins: data.asins,
          keywords: data.keywords,
          user_id: userData.user.id, // Add the user ID
        })
        .select()
        .single()

      if (listingError) {
        throw new Error(`Failed to create listing: ${listingError.message}`)
      }

      // Then insert the version using the listing ID
      const { data: versionData, error: versionError } = await supabase
        .from('listing_versions')
        .insert({
          listing_id: listingData.id,
          title: generatedContent.title,
          description: generatedContent.description,
          bullet_points: generatedContent.bullet_points,
          is_current: true,
          version_number: 1,
        })
        .select()
        .single()

      if (versionError) {
        throw new Error(`Failed to create listing version: ${versionError.message}`)
      }

      // 5. Update the listing with the current version ID
      const { error: updateError } = await supabase
        .from('product_listings')
        .update({ current_version_id: versionData.id })
        .eq('id', listingData.id)

      if (updateError) {
        console.error('Failed to update listing with version ID:', updateError)
        // Continue anyway since we have the listing ID
      }

      // 6. Return the listing ID and generated content
      return {
        success: true,
        listingId: listingData.id,
        content: generatedContent,
      }
    } catch (error) {
      console.error('Error in generate_listing:', error)
      throw error // Re-throw to maintain the original error
    }
  })
