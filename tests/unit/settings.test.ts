import { describe, expect, it, vi } from "vitest";

import {
	DEFAULT_SETTINGS,
	SETTINGS_KEY,
	loadSeoCoreSettings,
	normalizeSeoCoreSettings,
	parseSeoCoreAdminValues,
} from "../../src/settings.js";
import { createMockPluginContext } from "../test-utils.js";

describe("settings", () => {
	it("loads defaults when no settings are stored", async () => {
		const ctx = createMockPluginContext();

		await expect(loadSeoCoreSettings(ctx)).resolves.toEqual(DEFAULT_SETTINGS);
	});

	it("normalizes malformed stored settings and logs a warning", async () => {
		const ctx = createMockPluginContext({
			[SETTINGS_KEY]: {
				defaultRobots: "wild-west",
				defaultOgImage: "notaurl",
				publisherSameAs: ["https://twitter.com/example", "notaurl"],
			},
		});
		const warn = vi.fn();
		ctx.log.warn = warn;

		const settings = await loadSeoCoreSettings(ctx);

		expect(settings.defaultRobots).toBe(DEFAULT_SETTINGS.defaultRobots);
		expect(settings.defaultOgImage).toBeNull();
		expect(settings.publisherSameAs).toEqual(["https://twitter.com/example"]);
		expect(warn).toHaveBeenCalledOnce();
	});

	it("keeps valid structured settings intact", () => {
		const normalized = normalizeSeoCoreSettings({
			homepageDescription: " Welcome home ",
			defaultRobots: "noindex,follow",
			defaultOgImage: "https://cdn.example.com/og.png",
			publisherType: "person",
			publisherName: " Mason James ",
			publisherLogoUrl: "https://cdn.example.com/logo.png",
			publisherSameAs: "https://twitter.com/example, https://github.com/example",
		});

		expect(normalized.invalid).toBe(false);
		expect(normalized.settings).toEqual({
			schemaVersion: 1,
			homepageDescription: "Welcome home",
			defaultRobots: "noindex,follow",
			defaultOgImage: "https://cdn.example.com/og.png",
			publisherType: "person",
			publisherName: "Mason James",
			publisherLogoUrl: "https://cdn.example.com/logo.png",
			publisherSameAs: ["https://twitter.com/example", "https://github.com/example"],
		});
	});

	it("parses valid admin values", () => {
		const parsed = parseSeoCoreAdminValues({
			homepageDescription: "A home page worth indexing.",
			defaultRobots: "noindex,follow",
			defaultOgImage: "https://cdn.example.com/default-og.png",
			publisherIsPerson: true,
			publisherName: "Mason James",
			publisherLogoUrl: "https://cdn.example.com/logo.png",
			publisherSameAs: "https://twitter.com/example, https://github.com/example",
		});

		expect(parsed).toEqual({
			ok: true,
			settings: {
				schemaVersion: 1,
				homepageDescription: "A home page worth indexing.",
				defaultRobots: "noindex,follow",
				defaultOgImage: "https://cdn.example.com/default-og.png",
				publisherType: "person",
				publisherName: "Mason James",
				publisherLogoUrl: "https://cdn.example.com/logo.png",
				publisherSameAs: ["https://twitter.com/example", "https://github.com/example"],
			},
		});
	});

	it("returns field errors for invalid admin values", () => {
		const parsed = parseSeoCoreAdminValues({
			defaultRobots: "robots go brrr",
			defaultOgImage: "ftp://example.com/image.png",
			publisherLogoUrl: "not-a-url",
			publisherSameAs: "https://twitter.com/example, no",
		});

		expect(parsed.ok).toBe(false);
		if (parsed.ok) {
			throw new Error("Expected invalid settings parse result.");
		}
		expect(parsed.fieldErrors).toMatchObject({
			defaultRobots: expect.stringContaining("index,follow"),
			defaultOgImage: expect.stringContaining("http:// or https://"),
			publisherLogoUrl: expect.stringContaining("http:// or https://"),
			publisherSameAs: expect.stringContaining("invalid"),
		});
	});
});
