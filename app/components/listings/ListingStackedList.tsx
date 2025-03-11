import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ListingWithTitle } from '~/types/listings'

interface ListingStackedListProps {
  listings: ListingWithTitle[]
}

export function ListingStackedList({ listings }: ListingStackedListProps) {
  return (
    <ul role="list" className="divide-y divide-border">
      {listings.map((listing) => (
        <li key={listing.id} className="flex justify-between gap-x-6 py-5 px-4 hover:bg-muted/50 transition-colors">
          <div className="flex min-w-0 gap-x-4">
            <div className="min-w-0 flex-auto">
              <p className="text-sm font-semibold">
                <Link to="/listings/$id" params={{ id: listing.id.toString() }} className="hover:underline">
                  {listing.current_version?.title || 'Untitled Listing'}
                </Link>
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {listing.asins.map((asin, i) => (
                  <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {asin}
                  </Badge>
                ))}
                {listing.asins.length === 0 && <span className="text-sm text-muted-foreground">No ASINs</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-x-4">
            <div className="hidden sm:flex sm:flex-col sm:items-end">
              {listing.created_at && (
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(listing.created_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-m-2.5 p-2.5">
                  <span className="sr-only">Open options</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link to="/listings/$id" params={{ id: listing.id.toString() }} className="w-full">
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/listings/$id" params={{ id: listing.id.toString() }} className="w-full">
                    Analyze listing
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      ))}
    </ul>
  )
}
