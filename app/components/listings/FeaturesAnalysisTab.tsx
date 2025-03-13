import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

interface FeatureAnalysis {
  feature: string
  analysis: string
}

interface FeaturesAnalysisTabProps {
  analysisData: {
    overall_score: number
    overall_analysis: string
    keyword_usage: string
    feature_specific: FeatureAnalysis[]
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
          <Badge variant={getScoreBadgeVariant(analysisData.overall_score)}>
            Score: {analysisData.overall_score}/10
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Overall Analysis</h3>
          <p className="text-sm">{analysisData.overall_analysis}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Keyword Usage</h3>
          <p className="text-sm">{analysisData.keyword_usage}</p>
        </div>
        {analysisData.feature_specific && analysisData.feature_specific.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Feature-Specific Analysis</h3>
            <div className="space-y-3">
              {analysisData.feature_specific.map((item, index) => (
                <div key={index} className="border rounded-md p-3">
                  <p className="font-medium text-sm mb-1">{item.feature}</p>
                  <p className="text-xs text-muted-foreground">{item.analysis}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
