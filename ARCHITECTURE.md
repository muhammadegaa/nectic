# Clean Architecture Documentation

## Overview

This project follows Clean Architecture principles, separating concerns into distinct layers with clear dependency rules.

## Layer Structure

```
src/
├── domain/                    # Domain Layer (Business Logic)
│   ├── entities/             # Core business entities
│   ├── repositories/         # Repository interfaces (contracts)
│   └── services/             # Service interfaces (contracts)
│
├── application/               # Application Layer (Use Cases)
│   ├── use-cases/            # Business use cases
│   ├── dtos/                 # Data Transfer Objects
│   └── errors/               # Domain error classes
│
├── infrastructure/            # Infrastructure Layer (External Dependencies)
│   ├── firebase/             # Firebase client/server setup
│   ├── repositories/         # Repository implementations
│   ├── services/             # External service implementations
│   └── di/                   # Dependency injection container
│
└── presentation/              # Presentation Layer (UI & API)
    ├── hooks/                # React hooks for UI
    └── components/           # React components (to be created)
```

## Dependency Rules

### ✅ Allowed Dependencies

1. **Domain Layer**: No dependencies (pure TypeScript)
2. **Application Layer**: Depends only on Domain Layer
3. **Infrastructure Layer**: Depends on Domain Layer (implements interfaces)
4. **Presentation Layer**: Depends on Application Layer and Infrastructure (for DI)

### ❌ Forbidden Dependencies

- Domain layer cannot depend on anything
- Application layer cannot depend on Infrastructure or Presentation
- Infrastructure cannot depend on Application or Presentation
- Presentation can depend on all layers (it's the outermost layer)

## Key Concepts

### Entities

Pure business objects with no framework dependencies:
- `UserProfile`
- `AssessmentResult`
- `AIOpportunity`
- `Subscription`

### Repositories

Interfaces defined in Domain, implemented in Infrastructure:
- `IUserRepository`
- `IAssessmentRepository`
- `IOpportunityRepository`
- `IPaymentRepository`

### Use Cases

Business logic orchestration in Application layer:
- `SubmitAssessmentUseCase`
- `GenerateOpportunitiesUseCase`
- `GetUserProfileUseCase`
- `CreateCheckoutSessionUseCase`

### DTOs

Data Transfer Objects for API boundaries:
- `SubmitAssessmentDTO`
- `OpportunityListDTO`
- `AssessmentResultDTO`

## Example Flow: Submit Assessment

```
1. User submits form (Presentation)
   ↓
2. POST /api/assessment/submit (Presentation - API Route)
   ↓
3. SubmitAssessmentUseCase.execute() (Application)
   ↓
4. CalculateAssessmentScoresUseCase.execute() (Application)
   ↓
5. FirebaseAssessmentRepository.saveResult() (Infrastructure)
   ↓
6. FirebaseUserRepository.update() (Infrastructure)
   ↓
7. Return AssessmentResultDTO (Application → Presentation)
```

## Next.js 14 App Router Compatibility

### Server Components vs Client Components

- **Server Components** (default): Use for pages that don't need interactivity
- **Client Components** (`"use client"`): Use for interactive components, hooks

### API Routes

All API routes are in `src/app/api/` and are server-side only. They:
- Use dependency injection container to get use cases
- Handle HTTP concerns (request/response)
- Convert domain errors to HTTP status codes

### Hooks

React hooks in `src/presentation/hooks/` are client-side only and:
- Call API routes (not use cases directly)
- Manage loading/error states
- Provide clean interface for components

## Testing Strategy

### Unit Tests

- **Domain Layer**: Test entities and business logic
- **Application Layer**: Test use cases with mock repositories
- **Infrastructure Layer**: Test repository implementations with test database

### Integration Tests

- Test API routes with test database
- Test use case flows end-to-end

### E2E Tests

- Test complete user flows through UI

## Migration Notes

The existing Firebase files have been migrated to:
- `src/infrastructure/firebase/firebase-client.ts` (client-side)
- `src/infrastructure/firebase/firebase-server.ts` (server-side)

Old files (`src/lib/firebase.ts`, `src/lib/firebase-client.ts`) can be removed after verifying the new structure works.










