import type { KVAccess, PluginContext, PublicPageContext } from "emdash";

import type { SeoCoreSettings } from "../src/types.js";

export class MemoryKV implements KVAccess {
	private readonly store = new Map<string, unknown>();

	constructor(seed?: Record<string, unknown>) {
		if (!seed) return;
		for (const [key, value] of Object.entries(seed)) {
			this.store.set(key, value);
		}
	}

	async get<T>(key: string): Promise<T | null> {
		return (this.store.get(key) as T | undefined) ?? null;
	}

	async set(key: string, value: unknown): Promise<void> {
		this.store.set(key, value);
	}

	async delete(key: string): Promise<boolean> {
		return this.store.delete(key);
	}

	async list(prefix?: string): Promise<Array<{ key: string; value: unknown }>> {
		const items: Array<{ key: string; value: unknown }> = [];
		for (const [key, value] of this.store.entries()) {
			if (!prefix || key.startsWith(prefix)) {
				items.push({ key, value });
			}
		}
		return items;
	}
}

export function createMockPluginContext(seed?: Record<string, unknown>): PluginContext {
	const kv = new MemoryKV(seed);
	return {
		plugin: {
			id: "seo-core",
			version: "0.1.0",
		},
		storage: {},
		kv,
		log: {
			debug: () => undefined,
			info: () => undefined,
			warn: () => undefined,
			error: () => undefined,
		},
		site: {
			name: "Example Site",
			url: "https://example.com",
			locale: "en",
		},
		url(path: string) {
			return new URL(path, "https://example.com").toString();
		},
	};
}

export function createPageContext(
	overrides: Partial<PublicPageContext> = {},
): PublicPageContext {
	return {
		url: "https://example.com/posts/hello-world?utm_source=test#fragment",
		path: "/posts/hello-world",
		locale: "en",
		kind: "content",
		pageType: "article",
		title: "Hello World",
		description: "A hello world article.",
		canonical: "https://example.com/posts/hello-world",
		image: "https://cdn.example.com/hello-world.jpg",
		content: {
			collection: "posts",
			id: "post_1",
			slug: "hello-world",
		},
		seo: {
			ogTitle: null,
			ogDescription: null,
			ogImage: null,
			robots: null,
		},
		articleMeta: {
			publishedTime: "2026-04-02T12:00:00.000Z",
			modifiedTime: "2026-04-03T08:15:00.000Z",
			author: "Mason James",
		},
		siteName: "Example Site",
		...overrides,
	};
}

export function createSettings(
	overrides: Partial<SeoCoreSettings> = {},
): SeoCoreSettings {
	return {
		schemaVersion: 1,
		homepageDescription: "The best example homepage description.",
		defaultRobots: "index,follow",
		defaultOgImage: "https://cdn.example.com/default-og.jpg",
		publisherType: "organization",
		publisherName: "Example Site",
		publisherLogoUrl: "https://cdn.example.com/logo.png",
		publisherSameAs: ["https://twitter.com/example"],
		...overrides,
	};
}
