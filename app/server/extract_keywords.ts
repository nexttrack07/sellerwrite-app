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
      // Prepare the prompt with explicit format instructions
      const prompt = `
        Extract potential long-tail SEO keywords for this Amazon product listing. Focus on keywords that would be valuable for Amazon search optimization specifically.

        Product title: ${title}
        ${description ? `Product description: ${description}` : ''}
        ${
          bulletPoints && bulletPoints.length > 0
            ? `Product features:\n${bulletPoints.map((bullet) => `- ${bullet}`).join('\n')}`
            : ''
        }

        Provide your response as a JSON array with the following structure:
        {
          "keywords": [
            {
              "keyword": "the long tail keyword",
              "searchVolume": "low/medium/high",
              "competition": "low/medium/high",
              "relevance": "primary/secondary/tertiary"
            }
          ]
        }

        Focus on discovering:
        1. Multi-word search phrases (3-7 words is ideal)
        2. Highly specific product attributes
        3. Problem-solution pairings
        4. Buyer intent phrases
        5. Consider different variations and synonyms

        For each keyword:
        - Estimate search volume (low/medium/high)
        - Estimate competition level (low/medium/high)
        - Categorize relevance (primary/secondary/tertiary)

        Generate at least 15 strong keyword phrases.
      `

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

      return {
        success: true,
        keywords: keywordsData.keywords,
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
