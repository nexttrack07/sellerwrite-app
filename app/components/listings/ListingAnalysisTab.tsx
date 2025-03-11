import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { CheckCircle, AlertCircle } from 'lucide-react'

// Updated interfaces to match the actual API response
export interface AnalysisScore {
  score: number
  pros: string
  cons: string
  recommendations: string
}

export interface ListingAnalysis {
  keyword_optimization: AnalysisScore
  title_structure: AnalysisScore
  feature_bullets: AnalysisScore
  description_effectiveness: AnalysisScore
  competitor_differentiation: AnalysisScore
  trust_factors: AnalysisScore
  overall_score: number
}

interface ListingAnalysisTabProps {
  analysisData: ListingAnalysis
  getScoreBadgeVariant: (score: number) => 'success' | 'warning' | 'destructive'
}

export function ListingAnalysisTab({ analysisData, getScoreBadgeVariant }: ListingAnalysisTabProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Analysis</CardTitle>
          <CardDescription>AI-powered analysis of your listing's effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">Overall Score</span>
              <Badge variant={getScoreBadgeVariant(analysisData.overall_score)}>{analysisData.overall_score}/10</Badge>
            </div>
            <p className="text-muted-foreground">{analysisData.keyword_optimization.recommendations}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Title Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">Title Score</span>
              <Badge variant={getScoreBadgeVariant(analysisData.title_structure.score)}>
                {analysisData.title_structure.score}/10
              </Badge>
            </div>
            <p className="text-muted-foreground">{analysisData.title_structure.recommendations}</p>

            <h3 className="font-medium mt-2">Strengths</h3>
            <p className="text-sm">{analysisData.title_structure.pros}</p>

            <h3 className="font-medium mt-2">Areas for Improvement</h3>
            <p className="text-sm">{analysisData.title_structure.cons}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bullet Points Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">Bullet Points Score</span>
              <Badge variant={getScoreBadgeVariant(analysisData.feature_bullets.score)}>
                {analysisData.feature_bullets.score}/10
              </Badge>
            </div>
            <p className="text-muted-foreground">{analysisData.feature_bullets.recommendations}</p>

            <h3 className="font-medium mt-2">Strengths</h3>
            <p className="text-sm">{analysisData.feature_bullets.pros}</p>

            <h3 className="font-medium mt-2">Areas for Improvement</h3>
            <p className="text-sm">{analysisData.feature_bullets.cons}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">Description Score</span>
              <Badge variant={getScoreBadgeVariant(analysisData.description_effectiveness.score)}>
                {analysisData.description_effectiveness.score}/10
              </Badge>
            </div>
            <p className="text-muted-foreground">{analysisData.description_effectiveness.recommendations}</p>

            <h3 className="font-medium mt-2">Strengths</h3>
            <p className="text-sm">{analysisData.description_effectiveness.pros}</p>

            <h3 className="font-medium mt-2">Areas for Improvement</h3>
            <p className="text-sm">{analysisData.description_effectiveness.cons}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-medium">SEO Score</span>
              <Badge variant={getScoreBadgeVariant(analysisData.keyword_optimization.score)}>
                {analysisData.keyword_optimization.score}/10
              </Badge>
            </div>
            <p className="text-muted-foreground">{analysisData.keyword_optimization.recommendations}</p>

            <h3 className="font-medium mt-2">Strengths</h3>
            <p className="text-sm">{analysisData.keyword_optimization.pros}</p>

            <h3 className="font-medium mt-2">Areas for Improvement</h3>
            <p className="text-sm">{analysisData.keyword_optimization.cons}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
