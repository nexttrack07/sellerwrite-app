import type { ListingAnalysis } from '~/types/analytics'

export function calculateOverallScore(analysis: Omit<ListingAnalysis, 'overall_score'>): number {
  const categories = [
    'keyword_optimization',
    'title_structure',
    'feature_bullets',
    'description_effectiveness',
    'competitor_differentiation',
    'trust_factors',
  ]

  const sum = categories.reduce((total, category) => {
    return total + analysis[category as keyof typeof analysis].score
  }, 0)

  return parseFloat((sum / categories.length).toFixed(1))
}
