import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface DescriptionAnalysisTabProps {
  analysisData: {
    score: number
    pros: string
    cons: string
    recommendations: string
    keyword_usage: string
    readability: string
    persuasiveness: string
  }
  getScoreBadgeVariant: (score: number) => 'success' | 'warning' | 'destructive'
}

export function DescriptionAnalysisTab({ analysisData, getScoreBadgeVariant }: DescriptionAnalysisTabProps) {
  console.log('Analysis Data:', analysisData)
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
          <Badge variant={getScoreBadgeVariant(analysisData.score)}>
            Score: {analysisData.score}/10
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <h3 className="font-semibold mb-1 text-green-700 dark:text-green-400">Pros</h3>
            <p className="text-sm">{analysisData.pros}</p>
          </div>
          <div className="border p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
            <h3 className="font-semibold mb-1 text-red-700 dark:text-red-400">Cons</h3>
            <p className="text-sm">{analysisData.cons}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Recommendations</h3>
          <p className="text-sm">{analysisData.recommendations}</p>
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
