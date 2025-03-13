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
  
  return {
    listing,
    title: title || null,
    features: features || null,
    description: description || null
  };
});
