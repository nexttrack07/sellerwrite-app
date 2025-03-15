import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface FeatureAnalysis {
  feature: string
  analysis: string
}

interface FeaturesAnalysisTabProps {
  analysisData: {
    score: number
    pros: string
    cons: string
    recommendations: string
    keyword_usage: string
    feature_by_feature: FeatureAnalysis[]
  }
  getScoreBadgeVariant: (score: number) => 'success' | 'warning' | 'destructive'
}

export function FeaturesAnalysisTab({ analysisData, getScoreBadgeVariant }: FeaturesAnalysisTabProps) {
  if (!analysisData) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No features analysis data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Features Analysis
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

        {analysisData.feature_by_feature && analysisData.feature_by_feature.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Feature-by-Feature Analysis</h3>
            <div className="space-y-3">
              {analysisData.feature_by_feature.map((item, index) => (
                <div key={index} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                  <p className="font-medium text-sm mb-1">• {item.feature}</p>
                  <p className="text-xs text-muted-foreground pl-4 border-l-2 border-muted-foreground/30">{item.analysis}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
