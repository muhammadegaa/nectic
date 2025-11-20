# Agentic AI Implementation Plan
## Research-Backed Approach Building on Existing System

## Core Agentic AI Principles (From Research)

### 1. **Perception → Reasoning → Action Loop (ReAct Pattern)**
- **Perception**: Understand environment/context
- **Reasoning**: Plan actions based on understanding
- **Action**: Execute planned actions
- **Reflection**: Learn from outcomes

### 2. **Tool Use & Function Calling**
- AI should have access to tools/functions
- Can decide which tools to use autonomously
- Can chain multiple tools together

### 3. **Multi-Step Planning**
- Break complex tasks into subtasks
- Execute in sequence with dependencies
- Adapt plan based on intermediate results

### 4. **Memory & Context**
- Remember conversation history
- Learn user patterns
- Build context over time

## Current System Analysis

### What We Have ✅
- Basic intent detection (keyword matching)
- Firestore query capability
- Conversation persistence
- OpenAI GPT-4o integration
- User authentication & isolation

### What's Missing (Making It Agentic) ❌
- No tool/function calling
- No multi-step planning
- No reasoning loop (ReAct)
- Static queries (always limit 10)
- No reflection/learning
- Single-turn responses

## Implementation Strategy: Build on Existing

### Phase 1: Tool Use with OpenAI Function Calling (Week 1)
**Goal**: Transform static queries into dynamic tool calls

#### Current Flow:
```
User Question → Intent Detection → Query (limit 10) → Answer
```

#### New Flow (Agentic):
```
User Question → LLM Plans → Calls Tools → Executes Queries → Synthesizes Answer
```

#### Implementation:

1. **Define Tools as Functions** (`src/lib/agent-tools.ts`)
   ```typescript
   const tools = [
     {
       type: "function",
       function: {
         name: "query_finance_transactions",
         description: "Query finance transactions with filters",
         parameters: {
           type: "object",
           properties: {
             dateRange: { type: "string", description: "Date range filter" },
             category: { type: "string", description: "Transaction category" },
             limit: { type: "number", description: "Number of records" },
             minAmount: { type: "number", description: "Minimum amount" }
           }
         }
       }
     },
     {
       type: "function",
       function: {
         name: "query_sales_deals",
         description: "Query sales deals with filters",
         parameters: { ... }
       }
     },
     {
       type: "function",
       function: {
         name: "analyze_trends",
         description: "Analyze trends across data",
         parameters: { ... }
       }
     }
   ]
   ```

2. **Update Chat API** (`src/app/api/chat/route.ts`)
   - Use `tools` parameter in OpenAI API
   - Handle `tool_calls` in response
   - Execute tool functions
   - Return results to LLM for synthesis

3. **Benefits**:
   - LLM decides what data to fetch
   - Can query with specific filters
   - Can chain multiple queries
   - More intelligent than static limit 10

### Phase 2: Multi-Step Planning (Week 2)
**Goal**: Break complex questions into sub-queries

#### Implementation:

1. **Query Planner** (`src/lib/query-planner.ts`)
   - LLM analyzes question complexity
   - Breaks into sub-questions if needed
   - Plans execution order
   - Handles dependencies

2. **Example**:
   ```
   User: "What's our revenue trend and which deals are at risk?"
   
   Plan:
   1. Query finance transactions (last 12 months)
   2. Calculate revenue by month
   3. Query sales deals (status: at-risk)
   4. Synthesize both into answer
   ```

3. **Execution Loop**:
   ```typescript
   while (hasMoreSteps) {
     const step = plan.nextStep()
     const result = await executeTool(step)
     plan.updateWithResult(result)
   }
   ```

### Phase 3: ReAct Pattern (Week 3)
**Goal**: Reasoning + Acting loop with reflection

#### Implementation:

1. **ReAct Loop** (`src/lib/react-agent.ts`)
   ```typescript
   while (!taskComplete) {
     // Reasoning: LLM thinks about what to do next
     const thought = await llm.reason(context)
     
     // Acting: LLM decides on action
     const action = await llm.planAction(thought)
     
     // Execute action
     const result = await executeAction(action)
     
     // Reflection: Learn from result
     context.update(result)
   }
   ```

2. **System Prompt Enhancement**:
   ```
   You are an agentic AI assistant. Follow this process:
   1. Think: Analyze the question and available tools
   2. Act: Choose which tools to use and how
   3. Observe: Review the results
   4. Reflect: Determine if more actions are needed
   5. Respond: Synthesize final answer
   ```

### Phase 4: Proactive Insights (Week 4)
**Goal**: Generate insights without being asked

#### Implementation:

1. **After Answer Generation**:
   - Analyze returned data for anomalies
   - Identify patterns
   - Generate 2-3 follow-up questions
   - Suggest related queries

2. **Example**:
   ```
   Answer: "Revenue is $50k, up 15% from last quarter"
   
   Proactive Insights:
   - "I noticed Q3 expenses were unusually high. Want me to investigate?"
   - "You might also want to know: Which deals are closing this month?"
   ```

## Technical Implementation Details

### 1. OpenAI Function Calling Setup

```typescript
// src/lib/agent-tools.ts
export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "query_collection",
      description: "Query a Firestore collection with filters",
      parameters: {
        type: "object",
        properties: {
          collection: {
            type: "string",
            enum: ["finance_transactions", "sales_deals", "hr_employees"],
            description: "Collection to query"
          },
          filters: {
            type: "object",
            description: "Filter criteria",
            properties: {
              dateRange: { type: "string" },
              category: { type: "string" },
              status: { type: "string" },
              limit: { type: "number", default: 50 }
            }
          }
        },
        required: ["collection"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_data",
      description: "Analyze data for trends, anomalies, or patterns",
      parameters: {
        type: "object",
        properties: {
          data: { type: "array", description: "Data to analyze" },
          analysisType: {
            type: "string",
            enum: ["trend", "anomaly", "summary", "comparison"],
            description: "Type of analysis to perform"
          }
        },
        required: ["data", "analysisType"]
      }
    }
  }
]
```

### 2. Updated Chat API with Tool Calling

```typescript
// src/app/api/chat/route.ts (enhanced)
export async function POST(request: NextRequest) {
  // ... existing auth and validation ...
  
  // First call: Let LLM plan and decide on tools
  const initialResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
      ...conversationHistory // Add context
    ],
    tools: agentTools,
    tool_choice: "auto", // Let LLM decide
    temperature: 0.7,
  })
  
  const message = initialResponse.choices[0].message
  const toolCalls = message.tool_calls || []
  
  // Execute tool calls
  const toolResults = []
  for (const toolCall of toolCalls) {
    const result = await executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments))
    toolResults.push({
      tool_call_id: toolCall.id,
      role: "tool",
      name: toolCall.function.name,
      content: JSON.stringify(result)
    })
  }
  
  // Second call: Synthesize results
  if (toolResults.length > 0) {
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
        message, // Include tool call request
        ...toolResults, // Include tool results
      ],
      temperature: 0.7,
    })
    
    return finalResponse.choices[0].message.content
  }
  
  return message.content
}
```

### 3. Tool Execution Functions

```typescript
// src/lib/tool-executors.ts
export async function executeTool(toolName: string, args: any) {
  switch (toolName) {
    case "query_collection":
      return await queryCollectionWithFilters(args.collection, args.filters)
    
    case "analyze_data":
      return await analyzeData(args.data, args.analysisType)
    
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

async function queryCollectionWithFilters(collection: string, filters: any) {
  const adminDb = getAdminDb()
  let query = adminDb.collection(collection)
  
  // Apply filters dynamically
  if (filters.dateRange) {
    // Parse and apply date filter
  }
  if (filters.category) {
    query = query.where('category', '==', filters.category)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  
  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

## Migration Strategy: Don't Break Existing

### Step 1: Add Tool Calling (Backward Compatible)
- Keep existing flow as fallback
- Add tool calling as enhancement
- Feature flag: `useAgenticMode`

### Step 2: Gradual Migration
- Test with subset of users
- Compare results
- Iterate based on feedback

### Step 3: Full Rollout
- Once validated, make default
- Keep simple mode as option

## Success Metrics

1. **Query Quality**: More accurate answers (user feedback)
2. **Complexity Handling**: Can answer multi-part questions
3. **Proactivity**: Users engage with suggested insights
4. **Efficiency**: Fewer back-and-forth questions needed

## Next Steps

1. **Week 1**: Implement OpenAI Function Calling
   - Define tools
   - Update chat API
   - Test with simple queries

2. **Week 2**: Add Multi-Step Planning
   - Query planner
   - Execution loop
   - Test with complex questions

3. **Week 3**: Implement ReAct Pattern
   - Reasoning loop
   - Reflection mechanism
   - Test end-to-end

4. **Week 4**: Add Proactive Insights
   - Anomaly detection
   - Follow-up suggestions
   - Polish UX

---

**Key Insight**: We don't need to rebuild. We enhance the existing system with agentic capabilities using OpenAI Function Calling, which is the industry-standard approach for building agentic AI systems.

