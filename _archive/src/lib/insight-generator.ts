/**
 * Insight Generator - Generate proactive insights and follow-up suggestions
 * Analyzes data and conversation context to suggest what users should ask next
 */

export interface Insight {
  type: 'anomaly' | 'trend' | 'opportunity' | 'recommendation'
  title: string
  description: string
  suggestedQuestion?: string
  data?: any
}

/**
 * Generate proactive insights from data and conversation
 */
export function generateInsights(
  data: any[],
  conversationContext: string[],
  collectionName: string
): Insight[] {
  const insights: Insight[] = []

  if (!data || data.length === 0) {
    return insights
  }

  // Detect anomalies (outliers in amounts/values)
  const amountField = collectionName === 'finance_transactions' ? 'amount' : 
                     collectionName === 'sales_deals' ? 'value' : null

  if (amountField) {
    const amounts = data
      .map(item => item[amountField])
      .filter(val => typeof val === 'number')
      .sort((a, b) => b - a)

    if (amounts.length > 0) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const max = amounts[0]
      const threshold = avg * 1.5 // 50% above average

      if (max > threshold) {
        const outlier = data.find(item => item[amountField] === max)
        insights.push({
          type: 'anomaly',
          title: 'Unusual Transaction Detected',
          description: `Found a ${amountField} of $${max.toLocaleString()} which is significantly above the average of $${avg.toLocaleString()}.`,
          suggestedQuestion: `Tell me more about ${outlier?.id || 'this transaction'}`,
          data: outlier
        })
      }
    }
  }

  // Detect trends (increasing/decreasing patterns)
  const dateField = collectionName === 'finance_transactions' ? 'date' :
                   collectionName === 'sales_deals' ? 'expectedCloseDate' :
                   collectionName === 'hr_employees' ? 'hireDate' : 'createdAt'

  if (dateField && data.length >= 3) {
    const sortedByDate = [...data]
      .filter(item => item[dateField])
      .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime())

    if (sortedByDate.length >= 3) {
      const recent = sortedByDate.slice(-3)
      const older = sortedByDate.slice(0, 3)

      if (amountField) {
        const recentAvg = recent
          .map(item => item[amountField] || 0)
          .reduce((a, b) => a + b, 0) / recent.length

        const olderAvg = older
          .map(item => item[amountField] || 0)
          .reduce((a, b) => a + b, 0) / older.length

        const change = ((recentAvg - olderAvg) / olderAvg) * 100

        if (Math.abs(change) > 20) {
          insights.push({
            type: 'trend',
            title: change > 0 ? 'Increasing Trend' : 'Decreasing Trend',
            description: `${amountField} has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in recent periods.`,
            suggestedQuestion: `What's causing this ${change > 0 ? 'increase' : 'decrease'}?`,
            data: { change, recentAvg, olderAvg }
          })
        }
      }
    }
  }

  // Detect opportunities (pending items, low-hanging fruit)
  if (collectionName === 'finance_transactions') {
    const pending = data.filter(item => item.status === 'pending')
    if (pending.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Pending Transactions',
        description: `There are ${pending.length} pending transaction${pending.length > 1 ? 's' : ''} that may need attention.`,
        suggestedQuestion: 'Show me all pending transactions and their details',
        data: { count: pending.length }
      })
    }
  }

  if (collectionName === 'sales_deals') {
    const highValue = data.filter(item => item.value && item.value > 10000)
    const atRisk = data.filter(item => item.stage && ['proposal', 'negotiation'].includes(item.stage))
    
    if (highValue.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Deals',
        description: `Found ${highValue.length} deal${highValue.length > 1 ? 's' : ''} worth over $10,000.`,
        suggestedQuestion: 'What are the details of these high-value deals?',
        data: { count: highValue.length }
      })
    }

    if (atRisk.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Deals in Progress',
        description: `There are ${atRisk.length} deal${atRisk.length > 1 ? 's' : ''} in proposal or negotiation stage.`,
        suggestedQuestion: 'Show me the deals that need follow-up',
        data: { count: atRisk.length }
      })
    }
  }

  return insights.slice(0, 3) // Limit to 3 insights
}

/**
 * Generate follow-up questions based on conversation context
 */
export function generateFollowUpQuestions(
  userQuestion: string,
  agentResponse: string,
  availableCollections: string[]
): string[] {
  const questions: string[] = []
  const lowerQuestion = userQuestion.toLowerCase()

  // If question was about specific data, suggest related questions
  if (lowerQuestion.includes('transaction') || lowerQuestion.includes('finance')) {
    questions.push('What are the largest transactions this month?')
    questions.push('Show me transactions by category')
    if (!lowerQuestion.includes('trend')) {
      questions.push('What are the spending trends over the last 3 months?')
    }
  }

  if (lowerQuestion.includes('deal') || lowerQuestion.includes('sales')) {
    questions.push('What deals are closing this month?')
    questions.push('Which deals are at risk?')
    if (!lowerQuestion.includes('pipeline')) {
      questions.push('Show me the sales pipeline overview')
    }
  }

  if (lowerQuestion.includes('employee') || lowerQuestion.includes('hr')) {
    questions.push('How many employees are in each department?')
    questions.push('Show me recent hires')
  }

  // Generic follow-ups if no specific match
  if (questions.length === 0) {
    questions.push('Can you break this down by category?')
    questions.push('What are the trends over time?')
    if (availableCollections.length > 1) {
      questions.push(`What about ${availableCollections[1]}?`)
    }
  }

  return questions.slice(0, 3) // Limit to 3 questions
}

