import type { PluginContext } from "emdash";

import {
	formStateFromRawValues,
	loadSeoCoreSettings,
	parseSeoCoreAdminValues,
	saveSeoCoreSettings,
	toSeoCoreSettingsFormState,
} from "./settings.js";
import type {
	SeoCoreAdminInteraction,
	SeoCoreAdminResponse,
	SeoCoreSettingsFormState,
	SeoCoreToast,
} from "./types.js";

function toInteraction(input: unknown): SeoCoreAdminInteraction {
	if (!input || typeof input !== "object") {
		return { type: "page_load", page: "/settings" };
	}

	const record = input as Record<string, unknown>;
	const type = typeof record.type === "string" ? record.type : "page_load";

	if (type === "form_submit") {
		return {
			type,
			action_id: typeof record.action_id === "string" ? record.action_id : undefined,
			values: isRecord(record.values) ? record.values : {},
		};
	}

	if (type === "block_action") {
		return {
			type,
			action_id: typeof record.action_id === "string" ? record.action_id : undefined,
			values: isRecord(record.values) ? record.values : {},
		};
	}

	return {
		type: "page_load",
		page: typeof record.page === "string" ? record.page : "/settings",
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function buildErrorSummary(fieldErrors: Record<string, string>): string[] {
	return Object.entries(fieldErrors).map(([field, message]) => `${field}: ${message}`);
}

function buildSettingsPage(
	form: SeoCoreSettingsFormState,
	options: {
		fieldErrors?: Record<string, string>;
		banner?: { style: "success" | "warning" | "error"; text: string };
	} = {},
): unknown[] {
	const blocks: unknown[] = [
		{ type: "header", text: "SEO Core" },
		{
			type: "section",
			text: "Fill metadata gaps without fighting EmDash core SEO. Page-specific SEO always wins; this plugin supplies defaults for canonicals, robots, social tags, and structured data.",
		},
		{ type: "context", text: "Theme requirement: render EmDashHead in your layout so plugin metadata reaches <head>." },
	];

	if (options.banner) {
		blocks.push({ type: "banner", style: options.banner.style, text: options.banner.text });
	}

	if (options.fieldErrors && Object.keys(options.fieldErrors).length > 0) {
		blocks.push({
			type: "banner",
			style: "error",
			text: "Please fix the highlighted SEO Core settings and save again.",
		});
		blocks.push({
			type: "section",
			text: buildErrorSummary(options.fieldErrors).join("\n"),
		});
	}

	blocks.push({
		type: "form",
		block_id: "seo-core-settings",
		fields: [
			{
				type: "text_input",
				action_id: "homepageDescription",
				label: "Homepage Description",
				initial_value: form.homepageDescription,
			},
			{
				type: "text_input",
				action_id: "defaultRobots",
				label: "Default Robots Policy",
				initial_value: form.defaultRobots,
			},
			{
				type: "text_input",
				action_id: "defaultOgImage",
				label: "Fallback Open Graph Image URL",
				initial_value: form.defaultOgImage,
			},
			{
				type: "toggle",
				action_id: "publisherIsPerson",
				label: "Publisher is a person",
				initial_value: form.publisherIsPerson,
			},
			{
				type: "text_input",
				action_id: "publisherName",
				label: "Publisher Name",
				initial_value: form.publisherName,
			},
			{
				type: "text_input",
				action_id: "publisherLogoUrl",
				label: "Publisher Logo URL",
				initial_value: form.publisherLogoUrl,
			},
			{
				type: "text_input",
				action_id: "publisherSameAs",
				label: "Publisher sameAs URLs",
				initial_value: form.publisherSameAs,
			},
		],
		submit: {
			label: "Save SEO Settings",
			action_id: "save_settings",
		},
	});

	blocks.push(
		{ type: "divider" },
		{
			type: "context",
			text: "SEO Core v1 does not control HTML <title> tags yet. Keep title tags in your theme/core pipeline and use this plugin for metadata defaults plus richer JSON-LD.",
		},
		{
			type: "context",
			text: "Recommended defaults mirror the strongest parts of Rank Math and The SEO Framework: sane canonicals, social fallbacks, and one authoritative structured-data graph.",
		},
	);

	return blocks;
}

function buildResponse(
	form: SeoCoreSettingsFormState,
	options: {
		fieldErrors?: Record<string, string>;
		banner?: { style: "success" | "warning" | "error"; text: string };
		toast?: SeoCoreToast;
	} = {},
): SeoCoreAdminResponse {
	return {
		blocks: buildSettingsPage(form, options),
		toast: options.toast,
	};
}

export async function handleSeoCoreAdminRoute(
	routeCtx: { input: unknown },
	ctx: PluginContext,
): Promise<SeoCoreAdminResponse> {
	const interaction = toInteraction(routeCtx.input);

	if (interaction.type === "form_submit" && interaction.action_id === "save_settings") {
		const values = interaction.values ?? {};
		const parsed = parseSeoCoreAdminValues(values);
		if (!parsed.ok) {
			return buildResponse(formStateFromRawValues(values), {
				fieldErrors: parsed.fieldErrors,
				toast: {
					message: "SEO Core settings could not be saved.",
					type: "error",
				},
			});
		}

		await saveSeoCoreSettings(ctx, parsed.settings);
		return buildResponse(toSeoCoreSettingsFormState(parsed.settings), {
			banner: {
				style: "success",
				text: "SEO Core settings saved. New defaults apply on the next page render.",
			},
			toast: {
				message: "SEO Core settings saved.",
				type: "success",
			},
		});
	}

	const settings = await loadSeoCoreSettings(ctx);
	return buildResponse(toSeoCoreSettingsFormState(settings));
}
