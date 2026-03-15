# Reporting TODOs

This document captures the next reporting enhancements to prioritize.
The goal is to turn the current high-level asks into implementation-ready guidance for the next iteration.

## 1. External chart library support

### Goal

Enable chart customization by supporting embeddable chart integrations from external libraries in addition to the current native chart components.

### Problem to solve

Today the reporting system is primarily opinionated around native chart renderers. That works for built-in scenarios, but it limits teams that already use other charting ecosystems or need chart types, theming, interactions, and rendering behavior not covered by the native set.

### Desired outcome  

- A host application should be able to keep the reporting DSL/spec and engine contract, while swapping chart rendering to another chart library.
- Integrators should be able to use either:
  - the built-in/native chart renderers, or
  - custom renderers backed by another chart library.
- The integration should not require forking the core reporting packages.

### Requirements

- Define an extension point for chart widgets at the component registry / renderer layer.
- Make chart renderer resolution explicit so hosts can override per widget type.
- Support partial override models:
  - override one chart type only,
  - override all chart types,
  - mix native and custom chart implementations in the same report.
- Preserve the current data contract for existing chart widgets unless there is a strong compatibility reason to evolve it.
- Document the minimum renderer interface required for third-party chart adapters.
- Make sure custom chart renderers can receive:
  - normalized widget data,
  - layout constraints,
  - theme information,
  - optional interaction callbacks if applicable.

### Design considerations

- Prefer adapter-style architecture over hard-coding a specific chart vendor.
- Avoid coupling report specs directly to a particular chart library API.
- Keep native renderers as the default path so existing consumers do not break.
- Consider whether some widgets need a generic "customChart" escape hatch in addition to per-type overrides.

### Open questions for implementation

- Should external chart support be registry-only, spec-driven, or both?
- Do we want vendor-specific adapters to live in the main repo or in separate packages?
- Should theming tokens be passed as raw tokens, CSS variables, or a typed theme object?
- Do we need event hooks for click, hover, select, drill-down, or brush/zoom behaviors?

### Suggested implementation breakdown

1. Audit the current chart rendering path and identify all hard-coded native assumptions.
2. Define a stable chart renderer contract and registry override API.
3. Refactor one or two chart types as a reference implementation for custom override support.
4. Validate that native renderers still work unchanged.
5. Add documentation and at least one example adapter using an external chart library.

## 2. DLS customization and extensibility

### Goal

Enable DLS customization so integrators can introduce capabilities such as reordering, editing, and contextual actions when needed. The goal is to make the DLS customizable and extension-ready, with component-level seams that are also easy to customize.

### Problem to solve

The current DLS appears optimized for fixed/default behavior. Enterprise integrations often need richer interaction patterns, alternative component behavior, and domain-specific actions that cannot be anticipated in the base implementation.

### Desired outcome

- Integrators should be able to extend the DLS without patching internal source code.
- Custom behaviors should feel first-class rather than like fragile workarounds.
- Component customization should be composable and discoverable.

### Requirements

- Identify the core DLS surfaces that should be customizable:
  - layout containers,
  - widget wrappers,
  - tables/cards/charts,
  - toolbar/actions areas,
  - empty/loading/error states.
- Introduce extension points for interactive capabilities such as:
  - reordering,
  - inline editing,
  - contextual actions,
  - custom menus,
  - domain-specific affordances.
- Support component replacement and component augmentation patterns.
- Make customization possible at multiple levels:
  - global/system-wide,
  - report-level,
  - widget-level where appropriate.
- Provide a clear contract for passing custom props, handlers, and metadata into customized components.
- Ensure the default experience remains simple for consumers that do not need customization.

### Design considerations

- Keep the extension model predictable and typed.
- Prefer explicit slots/hooks/registry patterns over ad hoc prop drilling.
- Avoid exposing too many unstable internal details.
- Think through how customization interacts with accessibility, keyboard behavior, and responsive layout.

### Open questions for implementation

- What exactly does "DLS" cover in this repo today: just visual components, layout orchestration, or interaction patterns too?
- Should customization rely on slots, render props, registry overrides, plugin hooks, or a combination?
- Which actions belong in the engine/spec layer versus the renderer/UI layer?
- How should custom actions be declared so they remain testable and serializable when needed?

### Suggested implementation breakdown

1. Map the current DLS architecture and identify stable versus unstable extension seams.
2. Define a customization model for replacing or augmenting core DLS components.
3. Add one concrete extensibility scenario, such as contextual row actions or drag reordering.
4. Verify that default consumers do not pay extra complexity for advanced customization support.
5. Document extension recipes for common enterprise use cases.

## 3. Enterprise renderer, template, theme, and branding support

### Goal

Ensure enterprise consumers can extend the platform with the capabilities they need and fully use their own renderers or templates to control color, theme, and overall presentation.

### Problem to solve

Even if the system becomes technically extensible, enterprise adoption will still be limited if teams cannot align reports with their existing brand systems, design tokens, component libraries, and internal UX expectations.

### Desired outcome

- Enterprise consumers should be able to apply their own visual language without rewriting the reporting engine.
- Reports should feel native inside the host product.
- The platform should support both light-touch branding and deep renderer replacement.

### Requirements

- Support theme customization for:
  - colors,
  - typography,
  - spacing,
  - borders/radius,
  - density,
  - state styling.
- Support template or renderer overrides for key report surfaces.
- Make it possible to use enterprise-owned renderers for widgets while preserving the reporting spec contract.
- Define how custom themes and renderers are registered and propagated through the report tree.
- Ensure host teams can customize:
  - color systems,
  - widget chrome,
  - layout framing,
  - empty states,
  - interaction affordances.
- Provide examples for integrating with an existing enterprise design system.

### Design considerations

- Separate data/behavior concerns from presentation concerns.
- Prefer tokenized theming rather than scattered one-off style overrides.
- Keep branding support compatible with the customization/extensibility work above rather than designing it as a parallel system.
- Consider whether templates should be declarative, component-driven, or both.

### Open questions for implementation

- Do we want one unified extension system for renderers, templates, and theming, or separate systems with a shared registration model?
- Should theming be package-agnostic or tightly integrated with the React UI package?
- What is the minimum viable theming API that still supports enterprise-grade branding?
- How do we ensure custom templates do not drift from accessibility and layout guarantees?

### Suggested implementation breakdown

1. Define the theming/token contract and how it reaches renderers.
2. Identify which surfaces are templateable versus fully replaceable.
3. Implement one end-to-end branded example using custom theme tokens and at least one overridden renderer.
4. Add developer documentation for enterprise integration patterns.

## 4. Premium offering foundation with playground-first agent workflow

### Goal

Start building the premium offering by creating a playground and premium agent workflow that lets teams conversationally add, test, tune, and approve reporting agents before release.

### Problem to solve

The repo is moving toward skills plus agent-kit as the primary app integration path, but there is not yet a premium-ready workflow for safely configuring and evaluating an agent in a controlled environment before it ships to end users.

### Desired outcome

- Teams should be able to open a playground, chat with a reporting agent, and iteratively improve its behavior.
- The premium offering should provide a clear path from prototype to release-ready agent configuration.
- Agent behavior, tools, prompts, and reporting context should be adjustable in the playground without requiring ad hoc code changes for every experiment.

### Requirements

- Create a premium offering roadmap that starts with a dedicated playground experience.
- Support conversational agent setup so a user can add or configure the premium reporting agent from within the playground.
- Make it possible to test agent behavior against realistic reporting context, query metadata, and live or representative data.
- Allow prompt, skill, tool, and runtime-note adjustments before release.
- Capture validation feedback, tool traces, and report-generation outcomes so agent quality can be reviewed.
- Define a release gate so agent changes can be promoted from playground testing to production only after review.

### Design considerations

- The playground should reflect the real host integration as closely as possible so test results are meaningful.
- Prefer configuration-driven agent composition over one-off hard-coded experiments.
- Keep the premium workflow compatible with the open reporting core and agent-kit architecture.
- Treat observability, approval flow, and rollback as first-class parts of the premium story.

### Open questions for implementation

- Should the playground live inside Storybook, a dedicated app, or both?
- What parts of the premium agent should be configurable by product users versus developers?
- How should we version prompts, skills, and tool bundles so a tested agent can be released predictably?
- What metrics or review checklist determine that an agent is ready for release?

### Suggested implementation breakdown

1. Define the premium offering thin slice, starting with a reporting-agent playground.
2. Build the playground flow for conversationally creating or updating the premium reporting agent.
3. Add controls for editing prompts, skills, tools, and reporting context and immediately retesting them.
4. Record validation results, traces, and qualitative notes to support agent tuning.
5. Add a promotion workflow so a reviewed playground configuration can be marked release-ready.

## Cross-cutting implementation guidance

### Principles

- Backward compatibility should be preserved for existing report specs and default renderers.
- Extension points should be typed, documented, and intentionally limited.
- Avoid vendor lock-in.
- Prefer composition over forking.
- Keep the default path simple and the advanced path powerful.

### Non-goals

- Do not redesign the reporting DSL unless required to unlock the extensibility model.
- Do not hard-code support for a single third-party charting vendor as the only customization strategy.
- Do not introduce enterprise-only behavior that makes the default open path harder to maintain.

### Deliverables expected from the implementation agent

- A proposed extension architecture covering charts, DLS components, and theming/renderers.
- Code changes implementing the first thin slice of that architecture.
- Updated documentation explaining how hosts customize the system.
- At least one example demonstrating external chart integration and one example demonstrating DLS or renderer customization.
- Tests covering backward compatibility and the new extension points.

### Recommended execution order

1. Start by defining the extension architecture and contracts.
2. Implement the chart renderer override path first, since it is the clearest and most isolated customization need.
3. Build DLS/component extensibility on the same extension model where possible.
4. Layer theming/template support on top so the final system feels unified rather than fragmented.
