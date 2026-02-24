/**
 * Executors for Powerful Agentic AI Tools
 * These implement REAL business logic, not just queries
 */

import { getAdminDb } from '@/infrastructure/firebase/firebase-server'
import { COLLECTIONS } from '@/infrastructure/database/schema'

/**
 * Execute a powerful tool
 * Note: Powerful tools may access Firestore directly for complex business logic.
 * For simple data queries, use query_collection tool which goes through S-DAL.
 */
export async function executePowerfulTool(toolName: string, args: any, agentId?: string, userId?: string): Promise<any> {
  try {
    // Finance tools
    if (toolName.startsWith('budget_') || toolName.startsWith('cash_') || 
        toolName.startsWith('revenue_') || toolName.startsWith('expense_') || 
        toolName.startsWith('financial_')) {
      return await executeFinanceTool(toolName, args)
    }
    
    // Sales tools
    if (toolName.startsWith('pipeline_') || toolName.startsWith('win_') || 
        toolName.startsWith('sales_') || toolName.startsWith('at_risk_') || 
        toolName.startsWith('conversion_')) {
      return await executeSalesTool(toolName, args)
    }
    
    // HR tools
    if (toolName.startsWith('team_') || toolName.startsWith('performance_') || 
        toolName.startsWith('retention_') || toolName.startsWith('hiring_')) {
      return await executeHRTool(toolName, args)
    }
    
    // Cross-collection tools
    if (toolName.startsWith('correlate_') || toolName.startsWith('department_')) {
      return await executeCrossCollectionTool(toolName, args)
    }
    
    // Advanced tools
    if (toolName.startsWith('trend_') || toolName.startsWith('what_if_') || 
        toolName.startsWith('pattern_')) {
      return await executeAdvancedTool(toolName, args)
    }
    
    throw new Error(`Unknown powerful tool: ${toolName}`)
  } catch (error: any) {
    return {
      error: error.message || "Tool execution failed",
      tool: toolName,
      args
    }
  }
}

// ============================================================================
// FINANCE TOOL EXECUTORS
// ============================================================================

async function executeFinanceTool(toolName: string, args: any): Promise<any> {
  const adminDb = getAdminDb()
  
  switch (toolName) {
    case "budget_vs_actual": {
      // Query budgets and transactions for the period
      const budgetsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.BUDGETS)
        .where('period', '==', args.period)
        .get()
      
      const budgets = budgetsSnapshot.docs.map(doc => doc.data())
      
      // Calculate date range from period
      const dateRange = parsePeriodToDateRange(args.period)
      
      let transactionsQuery = adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .where('type', '==', 'expense')
      
      if (args.department) {
        transactionsQuery = transactionsQuery.where('department', '==', args.department)
      }
      if (args.category) {
        transactionsQuery = transactionsQuery.where('category', '==', args.category)
      }
      
      const transactionsSnapshot = await transactionsQuery.get()
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Calculate actual spending by department/category
      const actualByKey: Record<string, number> = {}
      transactions.forEach(txn => {
        const key = args.department 
          ? txn.category 
          : args.category 
          ? txn.department 
          : `${txn.department || 'unknown'}_${txn.category || 'unknown'}`
        actualByKey[key] = (actualByKey[key] || 0) + Math.abs(txn.amount)
      })
      
      // Compare with budgets
      const comparison = budgets.map(budget => {
        const key = args.department 
          ? budget.category 
          : args.category 
          ? budget.department 
          : `${budget.department}_${budget.category}`
        const actual = actualByKey[key] || 0
        const variance = actual - budget.allocatedAmount
        const variancePercent = (variance / budget.allocatedAmount) * 100
        
        return {
          department: budget.department,
          category: budget.category,
          allocated: budget.allocatedAmount,
          actual,
          variance,
          variancePercent: Math.round(variancePercent * 100) / 100,
          status: variance > 0 ? 'over_budget' : variance < 0 ? 'under_budget' : 'on_budget'
        }
      })
      
      const overBudget = comparison.filter(c => c.status === 'over_budget')
      const totalVariance = comparison.reduce((sum, c) => sum + c.variance, 0)
      
      return {
        period: args.period,
        comparison,
        summary: {
          totalAllocated: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0),
          totalActual: Object.values(actualByKey).reduce((sum, val) => sum + val, 0),
          totalVariance,
          overBudgetCount: overBudget.length,
          overBudgetItems: overBudget.slice(0, 5)
        }
      }
    }
    
    case "cash_flow_forecast": {
      const months = args.months || 3
      
      // Get historical income and expenses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', sixMonthsAgo.toISOString().split('T')[0])
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number }> = {}
      transactions.forEach(txn => {
        const month = txn.date.substring(0, 7) // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 }
        }
        if (txn.type === 'income') {
          monthlyData[month].income += txn.amount
        } else if (txn.type === 'expense') {
          monthlyData[month].expenses += Math.abs(txn.amount)
        }
      })
      
      // Calculate averages and trends
      const monthKeys = Object.keys(monthlyData).sort()
      const avgIncome = monthKeys.reduce((sum, m) => sum + monthlyData[m].income, 0) / monthKeys.length
      const avgExpenses = monthKeys.reduce((sum, m) => sum + monthlyData[m].expenses, 0) / monthKeys.length
      
      // Simple trend calculation (linear regression slope)
      const incomeTrend = calculateTrend(monthKeys.map(m => monthlyData[m].income))
      const expenseTrend = calculateTrend(monthKeys.map(m => monthlyData[m].expenses))
      
      // Forecast future months
      const forecast = []
      const today = new Date()
      const forecastMonths = args.months || 3
      for (let i = 1; i <= forecastMonths; i++) {
        const forecastDate = new Date(today)
        forecastDate.setMonth(forecastDate.getMonth() + i)
        const monthKey = forecastDate.toISOString().substring(0, 7)
        
        const projectedIncome = avgIncome + (incomeTrend * i)
        const projectedExpenses = avgExpenses + (expenseTrend * i)
        const netCashFlow = projectedIncome - projectedExpenses
        
        forecast.push({
          month: monthKey,
          projectedIncome: Math.round(projectedIncome),
          projectedExpenses: Math.round(projectedExpenses),
          netCashFlow: Math.round(netCashFlow)
        })
      }
      
      return {
        forecast,
        assumptions: {
          avgMonthlyIncome: Math.round(avgIncome),
          avgMonthlyExpenses: Math.round(avgExpenses),
          incomeTrend: Math.round(incomeTrend * 100) / 100,
          expenseTrend: Math.round(expenseTrend * 100) / 100
        }
      }
    }
    
    case "revenue_trend_analysis": {
      const dateRange = parsePeriodToDateRange(args.period)
      const groupBy = args.groupBy || 'month'
      
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .where('type', '==', 'income')
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Group by period
      const grouped: Record<string, number> = {}
      transactions.forEach(txn => {
        let key: string
        if (groupBy === 'month') {
          key = txn.date.substring(0, 7) // YYYY-MM
        } else if (groupBy === 'quarter') {
          const month = parseInt(txn.date.substring(5, 7))
          const quarter = Math.ceil(month / 3)
          key = `${txn.date.substring(0, 4)}-Q${quarter}`
        } else {
          key = txn.date.substring(0, 4) // YYYY
        }
        grouped[key] = (grouped[key] || 0) + txn.amount
      })
      
      const periods = Object.keys(grouped).sort()
      const trendData = periods.map((period, index) => {
        const revenue = grouped[period]
        const prevRevenue = index > 0 ? grouped[periods[index - 1]] : null
        const growth = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : null
        
        return {
          period,
          revenue: Math.round(revenue),
          growth: growth ? Math.round(growth * 100) / 100 : null,
          growthDirection: growth ? (growth > 0 ? 'up' : 'down') : null
        }
      })
      
      const totalRevenue = periods.reduce((sum, p) => sum + grouped[p], 0)
      const avgRevenue = totalRevenue / periods.length
      const overallGrowth = trendData.length >= 2 
        ? trendData[trendData.length - 1].growth 
        : null
      
      return {
        period: args.period,
        groupBy,
        trendData,
        summary: {
          totalRevenue: Math.round(totalRevenue),
          avgRevenue: Math.round(avgRevenue),
          overallGrowth,
          periodsAnalyzed: periods.length
        }
      }
    }
    
    case "expense_categorization_analysis": {
      const dateRange = parsePeriodToDateRange(args.period)
      const groupBy = args.groupBy || 'category'
      const topN = args.topN || 10
      
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .where('type', '==', 'expense')
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Group and sum
      const grouped: Record<string, number> = {}
      transactions.forEach(txn => {
        const key = txn[groupBy] || 'unknown'
        grouped[key] = (grouped[key] || 0) + Math.abs(txn.amount)
      })
      
      const total = Object.values(grouped).reduce((sum, val) => sum + val, 0)
      const ranked = Object.entries(grouped)
        .map(([key, amount]) => ({
          [groupBy]: key,
          amount: Math.round(amount),
          percentage: Math.round((amount / total) * 10000) / 100
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, topN)
      
      return {
        period: args.period,
        groupBy,
        totalExpenses: Math.round(total),
        topItems: ranked
      }
    }
    
    case "financial_health_score": {
      // This is a composite score based on multiple factors
      // For now, implement a simplified version
      const dateRange = parsePeriodToDateRange(args.period)
      
      // Get transactions
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const netCashFlow = income - expenses
      const expenseRatio = expenses / income
      
      // Calculate score (0-100)
      let score = 50 // Base score
      
      // Cash flow positive = +30 points
      if (netCashFlow > 0) score += 30
      else if (netCashFlow < -income * 0.2) score -= 20 // Large negative
      
      // Expense ratio < 80% = +20 points
      if (expenseRatio < 0.8) score += 20
      else if (expenseRatio > 0.95) score -= 15
      
      // Revenue growth (simplified - would need historical comparison)
      score = Math.max(0, Math.min(100, score))
      
      return {
        period: args.period,
        score: Math.round(score),
        factors: {
          netCashFlow: Math.round(netCashFlow),
          expenseRatio: Math.round(expenseRatio * 10000) / 100,
          income: Math.round(income),
          expenses: Math.round(expenses)
        },
        recommendations: score < 60 
          ? ["Focus on reducing expenses", "Increase revenue streams", "Improve cash flow management"]
          : score < 80
          ? ["Maintain current financial discipline", "Consider growth investments"]
          : ["Excellent financial health", "Consider strategic investments"]
      }
    }
    
    default:
      throw new Error(`Unknown finance tool: ${toolName}`)
  }
}

// ============================================================================
// SALES TOOL EXECUTORS
// ============================================================================

async function executeSalesTool(toolName: string, args: any): Promise<any> {
  const adminDb = getAdminDb()
  
  switch (toolName) {
    case "pipeline_health": {
      let dealsQuery = adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('stage', 'in', ['prospect', 'qualification', 'proposal', 'negotiation'])
      
      if (args.owner) {
        dealsQuery = dealsQuery.where('owner', '==', args.owner)
      }
      if (args.industry) {
        dealsQuery = dealsQuery.where('industry', '==', args.industry)
      }
      
      const dealsSnapshot = await dealsQuery.get()
      const deals = dealsSnapshot.docs.map(doc => doc.data())
      
      // Calculate metrics
      const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
      const weightedValue = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)
      
      const byStage: Record<string, { count: number; value: number; weightedValue: number }> = {}
      deals.forEach(deal => {
        if (!byStage[deal.stage]) {
          byStage[deal.stage] = { count: 0, value: 0, weightedValue: 0 }
        }
        byStage[deal.stage].count++
        byStage[deal.stage].value += deal.value
        byStage[deal.stage].weightedValue += deal.value * deal.probability / 100
      })
      
      // Calculate average deal age
      const now = new Date()
      const avgAge = deals.length > 0
        ? deals.reduce((sum, d) => {
            const created = new Date(d.createdAt)
            return sum + (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
          }, 0) / deals.length
        : 0
      
      return {
        totalDeals: deals.length,
        totalValue: Math.round(totalValue),
        weightedValue: Math.round(weightedValue),
        byStage,
        metrics: {
          avgDealSize: deals.length > 0 ? Math.round(totalValue / deals.length) : 0,
          avgDealAge: Math.round(avgAge * 10) / 10,
          conversionRate: deals.length > 0 ? Math.round((weightedValue / totalValue) * 10000) / 100 : 0
        },
        health: weightedValue > totalValue * 0.5 ? 'healthy' : 'needs_attention'
      }
    }
    
    case "win_rate_analysis": {
      const dateRange = parsePeriodToDateRange(args.period)
      const groupBy = args.groupBy
      
      const dealsSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('createdAt', '>=', dateRange.start)
        .where('createdAt', '<=', dateRange.end)
        .get()
      
      const deals = dealsSnapshot.docs.map(doc => doc.data())
      
      // Group deals
      const grouped: Record<string, { won: number; lost: number; total: number }> = {}
      deals.forEach(deal => {
        const key = groupBy === 'stage' ? deal.stage :
                   groupBy === 'owner' ? deal.owner :
                   groupBy === 'industry' ? deal.industry :
                   'all'
        
        if (!grouped[key]) {
          grouped[key] = { won: 0, lost: 0, total: 0 }
        }
        grouped[key].total++
        if (deal.stage === 'closed-won') grouped[key].won++
        if (deal.stage === 'closed-lost') grouped[key].lost++
      })
      
      const winRates = Object.entries(grouped).map(([key, data]) => ({
        [groupBy]: key,
        total: data.total,
        won: data.won,
        lost: data.lost,
        winRate: data.total > 0 ? Math.round((data.won / data.total) * 10000) / 100 : 0
      }))
      
      return {
        period: args.period,
        groupBy,
        winRates
      }
    }
    
    case "sales_forecast": {
      const months = args.months || 3
      const includeProbability = args.includeProbability !== false
      
      // Get open deals
      const dealsSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('stage', 'in', ['prospect', 'qualification', 'proposal', 'negotiation'])
        .get()
      
      const deals = dealsSnapshot.docs.map(doc => doc.data())
      
      // Get historical close rates
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const historicalSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('createdAt', '>=', sixMonthsAgo.toISOString().split('T')[0])
        .get()
      
      const historical = historicalSnapshot.docs.map(doc => doc.data())
      const closed = historical.filter(d => d.stage === 'closed-won' || d.stage === 'closed-lost')
      const closeRate = closed.length > 0 
        ? closed.filter(d => d.stage === 'closed-won').length / closed.length 
        : 0.3 // Default 30%
      
      // Forecast by month
      const forecast = []
      const today = new Date()
      for (let i = 1; i <= months; i++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0)
        
        // Deals expected to close this month
        const dealsThisMonth = deals.filter(deal => {
          const closeDate = new Date(deal.expectedCloseDate)
          return closeDate >= monthStart && closeDate <= monthEnd
        })
        
        const forecastedValue = dealsThisMonth.reduce((sum, deal) => {
          if (includeProbability) {
            return sum + (deal.value * deal.probability / 100)
          }
          return sum + (deal.value * closeRate)
        }, 0)
        
        forecast.push({
          month: monthStart.toISOString().substring(0, 7),
          dealCount: dealsThisMonth.length,
          forecastedValue: Math.round(forecastedValue),
          confidence: includeProbability ? 'high' : 'medium'
        })
      }
      
      return {
        forecast,
        assumptions: {
          historicalCloseRate: Math.round(closeRate * 10000) / 100,
          weightedByProbability: includeProbability
        }
      }
    }
    
    case "at_risk_deals_detection": {
      const riskThreshold = args.riskThreshold || 70
      
      const dealsSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('stage', 'in', ['prospect', 'qualification', 'proposal', 'negotiation'])
        .get()
      
      let deals = dealsSnapshot.docs.map(doc => doc.data())
      
      if (args.owner) {
        deals = deals.filter(d => d.owner === args.owner)
      }
      
      const now = new Date()
      const atRisk = deals.map(deal => {
        const created = new Date(deal.createdAt)
        const age = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // days
        const expectedClose = new Date(deal.expectedCloseDate)
        const daysUntilClose = (expectedClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        
        // Calculate risk score
        let riskScore = 0
        
        // Age risk (older = higher risk)
        if (age > 90) riskScore += 30
        else if (age > 60) riskScore += 20
        else if (age > 30) riskScore += 10
        
        // Probability risk (low probability = higher risk)
        if (deal.probability < 30) riskScore += 25
        else if (deal.probability < 50) riskScore += 15
        
        // Time risk (past expected close = higher risk)
        if (daysUntilClose < 0) riskScore += 25
        else if (daysUntilClose < 7) riskScore += 15
        
        // Stage risk (stuck in early stage = higher risk)
        if (deal.stage === 'prospect' && age > 30) riskScore += 20
        
        return {
          ...deal,
          riskScore: Math.min(100, riskScore),
          age: Math.round(age),
          daysUntilClose: Math.round(daysUntilClose)
        }
      }).filter(deal => deal.riskScore >= riskThreshold)
        .sort((a, b) => b.riskScore - a.riskScore)
      
      return {
        atRiskCount: atRisk.length,
        atRiskDeals: atRisk.slice(0, 10),
        riskThreshold
      }
    }
    
    case "conversion_funnel_analysis": {
      const dateRange = parsePeriodToDateRange(args.period)
      
      const dealsSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('createdAt', '>=', dateRange.start)
        .where('createdAt', '<=', dateRange.end)
        .get()
      
      const deals = dealsSnapshot.docs.map(doc => doc.data())
      
      const stages = ['prospect', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']
      const funnel = stages.map((stage, index) => {
        const stageDeals = deals.filter(d => d.stage === stage)
        const prevStage = index > 0 ? stages[index - 1] : null
        const prevCount = prevStage ? deals.filter(d => d.stage === prevStage).length : deals.length
        
        return {
          stage,
          count: stageDeals.length,
          conversionRate: prevCount > 0 ? Math.round((stageDeals.length / prevCount) * 10000) / 100 : 100,
          dropOff: prevCount > 0 ? Math.round(((prevCount - stageDeals.length) / prevCount) * 10000) / 100 : 0
        }
      })
      
      return {
        period: args.period,
        funnel,
        totalLeads: deals.length
      }
    }
    
    default:
      throw new Error(`Unknown sales tool: ${toolName}`)
  }
}

// ============================================================================
// HR TOOL EXECUTORS
// ============================================================================

async function executeHRTool(toolName: string, args: any): Promise<any> {
  const adminDb = getAdminDb()
  
  switch (toolName) {
    case "team_capacity_analysis": {
      let employeesQuery = adminDb.collection(COLLECTIONS.HR.EMPLOYEES)
        .where('status', '==', 'active')
      
      if (args.department) {
        employeesQuery = employeesQuery.where('department', '==', args.department)
      }
      
      const employeesSnapshot = await employeesQuery.get()
      const employees = employeesSnapshot.docs.map(doc => doc.data())
      
      // Group by department
      const byDepartment: Record<string, { count: number; salaries: number[] }> = {}
      employees.forEach(emp => {
        if (!byDepartment[emp.department]) {
          byDepartment[emp.department] = { count: 0, salaries: [] }
        }
        byDepartment[emp.department].count++
        if (emp.salary) {
          byDepartment[emp.department].salaries.push(emp.salary)
        }
      })
      
      const capacity = Object.entries(byDepartment).map(([dept, data]) => ({
        department: dept,
        headcount: data.count,
        avgSalary: data.salaries && data.salaries.length > 0
          ? Math.round(data.salaries.reduce((sum, s) => sum + s, 0) / data.salaries.length)
          : null,
        totalCost: data.salaries && data.salaries.length > 0
          ? Math.round(data.salaries.reduce((sum, s) => sum + s, 0))
          : null
      }))
      
      return {
        totalEmployees: employees.length,
        byDepartment: capacity,
        recommendations: capacity.filter(c => c.headcount < 3).map(c => 
          `${c.department} may be understaffed (${c.headcount} employees)`
        )
      }
    }
    
    case "performance_trends": {
      const dateRange = parsePeriodToDateRange(args.period)
      
      let reviewsQuery: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.HR.PERFORMANCE_REVIEWS)
        .where('createdAt', '>=', dateRange.start)
        .where('createdAt', '<=', dateRange.end)
      
      // Note: Department filtering would require joining with employees table
      // For now, we'll get all reviews and filter in memory if needed
      
      const reviewsSnapshot = await reviewsQuery.get()
      const reviews = reviewsSnapshot.docs.map(doc => doc.data())
      
      // Group by department (simplified - would need employee join)
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0
      
      const topPerformers = reviews
        .filter(r => r.rating >= 4)
        .slice(0, 5)
      
      return {
        period: args.period,
        totalReviews: reviews.length,
        avgRating: Math.round(avgRating * 100) / 100,
        topPerformers: topPerformers.length,
        trends: {
          improving: reviews.filter(r => r.rating >= 4).length,
          needsImprovement: reviews.filter(r => r.rating <= 2).length
        }
      }
    }
    
    case "retention_risk_analysis": {
      const riskThreshold = args.riskThreshold || 60
      
      const employeesSnapshot = await adminDb.collection(COLLECTIONS.HR.EMPLOYEES)
        .where('status', '==', 'active')
        .get()
      
      const employees = employeesSnapshot.docs.map(doc => doc.data())
      
      // Get performance reviews
      const reviewsSnapshot = await adminDb.collection(COLLECTIONS.HR.PERFORMANCE_REVIEWS).get()
      const reviews = reviewsSnapshot.docs.map(doc => doc.data())
      const reviewsByEmployee = new Map(reviews.map(r => [r.employeeId, r]))
      
      const now = new Date()
      const atRisk = employees.map(emp => {
        const hireDate = new Date(emp.hireDate)
        const tenure = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365) // years
        
        const review = reviewsByEmployee.get(emp.id)
        
        let riskScore = 0
        
        // Tenure risk (very new or very old = higher risk)
        if (tenure < 0.5) riskScore += 20 // New hires
        if (tenure > 5) riskScore += 15 // Long tenure might leave
        
        // Performance risk
        if (review && review.rating < 3) riskScore += 30
        
        // No recent review = risk
        if (!review) riskScore += 15
        
        return {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          tenure: Math.round(tenure * 10) / 10,
          riskScore: Math.min(100, riskScore),
          factors: [
            tenure < 0.5 ? 'New employee' : null,
            review && review.rating < 3 ? 'Low performance' : null,
            !review ? 'No recent review' : null
          ].filter(Boolean)
        }
      }).filter(emp => emp.riskScore >= riskThreshold)
        .sort((a, b) => b.riskScore - a.riskScore)
      
      return {
        atRiskCount: atRisk.length,
        atRiskEmployees: atRisk.slice(0, 10),
        riskThreshold
      }
    }
    
    case "hiring_needs_prediction": {
      const months = args.months || 6
      
      // Simplified prediction based on current headcount and growth trends
      const employeesSnapshot = await adminDb.collection(COLLECTIONS.HR.EMPLOYEES)
        .where('status', '==', 'active')
        .get()
      
      const employees = employeesSnapshot.docs.map(doc => doc.data())
      
      // Group by department
      const byDepartment: Record<string, number> = {}
      employees.forEach(emp => {
        byDepartment[emp.department] = (byDepartment[emp.department] || 0) + 1
      })
      
      // Simple growth assumption: 10% growth per quarter
      const growthRate = 0.1
      const quarters = Math.ceil(months / 3)
      
      const predictions = Object.entries(byDepartment).map(([dept, current]) => {
        const projected = Math.ceil(current * Math.pow(1 + growthRate, quarters))
        const needed = Math.max(0, projected - current)
        
        return {
          department: dept,
          currentHeadcount: current,
          projectedHeadcount: projected,
          hiringNeeded: needed,
          timeline: `${months} months`
        }
      })
      
      return {
        forecastHorizon: `${months} months`,
        predictions,
        assumptions: {
          growthRate: `${growthRate * 100}% per quarter`,
          note: "Based on historical patterns. Adjust based on business needs."
        }
      }
    }
    
    default:
      throw new Error(`Unknown HR tool: ${toolName}`)
  }
}

// ============================================================================
// CROSS-COLLECTION TOOL EXECUTORS
// ============================================================================

async function executeCrossCollectionTool(toolName: string, args: any): Promise<any> {
  const adminDb = getAdminDb()
  
  switch (toolName) {
    case "correlate_finance_sales": {
      const dateRange = parsePeriodToDateRange(args.period)
      const analysisType = args.analysisType
      
      // Get finance data
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Get sales data
      const dealsSnapshot = await adminDb.collection(COLLECTIONS.SALES.DEALS)
        .where('createdAt', '>=', dateRange.start)
        .where('createdAt', '<=', dateRange.end)
        .get()
      
      const deals = dealsSnapshot.docs.map(doc => doc.data())
      
      if (analysisType === 'revenue_vs_expenses') {
        const revenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const closedDeals = deals.filter(d => d.stage === 'closed-won')
        const dealValue = closedDeals.reduce((sum, d) => sum + d.value, 0)
        
        return {
          period: args.period,
          analysisType,
          revenue: Math.round(revenue),
          expenses: Math.round(expenses),
          dealValue: Math.round(dealValue),
          correlation: {
            revenueVsDeals: dealValue > 0 ? Math.round((revenue / dealValue) * 10000) / 100 : null,
            expenseRatio: revenue > 0 ? Math.round((expenses / revenue) * 10000) / 100 : null
          }
        }
      }
      
      // Add more correlation types as needed
      return { error: "Analysis type not yet implemented" }
    }
    
    case "department_performance_comparison": {
      const dateRange = parsePeriodToDateRange(args.period)
      
      // Get employees by department
      const employeesSnapshot = await adminDb.collection(COLLECTIONS.HR.EMPLOYEES).get()
      const employees = employeesSnapshot.docs.map(doc => doc.data())
      
      // Get department expenses
      const transactionsSnapshot = await adminDb.collection(COLLECTIONS.FINANCE.TRANSACTIONS)
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end)
        .where('type', '==', 'expense')
        .get()
      
      const transactions = transactionsSnapshot.docs.map(doc => doc.data())
      
      // Group by department
      const departments = new Set([
        ...employees.map(e => e.department),
        ...transactions.map(t => t.department).filter(Boolean)
      ])
      
      const comparison = Array.from(departments).map(dept => {
        const deptEmployees = employees.filter(e => e.department === dept && e.status === 'active')
        const deptExpenses = transactions
          .filter(t => t.department === dept)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        return {
          department: dept,
          headcount: deptEmployees.length,
          expenses: Math.round(deptExpenses),
          costPerEmployee: deptEmployees.length > 0 
            ? Math.round(deptExpenses / deptEmployees.length)
            : null
        }
      })
      
      return {
        period: args.period,
        departments: comparison
      }
    }
    
    default:
      throw new Error(`Unknown cross-collection tool: ${toolName}`)
  }
}

// ============================================================================
// ADVANCED TOOL EXECUTORS
// ============================================================================

async function executeAdvancedTool(toolName: string, args: any): Promise<any> {
  // Placeholder implementations - these would need more sophisticated algorithms
  switch (toolName) {
    case "trend_forecasting":
      return { error: "Advanced forecasting not yet implemented - use cash_flow_forecast or sales_forecast instead" }
    
    case "what_if_scenario":
      return { error: "What-if scenarios not yet implemented" }
    
    case "pattern_recognition":
      return { error: "Pattern recognition not yet implemented" }
    
    default:
      throw new Error(`Unknown advanced tool: ${toolName}`)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parsePeriodToDateRange(period: string): { start: string; end: string } {
  const now = new Date()
  
  if (period.startsWith('last-')) {
    const match = period.match(/last-(\d+)-months?/)
    if (match) {
      const months = parseInt(match[1])
      const start = new Date(now)
      start.setMonth(start.getMonth() - months)
      return {
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      }
    }
  }
  
  if (period.match(/^\d{4}-Q\d$/)) {
    // Quarter format: 2024-Q4
    const [year, quarter] = period.split('-Q')
    const q = parseInt(quarter)
    const startMonth = (q - 1) * 3
    const endMonth = q * 3 - 1
    
    const start = new Date(parseInt(year), startMonth, 1)
    const end = new Date(parseInt(year), endMonth + 1, 0)
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }
  
  if (period.match(/^\d{4}$/)) {
    // Year format: 2024
    return {
      start: `${period}-01-01`,
      end: `${period}-12-31`
    }
  }
  
  if (period.match(/^\d{4}-\d{2}$/)) {
    // Month format: 2024-11
    const [year, month] = period.split('-')
    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end = new Date(parseInt(year), parseInt(month), 0)
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }
  
  // Default: last 3 months
  const start = new Date(now)
  start.setMonth(start.getMonth() - 3)
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  }
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0
  
  // Simple linear regression slope
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i + 1)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

