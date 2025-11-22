# Quick Start Templates

Pre-configured agent templates for common business use cases.

## Finance Agent Template

**Purpose:** Analyze financial transactions, revenue, expenses, and budgets.

**Collections:**
- `finance_transactions` - Income, expenses, transfers
- `finance_budgets` - Department budgets

**Intent Mappings:**
```
Intent: revenue
Keywords: revenue, income, earnings, sales, money, cash
Collections: finance_transactions

Intent: expenses
Keywords: expenses, costs, spending, payments, bills
Collections: finance_transactions

Intent: budget
Keywords: budget, planned, allocated, forecast
Collections: finance_budgets
```

**Example Questions:**
- "What's our total revenue this month?"
- "Show me expenses by category"
- "Compare actual spending to budget"
- "What are our top expense categories?"

**Database Setup:**
If using external database (PostgreSQL/MySQL):
```sql
CREATE TABLE finance_transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  type VARCHAR(20), -- 'income' or 'expense'
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE finance_budgets (
  id SERIAL PRIMARY KEY,
  department VARCHAR(100),
  category VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Sales Agent Template

**Purpose:** Track sales pipeline, deals, win rates, and forecasts.

**Collections:**
- `sales_deals` - Sales opportunities and deals
- `sales_customers` - Customer records
- `sales_activities` - Calls, emails, meetings

**Intent Mappings:**
```
Intent: pipeline
Keywords: pipeline, deals, opportunities, prospects
Collections: sales_deals

Intent: customers
Keywords: customers, clients, accounts, companies
Collections: sales_customers

Intent: activities
Keywords: calls, emails, meetings, activities, touchpoints
Collections: sales_activities
```

**Example Questions:**
- "What's in our sales pipeline?"
- "Show me deals closing this quarter"
- "What's our win rate?"
- "Which deals are at risk?"

**Database Setup:**
If using external database (PostgreSQL/MySQL):
```sql
CREATE TABLE sales_deals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  value DECIMAL(10,2),
  stage VARCHAR(50), -- 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'
  owner VARCHAR(100),
  expected_close_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## HR Agent Template

**Purpose:** Manage employees, track performance, and analyze workforce data.

**Collections:**
- `hr_employees` - Employee records
- `hr_leave_requests` - Vacation and leave requests
- `hr_performance_reviews` - Performance evaluations

**Intent Mappings:**
```
Intent: employees
Keywords: employees, staff, team, people, workforce
Collections: hr_employees

Intent: leave
Keywords: leave, vacation, time off, PTO, holidays
Collections: hr_leave_requests

Intent: performance
Keywords: performance, reviews, evaluations, ratings
Collections: hr_performance_reviews
```

**Example Questions:**
- "How many employees do we have?"
- "Show me employees by department"
- "Who's on leave this month?"
- "What's our team's average performance rating?"

**Database Setup:**
If using external database (PostgreSQL/MySQL):
```sql
CREATE TABLE hr_employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  department VARCHAR(100),
  role VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE hr_leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES hr_employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR(50), -- 'vacation', 'sick', 'personal'
  status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Customer Support Agent Template

**Purpose:** Track tickets, response times, and customer satisfaction.

**Collections:**
- `support_tickets` - Customer support tickets
- `support_customers` - Customer information

**Intent Mappings:**
```
Intent: tickets
Keywords: tickets, issues, problems, support, help
Collections: support_tickets

Intent: customers
Keywords: customers, users, clients
Collections: support_customers
```

**Example Questions:**
- "How many open tickets do we have?"
- "What's our average response time?"
- "Show me tickets by priority"
- "Which customers have the most tickets?"

**Database Setup:**
```sql
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  subject VARCHAR(255),
  description TEXT,
  status VARCHAR(50), -- 'open', 'in-progress', 'resolved', 'closed'
  priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  assigned_to VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

---

## E-commerce Agent Template

**Purpose:** Analyze orders, products, inventory, and revenue.

**Collections:**
- `orders` - Customer orders
- `products` - Product catalog
- `inventory` - Stock levels

**Intent Mappings:**
```
Intent: orders
Keywords: orders, purchases, sales, transactions
Collections: orders

Intent: products
Keywords: products, items, SKUs, catalog
Collections: products

Intent: inventory
Keywords: inventory, stock, quantity, available
Collections: inventory
```

**Example Questions:**
- "What's our total revenue today?"
- "Show me top-selling products"
- "Which products are low on stock?"
- "What's our average order value?"

---

## Marketing Agent Template

**Purpose:** Track campaigns, leads, conversions, and ROI.

**Collections:**
- `marketing_campaigns` - Marketing campaigns
- `marketing_leads` - Generated leads
- `marketing_events` - Marketing events and activities

**Intent Mappings:**
```
Intent: campaigns
Keywords: campaigns, marketing, promotions, ads
Collections: marketing_campaigns

Intent: leads
Keywords: leads, prospects, inquiries, signups
Collections: marketing_leads

Intent: events
Keywords: events, webinars, conferences, activities
Collections: marketing_events
```

**Example Questions:**
- "Which campaigns are performing best?"
- "What's our lead conversion rate?"
- "Show me ROI by campaign"
- "How many leads did we generate this month?"

---

## Using Templates

### Step 1: Choose a Template

Select a template that matches your business needs:
- **Finance** - For accounting and financial analysis
- **Sales** - For sales pipeline and revenue tracking
- **HR** - For employee management and workforce analytics
- **Customer Support** - For ticket tracking and customer service
- **E-commerce** - For online store analytics
- **Marketing** - For campaign and lead tracking

### Step 2: Create Agent

1. Go to `/agents/new`
2. Enter agent name (e.g., "Finance Assistant")
3. Select collections from the template
4. Copy intent mappings from the template
5. (Optional) Connect external database

### Step 3: Connect Database

If using external database:
1. Select database type (PostgreSQL, MySQL, MongoDB)
2. Enter connection details
3. Test connection
4. Save connection

### Step 4: Test Agent

1. Go to `/agents/[id]/chat`
2. Ask template example questions
3. Verify responses are accurate
4. Adjust as needed

---

## Custom Templates

You can create custom templates by:
1. Defining your data schema
2. Creating collections/tables
3. Mapping business intents to collections
4. Testing with sample questions

See [DATABASE_CONNECTION_GUIDE.md](./DATABASE_CONNECTION_GUIDE.md) for database setup details.

---

## Next Steps

After setting up an agent:
1. **Test queries** - Verify data is accessible
2. **Refine intents** - Adjust keywords based on usage
3. **Add more collections** - Expand agent capabilities
4. **Monitor analytics** - Track usage and feedback

For more help, see:
- [README.md](./README.md) - Main documentation
- [DATABASE_CONNECTION_GUIDE.md](./DATABASE_CONNECTION_GUIDE.md) - Database setup
- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) - Product strategy

