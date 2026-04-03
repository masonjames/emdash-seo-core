import { describe, expect, it } from "vitest";

import { handleSeoCoreAdminRoute } from "../../src/admin-route.js";
import { SETTINGS_KEY } from "../../src/settings.js";
import { createMockPluginContext } from "../test-utils.js";

describe("handleSeoCoreAdminRoute", () => {
	it("renders the settings page on page load", async () => {
		const response = await handleSeoCoreAdminRoute(
			{ input: { type: "page_load", page: "/settings" } },
			createMockPluginContext(),
		);

		expect(response.toast).toBeUndefined();
		expect(response.blocks).toEqual(
			expect.arrayContaining([
				{ type: "header", text: "SEO Core" },
				expect.objectContaining({ type: "form", block_id: "seo-core-settings" }),
			]),
		);
	});

	it("saves valid settings and returns a success toast", async () => {
		const ctx = createMockPluginContext();

		const response = await handleSeoCoreAdminRoute(
			{
				input: {
					type: "form_submit",
					action_id: "save_settings",
					values: {
						homepageDescription: "A durable homepage description.",
						defaultRobots: "noindex,follow",
						defaultOgImage: "https://cdn.example.com/default-og.png",
						publisherIsPerson: true,
						publisherName: "Mason James",
						publisherLogoUrl: "https://cdn.example.com/logo.png",
						publisherSameAs: "https://twitter.com/example",
					},
				},
			},
			ctx,
		);

		expect(response.toast).toEqual({ message: "SEO Core settings saved.", type: "success" });
		await expect(ctx.kv.get(SETTINGS_KEY)).resolves.toEqual({
			schemaVersion: 1,
			homepageDescription: "A durable homepage description.",
			defaultRobots: "noindex,follow",
			defaultOgImage: "https://cdn.example.com/default-og.png",
			publisherType: "person",
			publisherName: "Mason James",
			publisherLogoUrl: "https://cdn.example.com/logo.png",
			publisherSameAs: ["https://twitter.com/example"],
		});
	});

	it("returns a validation error toast and does not persist invalid settings", async () => {
		const ctx = createMockPluginContext();

		const response = await handleSeoCoreAdminRoute(
			{
				input: {
					type: "form_submit",
					action_id: "save_settings",
					values: {
						defaultRobots: "chaos",
						defaultOgImage: "notaurl",
					},
				},
			},
			ctx,
		);

		expect(response.toast).toEqual({
			message: "SEO Core settings could not be saved.",
			type: "error",
		});
		expect(response.blocks).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: "banner", style: "error" }),
			]),
		);
		await expect(ctx.kv.get(SETTINGS_KEY)).resolves.toBeNull();
	});
});
