import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/utils/supabase'
import { ProductListing } from '~/types/listings'

export const fetchListings = createServerFn({ 
  method: 'GET' 
}).handler(async () => {
  const supabase = await getSupabaseServerClient();
  const {data, error} = await supabase.from('product_listings').select('*')

  if (error) {
    throw new Error(error.message)
  }

  return data as ProductListing[]
})

export const Route = createFileRoute('/_protected/listings')({
  loader: () => fetchListings(),
  component: RouteComponent,
})

function RouteComponent() {
  const listings = Route.useLoaderData()

  console.log('listings', listings)
  return (
    <div>
      <h1>Listings</h1>
      <ul>
        {listings?.map((listing) => (
          <li key={listing.id}>{listing.marketplace}</li>
        ))}
      </ul>
    </div>
  )
}
