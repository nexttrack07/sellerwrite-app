import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { fetchProductData } from '~/server/fetch_product'
import { extractKeywords } from '~/server/extract_keywords'
import { Style } from '~/types/schemas'
import { generateListing as generateListingFn } from '~/server/generate_listing'

// Define types for our store
interface ProductData {
  title: string
  features: string[]
  description: string
  images: string[]
  [key: string]: any // For other product data properties
}

export interface Keyword {
  id: string
  text: string
  sourceAsin: string | null
  searchVolume?: string
  competition?: string
  relevance?: string
  selected: boolean
}

interface ListingContent {
  title: string
  description: string
  bulletPoints: string[]
}

interface ProductDetails {
  productType: string
  category: string
  uniqueFeatures: string
  keyFeatures: string
  targetAudience: string
  name?: string
  description?: string
  keyHighlights?: string
  competitiveAdvantage?: string
}

interface ListingState {
  // ASINs and product data
  asins: string[]
  asinData: Record<string, ProductData | null>
  asinLoadingStatus: Record<string, 'idle' | 'loading' | 'success' | 'error'>
  asinErrors: Record<string, string | null>

  // Keywords
  keywords: Keyword[]
  keywordsLoading: boolean

  // Listing configuration
  listingStyle: Style
  listingTone: number // 1-10

  // Generated listing content
  generatedContent: ListingContent | null
  contentLoading: boolean
  generatedListingId?: number

  // Current step in the process
  currentStep: number

  // Product details
  productDetails: ProductDetails

  // Actions - will be implemented below
  // ASIN actions
  addAsin: (asin: string) => Promise<void>
  removeAsin: (asin: string) => void
  fetchProductData: (asin: string) => Promise<void>

  // Keyword actions
  extractKeywords: (asin: string) => Promise<void>
  addKeyword: (keyword: string) => void
  removeKeyword: (keywordId: string) => void
  toggleKeywordSelection: (keywordId: string) => void

  // Listing actions
  setListingStyle: (style: Style) => void
  setListingTone: (tone: number) => void
  generateListing: (options?: {
    keywordDensity?: { title: string; bullets: string; description: string }
  }) => Promise<void>
  updateGeneratedContent: (content: Partial<ListingContent>) => void

  // Navigation
  setCurrentStep: (step: number) => void

  // Product details actions
  setProductDetails: (details: ProductDetails) => void

  // Add reset action
  resetStore: () => void
}

// Define the expected input/output types for your API functions
interface FetchProductParams {
  asin: string
}

interface ExtractKeywordsParams {
  title: string
  description: string
  bulletPoints: string[]
}

// First, let's fix the type issues with the API calls and error handling

// 1. Add type definitions for API responses
interface ProductDataResponse {
  success: boolean
  productData?: ProductData
  error?: string | boolean
  message?: string
}

interface KeywordExtractResponse {
  success: boolean
  keywords?: Array<{
    keyword: string
    searchVolume?: string
    competition?: string
    relevance?: string
  }>
  error?: string | boolean
  message?: string
}

// Create the store with persistence
export const useListingStore = create<ListingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        asins: [],
        asinData: {},
        asinLoadingStatus: {},
        asinErrors: {},

        keywords: [],
        keywordsLoading: false,

        listingStyle: 'professional',
        listingTone: 5,

        generatedContent: null,
        contentLoading: false,

        currentStep: 0,

        // Product details
        productDetails: {
          productType: '',
          category: '',
          uniqueFeatures: '',
          keyFeatures: '',
          targetAudience: '',
          name: '',
          description: '',
          keyHighlights: '',
          competitiveAdvantage: '',
        },

        // Add reset action implementation
        resetStore: () => {
          set({
            asins: [],
            asinData: {},
            asinLoadingStatus: {},
            asinErrors: {},
            keywords: [],
            keywordsLoading: false,
            listingStyle: 'professional',
            listingTone: 5,
            generatedContent: null,
            contentLoading: false,
            currentStep: 0,
            productDetails: {
              productType: '',
              category: '',
              uniqueFeatures: '',
              keyFeatures: '',
              targetAudience: '',
              name: '',
              description: '',
              keyHighlights: '',
              competitiveAdvantage: '',
            },
          })
        },

        // ASIN actions
        addAsin: async (asin) => {
          // Normalize ASIN and check if it already exists
          const normalizedAsin = asin.trim().toUpperCase()
          const existingAsins = get().asins

          if (existingAsins.includes(normalizedAsin)) {
            return // ASIN already exists
          }

          // Add ASIN to the list
          set((state) => ({
            asins: [...state.asins, normalizedAsin],
            asinLoadingStatus: {
              ...state.asinLoadingStatus,
              [normalizedAsin]: 'idle',
            },
          }))

          // Automatically fetch product data for this ASIN
          await get().fetchProductData(normalizedAsin)
        },

        removeAsin: (asin) => {
          set((state) => {
            // Create new state objects without the removed ASIN
            const filteredAsins = state.asins.filter((a) => a !== asin)

            // Remove this ASIN from the data and status records
            const { [asin]: _, ...restAsinData } = state.asinData
            const { [asin]: __, ...restLoadingStatus } = state.asinLoadingStatus
            const { [asin]: ___, ...restErrors } = state.asinErrors

            // Also remove any keywords that came from this ASIN
            const filteredKeywords = state.keywords.filter((keyword) => keyword.sourceAsin !== asin)

            return {
              asins: filteredAsins,
              asinData: restAsinData,
              asinLoadingStatus: restLoadingStatus,
              asinErrors: restErrors,
              keywords: filteredKeywords,
            }
          })
        },

        fetchProductData: async (asin) => {
          console.log('Fetching product data for ASIN:', asin)

          // Update loading status
          set((state) => ({
            asinLoadingStatus: {
              ...state.asinLoadingStatus,
              [asin]: 'loading',
            },
          }))

          try {
            // Call the API to fetch product data
            const productData = (await fetchProductData({ data: { asin } })) as ProductDataResponse
            console.log('Product data response:', productData)

            if (productData.success && productData.productData) {
              // Update the store with product data
              set((state) => ({
                asinData: {
                  ...state.asinData,
                  [asin]: productData.productData || null,
                },
                asinLoadingStatus: {
                  ...state.asinLoadingStatus,
                  [asin]: 'success',
                },
                asinErrors: {
                  ...state.asinErrors,
                  [asin]: null,
                },
              }))

              // After fetching product data, extract keywords
              await get().extractKeywords(asin)
            } else {
              // Convert boolean error to string if needed
              const errorMessage =
                typeof productData.error === 'boolean'
                  ? 'Failed to fetch product data'
                  : productData.error || productData.message || 'Failed to fetch product data'

              throw new Error(errorMessage)
            }
          } catch (error) {
            // Handle error
            set((state) => ({
              asinLoadingStatus: {
                ...state.asinLoadingStatus,
                [asin]: 'error',
              },
              asinErrors: {
                ...state.asinErrors,
                [asin]: error instanceof Error ? error.message : 'Unknown error',
              },
            }))
          }
        },

        // Keyword actions
        extractKeywords: async (asin) => {
          const productData = get().asinData[asin]
          console.log('Product data for keyword extraction:', productData)

          if (!productData) {
            return // No product data to extract keywords from
          }

          set({ keywordsLoading: true })

          try {
            const params: ExtractKeywordsParams = {
              title: productData.title,
              description: productData.description || '',
              bulletPoints: Array.isArray(productData.features) ? productData.features : [],
            }
            console.log('Extract keywords params:', params)

            const result = (await extractKeywords({ data: params })) as KeywordExtractResponse
            console.log('Extract keywords result:', result)

            if (result.success && result.keywords && result.keywords.length > 0) {
              // Transform the keywords into our format with IDs
              const newKeywords = result.keywords.map((kw) => ({
                id: `${asin}-${kw.keyword}-${Math.random().toString(36).substring(2, 9)}`, // Generate a unique ID
                text: kw.keyword,
                sourceAsin: asin,
                searchVolume: kw.searchVolume,
                competition: kw.competition,
                relevance: kw.relevance,
                selected: true, // Default to selected
              }))

              // Add to existing keywords, avoiding duplicates by text
              set((state) => {
                const existingTexts = new Set(state.keywords.map((k) => k.text.toLowerCase()))
                const uniqueNewKeywords = newKeywords.filter((k) => !existingTexts.has(k.text.toLowerCase()))

                return {
                  keywords: [...state.keywords, ...uniqueNewKeywords],
                  keywordsLoading: false,
                }
              })
            } else {
              // Convert boolean error to string if needed
              const errorMessage =
                typeof result.error === 'boolean'
                  ? 'Failed to extract keywords'
                  : result.error || result.message || 'Failed to extract keywords'

              throw new Error(errorMessage)
            }
          } catch (error) {
            console.error('Error extracting keywords:', error)
            set({ keywordsLoading: false })
          }
        },

        addKeyword: (keyword) => {
          const newKeyword = {
            id: `custom-${Math.random().toString(36).substr(2, 9)}`,
            text: keyword.trim(),
            sourceAsin: null, // Null indicates manually added
            selected: true,
          }

          // Only add if not a duplicate
          set((state) => {
            const existingTexts = new Set(state.keywords.map((k) => k.text.toLowerCase()))
            if (!existingTexts.has(newKeyword.text.toLowerCase())) {
              return { keywords: [...state.keywords, newKeyword] }
            }
            return state
          })
        },

        removeKeyword: (keywordId) => {
          set((state) => ({
            keywords: state.keywords.filter((k) => k.id !== keywordId),
          }))
        },

        toggleKeywordSelection: (keywordId) => {
          set((state) => ({
            keywords: state.keywords.map((k) => (k.id === keywordId ? { ...k, selected: !k.selected } : k)),
          }))
        },

        // Listing actions
        setListingStyle: (style) => {
          set({ listingStyle: style })
        },

        setListingTone: (tone) => {
          set({ listingTone: tone })
        },

        generateListing: async (options?: {
          keywordDensity?: { title: string; bullets: string; description: string }
        }) => {
          set({ contentLoading: true })

          try {
            const state = get()

            // Prepare the data for the API call
            const data = {
              // Product details
              productName: state.productDetails.name || '',
              productCategory: state.productDetails.category || '',
              productDescription: state.productDetails.description || '',
              uniqueFeatures: state.productDetails.uniqueFeatures || '',
              keyHighlights: state.productDetails.keyHighlights || '',
              targetAudience: state.productDetails.targetAudience || '',
              competitiveAdvantage: state.productDetails.competitiveAdvantage || '',

              // ASINs and keywords
              asins: state.asins,
              keywords: state.keywords.filter((k) => k.selected).map((k) => k.text),

              // Style and tone
              style: state.listingStyle,
              tone: state.listingTone,

              // Keyword density settings (default to medium if not provided)
              keywordDensity: options?.keywordDensity || {
                title: 'medium',
                bullets: 'medium',
                description: 'medium',
              },
            }

            // Call the server function
            const result = await generateListingFn({ data })

            if (result.success) {
              // Store the generated content
              set({
                generatedContent: result.content,
                contentLoading: false,
                generatedListingId: result.listingId,
              })

              // Navigate to the listing detail page
              window.location.href = `/listings/${result.listingId}`
            } else {
              throw new Error('Failed to generate listing')
            }
          } catch (error) {
            console.error('Error generating listing:', error)
            set({ contentLoading: false })
            // You might want to show an error toast here
          }
        },

        updateGeneratedContent: (content) => {
          set((state) => ({
            generatedContent: state.generatedContent ? { ...state.generatedContent, ...content } : null,
          }))
        },

        // Navigation
        setCurrentStep: (step) => {
          set({ currentStep: step })
        },

        // Product details actions
        setProductDetails: (details) => set({ productDetails: details }),
      }),
      {
        name: 'listing-store',
        // You can customize which parts of the state to persist
        partialize: (state) => ({
          asins: state.asins,
          keywords: state.keywords,
          listingStyle: state.listingStyle,
          listingTone: state.listingTone,
          generatedContent: state.generatedContent,
          currentStep: state.currentStep,
          productDetails: state.productDetails,
        }),
      },
    ),
  ),
)
