// Define style enum to match Supabase's enum
export type ListingStyle = 
  | "professional" 
  | "casual" 
  | "technical" 
  | "friendly" 
  | "enthusiastic" 
  | "formal" 
  | "informative";

// ProductListing type (independent from Supabase generated types)
export type ProductListing = {
  id: number;
  marketplace: string;
  asins: any[]; // or create a more specific type
  keywords: string[]; // or create a more specific type
  style: ListingStyle;
  tone: number;
  user_id: string;
  current_version_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// ListingVersion type
export type ListingVersion = {
  id: number;
  listing_id: number;
  title: string;
  description: string;
  bullet_points: string[]; // or create a more specific type
  version_number: number;
  is_current?: boolean | null;
  created_at?: string | null;
};

// Type for creating a new listing
export type CreateProductListing = Omit<ProductListing, 'id' | 'created_at' | 'updated_at' | 'current_version_id'>;

// Type for creating a new listing version
export type CreateListingVersion = Omit<ListingVersion, 'id' | 'created_at'>;

// Type for updating a listing
export type UpdateProductListing = Partial<Omit<ProductListing, 'id' | 'created_at' | 'user_id'>>;

// Type for updating a listing version
export type UpdateListingVersion = Partial<Omit<ListingVersion, 'id' | 'created_at' | 'listing_id'>>; 