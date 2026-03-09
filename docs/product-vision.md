# Product Vision and Business Model

## Why this project exists

`reporting` exists to make application reporting easier to build, safer to evolve, and much easier for AI systems to understand.

The core idea is simple:

- reports should be defined as structured data, not hand-written UI code
- the rendering layer should stay predictable and safe
- the data layer should stay pluggable
- AI should help build reports, but only within a clear contract

We believe teams should be able to use this project without buying a hosted product, without giving up control of their data, and without being forced into a single vendor workflow.

## What we want to build

We want to build an open reporting framework with a strong AI-native contract.

That means:

- an open `ReportSpec` DSL
- an open validation and resolution engine
- an open rendering layer
- an open MCP surface for report generation and validation
- extension points for real-world systems such as 3rd party platforms, internal APIs, SQL-backed apps, and custom business data

Over time, we also want the ecosystem around the framework to become smarter about tenant-specific meaning:

- which query a user likely meant
- which custom field matches a business phrase
- which filter or widget is appropriate in context
- when the AI should ask a clarifying question instead of guessing

## The challenge we are solving

In simple demos, a query catalog may be small and obvious.

In real systems, especially in enterprise-grade tools and business platforms, the hard part is not rendering a chart or validating JSON. The hard part is understanding a messy and evolving query layer:

- many custom forms
- many custom fields
- overlapping business terminology
- tenant-specific naming conventions
- ambiguous user requests

This is where a basic "generate JSON and validate it" flow starts to break down.

That is why our direction is not only "build an MCP server." Our direction is to make it possible to build a strong context layer around reporting, while keeping the core framework open.

## Open source first

The open source version should be genuinely useful on its own.

We do not want an "open core" model where the public project feels intentionally incomplete. The foundation should remain production-capable and self-hostable.

The open source layer should include:

- the `ReportSpec` contract
- core validation
- report resolution primitives
- UI rendering packages
- basic MCP support
- examples and starter integrations
- the ability to supply your own query metadata and reporting context
- the ability to build and host your own custom MCP layer if you want full control

If a team wants to run everything themselves, that should be possible.

## Why a commercial product can still make sense

The commercial opportunity is not "pay us to use the spec."

The commercial opportunity is helping customers improve how AI understands their reporting domain.

Many teams do not struggle with the renderer. They struggle with semantic understanding:

- mapping natural language to tenant-specific queries
- resolving ambiguous custom field references
- learning business synonyms and internal vocabulary
- ranking the most likely interpretation of a request
- using examples, metadata, and feedback to improve generation quality over time

That is a real product surface, and it creates value without taking away the open foundation.

We want that context story to stay portable across OSS, self-hosted, and premium usage. Teams should be able to provide structured reporting context to the system in a clean, reusable way, rather than depending on transport-specific integration details.

## Business model

The business model we currently believe in is:

1. Keep the framework, DSL, and core MCP story open.
2. Offer optional premium products that improve setup, quality, governance, and operations.
3. Let advanced teams self-host or replace any layer if they prefer.

In practice, that points to a hybrid model:

- built-in core MCP plus optional custom host MCP
- self-hosted OSS path plus optional managed cloud path
- open contracts plus premium intelligence and tooling

## What could be premium

The premium layer should focus on customer outcomes, not artificial restrictions.

Examples of premium value:

- a managed context layer for tenant-specific query understanding
- tools for curating synonyms, aliases, custom fields, and query metadata
- retrieval and ranking pipelines that improve field and query matching
- confidence scoring and disambiguation workflows
- admin tooling for tuning how AI interprets reporting requests
- hosted MCP services that expose these richer capabilities through a stable interface
- observability for prompts, tool calls, validation failures, and repair loops
- enterprise governance such as RBAC, audit trails, and policy controls

This is similar in spirit to the relationship between an open framework and an optional hosted platform:

- you can adopt the framework without the hosted offering
- the hosted offering makes hard problems easier, especially at scale

## What should never feel locked away

To keep community trust, some things should remain clearly open:

- the report DSL and schema
- validation rules
- local rendering and report execution primitives
- the basic MCP contract
- extension hooks for custom integrations
- the ability to bring your own storage, retrieval, or inference stack

The premium offering should compete on convenience, intelligence, and operational quality, not on withholding the basics.

## Product direction

Our current preferred direction is:

### 1. Strong open foundation

Keep the reporting runtime, spec, validation, and baseline MCP story open and well documented.

### 2. Hybrid MCP model

Ship a built-in core MCP layer that works out of the box, while allowing applications to supply reporting context and add their own host-specific tools where needed.

### 3. Premium context intelligence

Invest in a premium layer that helps customers teach the system what their query model means in practice, especially when custom fields and tenant-specific vocabulary make naive prompting unreliable.

### 4. Respect for self-hosting

Make sure teams can still build that intelligence layer themselves if they want to own the entire stack.

## What success looks like

If we do this well:

- open source users get a practical reporting framework they can trust
- simple systems stay easy to integrate because they can start with lightweight reporting context and grow from there
- contributors understand the architecture and can extend it without guessing the product strategy
- customers with hard enterprise data problems have a clear reason to pay
- premium features improve outcomes rather than gatekeep essentials

## What we want from the community

We welcome feedback, criticism, and contributions on:

- the `ReportSpec` contract
- MCP tool design
- validation behavior
- integration patterns
- developer experience for self-hosted deployments
- ideas for representing query metadata, semantic hints, and reporting context cleanly

We especially want to avoid a split where the open source project becomes a demo for a closed platform. The long-term goal is a healthy ecosystem: open standards and core runtime, with optional managed products built on top.

## Short version

This project is intended to be:

- open at the core
- extensible in real deployments
- AI-friendly by design
- self-hostable when needed
- commercially sustainable through optional intelligence, hosting, and enterprise tooling

That balance is the direction we want to preserve.
