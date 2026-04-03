import { describe, expect, it } from "vitest";

import { buildSeoCoreContributions } from "../../src/metadata.js";
import { createPageContext, createSettings } from "../test-utils.js";

describe("SEO Core compatibility with EmDash metadata resolution", () => {
	it("overrides core gaps with plugin defaults via first-wins dedupe", async () => {
		const { generateBaseSeoContributions, resolvePageMetadata } = await import("emdash/page");
		const page = createPageContext({
			url: "https://example.com/?utm_source=test#hero",
			path: "/",
			kind: "custom",
			pageType: "website",
			description: null,
			canonical: null,
			image: null,
			content: undefined,
			articleMeta: undefined,
			seo: {
				ogTitle: null,
				ogDescription: null,
				ogImage: null,
				robots: null,
			},
		});

		const pluginContributions = buildSeoCoreContributions(page, createSettings());
		const baseContributions = generateBaseSeoContributions(page);
		const resolved = resolvePageMetadata([...pluginContributions, ...baseContributions]);

		expect(resolved.meta).toEqual(
			expect.arrayContaining([
				{ name: "description", content: "The best example homepage description." },
				{ name: "robots", content: "index,follow" },
				{ name: "twitter:card", content: "summary_large_image" },
			]),
		);
		expect(resolved.properties).toEqual(
			expect.arrayContaining([
				{ property: "og:image", content: "https://cdn.example.com/default-og.jpg" },
				{ property: "og:url", content: "https://example.com/" },
			]),
		);
		expect(resolved.links).toEqual([{ rel: "canonical", href: "https://example.com/" }]);
		expect(resolved.jsonld).toHaveLength(1);
		expect(JSON.parse(resolved.jsonld[0]!.json)).toHaveProperty("@graph");
	});

	it("yields to page-specific metadata when core already has the value", async () => {
		const { generateBaseSeoContributions, resolvePageMetadata } = await import("emdash/page");
		const page = createPageContext({
			seo: {
				ogTitle: "Custom OG Title",
				ogDescription: "Custom OG Description",
				ogImage: "https://cdn.example.com/custom-og.jpg",
				robots: "noindex,follow",
			},
		});

		const pluginContributions = buildSeoCoreContributions(page, createSettings());
		const baseContributions = generateBaseSeoContributions(page);
		const resolved = resolvePageMetadata([...pluginContributions, ...baseContributions]);

		expect(resolved.meta).toEqual(
			expect.arrayContaining([
				{ name: "description", content: "A hello world article." },
				{ name: "robots", content: "noindex,follow" },
				{ name: "twitter:card", content: "summary_large_image" },
			]),
		);
		expect(resolved.properties).toEqual(
			expect.arrayContaining([
				{ property: "og:image", content: "https://cdn.example.com/custom-og.jpg" },
				{ property: "og:url", content: "https://example.com/posts/hello-world" },
			]),
		);
		expect(resolved.links).toEqual([{ rel: "canonical", href: "https://example.com/posts/hello-world" }]);
		expect(resolved.jsonld).toHaveLength(1);
		expect(JSON.parse(resolved.jsonld[0]!.json)).toHaveProperty("@graph");
	});
});
