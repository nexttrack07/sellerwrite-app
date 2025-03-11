export interface ListingWithTitle {
  id: number
  asins: string[]
  created_at: string | null
  current_version?: {
    title: string
  } | null
}
