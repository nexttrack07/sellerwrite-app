import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/utils/supabase'
import { ProductListing, productListingSchema } from '~/types/schemas'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'

export const fetchListings = createServerFn({ 
  method: 'GET' 
}).handler(async () => {
  const supabase = await getSupabaseServerClient();
  const {data, error} = await supabase.from('product_listings').select('*')

  if (error) {
    throw new Error(error.message)
  }

  // Validate with Zod to ensure type safety
  return z.array(productListingSchema).parse(
    data.map(item => ({
      ...item,
      // Ensure these are arrays of strings
      asins: Array.isArray(item.asins) ? item.asins : [],
      keywords: Array.isArray(item.keywords) ? item.keywords : []
    }))
  );
})

export const Route = createFileRoute('/_protected/listings/')({
  loader: () => fetchListings(),
  component: ListingsComponent,
})

function ListingsComponent() {
  const listings = Route.useLoaderData()

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link
          to="/listings/create"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Listing
        </Link>
      </div>
      
      {listings?.length === 0 ? (
        <p>No listings found. Create your first listing!</p>
      ) : (
        <ul className="space-y-4">
          {listings?.map((listing) => (
            <li key={listing.id} className="border p-4 rounded-lg">
              <div className="font-bold">{listing.marketplace}</div>
              <div className="text-sm text-gray-600">Style: {listing.style}</div>
              <div className="text-sm text-gray-600">Tone: {listing.tone}/10</div>
              <div className="mt-2">
                <span className="text-sm font-semibold">ASINs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(listing.asins) && listing.asins.map((asin, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {asin}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 