# Agent Creation Assessment

**Purpose:** Clarify what you must configure when creating a Nectic agent, and where the confusion comes from.

---

## 1. All Configurable Aspects (Current State)

| Aspect | Location | Required? | Complexity |
|--------|----------|-----------|------------|
| **Agent name** | Basic tab | Yes | Low |
| **Description** | Basic tab | No | Low |
| **Data collections** | Basic tab | Yes (≥1) | Low |
| **Database connection** | Basic tab | No (defaults to Firestore) | Medium |
| **Intent mappings** | Basic tab | No (falls back to "general") | High |
| **Agentic config** | Basic tab | No | High |
| **OAuth connections** | Tools tab | No | Medium |
| **Tool marketplace** | Tools tab | No (auto-adds basic tools) | High |
| **Visual workflow** | Workflow tab | No | High |
| **Model config** | Config tab | No (defaults to gpt-4) | Medium |
| **System prompt** | Config tab | No | Medium |
| **Memory config** | Config tab | No | Medium |
| **Deployment config** | Config tab | No | Medium |

---

## 2. What Actually Matters (Minimum to Create)

**Required:**
- Agent name
- At least one collection (e.g. `finance_transactions`)

**Everything else has defaults.** You can create an agent with just name + collections.

---

## 3. Where Confusion Comes From

### Too many tabs and concepts
- 4 tabs: Basic, Tools, Workflow, Config
- Basic tab alone has: Agent details, Database connection, Agentic config, Collections, Intent mappings
- Agentic config has: Reasoning, Tools, Proactive insights, Context memory, Response style, Domain knowledge, Cost optimization

### Overlapping concepts
- **Collections** vs **Intent mappings** – both control which data the agent uses
- **Tools** (Tool marketplace) vs **Agentic config → tools** – tool selection appears in two places
- **Database connection** vs **Collections** – connection is separate from which collections are used

### Optional but prominent
- Intent mappings are optional but get a full card
- Visual workflow is optional but gets its own tab
- Agentic config is optional but has many nested sections

### NECTIC strategy mismatch
From `NECTIC.md`:
> **Cut for v1:** Agent creation UI, OAuth, workflow builder, multiple LLM providers.

The current agent creation flow is the opposite of the product direction: it’s full-featured, not “Connect data → Chat.”

---

## 4. Recommended Simplification (Aligned with NECTIC)

| For v1 (Connect → Chat) | Cut / Defer |
|-------------------------|-------------|
| Name | Agent creation UI (use Connect → Chat instead) |
| Connect data (Excel/CSV) | Intent mappings |
| Chat | OAuth, workflow builder |
| | Multiple LLM providers |
| | Agentic config (reasoning, tools, etc.) |
| | Database connection form |
| | Tool marketplace |

**Target flow:** Upload Excel → Ask question → Get answer. No agent creation step.

---

## 5. If You Keep Agent Creation

**Minimum viable form:**
1. Agent name
2. Select collections (or “Connect data”)
3. Create

**Defer to later:**
- Intent mappings
- Agentic config (reasoning, tools, proactive insights, etc.)
- Visual workflow
- Database connection (use Firestore/Excel only)
- OAuth
- Model/memory/deployment config

---

## 6. Summary

| Question | Answer |
|----------|--------|
| What do I *have* to set? | Name + at least one collection |
| Why does it feel confusing? | Many optional features are shown as first-class |
| What should we do? | Match NECTIC: Connect data → Chat. Cut agent creation for v1, or reduce it to name + data source only |
