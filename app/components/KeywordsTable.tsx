import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Tag } from 'lucide-react'

type KeywordItem = {
  keyword: string
  searchVolume: string
  competition: string
  relevance: string
}

interface KeywordsTableProps {
  keywords: KeywordItem[]
}

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  // Helper functions for badge variants
  const getVolumeBadgeVariant = (volume: string) => {
    switch (volume.toLowerCase()) {
      case 'high':
        return 'success'
      case 'medium':
        return 'warning'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getCompetitionBadgeVariant = (competition: string) => {
    switch (competition.toLowerCase()) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getRelevanceBadgeVariant = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case 'primary':
        return 'default'
      case 'secondary':
        return 'outline'
      case 'tertiary':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Potential Keywords
        </CardTitle>
        <CardDescription>Long-tail keywords identified for Amazon SEO optimization</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Fixed-height, scrollable container */}
        <div className="rounded-md border h-[450px]">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[50%]">Keyword</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Relevance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.length > 0 ? (
                  keywords.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.keyword}</TableCell>
                      <TableCell>
                        <Badge variant={getVolumeBadgeVariant(item.searchVolume)}>{item.searchVolume}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCompetitionBadgeVariant(item.competition)}>{item.competition}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRelevanceBadgeVariant(item.relevance)}>{item.relevance}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No keywords found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
