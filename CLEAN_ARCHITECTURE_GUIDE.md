# Clean Architecture Implementation Guide

## ✅ Complete Structure

```
src/
├── domain/                          # 🟢 Domain Layer (No Dependencies)
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── assessment.entity.ts
│   │   ├── opportunity.entity.ts
│   │   └── payment.entity.ts
│   ├── repositories/                # Interfaces only
│   │   ├── user.repository.ts
│   │   ├── assessment.repository.ts
│   │   ├── opportunity.repository.ts
│   │   └── payment.repository.ts
│   └── services/                    # Interfaces only
│       ├── ai-service.interface.ts
│       └── payment-service.interface.ts
│
├── application/                      # 🟡 Application Layer (Depends on Domain)
│   ├── use-cases/
│   │   ├── assessment/
│   │   │   ├── calculate-assessment-scores.use-case.ts
│   │   │   └── submit-assessment.use-case.ts
│   │   ├── opportunity/
│   │   │   └── generate-opportunities.use-case.ts
│   │   ├── user/
│   │   │   └── get-user-profile.use-case.ts
│   │   └── payment/
│   │       └── create-checkout-session.use-case.ts
│   ├── dtos/
│   │   ├── assessment.dto.ts
│   │   └── opportunity.dto.ts
│   └── errors/
│       └── domain-errors.ts
│
├── infrastructure/                   # 🔵 Infrastructure Layer (Implements Domain)
│   ├── firebase/
│   │   ├── firebase-client.ts        # Client-side Firebase
│   │   └── firebase-server.ts        # Server-side Firebase (Admin)
│   ├── repositories/                 # Repository implementations
│   │   ├── firebase-user.repository.ts
│   │   ├── firebase-assessment.repository.ts
│   │   ├── firebase-opportunity.repository.ts
│   │   └── firebase-payment.repository.ts
│   ├── services/                     # External service implementations
│   │   ├── perplexity-ai.service.ts
│   │   └── stripe-payment.service.ts
│   └── di/
│       └── container.ts              # Dependency Injection
│
└── presentation/                     # 🟣 Presentation Layer (Depends on All)
    ├── hooks/                        # React hooks
    │   ├── use-assessment.ts
    │   └── use-opportunities.ts
    └── components/                   # (To be created with v0)
```

## 🎯 How to Use

### 1. Adding a New Feature

**Example: Add a "Save Opportunity" feature**

#### Step 1: Domain Layer
```typescript
// src/domain/entities/opportunity.entity.ts
export interface SavedOpportunity {
  id: string
  userId: string
  opportunityId: string
  savedAt: Date
  notes?: string
}
```

#### Step 2: Repository Interface
```typescript
// src/domain/repositories/opportunity.repository.ts
export interface IOpportunityRepository {
  // ... existing methods
  saveOpportunity(opportunity: SavedOpportunity): Promise<SavedOpportunity>
}
```

#### Step 3: Use Case
```typescript
// src/application/use-cases/opportunity/save-opportunity.use-case.ts
export class SaveOpportunityUseCase {
  constructor(private repository: IOpportunityRepository) {}
  
  async execute(userId: string, opportunityId: string): Promise<SavedOpportunity> {
    return this.repository.saveOpportunity({
      userId,
      opportunityId,
      savedAt: new Date(),
    })
  }
}
```

#### Step 4: Infrastructure Implementation
```typescript
// src/infrastructure/repositories/firebase-opportunity.repository.ts
async saveOpportunity(opportunity: SavedOpportunity): Promise<SavedOpportunity> {
  // Firestore implementation
}
```

#### Step 5: API Route
```typescript
// src/app/api/opportunities/save/route.ts
export async function POST(request: NextRequest) {
  const { userId, opportunityId } = await request.json()
  const repository = getOpportunityRepository()
  const useCase = new SaveOpportunityUseCase(repository)
  const result = await useCase.execute(userId, opportunityId)
  return NextResponse.json(result)
}
```

#### Step 6: React Hook (Optional)
```typescript
// src/presentation/hooks/use-opportunities.ts
const saveOpportunity = async (opportunityId: string) => {
  await fetch('/api/opportunities/save', {
    method: 'POST',
    body: JSON.stringify({ userId, opportunityId }),
  })
}
```

### 2. Dependency Injection Pattern

Always use the DI container to get dependencies:

```typescript
// ✅ Correct
import { getUserRepository } from '@/infrastructure/di/container'
const userRepo = getUserRepository()

// ❌ Wrong - Direct instantiation
import { FirebaseUserRepository } from '@/infrastructure/repositories/firebase-user.repository'
const userRepo = new FirebaseUserRepository()
```

### 3. Error Handling

Use domain errors in use cases:

```typescript
import { NotFoundError, ValidationError } from '@/application/errors/domain-errors'

if (!user) {
  throw new NotFoundError('User', userId)
}

if (!email.includes('@')) {
  throw new ValidationError('Invalid email format', 'email')
}
```

Handle in API routes:

```typescript
try {
  const result = await useCase.execute(dto)
  return NextResponse.json(result)
} catch (error) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

## 📋 Current Implementation Status

### ✅ Completed
- Domain entities and interfaces
- Repository interfaces
- Service interfaces
- Use cases for core features
- Infrastructure implementations (Firebase, Perplexity, Stripe)
- Dependency injection container
- API routes for assessment, opportunities, checkout
- React hooks for assessment and opportunities
- Error handling patterns

### 🚧 To Be Implemented (with v0)
- React components using the hooks
- Pages using the components
- Authentication context/hooks
- Analytics integration (PostHog)
- Error reporting (Sentry)

## 🔄 Migration from Old Code

### Old Firebase Files
- `src/lib/firebase.ts` → `src/infrastructure/firebase/firebase-client.ts`
- `src/lib/firebase-client.ts` → Can be deleted (deprecated)

### Old Service Files
- `src/lib/assessment-service.ts` → Use `SubmitAssessmentUseCase` instead
- `src/lib/ai-service.ts` → Use `PerplexityAIService` via DI container
- `src/lib/opportunities-service.ts` → Use `IOpportunityRepository` instead

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test use case with mock repository
const mockRepo = {
  findById: jest.fn(),
  update: jest.fn(),
}
const useCase = new GetUserProfileUseCase(mockRepo)
```

### Integration Tests
```typescript
// Test API route with test database
const response = await fetch('/api/assessment/submit', {
  method: 'POST',
  body: JSON.stringify({ userId, answers }),
})
```

## 🎓 Key Principles

1. **Dependency Rule**: Inner layers never depend on outer layers
2. **Interface Segregation**: Define interfaces in domain, implement in infrastructure
3. **Single Responsibility**: Each use case does one thing
4. **Dependency Injection**: Use DI container, never instantiate directly
5. **Error Handling**: Use domain errors, convert to HTTP in presentation layer

## 📚 Next Steps

1. Build React components using the hooks
2. Create pages that use the components
3. Add authentication context
4. Integrate analytics and error reporting
5. Write tests for each layer





