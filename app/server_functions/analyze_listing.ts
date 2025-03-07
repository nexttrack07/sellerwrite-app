import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod' // Assuming you're using Zod for validation

// Function to fetch Amazon product data
async function fetchAmazonProductData(asin: string) {
  // Replace with your actual Amazon API integration
  const response = await fetch(`https://your-amazon-api.com/products/${asin}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch Amazon data: ${response.statusText}`)
  }
  return await response.json()
}

// Function to analyze the listing using Claude API
async function analyzeProductListing(listingData: any) {
  // Replace with your actual Claude API integration
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
          content: `Analyze this Amazon product listing and provide a structured assessment with scores for keyword optimization, title structure, feature bullets, description effectiveness, competitor differentiation, and trust factors. Include strengths, areas for improvement, and recommendations. Format your response as JSON.
          
          ${JSON.stringify(listingData)}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const claudeResponse = await response.json()
  return claudeResponse.content[0].text
}

export const analyzeAmazonListingFn = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        asin: z.string().min(10).max(10),
      })
      .parse(d as any),
  )
  .handler(async ({ data }) => {
    try {
      // Step 1: Fetch the Amazon listing data
      const listingData = await fetchAmazonProductData(data.asin)

      // Step 2: Send to Claude for analysis
      const analysis = await analyzeProductListing(listingData)

      // Step 3: Return both the original data and the analysis
      return {
        success: true,
        listingData,
        analysis: JSON.parse(analysis), // Parse the JSON response from Claude
      }
    } catch (error: any) {
      return {
        success: false,
        error: true,
        message: error.message || 'Failed to analyze listing',
      }
    }
  })
