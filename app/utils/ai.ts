import Anthropic from '@anthropic-ai/sdk'

// Add interface for fetchAI parameters
interface FetchAIParams {
  prompt: string
  temperature?: number
  max_tokens?: number
}

// Simple utility to call the AI API using the Anthropic SDK's Messages API
export async function fetchAI({ prompt, temperature = 0.7, max_tokens = 1000 }: FetchAIParams) {
  // Check if we're in development mode and should use mock data
  const useMockData = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AI === 'true'

  if (useMockData) {
    console.log('Using mock AI data instead of calling Claude API')
    // Return mock data for testing
    return JSON.stringify({
      title: 'Professional Ergonomic Office Chair with Lumbar Support - Adjustable Height and Armrests',
      bullet_points: [
        'ERGONOMIC DESIGN: Contoured seat and breathable mesh back provide all-day comfort and support',
        'ADJUSTABLE FEATURES: Customize height, armrests, and recline angle to your perfect position',
        'LUMBAR SUPPORT: Built-in support system reduces back pain and improves posture during long work sessions',
        'DURABLE CONSTRUCTION: Heavy-duty base and premium materials support up to 300 lbs with 5-year warranty',
        'EASY ASSEMBLY: Quick 15-minute setup with included tools and clear instructions',
      ],
      description:
        "Transform your workspace with our Professional Ergonomic Office Chair, designed for maximum comfort during long workdays. The breathable mesh back keeps you cool while the contoured seat cushion reduces pressure points. Fully adjustable height, armrests, and recline tension let you customize your seating position for optimal ergonomics. The built-in lumbar support system maintains proper spine alignment, reducing back pain and fatigue. Constructed with premium materials and a heavy-duty base, this chair supports up to 300 pounds and comes with smooth-rolling casters that won't damage your floors. Perfect for home offices, corporate settings, or anyone who spends significant time at a desk. Assembly takes just 15 minutes with the included tools. Invest in your productivity and well-being with a chair that supports you throughout your workday.",
    })
  }

  try {
    console.log('Calling Anthropic API with Messages API...')

    // Initialize the Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Call the API using the Messages API
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: max_tokens,
      temperature: temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('Anthropic API response received successfully')

    // Parse the response content
    const jsonText = (message.content[0] as any).text
    const cleanedJson = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')

    return cleanedJson
  } catch (error) {
    console.error('Error calling Anthropic API:', error)
    throw new Error('Failed to generate content from AI')
  }
}
