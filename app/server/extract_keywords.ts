import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Anthropic } from '@anthropic-ai/sdk'

// Anthropic client initialization
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Server function to extract keywords from an Amazon listing
export const extractKeywords = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        title: z.string(),
        description: z.string().optional(),
        bulletPoints: z.array(z.string()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data: { title, description, bulletPoints } }) => {
    try {
      // Modify the prompt to explicitly exclude brand names and trademarks
      function buildPrompt(productData: { title: string; description: string; bulletPoints: string[] }) {
        return `
Extract relevant keywords from the following Amazon product information. Focus on descriptive, generic terms that shoppers would use to find this type of product.

IMPORTANT: DO NOT include any of the following in your keyword extraction:
- Brand names, company names, or product line names
- Trademarked terms (including those with ™, ®, © symbols)
- Proprietary model numbers or product codes
- Competitor brand names
- Product-specific unique identifiers

For example, if analyzing "Nike Air Jordan Basketball Shoes", extract terms like "basketball shoes", "athletic footwear", "court shoes", "high-top sneakers" - but NOT "Nike", "Air Jordan", or "Jordan".

Product Title:
${productData.title}

Product Description:
${productData.description}

Product Features:
${productData.bulletPoints.join('\n')}

Analyze the text above and extract a list of relevant, generic keywords that potential customers might use to search for this type of product on Amazon. Focus on terms that describe:
- Product category and type
- Features and functionality
- Materials and components
- Use cases and applications
- Problems the product solves
- Target audience or user demographics

Format your response as a JSON array of keyword objects with the following structure:
[
  {
    "keyword": "descriptive term",
    "searchVolume": "estimated search popularity (high/medium/low)",
    "competition": "level of keyword competition (high/medium/low)",
    "relevance": "relevance to the product (high/medium/low)"
  }
]
`
      }

      // Prepare the prompt with the modified prompt
      const prompt = buildPrompt({ title, description: description || '', bulletPoints: bulletPoints || [] })

      // Call Claude API using the SDK with the specified model
      const message = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      // Parse the response content
      const jsonText = (message.content[0] as any).text
      const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
      const keywordsData = JSON.parse(cleanedJson)
      console.log('keywordsData', keywordsData)

      // Add this function to filter out any remaining brand terms
      function filterBrandTerms(
        keywords: { keyword: string }[],
        brandTerms: string[] | undefined,
      ): { keyword: string }[] {
        // Add a null check to handle undefined brandTerms
        if (!brandTerms || !Array.isArray(brandTerms)) {
          return keywords // Return original keywords if no brand terms to filter
        }

        // Now we can safely use filter since we've verified brandTerms exists
        return keywords.filter((keyword) => {
          // Check if any brand term is contained in the keyword
          return !brandTerms.some((brand) => keyword.keyword.toLowerCase().includes(brand.toLowerCase()))
        })
      }

      // Extract potential brand names from the product title
      // This is a simple approach - you might need more sophisticated brand detection
      const potentialBrands = title
        .split(' ')
        .slice(0, 2) // First two words often contain brand
        .filter((word) => word.length > 2)

      // Filter out brand terms
      const filteredKeywords = filterBrandTerms(keywordsData, potentialBrands)

      return {
        success: true,
        keywords: filteredKeywords,
      }
    } catch (error: any) {
      console.error('Keyword extraction error:', error)
      return {
        success: false,
        error: true,
        message: error.message || 'Failed to extract keywords',
      }
    }
  })
