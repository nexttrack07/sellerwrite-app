import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '~/components/ui/accordion'

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          Features Analysis
          <Badge variant={getScoreBadgeVariant(analysisData.score)}>
            Score: {analysisData.score}/10
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full justify-start mb-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="features">Feature Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4 pt-2">
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
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 pt-2">
            <div>
              <h3 className="font-semibold mb-1">Recommendations</h3>
              <p className="text-sm">{analysisData.recommendations}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Keyword Usage</h3>
              <p className="text-sm">{analysisData.keyword_usage}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="pt-2">
            {analysisData.feature_by_feature && analysisData.feature_by_feature.length > 0 && (
              <Accordion type="multiple" className="w-full">
                {analysisData.feature_by_feature.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b py-0">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <span className="text-sm font-medium">• {item.feature}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-0">
                      <p className="text-xs text-muted-foreground pl-4 border-l-2 border-muted-foreground/30">
                        {item.analysis}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
