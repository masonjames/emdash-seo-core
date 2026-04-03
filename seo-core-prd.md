---
title: "PRD: EmDash SEO Core"
status: draft
priority: P3
inspired_by: "The SEO Framework (subset-first)"
plugin_id: "seo-core"
package_name: "@emdash-cms/plugin-seo-core"
execution_mode: "Standard plugin, sandbox-compatible target"
---

# PRD: EmDash SEO Core

## Product summary

EmDash SEO Core provides a clean, EmDash-native metadata layer for titles, descriptions, canonicals, robots directives, social cards, and structured data. This is a **subset-first** product. It should focus on the metadata surfaces EmDash already supports cleanly, especially `page:metadata`.

This is not a full port of a WordPress SEO suite. It is the smallest product that meaningfully upgrades site metadata quality without inventing unsupported platform behavior.

## Problem

Publishers want stronger SEO defaults and easier metadata control, but the traditional WordPress pattern often bundles together too many concerns:

- metadata,
- XML sitemap,
- redirects,
- schema graph wizardry,
- post scoring,
- link management,
- crawl controls.

EmDash’s current plugin model cleanly supports metadata contributions. It does **not** justify forcing a sprawling all-in-one SEO plugin on day one.

## Goals

1. Provide reliable page metadata using EmDash’s `page:metadata` hook.
2. Centralize sitewide defaults for title patterns, descriptions, canonical rules, and robots.
3. Respect existing per-content SEO values where present.
4. Generate basic JSON-LD structured data for key page types.
5. Stay safe for sandboxed deployment and avoid browser script injection.

## Non-goals

- XML sitemap generation in MVP
- Redirect management
- Broken-link monitoring
- Keyword density scoring
- Content editor overlays
- Sitewide raw script injection

## Primary users

### Site owners
They want sane SEO defaults without a giant plugin suite.

### Editors
They want page metadata that usually works by default and can still be overridden per page in core fields.

### Theme developers
They want a metadata plugin that plugs into EmDash head rendering instead of fighting it.

## Key user stories

1. As a site owner, I can define global title and description defaults.
2. As an editor, I can rely on per-page metadata when it exists and fallback logic when it does not.
3. As a reader or crawler, I receive canonical, OG, and structured-data signals consistently.
4. As a technical team, I can enable the plugin without exposing public routes.
5. As a platform team, I can publish a smaller, safer SEO product before taking on sitemap or redirects.

## MVP scope

### In scope

- title pattern settings
- description fallback settings
- canonical handling
- robots defaults
- Open Graph and related social metadata
- JSON-LD for:
  - WebSite
  - Organization or Person
  - Article or BlogPosting where page context supports it
- optional private preview page or diagnostics in a later milestone, not required for launch

### Out of scope

- XML sitemap
- redirects
- indexation reports
- keyword scoring
- link assistant features
- page-fragment script injection

## Functional requirements

### Metadata generation

The plugin must contribute typed metadata through `page:metadata`, including:

- meta tags by `name`
- meta tags by `property`
- canonical and alternate links when appropriate
- JSON-LD graphs

### Fallback logic

The plugin must follow a clear order of precedence:

1. page-specific values already present in the page context
2. plugin-level settings and patterns
3. reasonable last-resort fallbacks such as page title or site name

### Settings

Admins must be able to configure:

- site title pattern
- separator
- homepage title override
- homepage description override
- default robots policy
- organization/person identity data
- OG image fallback

### Theme integration

The plugin depends on the site rendering EmDash’s head contribution components. That dependency must be documented clearly.

## UX and integration model

This is a configuration-first plugin.

The best v1 experience is:

- enable plugin,
- configure defaults,
- let core content SEO fields remain the per-page override layer,
- let the plugin fill in gaps and structured data.

That keeps the product aligned with EmDash instead of competing with core SEO fields.

## Technical approach for EmDash

### Plugin surfaces

- `admin.settingsSchema`
- `page:metadata`
- optional admin page later for diagnostics

### Capabilities

No additional capability should be required for the metadata MVP if the page event already contains the needed page context.

If diagnostics are added later, `read:content` may become necessary.

### Storage

No storage required for v1 metadata behavior.

### Routes

No public routes in v1.
Private admin routes are optional for future diagnostics, not required for launch.

### Settings

- `settings:titlePattern`
- `settings:separator`
- `settings:homepageTitle`
- `settings:homepageDescription`
- `settings:defaultRobots`
- `settings:organizationName`
- `settings:organizationLogo`
- `settings:defaultOgImage`

### Metadata contribution strategy

Use stable dedupe keys and IDs so the plugin plays well with core metadata collectors and future theme-level contributions.

## Success metrics

- Canonical and OG metadata render consistently on content pages.
- Structured data is present for supported page types.
- Teams can use the plugin without opening any public endpoints.
- The feature set remains intentionally small and shippable.

## Risks and mitigations

### Risk: teams expect “full SEO suite” behavior
Mitigation: position the product explicitly as SEO Core.

### Risk: metadata collisions with theme or core output
Mitigation: define strict precedence and keying rules.

### Risk: missing head contribution components in themes
Mitigation: publish integration docs and a validation checklist.

## Milestones

1. Define settings and fallback precedence.
2. Implement page-metadata contributions.
3. Add JSON-LD support for core page types.
4. QA against content pages, homepages, and custom pages.
5. Publish docs and validation recipes.

## Acceptance criteria

- The plugin can generate metadata using `page:metadata`.
- Canonical, robots, OG, and JSON-LD outputs are supported.
- The plugin launches without public routes.
- The MVP does not depend on `page:fragments` or browser script injection.

## Open questions

1. Should diagnostics be part of the first release or v1.1?
2. Is XML sitemap better as a separate plugin so SEO Core stays small?
3. Should the plugin expose preview utilities for editors later, or rely on existing preview flows?
