# Nectic - AI Agent Platform

Internal AI agents that connect to company databases and answer questions in natural language.

## 🚀 Quick Start

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Firebase Setup:**
   - Copy your Firebase Admin SDK key to `firebase-service-account.json` in project root
   - Or set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

3. **Seed Database:**
   ```bash
   # Start dev server first
   npm run dev
   
   # Then in another terminal, seed the database
   curl http://localhost:3000/api/seed
   ```
   
   Or visit `http://localhost:3000/api/seed` in your browser.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📊 Database Structure

### Collections

**Finance:**
- `finance_transactions` - Financial transactions (income, expenses, transfers)
- `finance_budgets` - Department budgets by category and period

**Sales:**
- `sales_deals` - Sales pipeline deals
- `sales_customers` - Customer records
- `sales_activities` - Sales activities (calls, emails, meetings)

**HR:**
- `hr_employees` - Employee records
- `hr_leave_requests` - Leave/vacation requests
- `hr_performance_reviews` - Performance review records

### Seed Data

The seed script creates:
- 200 financial transactions
- 50 sales deals
- 25 employees

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Firebase Firestore
- **AI:** OpenAI GPT-4o (to be integrated)
- **Database:** Firebase Firestore

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── seed/          # Database seed endpoint
│   └── ...
├── domain/                # Domain layer (entities, interfaces)
├── application/           # Application layer (use cases, DTOs)
├── infrastructure/         # Infrastructure layer
│   ├── database/          # Database schema, seed, utilities
│   ├── firebase/          # Firebase configuration
│   └── services/          # External services
└── presentation/          # Presentation layer (hooks, components)
```

## 🤖 Model Fine-Tuning with Tinker

Nectic can fine-tune its own language models for generating AI opportunity reports using the [Tinker platform](https://tinker.ai).

### Overview

The `tinker-training/` subproject contains Python scripts to:
- Train LoRA adapters on business context → opportunity report examples
- Export checkpoints for inference
- Sample from trained models

### Quick Start

1. **Navigate to training directory:**
   ```bash
   cd tinker-training
   ```

2. **Set up Python environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set Tinker API key:**
   ```bash
   export TINKER_API_KEY=your_api_key_here
   ```

4. **Train a model:**
   ```bash
   python train_nectic_opportunity_model.py \
     --dataset data/nectic_examples.jsonl \
     --num-steps 500
   ```

5. **Test the model:**
   ```bash
   python sample_nectic_model.py \
     --checkpoint-name nectic-v1_weights_final \
     --business-context "A restaurant uses paper menus and phone orders..."
   ```

### Integration

The trained model can be integrated into Nectic's opportunity generation pipeline by replacing the current AI service implementation.

For detailed documentation, see [`tinker-training/README.md`](./tinker-training/README.md).

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database (via API route)

### Environment Variables

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (for server-side operations)
# In Vercel: Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_ADMIN_SDK_KEY
# Value should be the entire JSON service account key as a single-line string
# Get it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Convert to single line: cat your-service-account.json | jq -c .
FIREBASE_SERVICE_ACCOUNT_KEY=  # Or use firebase-service-account.json file locally

# OpenAI (for AI agent)
OPENAI_API_KEY=

# Tinker (for model fine-tuning)
TINKER_API_KEY=  # Required for tinker-training scripts
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
run_terminal_cmd

## 📝 Next Steps

1. ✅ Database schema and seed script
2. ⏭️ Agent config system (intent → table mapping)
3. ⏭️ Chat interface with GPT-4o integration
4. ⏭️ Query generation from natural language

## 📚 Usage Examples

### Querying Data

```typescript
import { getTransactions, getDeals, getEmployees } from '@/infrastructure/database/db-utils'

// Get transactions
const transactions = await getTransactions({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  category: 'software',
  limit: 50
})

// Get deals
const deals = await getDeals({
  stage: 'negotiation',
  minValue: 10000
})

// Get employees
const employees = await getEmployees({
  department: 'Engineering',
  status: 'active'
})
```

## 🛠️ Troubleshooting

### Seed Script Issues

If the seed script fails:
1. Make sure `firebase-service-account.json` exists in project root
2. Check Firebase Admin SDK is properly installed
3. Use the API route method: `curl http://localhost:3000/api/seed`

### Firebase Connection

- Verify service account key is valid
- Check Firebase project permissions
- Ensure Firestore is enabled in Firebase Console
