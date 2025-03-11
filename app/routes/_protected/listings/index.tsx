import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/utils/supabase'
import { ProductListing, productListingSchema } from '~/types/schemas'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, ClipboardListIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { ListingStackedList } from '~/components/listings/ListingStackedList'
import { ListingWithTitle } from '~/types/listings'

export const fetchListings = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = await getSupabaseServerClient()

  // First get all listings
  const { data: listings, error: listingsError } = await supabase
    .from('product_listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (listingsError) {
    throw new Error(listingsError.message)
  }

  // Then get all current versions
  const currentVersionIds = listings.map((listing) => listing.current_version_id).filter((id) => id != null)

  const { data: versions, error: versionsError } = await supabase
    .from('listing_versions')
    .select('id, title')
    .in('id', currentVersionIds)

  if (versionsError) {
    throw new Error(versionsError.message)
  }

  // Create a map of version IDs to titles
  const versionMap = new Map(versions.map((v) => [v.id, v.title]))

  // Combine the data
  const listingsWithTitles = listings.map((listing) => ({
    ...listing,
    asins: Array.isArray(listing.asins) ? listing.asins : [],
    keywords: Array.isArray(listing.keywords) ? listing.keywords : [],
    current_version: listing.current_version_id ? { title: versionMap.get(listing.current_version_id) || '' } : null,
  }))

  // Validate with Zod and return
  return z
    .array(
      productListingSchema.extend({
        current_version: z.object({ title: z.string() }).nullable(),
      }),
    )
    .parse(listingsWithTitles) as ListingWithTitle[]
})

export const Route = createFileRoute('/_protected/listings/')({
  loader: () => fetchListings(),
  component: ListingsComponent,
})

function ListingsComponent() {
  const listings = Route.useLoaderData() as ListingWithTitle[]

  return (
    <div className="container py-10 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
        <Button asChild>
          <Link to="/listings/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      {listings?.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ClipboardListIcon className="h-10 w-10 opacity-50" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">Get started by creating your first listing.</p>
            <Button asChild>
              <Link to="/listings/create">Create Listing</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="rounded-md border bg-card">
          <ListingStackedList listings={listings} />
        </div>
      )}
    </div>
  )
}
