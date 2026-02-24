# MVP Status

## What Works Now

### Demo (Zero Config)
- **Route:** `/demo`
- **Requires:** `OPENAI_API_KEY` only. No Firebase, no seed.
- **Flow:** Visit /demo → Ask "What's our burn rate?" → Get answer from embedded sample data (150 transactions).
- **Suggested prompts:** "What's our total spend on software?", "Top 5 expenses by category?", "What's our burn rate this month?"

### Full App (Firebase Required)
- **Requires:** Firebase config, OpenAI key, seed.
- **Flow:** Signup → Create agent (Finance) → Chat with your Firestore data.
- **Seed:** `GET /api/seed` creates finance_transactions, finance_budgets, sales_deals, hr_employees.

## Quick Test (Demo Only)

```bash
# 1. Set OpenAI key
echo "OPENAI_API_KEY=sk-..." >> .env.local

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000/demo
# 4. Ask: "What's our total spend on software?"
```

## Next (Phase 2)

- [ ] CSV upload — Upload Excel/CSV → Chat with your data (no Firebase for try-now)
- [ ] Citation — Show which rows the answer came from
- [ ] Export — Download table answers as CSV
