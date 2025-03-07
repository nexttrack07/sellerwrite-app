export interface AnalysisScore {
  score: number // Score out of 10
  pros: string // Positive aspects
  cons: string // Areas for improvement
  recommendations: string // Suggested improvements
}

export interface ListingAnalysis {
  keyword_optimization: AnalysisScore
  title_structure: AnalysisScore
  feature_bullets: AnalysisScore
  description_effectiveness: AnalysisScore
  competitor_differentiation: AnalysisScore
  trust_factors: AnalysisScore
  overall_score: number // Average of all scores
}
