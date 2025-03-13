import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface DescriptionAnalysisTabProps {
  analysisData: {
    overall_score: number
    clarity: string
    keyword_usage: string
    readability: string
    persuasiveness: string
  }
  getScoreBadgeVariant: (score: number) => 'success' | 'warning' | 'destructive'
}

export function DescriptionAnalysisTab({ analysisData, getScoreBadgeVariant }: DescriptionAnalysisTabProps) {
  if (!analysisData) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No description analysis data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Description Analysis
          <Badge variant={getScoreBadgeVariant(analysisData.overall_score)}>
            Score: {analysisData.overall_score}/10
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Clarity</h3>
          <p className="text-sm">{analysisData.clarity}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Keyword Usage</h3>
          <p className="text-sm">{analysisData.keyword_usage}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Readability</h3>
          <p className="text-sm">{analysisData.readability}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Persuasiveness</h3>
          <p className="text-sm">{analysisData.persuasiveness}</p>
        </div>
      </CardContent>
    </Card>
  )
}
