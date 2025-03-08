// Mock analysis results by ASIN
export const mockAnalyses: Record<string, any> = {
  B01DFKC2SO: {
    keyword_optimization: {
      score: 8,
      pros: "Excellent use of primary keywords like 'spinner luggage', 'hardside', and 'expandable'. Title incorporates important product attributes including size, color, and brand.",
      cons: "Missing some relevant keywords like 'travel', 'airport', 'lightweight', and 'scratch-resistant' in the title.",
      recommendations:
        'Add travel-specific keywords in the description. Consider incorporating TSA-approved and lightweight mentions earlier in the listing.',
    },
    title_structure: {
      score: 9,
      pros: 'Well-structured title with brand name first, followed by product type and key features. Good use of capitalization for emphasis.',
      cons: 'Title could be slightly more concise while maintaining all key information.',
      recommendations: "Consider removing 'with Spinner Wheels' as this is implied by 'Spinner' in the product name.",
    },
    feature_bullets: {
      score: 7,
      pros: 'Bullets clearly highlight the most important features. Good specificity with measurements and material information.',
      cons: 'Some bullets are overly long and combine multiple benefits. The warranty information takes up a full bullet point.',
      recommendations: 'Break longer bullets into separate points. Place the most compelling features first.',
    },
    description_effectiveness: {
      score: 6,
      pros: 'Description covers the main selling points and functional benefits of the product.',
      cons: 'Description is a bit generic and lacks emotional appeal or use-case scenarios.',
      recommendations:
        'Add travel scenarios and emotional benefits. Describe how the luggage solves common travel frustrations.',
    },
    competitor_differentiation: {
      score: 7,
      pros: 'Mentions the scratch-hiding pattern and TSA lock which are competitive advantages.',
      cons: "Doesn't explicitly compare to other luggage brands or explain why this model is superior.",
      recommendations: 'Highlight what makes Samsonite Winfield 2 different from competing hardside luggage.',
    },
    trust_factors: {
      score: 9,
      pros: 'Strong warranty information builds confidence. Samsonite brand name adds credibility.',
      cons: 'No mention of testing processes or quality certifications beyond basic warranty.',
      recommendations: 'Include information about durability testing or quality standards the product meets.',
    },
    overall_score: 7.7,
  },
  B07PY3GFNZ: {
    keyword_optimization: {
      score: 9,
      pros: "Excellent use of primary keywords like 'Echo Dot', 'smart speaker', and 'Alexa'. The title clearly identifies the generation and color.",
      cons: "Could incorporate more specific feature keywords in the title like 'voice control' or 'hands-free'.",
      recommendations:
        'Add more specific feature keywords in the title and early in bullet points to improve searchability.',
    },
    title_structure: {
      score: 8,
      pros: 'Clean, concise title that includes all essential information. Good use of hyphens to separate concepts.',
      cons: 'Title could better emphasize the primary selling point (Alexa) earlier.',
      recommendations:
        "Consider reordering to emphasize Alexa first: 'Echo Dot (3rd Gen) - Alexa Smart Speaker - Charcoal'",
    },
    feature_bullets: {
      score: 7,
      pros: 'Bullets focus on capabilities and use cases. Good emphasis on music streaming and smart home control.',
      cons: 'Some repetition between bullets. Not enough technical specifications about sound quality, size, etc.',
      recommendations:
        'Reduce repetition between bullets. Add more specific technical details about the device capabilities.',
    },
    description_effectiveness: {
      score: 8,
      pros: 'Clear description that highlights the most important features and use cases.',
      cons: 'Lacks information about setup process and compatibility requirements.',
      recommendations:
        'Add information about easy setup and device compatibility. Include more specific examples of Alexa skills.',
    },
    competitor_differentiation: {
      score: 6,
      pros: 'Mentions Amazon Music, Apple Music, Spotify integration which shows versatility.',
      cons: "Doesn't explain advantages over Google Home, Apple HomePod, or other Echo versions.",
      recommendations:
        'Add specific comparisons to previous Echo generations or competing products to highlight advantages.',
    },
    trust_factors: {
      score: 8,
      pros: 'Amazon brand name provides trust. Multiple mentions of compatibility with major services builds confidence.',
      cons: 'No mention of privacy features, data security, or warranty information.',
      recommendations: 'Add information about privacy controls, microphone muting capabilities, and warranty details.',
    },
    overall_score: 7.6,
  },
}
