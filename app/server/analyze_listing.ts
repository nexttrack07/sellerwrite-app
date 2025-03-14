import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ListingAnalysis } from '~/types/analytics'
import { Anthropic } from '@anthropic-ai/sdk'
import { mockAnalyses } from '~/mocks/listing-analyses'
import { fetchAmazonProductData } from './fetch_product'

// Toggle this to use mock data instead of making real API calls
const USE_MOCK_DATA = true

// Anthropic client initialization
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Main analysis function
export const analyzeListing = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        asin: z.string(),
        productData: z.any().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      // If product data wasn't provided, fetch it
      const listingData = data.productData || (await fetchAmazonProductData(data.asin))

      // Check for mock analysis data if enabled
      if (USE_MOCK_DATA && mockAnalyses[data.asin]) {
        console.log('Using mock analysis data for', data.asin)
        return {
          success: true,
          listingData,
          analysis: mockAnalyses[data.asin],
        }
      }

      // Otherwise, proceed with real API call
      console.log('Making real API call to Claude for ASIN:', data.asin)

      // Prepare the prompt with explicit format instructions
      const prompt = `
        Analyze this Amazon product listing and provide a detailed assessment.
        
        Your response MUST follow this exact JSON structure:
        {
          "keyword_optimization": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "title_structure": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "feature_bullets": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "description_effectiveness": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "competitor_differentiation": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "trust_factors": {
            "score": (number between 1-10),
            "pros": "Text describing strengths",
            "cons": "Text describing weaknesses",
            "recommendations": "Specific actionable recommendations"
          },
          "overall_score": (number between 1-10, average of all scores)
        }
        
        Listing data: ${JSON.stringify(listingData)}
      `

      // Call Claude API using the SDK with the specified model
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      // Update the parsing logic to handle JSON wrapped in markdown code block
      // Parse the response content using the correct property
      const jsonText = (message.content[0] as any).text
      const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
      const analysisResult = JSON.parse(cleanedJson) as ListingAnalysis

      // Validate the response structure
      validateAnalysisStructure(analysisResult)

      // Return both the original data and the standardized analysis
      return {
        success: true,
        listingData,
        analysis: analysisResult,
      }
    } catch (error: any) {
      console.error('API Error:', error)
      console.error('Error details:', {
        message: error.message,
        statusCode: error.status || error.statusCode,
        type: error.type,
        stack: error.stack,
      })

      return {
        success: false,
        error: true,
        message: error.message || 'Failed to analyze listing',
      }
    }
  })

// Helper function to validate response structure
function validateAnalysisStructure(analysis: any): asserts analysis is ListingAnalysis {
  const requiredCategories = [
    'keyword_optimization',
    'title_structure',
    'feature_bullets',
    'description_effectiveness',
    'competitor_differentiation',
    'trust_factors',
  ]

  for (const category of requiredCategories) {
    if (!analysis[category]) throw new Error(`Missing category: ${category}`)
    if (typeof analysis[category].score !== 'number') throw new Error(`Invalid score in ${category}`)
    if (typeof analysis[category].pros !== 'string') throw new Error(`Invalid pros in ${category}`)
    if (typeof analysis[category].cons !== 'string') throw new Error(`Invalid cons in ${category}`)
    if (typeof analysis[category].recommendations !== 'string')
      throw new Error(`Invalid recommendations in ${category}`)
  }

  if (typeof analysis.overall_score !== 'number') throw new Error('Missing overall_score')
}
