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

// Title schema
export const titleSchema = z.object({
  id: z.number(),
  listing_id: z.number().nullable().optional(),
  content: z.string(),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).nullable().optional(),
  analysis_data: jsonSchema.nullable().optional()
})

// Features schema
export const featuresSchema = z.object({
  id: z.number(),
  listing_id: z.number().nullable().optional(),
  content: z.array(z.string()),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).nullable().optional(),
  analysis_data: jsonSchema.nullable().optional()
})

// Description schema
export const descriptionSchema = z.object({
  id: z.number(),
  listing_id: z.number().nullable().optional(),
  content: z.string(),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).nullable().optional(),
  analysis_data: jsonSchema.nullable().optional()
})

// Product Listing schema - updated with new references
export const productListingSchema = z.object({
  id: z.number(),
  asins: z.array(z.string()),
  created_at: z.string().nullable().optional(),
  current_title_id: z.number().nullable().optional(),
  current_features_id: z.number().nullable().optional(),
  current_description_id: z.number().nullable().optional(),
  marketplace: z.string(),
  style: styleSchema.nullable().optional(),
  tone: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  user_id: z.string(),
})

// Create schema for inserting a new title
export const createTitleSchema = titleSchema.omit({
  id: true,
  created_at: true,
})

// Create schema for inserting new features
export const createFeaturesSchema = featuresSchema.omit({
  id: true,
  created_at: true,
})

// Create schema for inserting a new description
export const createDescriptionSchema = descriptionSchema.omit({
  id: true,
  created_at: true,
})

// Create schema for inserting a new product listing
export const createProductListingSchema = productListingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  current_title_id: true,
  current_features_id: true,
  current_description_id: true,
  user_id: true,
})

// Schema for updating a title
export const updateTitleSchema = titleSchema
  .omit({ id: true, created_at: true, listing_id: true })
  .partial()

// Schema for updating features
export const updateFeaturesSchema = featuresSchema
  .omit({ id: true, created_at: true, listing_id: true })
  .partial()

// Schema for updating a description
export const updateDescriptionSchema = descriptionSchema
  .omit({ id: true, created_at: true, listing_id: true })
  .partial()

// Schema for updating a product listing
export const updateProductListingSchema = productListingSchema
  .omit({ id: true, created_at: true, user_id: true })
  .partial()

// Export the types derived from the schemas
export type Style = z.infer<typeof styleSchema>
export type Title = z.infer<typeof titleSchema>
export type Features = z.infer<typeof featuresSchema>
export type Description = z.infer<typeof descriptionSchema>
export type ProductListing = z.infer<typeof productListingSchema>

export type CreateTitle = z.infer<typeof createTitleSchema>
export type CreateFeatures = z.infer<typeof createFeaturesSchema>
export type CreateDescription = z.infer<typeof createDescriptionSchema>
export type CreateProductListing = z.infer<typeof createProductListingSchema>

export type UpdateTitle = z.infer<typeof updateTitleSchema>
export type UpdateFeatures = z.infer<typeof updateFeaturesSchema>
export type UpdateDescription = z.infer<typeof updateDescriptionSchema>
export type UpdateProductListing = z.infer<typeof updateProductListingSchema>
