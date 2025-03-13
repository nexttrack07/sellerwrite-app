# Schema Restructuring Implementation Plan

This document outlines the steps to implement the new database schema, splitting the `listing_versions` table into separate `titles`, `features`, and `descriptions` tables for more granular control.

## Phase 1: Database Schema Changes

### Step 1: Create New Tables in Supabase

```sql
-- Create titles table
CREATE TABLE titles (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES product_listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  keywords_used TEXT[] DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}'
);

-- Create features table
CREATE TABLE features (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES product_listings(id) ON DELETE CASCADE,
  content TEXT[] NOT NULL,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  keywords_used TEXT[] DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}'
);

-- Create descriptions table
CREATE TABLE descriptions (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES product_listings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  keywords_used TEXT[] DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}'
);

-- Note: Keywords are stored directly in the keywords_used column of each component table (titles, features, descriptions)
-- This allows for tracking which keywords are used in each component
```

### Step 2: Update the product_listings Table and Drop Old Tables

```sql
-- Update product_listings table with new foreign keys
ALTER TABLE product_listings 
ADD COLUMN current_title_id BIGINT REFERENCES titles(id) ON DELETE SET NULL,
ADD COLUMN current_features_id BIGINT REFERENCES features(id) ON DELETE SET NULL,
ADD COLUMN current_description_id BIGINT REFERENCES descriptions(id) ON DELETE SET NULL;

-- Drop old tables that are no longer needed
DROP TABLE IF EXISTS listing_analyses CASCADE;
DROP TABLE IF EXISTS listing_versions CASCADE;

-- Remove the current_version_id column from product_listings as it's no longer needed
ALTER TABLE product_listings DROP COLUMN IF EXISTS current_version_id;
```

### Step 3: Set Up Row-Level Security (RLS) Policies

```sql
-- For titles table
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY titles_select_policy ON titles FOR SELECT USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY titles_insert_policy ON titles FOR INSERT WITH CHECK (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY titles_update_policy ON titles FOR UPDATE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY titles_delete_policy ON titles FOR DELETE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);

-- For features table
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
CREATE POLICY features_select_policy ON features FOR SELECT USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY features_insert_policy ON features FOR INSERT WITH CHECK (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY features_update_policy ON features FOR UPDATE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY features_delete_policy ON features FOR DELETE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);

-- For descriptions table
ALTER TABLE descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY descriptions_select_policy ON descriptions FOR SELECT USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY descriptions_insert_policy ON descriptions FOR INSERT WITH CHECK (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY descriptions_update_policy ON descriptions FOR UPDATE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);
CREATE POLICY descriptions_delete_policy ON descriptions FOR DELETE USING (
  listing_id IN (SELECT id FROM product_listings WHERE user_id = auth.uid())
);

-- Note: No need for keywords table RLS policies as keywords are stored directly in the component tables
```

## Phase 2: Schema and Server Functions Updates

### Step 4: Update Zod Schemas

Update the `app/types/schemas.ts` file to include the new schemas:

```typescript
// Title schema
export const titleSchema = z.object({
  id: z.number(),
  listing_id: z.number(),
  content: z.string(),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).default([]),
  analysis_data: jsonSchema.default({})
});

// Features schema
export const featuresSchema = z.object({
  id: z.number(),
  listing_id: z.number(),
  content: z.array(z.string()),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).default([]),
  analysis_data: jsonSchema.default({})
});

// Description schema
export const descriptionSchema = z.object({
  id: z.number(),
  listing_id: z.number(),
  content: z.string(),
  version_number: z.number(),
  is_current: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  keywords_used: z.array(z.string()).default([]),
  analysis_data: jsonSchema.default({})
});

// Keyword schema
export const keywordSchema = z.object({
  id: z.number(),
  listing_id: z.number(),
  keyword: z.string(),
  relevance_score: z.number().nullable().optional(),
  search_volume: z.number().nullable().optional(),
  is_selected: z.boolean().default(false),
  created_at: z.string().nullable().optional()
});

// Update product listing schema
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
});

// Create schemas for inserting new records
export const createTitleSchema = titleSchema.omit({
  id: true,
  created_at: true,
});

export const createFeaturesSchema = featuresSchema.omit({
  id: true,
  created_at: true,
});

export const createDescriptionSchema = descriptionSchema.omit({
  id: true,
  created_at: true,
});

export const createKeywordSchema = keywordSchema.omit({
  id: true,
  created_at: true,
});

// Export types
export type Title = z.infer<typeof titleSchema>;
export type Features = z.infer<typeof featuresSchema>;
export type Description = z.infer<typeof descriptionSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
export type CreateTitle = z.infer<typeof createTitleSchema>;
export type CreateFeatures = z.infer<typeof createFeaturesSchema>;
export type CreateDescription = z.infer<typeof createDescriptionSchema>;
export type CreateKeyword = z.infer<typeof createKeywordSchema>;
```

### Step 5: Create New Server Functions

Create new server functions for fetching and updating the new entities:

#### app/server/fetch_listing_components.ts

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "~/utils/supabase";

export const fetchListingComponents = createServerFn({
  method: 'POST',
})
.validator((d: unknown) => {
  return z.object({
    id: z.number()
  }).parse(d);
})
.handler(async ({ data }) => {
  const supabase = await getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user?.id) {
    throw new Error('User not authenticated');
  }
  
  // Fetch the product listing
  const { data: listing, error: listingError } = await supabase
    .from('product_listings')
    .select('*, current_title_id, current_features_id, current_description_id')
    .eq('id', data.id)
    .eq('user_id', userData.user.id)
    .single();
  
  if (listingError) {
    throw new Error(`Failed to fetch listing: ${listingError.message}`);
  }
  
  // Fetch the current title
  const { data: title, error: titleError } = await supabase
    .from('titles')
    .select('*')
    .eq('id', listing.current_title_id)
    .single();
  
  if (titleError && titleError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch title: ${titleError.message}`);
  }
  
  // Fetch the current features
  const { data: features, error: featuresError } = await supabase
    .from('features')
    .select('*')
    .eq('id', listing.current_features_id)
    .single();
  
  if (featuresError && featuresError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch features: ${featuresError.message}`);
  }
  
  // Fetch the current description
  const { data: description, error: descriptionError } = await supabase
    .from('descriptions')
    .select('*')
    .eq('id', listing.current_description_id)
    .single();
  
  if (descriptionError && descriptionError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch description: ${descriptionError.message}`);
  }
  
  // Fetch keywords
  const { data: keywords, error: keywordsError } = await supabase
    .from('keywords')
    .select('*')
    .eq('listing_id', data.id);
  
  if (keywordsError) {
    throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
  }
  
  return {
    listing,
    title: title || null,
    features: features || null,
    description: description || null,
    keywords: keywords || []
  };
});
```

#### app/server/update_title.ts

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "~/utils/supabase";

export const updateTitle = createServerFn({
  method: 'POST',
})
.validator((d: unknown) => {
  return z.object({
    listing_id: z.number(),
    content: z.string(),
    keywords_used: z.array(z.string()).optional()
  }).parse(d);
})
.handler(async ({ data }) => {
  const supabase = await getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user?.id) {
    throw new Error('User not authenticated');
  }
  
  // Verify user owns this listing
  const { data: listing, error: listingError } = await supabase
    .from('product_listings')
    .select('id')
    .eq('id', data.listing_id)
    .eq('user_id', userData.user.id)
    .single();
  
  if (listingError) {
    throw new Error(`Unauthorized or listing not found: ${listingError.message}`);
  }
  
  // Get the latest version number
  const { data: latestVersion, error: versionError } = await supabase
    .from('titles')
    .select('version_number')
    .eq('listing_id', data.listing_id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();
  
  const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
  
  // Set all existing versions to not current
  await supabase
    .from('titles')
    .update({ is_current: false })
    .eq('listing_id', data.listing_id);
  
  // Insert new title
  const { data: newTitle, error: insertError } = await supabase
    .from('titles')
    .insert({
      listing_id: data.listing_id,
      content: data.content,
      version_number: newVersionNumber,
      is_current: true,
      keywords_used: data.keywords_used || []
    })
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Failed to insert title: ${insertError.message}`);
  }
  
  // Update the product listing with the new current title
  const { error: updateError } = await supabase
    .from('product_listings')
    .update({ current_title_id: newTitle.id })
    .eq('id', data.listing_id);
  
  if (updateError) {
    throw new Error(`Failed to update product listing: ${updateError.message}`);
  }
  
  return newTitle;
});
```

#### app/server/update_features.ts and app/server/update_description.ts

Create similar functions for features and description updates, following the same pattern as the title update function.

### Step 6: Create Component-Specific Analysis Functions

#### app/server/analyze_title.ts

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "~/utils/supabase";
import Anthropic from '@anthropic-ai/sdk';

export const analyzeTitle = createServerFn({
  method: 'POST',
})
.validator((d: unknown) => {
  return z.object({
    title_id: z.number(),
    asin: z.string().optional()
  }).parse(d);
})
.handler(async ({ data }) => {
  const supabase = await getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user?.id) {
    throw new Error('User not authenticated');
  }
  
  // Fetch the title
  const { data: title, error: titleError } = await supabase
    .from('titles')
    .select('*, product_listings!inner(user_id, asins)')
    .eq('id', data.title_id)
    .single();
  
  if (titleError) {
    throw new Error(`Failed to fetch title: ${titleError.message}`);
  }
  
  // Verify user owns this title
  if (title.product_listings.user_id !== userData.user.id) {
    throw new Error('Unauthorized');
  }
  
  // Analyze the title using Anthropic API
  const asin = data.asin || (title.product_listings.asins && title.product_listings.asins[0]) || '';
  const analysis = await analyzeTitleWithAI(title.content, asin);
  
  // Update the title with the analysis
  const { data: updatedTitle, error: updateError } = await supabase
    .from('titles')
    .update({ analysis_data: analysis })
    .eq('id', data.title_id)
    .select()
    .single();
  
  if (updateError) {
    throw new Error(`Failed to update title with analysis: ${updateError.message}`);
  }
  
  return {
    success: true,
    title: updatedTitle,
    analysis
  };
});

// Helper function to analyze title with AI
async function analyzeTitleWithAI(title: string, asin: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  
  const prompt = `Analyze this Amazon product title: "${title}"
  
  If you know the ASIN ${asin}, please consider any relevant product information.
  
  Provide an analysis in the following JSON format:
  {
    "score": 0-10 rating of the title's effectiveness,
    "pros": "What works well in this title",
    "cons": "What could be improved",
    "recommendations": "Specific recommendations for improvement"
  }`;
  
  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  // Extract and parse the JSON from the response
  const content = response.content[0].text;
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*?}/);
  
  if (jsonMatch) {
    const jsonText = jsonMatch[0].replace(/```json\n/, '').replace(/\n```$/, '');
    return JSON.parse(jsonText);
  }
  
  throw new Error('Failed to parse AI analysis response');
}
```

Create similar functions for analyzing features and descriptions.

## Phase 3: UI Component Updates

### Step 7: Update ListingContentTab Component

Update the `app/components/listings/ListingContentTab.tsx` file to handle the new component structure:

```typescript
// Implement the updated ListingContentTab component with separate cards for title, features, and description
// Include click handlers for each component
// Implement keyword highlighting for each component
```

### Step 8: Create Component-Specific Analysis Tabs

Create new components for displaying analysis of each content type:

```typescript
// Create TitleAnalysisTab.tsx
// Create FeaturesAnalysisTab.tsx
// Create DescriptionAnalysisTab.tsx
```

### Step 9: Update Keywords Component

Update the `app/components/Keywords.tsx` file to highlight keywords used in specific components:

```typescript
// Update the Keywords component to highlight keywords used in specific components
// Add ability to select keywords for regeneration
```

## Phase 4: Route Updates

### Step 10: Update Listing Details Page

Update the `app/routes/_protected/listings/$id.tsx` file to use the new component structure:

```typescript
// Modify to use new component structure
// Add state for tracking which component is selected
// Add handlers for component-specific actions
```

### Step 11: Update Listing Creation Flow

Update the listing creation flow to create records in the new tables:

```typescript
// Modify to create records in the new tables
// Update to handle component-specific generation
```

## Phase 5: Testing and Deployment

### Step 12: Test UI Functionality

- Test component selection
- Test keyword highlighting
- Test regeneration of individual components

### Step 13: Deploy Changes

- Deploy database changes
- Deploy application code
- Monitor for errors
