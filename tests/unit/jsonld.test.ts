import { describe, expect, it } from "vitest";

import { buildSeoCorePrimaryGraph } from "../../src/jsonld.js";
import { createPageContext, createSettings } from "../test-utils.js";

describe("buildSeoCorePrimaryGraph", () => {
	it("builds a website graph with publisher identity for non-article pages", () => {
		const page = createPageContext({
			url: "https://example.com/",
			path: "/",
			kind: "custom",
			pageType: "website",
			title: "Homepage",
			description: null,
			canonical: null,
			image: null,
			content: undefined,
			articleMeta: undefined,
		});

		const graph = buildSeoCorePrimaryGraph(page, createSettings());
		expect(graph).not.toBeNull();
		const nodes = ((graph as { "@graph": Array<Record<string, unknown>> })["@graph"]);
		expect(nodes.map((node) => node["@type"])).toEqual([
			"WebSite",
			"Organization",
			"WebPage",
		]);
		expect(nodes[0]?.name).toBe("Example Site");
		expect(nodes[1]?.sameAs).toEqual(["https://twitter.com/example"]);
	});

	it("builds a blog posting graph with stable node ids", () => {
		const page = createPageContext({
			canonical: null,
			image: null,
			seo: {
				ogTitle: "Custom OG Title",
				ogDescription: null,
				ogImage: null,
				robots: null,
			},
		});

		const graph = buildSeoCorePrimaryGraph(page, createSettings());
		expect(graph).not.toBeNull();
		const nodes = ((graph as { "@graph": Array<Record<string, unknown>> })["@graph"]);
		const article = nodes.find((node) => node["@type"] === "BlogPosting");
		expect(article).toMatchObject({
			"@id": "https://example.com/posts/hello-world#article",
			headline: "Custom OG Title",
			url: "https://example.com/posts/hello-world",
			publisher: { "@id": "https://example.com#publisher" },
			mainEntityOfPage: { "@id": "https://example.com/posts/hello-world#webpage" },
		});
	});

	it("omits logo when the publisher is a person", () => {
		const graph = buildSeoCorePrimaryGraph(
			createPageContext({
				url: "https://example.com/",
				path: "/",
				kind: "custom",
				pageType: "website",
				content: undefined,
				articleMeta: undefined,
			}),
			createSettings({
				publisherType: "person",
				publisherLogoUrl: "https://cdn.example.com/logo.png",
			}),
		);

		const nodes = ((graph as { "@graph": Array<Record<string, unknown>> })["@graph"]);
		const publisher = nodes.find((node) => node["@type"] === "Person");
		expect(publisher?.logo).toBeUndefined();
	});

	it("returns null for non-article pages with no site or publisher identity", () => {
		const graph = buildSeoCorePrimaryGraph(
			createPageContext({
				url: "https://example.com/about",
				path: "/about",
				kind: "custom",
				pageType: "website",
				siteName: undefined,
				content: undefined,
				articleMeta: undefined,
			}),
			createSettings({
				publisherName: null,
				publisherLogoUrl: null,
				publisherSameAs: [],
			}),
		);

		expect(graph).toBeNull();
	});
});
