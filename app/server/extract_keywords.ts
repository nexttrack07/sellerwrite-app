import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { Anthropic } from '@anthropic-ai/sdk'

// Anthropic client initialization
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper function to check if a phrase is a subset of another phrase
function isSubPhrase(phrase1: string, phrase2: string): boolean {
  const words1 = phrase1.toLowerCase().split(' ')
  const words2 = phrase2.toLowerCase().split(' ')

  // If phrase1 is longer than phrase2, it can't be a subset
  if (words1.length > words2.length) return false

  // Check if all words in phrase1 appear in phrase2 in the same order
  const phrase2Str = words2.join(' ')
  return phrase2Str.includes(words1.join(' '))
}

// Helper function to remove redundant keywords
function removeRedundantKeywords(keywords: Array<{ keyword: string; [key: string]: any }>) {
  // Sort keywords by length (shortest to longest) to prioritize base terms
  const sortedKeywords = [...keywords].sort((a, b) => a.keyword.length - b.keyword.length)

  const uniqueKeywords: Array<{ keyword: string; [key: string]: any }> = []
  const seenPhrases = new Set<string>()

  for (const keyword of sortedKeywords) {
    const currentPhrase = keyword.keyword.toLowerCase()

    // Skip if we've seen this exact phrase
    if (seenPhrases.has(currentPhrase)) continue

    // Check if this phrase is redundant with any existing phrases
    const isRedundant = uniqueKeywords.some(
      (existingKeyword) =>
        isSubPhrase(existingKeyword.keyword, currentPhrase) || isSubPhrase(currentPhrase, existingKeyword.keyword),
    )

    if (!isRedundant) {
      uniqueKeywords.push(keyword)
      seenPhrases.add(currentPhrase)
    }
  }

  return uniqueKeywords
}

// Server function to extract keywords from an Amazon listing
export const extractKeywords = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        content: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data: { content } }) => {
    try {
      function buildPrompt(content: string) {
        return `

Product details:
${content}


Analyze the text above and extract a list of unique, non-redundant keywords that potential customers might use to search for this type of product on Amazon. Focus on terms that describe:
- Core product type (single most specific term)
- Unique features and functionality
- Materials and components
- Use cases and applications
- Problems the product solves
- Target audience or user demographics

Each term should represent a distinct concept without repeating base terms.

Examples:
BAD (redundant):
- phone case, clear phone case, magnetic phone case // phone case is redundant
- puzzle, landscape puzzle, scenery puzzle // puzzle is redundant

GOOD (unique concepts):
- phone case, magnetic mount, shock protection
- jigsaw puzzle, landscape scenery, memory improvement

Format your response as a JSON array of keyword objects with the following structure:
[
  {
    "keyword": "unique descriptive term",
    "searchVolume": "estimated search popularity (high/medium/low)",
    "competition": "level of keyword competition (high/medium/low)",
    "relevance": "relevance to the product (high/medium/low)"
  }
]
`
      }

      // Prepare the prompt with the modified prompt
      const prompt = buildPrompt(content)

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

      // Extract potential brand names from the product title
      const potentialBrands = content
        .split(' ')
        .slice(0, 2)
        .filter((word: string) => word.length > 2)

      // Filter out brand terms
      const filteredKeywords = filterBrandTerms(keywordsData, potentialBrands)

      // Remove redundant keywords
      const uniqueKeywords = removeRedundantKeywords(filteredKeywords)

      // Validate the final keywords
      const validatedKeywords = uniqueKeywords.filter((keyword) => {
        // Ensure minimum length
        if (keyword.keyword.length < 3) return false

        // Ensure keyword is not just numbers
        if (/^\d+$/.test(keyword.keyword)) return false

        // Ensure keyword contains actual words
        if (!/[a-zA-Z]/.test(keyword.keyword)) return false

        return true
      })

      return {
        success: true,
        keywords: validatedKeywords,
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

// Add this function to filter out any remaining brand terms
function filterBrandTerms(keywords: { keyword: string }[], brandTerms: string[] | undefined): { keyword: string }[] {
  if (!brandTerms || !Array.isArray(brandTerms)) {
    return keywords
  }

  return keywords.filter((keyword) => {
    return !brandTerms.some((brand) => keyword.keyword.toLowerCase().includes(brand.toLowerCase()))
  })
}
