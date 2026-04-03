import { describe, expect, it } from "vitest";

import seoCore, { seoCore as createDescriptor } from "../../src/index.js";
import seoCorePlugin from "../../src/sandbox-entry.js";

describe("descriptor and standard entrypoint", () => {
	it("returns a standard plugin descriptor ready for astro.config.mjs", () => {
		const descriptor = createDescriptor();

		expect(descriptor).toEqual({
			id: "seo-core",
			version: "0.1.0",
			format: "standard",
			entrypoint: "emdash-seo-core/sandbox",
			capabilities: [],
			allowedHosts: [],
			adminPages: [{ path: "/settings", label: "SEO Core", icon: "globe" }],
		});
		expect(seoCore).toBe(createDescriptor);
	});

	it("adapts the standard runtime entry using EmDash's sandbox adapter", async () => {
		const { adaptSandboxEntry } = await import("emdash/plugins/adapt-sandbox-entry");
		const resolved = adaptSandboxEntry(
			seoCorePlugin as Parameters<typeof adaptSandboxEntry>[0],
			createDescriptor() as Parameters<typeof adaptSandboxEntry>[1],
		);

		expect(resolved.id).toBe("seo-core");
		expect(resolved.routes).toHaveProperty("admin");
		expect(resolved.hooks).toHaveProperty("page:metadata");
		expect(resolved.hooks["page:metadata"]?.priority).toBe(500);
		expect(resolved.admin.pages).toEqual([{ path: "/settings", label: "SEO Core", icon: "globe" }]);
	});
});
