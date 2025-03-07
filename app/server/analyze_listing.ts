import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { ListingAnalysis } from '~/types/analytics'

// Function to fetch Amazon product data from Canopy API
async function fetchAmazonProductData(asin: string) {
  const query = `
    query amazonProduct {
      amazonProduct(input: {asin: "${asin}"}) {
        title
        mainImageUrl
        rating
        price {
          display
        }
        bulletPoints
        description
        featureBullets
        images {
          hiRes
        }
        categories {
          name
        }
        attributes {
          name
          value
        }
      }
    }
  `

  const response = await fetch('https://graphql.canopyapi.co/', {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'API-KEY': process.env.CANOPY_API_KEY as string,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Amazon data: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`Canopy API error: ${data.errors[0].message}`)
  }

  return data.data.amazonProduct
}

export const analyzeListing = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        asin: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data: { asin } }) => {
    try {
      // Fetch product data from Canopy API
      const listingData = await fetchAmazonProductData(asin)

      // Prepare the prompt with explicit format instructions
      const prompt = `
        Analyze this Amazon product listing and provide a structured assessment. 
        
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

      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const data = await response.json()
      const analysisResult = JSON.parse(data.content[0].text) as ListingAnalysis

      // Validate the response structure
      validateAnalysisStructure(analysisResult)

      // Return both the original data and the standardized analysis
      return {
        success: true,
        listingData,
        analysis: analysisResult,
      }
    } catch (error: any) {
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
