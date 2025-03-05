import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/utils/supabase'
import { ProductListing, productListingSchema } from '~/types/schemas'
import { z } from 'zod'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, ClipboardListIcon } from 'lucide-react'

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
        <Button asChild>
          <Link to="/listings/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>
      
      {listings?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ClipboardListIcon className="h-10 w-10 opacity-50" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No listings found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">Get started by creating your first listing.</p>
            <Button asChild>
              <Link to="/listings/create">Create Listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((listing) => (
            <Card key={listing.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{listing.marketplace}</CardTitle>
                <Badge variant="outline">{listing.style}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Tone: {listing.tone}/10</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium leading-none mb-3">ASINs</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.asins.map((asin, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {asin}
                      </Badge>
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
                      <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {keyword}
                      </Badge>
                    ))}
                    {listing.keywords.length === 0 && 
                      <span className="text-sm text-muted-foreground">No keywords</span>
                    }
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0">
                <Button variant="outline" asChild>
                  <Link
                    to={`/listings`}
                  >
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 