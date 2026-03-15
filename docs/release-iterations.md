# Release Iterations

## Goal

Ship this project in a way that matches its real differentiator: AI integrability.

The current DSL and engine are a strong foundation, but the default renderer story is not yet compelling enough to be the main adoption hook. That means we should avoid presenting the project as a finished reporting UI platform too early.

Instead, each release should make the project more useful while keeping expectations honest:

- engine and agentic pieces are `beta`
- breaking changes are acceptable during this phase
- the default UI is a reference surface, not the final destination
- customization and integration matter more than polished built-in rendering

## Release Thesis

We should not optimize for a single "big reveal" where everything is launched at once.

We should also not lead with a DSL-only release that asks users to adopt the hardest and least differentiated part of the system first.

The better path is staged:

1. make the core open source foundation safe to publish
2. make the agentic direction explicit
3. build the playground and integration surface
4. improve customization and renderer hooks
5. only then harden the default reporting UX as a stronger product surface

## Iteration 0: Beta Foundation

### Objective

Prepare the repo and messaging so the project can be shared publicly without implying stability that does not yet exist.

### Deliverables

- add explicit `beta` messaging across engine and agentic packages
- update README and docs to set expectations around breaking changes
- define contribution and review rules for the open source repo
- define branch protection, CI expectations, and release process
- make it clear which packages are experimental vs more stable

### Exit criteria

- a new visitor can understand what is usable today and what is still evolving
- contributors cannot treat the repo like an ungoverned code dump
- releases can happen through a repeatable process

### Notes

This iteration is about trust, not features. It keeps us from overpromising.

## Iteration 1: Publish the Core as a Beta Engine

### Objective

Release the DSL, validation, engine, and baseline rendering as an open foundation, but position it as infrastructure rather than a polished reporting product.

### Deliverables

- document the DSL clearly enough for early adopters and contributors
- provide a minimal website or docs entry point
- include examples that show end-to-end report definition and rendering
- document extension points for custom data providers and custom renderers
- document what is intentionally missing from the default UI

### Exit criteria

- users can understand the `ReportSpec` model without reading the source
- a technical adopter can build a simple integration from docs and examples
- the public story is "open reporting engine in beta", not "production-ready reporting platform"

### What not to do

- do not overinvest in making the default renderer feel enterprise-ready
- do not market the UI as the main reason to adopt the project

## Iteration 2: Agentic Playground

### Objective

Build the playground that lets us improve authoring, prompting, repair, and integration workflows in a tight feedback loop.

### Why this matters

This is likely the most important iteration. Without the playground, we are guessing at how people will actually use the AI side of the system.

### Deliverables

- a playground for generating and refining reports with AI
- visibility into prompts, validation failures, repair loops, and outputs
- a workflow for testing query metadata, synonyms, and semantic hints
- a clear path for trying custom integrations locally
- enough UX to make agent behavior observable and debuggable

### Exit criteria

- we can iteratively improve the agentic flow based on real interaction
- contributors can test AI behavior without setting up a full app
- the project has a clear "AI-native reporting" story

### What not to do

- do not wait for perfect UI polish before shipping the playground
- do not attempt full enterprise robustness here

## Iteration 3: Customization and Integration Surface

### Objective

Make the project easy to adopt as an AI reporting component, even if teams do not want to use the built-in renderer as-is.

### Deliverables

- stable hooks for custom renderers
- stronger integration APIs and adapter examples
- documentation for plugging in tenant-specific query catalogs and metadata
- clear extension points for teams building their own DSL layer on top
- guidance for replacing or bypassing the default UI

### Exit criteria

- a team can adopt the agentic infrastructure without committing to our UI
- customization feels like a first-class workflow, not a workaround
- the project supports "bring your own renderer" and "build your own reporting UX"

### Why this matters

This iteration aligns the product with the likely adoption path: teams may want our engine and agentic layer more than our default interface.

## Iteration 4: Harden the Default Experience

### Objective

Improve the built-in renderers and reporting UI enough that the open source project becomes attractive both as infrastructure and as a usable default experience.

### Deliverables

- better visual quality and UX of built-in renderers
- stronger customization controls in the UI layer
- improved docs for production usage patterns
- examples that demonstrate credible real-world report experiences
- cleanup of rough edges discovered through earlier integrations

### Exit criteria

- the default UI no longer feels like a weak point in demos
- users can choose between using the defaults or replacing them
- the project feels cohesive, not like disconnected building blocks

### Notes

This should come after the agentic and integration story is validated, not before.

## Iteration 5: Production Readiness Push

### Objective

Decide which parts are ready to move from beta positioning toward stronger stability guarantees.

### Deliverables

- identify which packages can lose the `beta` label first
- tighten compatibility expectations and migration guidance
- improve test coverage around public extension points
- document supported production deployment patterns
- formalize release notes and upgrade policy

### Exit criteria

- there is a credible answer to "what can I safely use in production?"
- stability guarantees are tied to evidence, not optimism

## Suggested Order of Work

If we want to stay aligned with the actual differentiator, the recommended order is:

1. Iteration 0: Beta Foundation
2. Iteration 1: Publish the Core as a Beta Engine
3. Iteration 2: Agentic Playground
4. Iteration 3: Customization and Integration Surface
5. Iteration 4: Harden the Default Experience
6. Iteration 5: Production Readiness Push

## Strategic Rule

Whenever there is a tradeoff between:

- making the default UI more polished
- making AI integration, customization, and extension easier

prefer the second one until the playground and integration surface are strong.

That is where the project is most differentiated, and that is the layer most likely to teach us what the long-term product should become.
