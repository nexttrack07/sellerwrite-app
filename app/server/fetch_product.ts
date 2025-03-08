import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { mockProducts } from '~/mocks/amazon-products'

// Toggle this to use mock data instead of making real API calls
const USE_MOCK_DATA = true

// Function to fetch Amazon product data from Canopy API
export async function fetchAmazonProductData(asin: string) {
  // Check for mock data first if enabled
  if (USE_MOCK_DATA && mockProducts[asin]) {
    console.log('Using mock product data for', asin)
    return mockProducts[asin]
  }

  // If no mock data or mocks disabled, proceed with real API call
  const query = `
    query amazonProduct {
      amazonProduct(input: {asin: "${asin}"}) {
        title
        mainImageUrl
        optimizedDescription
        featureBullets
      }
    }
  `

  console.log('Making real API call to Canopy for ASIN:', asin)

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

// Separate function to fetch just the product data
export const fetchProductData = createServerFn()
  .validator((d: unknown) =>
    z
      .object({
        asin: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data: { asin } }) => {
    try {
      const productData = await fetchAmazonProductData(asin)
      return {
        success: true,
        productData,
      }
    } catch (error: any) {
      return {
        success: false,
        error: true,
        message: error.message || 'Failed to fetch product data',
      }
    }
  })
