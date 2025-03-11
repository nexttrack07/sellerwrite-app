import { z } from 'zod'

// Define the JSON schema for complex data with explicit type annotation
export const jsonSchema: z.ZodType<any> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.lazy(() => z.array(jsonSchema)),
  z.lazy(() => z.record(jsonSchema)),
])

// Style enum schema - updated to match Supabase enum
export const styleSchema = z.enum([
  'professional',
  'conversational',
  'enthusiastic',
  'benefit-focused',
  'problem-solution',
  'technical',
  'premium',
  'lifestyle',
])

// Product Listing schema - updated with nullable fields
export const productListingSchema = z.object({
  id: z.number(),
  asins: z.array(z.string()),
  created_at: z.string().nullable().optional(),
  current_version_id: z.number().nullable().optional(),
  keywords: z.array(z.string()),
  marketplace: z.string(),
  style: styleSchema.nullable().optional(),
  tone: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  user_id: z.string(),
})

// Listing Version schema
export const listingVersionSchema = z.object({
  id: z.number(),
  bullet_points: jsonSchema,
  created_at: z.string().nullable().optional(),
  description: z.string(),
  is_current: z.boolean().nullable().optional(),
  listing_id: z.number(),
  title: z.string(),
  version_number: z.number(),
})

// Listing Analysis schema
export const listingAnalysisSchema = z.object({
  id: z.number(),
  analysis_data: jsonSchema,
  created_at: z.string(),
  listing_id: z.number(),
  version_id: z.number(),
})

// Create schema for inserting a new product listing
export const createProductListingSchema = productListingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  current_version_id: true,
  user_id: true,
})

// Create schema for inserting a new listing version
export const createListingVersionSchema = listingVersionSchema.omit({
  id: true,
  created_at: true,
})

// Create schema for inserting a new listing analysis
export const createListingAnalysisSchema = listingAnalysisSchema.omit({
  id: true,
  created_at: true,
})

// Schema for updating a product listing
export const updateProductListingSchema = productListingSchema
  .omit({ id: true, created_at: true, user_id: true })
  .partial()

// Schema for updating a listing version
export const updateListingVersionSchema = listingVersionSchema
  .omit({ id: true, created_at: true, listing_id: true })
  .partial()

// Export the types derived from the schemas
export type Style = z.infer<typeof styleSchema>
export type ProductListing = z.infer<typeof productListingSchema>
export type ListingVersion = z.infer<typeof listingVersionSchema>
export type ListingAnalysis = z.infer<typeof listingAnalysisSchema>
export type CreateProductListing = z.infer<typeof createProductListingSchema>
export type CreateListingVersion = z.infer<typeof createListingVersionSchema>
export type CreateListingAnalysis = z.infer<typeof createListingAnalysisSchema>
export type UpdateProductListing = z.infer<typeof updateProductListingSchema>
export type UpdateListingVersion = z.infer<typeof updateListingVersionSchema>
