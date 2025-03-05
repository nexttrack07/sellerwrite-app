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
    <div className="container py-10 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
        <Link
          to="/listings/create"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
          </svg>
          Create Listing
        </Link>
      </div>
      
      {listings?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Get started by creating your first listing.</p>
          <Link
            to="/listings/create"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing) => (
            <div key={listing.id} className="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
              <div className="p-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-4">
                  <h3 className="font-semibold text-xl">{listing.marketplace}</h3>
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {listing.style}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                    Tone: {listing.tone}/10
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium leading-none mb-3">ASINs</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.asins.map((asin, i) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {asin}
                      </span>
                    ))}
                    {listing.asins.length === 0 && 
                      <span className="text-sm text-muted-foreground">No ASINs</span>
                    }
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium leading-none mb-3">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.keywords.map((keyword, i) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        {keyword}
                      </span>
                    ))}
                    {listing.keywords.length === 0 && 
                      <span className="text-sm text-muted-foreground">No keywords</span>
                    }
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link
                    to={`/listings/${listing.id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 