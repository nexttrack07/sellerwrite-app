import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface TitleAnalysisTabProps {
  analysisData: {
    score: number
    pros: string
    cons: string
    recommendations: string
  }
  getScoreBadgeVariant: (score: number) => 'success' | 'warning' | 'destructive'
}

export function TitleAnalysisTab({ analysisData, getScoreBadgeVariant }: TitleAnalysisTabProps) {
  if (!analysisData) {
    return (
      <Card className="border-0">
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No title analysis data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 border-l border-b">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Title Analysis
          <Badge variant={getScoreBadgeVariant(analysisData.score)}>Score: {analysisData.score}/10</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">What Works Well</h3>
          <p className="text-sm">{analysisData.pros}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">What Could Be Improved</h3>
          <p className="text-sm">{analysisData.cons}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Recommendations</h3>
          <p className="text-sm">{analysisData.recommendations}</p>
        </div>
      </CardContent>
    </Card>
  )
}
