import { describe, expect, it } from "vitest";

import { buildSeoCoreContributions } from "../../src/metadata.js";
import { createPageContext, createSettings } from "../test-utils.js";

describe("buildSeoCoreContributions", () => {
	it("fills homepage metadata gaps with plugin defaults", () => {
		const contributions = buildSeoCoreContributions(
			createPageContext({
				url: "https://example.com/?utm_source=test#top",
				path: "/",
				kind: "custom",
				pageType: "website",
				description: null,
				canonical: null,
				image: null,
				siteName: undefined,
				content: undefined,
				articleMeta: undefined,
				seo: {
					ogTitle: null,
					ogDescription: null,
					ogImage: null,
					robots: null,
				},
			}),
			createSettings({
				publisherName: "EmDash Example",
			}),
		);

		expect(contributions).toEqual(
			expect.arrayContaining([
				{ kind: "meta", name: "description", content: "The best example homepage description." },
				{ kind: "property", property: "og:description", content: "The best example homepage description." },
				{ kind: "meta", name: "twitter:description", content: "The best example homepage description." },
				{ kind: "meta", name: "robots", content: "index,follow" },
				{ kind: "link", rel: "canonical", href: "https://example.com/" },
				{ kind: "property", property: "og:url", content: "https://example.com/" },
				{ kind: "property", property: "og:image", content: "https://cdn.example.com/default-og.jpg" },
				{ kind: "meta", name: "twitter:image", content: "https://cdn.example.com/default-og.jpg" },
				{ kind: "meta", name: "twitter:card", content: "summary_large_image" },
				{ kind: "property", property: "og:site_name", content: "EmDash Example" },
				{ kind: "jsonld", id: "primary", graph: expect.any(Object) },
			]),
		);
	});

	it("does not override page-specific social descriptions", () => {
		const contributions = buildSeoCoreContributions(
			createPageContext({
				url: "https://example.com/",
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
					ogDescription: "Already curated for social",
					ogImage: null,
					robots: null,
				},
			}),
			createSettings(),
		);

		expect(contributions).toContainEqual({
			kind: "meta",
			name: "description",
			content: "The best example homepage description.",
		});
		expect(contributions).not.toContainEqual({
			kind: "property",
			property: "og:description",
			content: "The best example homepage description.",
		});
		expect(contributions).not.toContainEqual({
			kind: "meta",
			name: "twitter:description",
			content: "The best example homepage description.",
		});
	});

	it("limits itself to primary JSON-LD when page-specific metadata already exists", () => {
		const contributions = buildSeoCoreContributions(
			createPageContext({
				seo: {
					ogTitle: "Custom OG Title",
					ogDescription: "Custom OG Description",
					ogImage: "https://cdn.example.com/custom-og.jpg",
					robots: "noindex,follow",
				},
			}),
			createSettings(),
		);

		expect(contributions).toEqual([{ kind: "jsonld", id: "primary", graph: expect.any(Object) }]);
	});
});
