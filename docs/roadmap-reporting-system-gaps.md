# Reporting System Gaps and Roadmap

## Why the current system can feel simple

The current platform is a strong v1 foundation:

- a constrained `ReportSpec` DSL
- validation and repair loops
- a predictable resolution engine
- a safe rendering layer

That is enough to prove the architecture and make AI-assisted report generation possible.

However, it still feels closer to:

- "generate a valid report config and render it"

than to:

- "operate a robust reporting system for messy, real-world business use cases"

The difference is mostly in missing semantics, report operations, and higher-quality intent understanding.

## What is missing today

### 1. Richer data shaping

The current model can bind filters to query params and render result sets, but robust reporting usually also needs:

- sorting
- pagination
- row limits
- grouping beyond simple table grouping
- aggregations such as sum, avg, min, max, count
- derived fields and formulas
- period-over-period comparisons
- joining or combining multiple data sources
- reusable transformations per widget

### 2. Richer filtering

The current filter set is intentionally narrow. A more capable reporting system usually needs:

- multi-select filters
- numeric range filters
- boolean/toggle filters
- dynamic filter options loaded from data
- dependent filters where one filter narrows another
- required filters
- default values
- saved filter presets
- filter visibility rules

### 3. Richer widgets and report composition

Today the widget model is intentionally small. A more mature reporting surface usually needs:

- line, area, pie, stacked, and trend charts
- richer KPI cards with delta and sparkline support
- drill-down and click-through actions
- widget-level sorting and display options
- sections and stronger layout primitives
- tabs or report pages
- narrative text or annotations
- export-friendly rendering

### 4. Better report lifecycle features

A robust reporting system is not only about the DSL. It also needs operational capabilities such as:

- saved reports
- saved views and presets
- shareable report URLs
- export to CSV and PDF
- refresh intervals
- caching
- version history
- auditability
- usage analytics

### 5. Governance and enterprise controls

Serious deployments usually need:

- role-aware query exposure
- field-level access controls
- audit logs
- approval or review workflows
- policy checks on generated specs
- clear observability for generation, validation, and repair loops

### 6. Stronger semantic understanding before generation

This is likely the biggest functional gap.

The current system can recover from invalid DSL through validation and repair, which is valuable. But a robust reporting product should increasingly avoid bad guesses in the first place.

That means improving:

- query selection
- field matching
- synonym handling
- tenant-specific vocabulary
- ambiguity detection
- confidence scoring
- asking clarifying questions when needed

This is the layer that turns a valid report generator into a trustworthy reporting assistant.

## Roadmap

### V1.1 implementation status

All five V1.1 steps have been implemented by subagents:

| Step | Scope | Status |
|------|--------|--------|
| 1 | Richer filters: multiSelect, numericRange, required/defaultValue | Done |
| 2 | Data shaping: sort, limit, pagination metadata, table aggregations | Done |
| 3 | Widgets: lineChart, KPI format/currency/decimalPlaces, table config.sort | Done |
| 4 | Presets on spec; URL serialize/parse helpers in core | Done |
| 5 | Authoring: guide tables, examples, validation suggestions, repair hints | Done |

## V1.1 Must-Have

The goal of this phase is to make the system feel meaningfully more capable without breaking the simple, safe architecture.

### Priority outcomes

- Reports support more realistic filter behavior.
- Widgets support more practical data exploration.
- The generated specs represent more of what users expect from business reporting.

### Recommended scope

1. Add richer filters
   - multi-select
   - numeric range
   - dynamic options
   - required/default filter support

2. Add data shaping primitives to the DSL
   - sort
   - limit
   - pagination metadata
   - basic aggregations

3. Strengthen widgets
   - line chart
   - richer KPI formatting
   - widget-level sorting or ranking

4. Add report presets and shareable state
   - saved filter states
   - URL-backed filter state
   - named presets
   - **Implemented:** presets on spec, URL serialize/parse helpers in core.

5. Improve authoring guidance for agents
   - clearer DSL docs
   - more examples
   - stronger validation diagnostics
   - better repair hints

### Why this phase matters

This phase improves both perception and utility. It will make the system feel less like a toy without forcing a major architecture change.

## V1.2 Feels Enterprise

The goal of this phase is to make the system feel like a real reporting platform rather than a well-structured renderer.

### V1.2 implementation status

All five V1.2 steps have been implemented by subagents:

| Step | Scope | Status |
|------|--------|--------|
| 1 | Richer composition: sections, layoutOptions, widget width/height, tabs (tabs override sections) | Done |
| 2 | Advanced widgets: stackedBarChart, KPI trend sparkline, table drillDown (urlTemplate, paramKeys, target) | Done |
| 3 | Lifecycle: spec version & refreshInterval; serialize/parse spec; export CSV; Print/PDF; core README | Done |
| 4 | Governance: spec owner/author; ReportAuditEvent + onAudit in resolveReport; policy hook in validateReportSpec + MCP | Done |
| 5 | Observability: validate_report_spec trace (timestamp, specId, outcome, diagnosticCount, repairSuggestions, errorCodeSummary); build_report trace on success/error | Done |

### Priority outcomes

- Reports support richer composition and interaction.
- Teams can manage reports as assets, not just generated objects.
- The platform becomes more suitable for production operations.

### Recommended scope

1. Add richer report composition
   - sections
   - stronger layout rules
   - widget sizing hints
   - multi-page or tabbed reports

2. Add advanced widget capabilities
   - stacked charts
   - trend views
   - drill-down actions
   - click-through to source systems

3. Add stronger lifecycle and operations
   - save/load reports
   - export CSV/PDF
   - report versioning
   - refresh and caching controls

4. Add governance features
   - audit trail
   - report ownership
   - access-aware query catalogs
   - policy validation for unsafe or unsupported specs

5. Add observability
   - prompt/tool/validation traces
   - repair loop metrics
   - failure classification
   - authoring quality dashboards

### Why this phase matters

This is the phase where the product stops looking like "AI generates charts" and starts looking like a reporting platform teams could adopt with confidence.

## Later: Intelligence Layer and Premium Surface

The goal of this phase is not to hide the basics behind a paywall. The goal is to solve the hard semantic problems that appear in real customer environments.

### Core idea

The open foundation should remain fully useful. The premium or advanced layer should focus on improving understanding, governance, and operations at scale.

### Recommended scope

1. Tenant-specific semantic context
   - custom field understanding
   - business synonyms
   - alias management
   - field ranking and retrieval

2. Smarter intent handling
   - confidence scoring
   - ambiguity detection
   - clarifying questions before generation
   - guided fallback strategies

3. Admin tooling
   - curate query metadata
   - tune synonyms and mappings
   - review generated specs
   - inspect failures and repair loops

4. Governance and compliance
   - RBAC
   - policy controls
   - audit exports
   - enterprise approvals

5. Managed operational experience
   - hosted MCP services
   - observability dashboards
   - managed storage and evaluation pipelines

### Why this phase matters

This is where the biggest quality gains will likely come from in enterprise environments. Many teams do not mainly struggle with rendering. They struggle with ambiguity, tenant-specific naming, and trust in AI interpretation.

## Highest-impact next bets

If the goal is to make the system feel substantially more robust as quickly as possible, the best near-term bets are:

1. Multi-select plus dynamic filter options
2. Sorting, limit, pagination, and aggregation in the DSL
3. One stronger chart type plus drill-down
4. Saved report presets and shareable report state
5. Clarification workflows before DSL generation

Of these, clarification and semantic confidence may create more perceived quality than adding several more widget types.

## Current TODO focus

The next concrete TODO list is captured in [todo-reporting-enhancements.md](./todo-reporting-enhancements.md).

Priority items from that list:

- KPI aggregation for totals such as total budget spend
- Raw grouped summarization for object-style summaries like project milestones with latest completion date
- `cardView`
- `timelineView` / gantt-style scheduling
- Further specialized charts only where the semantics are clear and implementation cost stays low

## Product principle

The system should evolve from:

- "AI can generate a valid report spec"

to:

- "AI can reliably produce the right report for ambiguous, real-world business requests"

That shift should guide prioritization. Validation and repair are necessary, but long-term robustness comes from better intent understanding, clearer semantics, and stronger operational controls.
