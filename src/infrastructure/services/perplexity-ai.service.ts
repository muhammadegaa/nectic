/**
 * Infrastructure: Perplexity AI Service
 * Implements IAIService using Perplexity API
 */

import { IAIService } from '@/domain/services/ai-service.interface'
import { AssessmentResult, NLPExtractedData } from '@/domain/entities/assessment.entity'
import { AIOpportunity } from '@/domain/entities/opportunity.entity'

export class PerplexityAIService implements IAIService {
  private readonly apiKey: string | undefined
  private readonly apiUrl = 'https://api.perplexity.ai/chat/completions'

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY
  }

  async generateOpportunitiesFromAssessment(
    assessmentResult: AssessmentResult
  ): Promise<AIOpportunity[]> {
    if (!this.apiKey) {
      // Fallback to mock data if API key not configured
      return this.generateMockOpportunities(assessmentResult)
    }

    try {
      const prompt = this.buildPrompt(assessmentResult)
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an AI automation consultant. Generate specific, actionable AI automation opportunities based on assessment data. Return JSON array of opportunities.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content in API response')
      }

      // Parse JSON from response
      const opportunities = this.parseOpportunities(content)
      return opportunities
    } catch (error) {
      console.error('Error generating opportunities:', error)
      // Fallback to mock data on error
      return this.generateMockOpportunities(assessmentResult)
    }
  }

  private buildPrompt(assessmentResult: AssessmentResult): string {
    const primaryPainPoint = assessmentResult.primaryPainPoint || 'general automation'
    const scores = assessmentResult.scores

    return `Based on this assessment:
- Primary pain point: ${primaryPainPoint}
- Document automation score: ${scores.documentAutomation}
- Customer service AI score: ${scores.customerServiceAI}
- Data processing score: ${scores.dataProcessing}
- Workflow automation score: ${scores.workflowAutomation}

Generate 3-5 specific AI automation opportunities. For each opportunity, provide:
- title: Short, compelling title
- description: 2-3 sentence description
- category: One of "document-automation", "customer-service", "data-processing", "workflow-automation"
- monthlySavings: Estimated monthly savings in USD
- timeSavedHours: Hours saved per month
- impactScore: 1-100 based on scores
- keyBenefits: Array of 3-5 key benefits

Return ONLY valid JSON array, no markdown or extra text.`
  }

  private parseOpportunities(content: string): AIOpportunity[] {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || 
                       content.match(/\[[\s\S]*\]/)
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array')
      }

      return parsed.map((opp: any, index: number) => ({
        id: `opp-${Date.now()}-${index}`,
        userId: '', // Will be set by use case
        title: opp.title || 'AI Automation Opportunity',
        description: opp.description || '',
        category: opp.category || 'workflow-automation',
        monthlySavings: opp.monthlySavings || 0,
        timeSavedHours: opp.timeSavedHours || 0,
        impactScore: opp.impactScore || 50,
        keyBenefits: opp.keyBenefits || [],
        estimatedImplementationTime: opp.estimatedImplementationTime,
        difficulty: opp.difficulty,
        createdAt: new Date(),
        isPremium: true, // Premium features require subscription
      }))
    } catch (error) {
      console.error('Error parsing opportunities:', error)
      throw new Error('Failed to parse AI response')
    }
  }

  private generateMockOpportunities(assessmentResult: AssessmentResult): AIOpportunity[] {
    const primaryPainPoint = assessmentResult.primaryPainPoint || 'general automation'
    const scores = assessmentResult.scores

    // Determine top category
    const topCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0]

    const categoryMap: Record<string, string> = {
      documentAutomation: 'document-automation',
      customerServiceAI: 'customer-service',
      dataProcessing: 'data-processing',
      workflowAutomation: 'workflow-automation',
    }

    return [
      {
        id: `mock-opp-1`,
        userId: '',
        title: `AI-Powered ${primaryPainPoint} Solution`,
        description: `Automate your ${primaryPainPoint} processes using AI to reduce manual work and increase efficiency.`,
        category: categoryMap[topCategory] as any,
        monthlySavings: 5000,
        timeSavedHours: 40,
        impactScore: scores[topCategory as keyof typeof scores],
        keyBenefits: [
          'Reduce manual processing time by 80%',
          'Improve accuracy and consistency',
          'Free up team for strategic work',
        ],
        estimatedImplementationTime: '2-4 weeks',
        difficulty: 'medium',
        createdAt: new Date(),
        isPremium: true,
      },
    ]
  }

  async extractStructuredDataFromText(text: string): Promise<NLPExtractedData> {
    // Simple implementation - extract primary pain point from text
    // In a real implementation, this would use NLP/LLM to extract structured data
    const lowerText = text.toLowerCase()
    
    const painPoints: Record<string, string> = {
      'document': 'document processing',
      'paperwork': 'document processing',
      'customer': 'customer service',
      'support': 'customer service',
      'data': 'data processing',
      'workflow': 'workflow automation',
      'process': 'workflow automation',
    }

    for (const [keyword, painPoint] of Object.entries(painPoints)) {
      if (lowerText.includes(keyword)) {
        return { primaryPainPoint: painPoint }
      }
    }

    return {}
  }
}

