# SEO Core for EmDash

SEO Core is a subset-first SEO plugin for [EmDash CMS](https://github.com/emdash-cms/emdash). It enhances EmDash’s built-in metadata pipeline instead of replacing it, giving you stronger defaults for canonicals, robots, social cards, and JSON-LD while preserving page-specific SEO values from core.

Inspired by the best day-one wins from Rank Math and The SEO Framework, this plugin focuses on the metadata surfaces EmDash supports cleanly today.

## What it does

- Adds fallback canonical URLs when a page-specific canonical is missing
- Applies a sitewide default robots policy when a page doesn’t define one
- Adds a homepage description fallback
- Adds a default Open Graph/Twitter image fallback
- Replaces the default `primary` JSON-LD graph with a richer WebSite / WebPage / BlogPosting graph
- Supports publisher identity as an `Organization` or `Person`
- Provides a private admin settings page at `/_emdash/admin/plugins/seo-core/settings`

## What it deliberately does not do in v1

- Control HTML `<title>` tags
- Generate XML sitemaps
- Manage redirects or 404 monitoring
- Add keyword scoring, editor overlays, or link assistant features
- Inject browser scripts with `page:fragments`

## Installation

```bash
pnpm add emdash-seo-core
```

> Requires `emdash` `^0.1.0` in the host site.

Then register the plugin in your EmDash config:

```ts
import seoCore from "emdash-seo-core";

emdash({
	plugins: [seoCore()],
});
```

## Theme integration requirements

SEO Core depends on your theme rendering EmDash’s metadata pipeline.

At minimum, your layout should build a page context and render `EmDashHead` inside `<head>`:

```astro
---
import { EmDashHead } from "emdash/ui";
import { createPublicPageContext } from "emdash/page";

const page = createPublicPageContext({
	Astro,
	kind: "content",
	title: post.data.title,
	description: post.data.description,
	canonical: post.data.canonical,
	image: post.data.image,
	content: {
		collection: "posts",
		id: post.id,
		slug: post.slug,
	},
	siteName: site.title,
	articleMeta: {
		publishedTime: post.data.publishedAt,
		modifiedTime: post.data.updatedAt,
		author: post.data.author,
	},
});
---

<head>
	<title>{post.data.title}</title>
	<EmDashHead page={page} />
</head>
```

### Important limitation

SEO Core v1 does **not** own the `<title>` tag. Keep title generation in your theme/core layer for now.

## Settings

SEO Core stores one normalized settings object under plugin KV and exposes a configuration-first admin page.

Current settings:

- Homepage Description
- Default Robots Policy (`index,follow`, `noindex,follow`, `noindex,nofollow`)
- Fallback Open Graph Image URL
- Publisher is a person toggle
- Publisher Name
- Publisher Logo URL
- Publisher `sameAs` URLs

## Precedence rules

SEO Core is designed to work alongside EmDash’s built-in SEO behavior.

1. Page-specific values from the page context win
2. SEO Core fills supported gaps with plugin settings
3. Final metadata is deduped by EmDash’s first-wins resolver

That means the plugin augments core instead of fighting it.

## Production notes

- No public plugin routes are required for runtime metadata behavior
- The admin page is private
- The plugin is sandbox-compatible in design because it only uses `page:metadata`, KV, and a private route
- The JSON-LD graph uses stable node IDs so it can replace EmDash’s default `primary` graph cleanly

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm test:dist
```

Typechecking and tests run against the real published `emdash` package, and `pnpm test:dist` verifies the built package exports (`.` and `./sandbox`).
## License

MIT
