import { createAPIFileRoute } from '@tanstack/react-start/api'
import { Anthropic } from '@anthropic-ai/sdk'

// Anthropic client initialization
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const APIRoute = createAPIFileRoute('/api/extract-keywords')({
  POST: async ({ request }) => {
    try {
      const requestData = await request.json()
      const { title, description, bulletPoints } = requestData

      if (!title) {
        return new Response(JSON.stringify({ success: false, error: 'Missing title parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Prepare the prompt with explicit format instructions
      const prompt = `
        Extract potential long-tail SEO keywords for this Amazon product listing. Focus on keywords that would be valuable for Amazon search optimization specifically.

        Product title: ${title}
        ${description ? `Product description: ${description}` : ''}
        ${
          bulletPoints && bulletPoints.length > 0
            ? `Product features:\n${bulletPoints.map((bullet: string) => `- ${bullet}`).join('\n')}`
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

      return new Response(
        JSON.stringify({
          success: true,
          keywords: keywordsData.keywords,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error: any) {
      console.error('Keyword extraction error:', error)

      return new Response(
        JSON.stringify({
          success: false,
          error: true,
          message: error.message || 'Failed to extract keywords',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  },
})
