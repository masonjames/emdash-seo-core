import type { PluginContext } from "emdash";

import type { PublisherType, RobotsPolicy, SeoCoreSettings, SeoCoreSettingsFormState } from "./types.js";
import {
	normalizeAbsoluteHttpUrl,
	normalizeNullableText,
	parseAbsoluteHttpUrlList,
} from "./utils.js";

export const SETTINGS_KEY = "settings:config";

export const DEFAULT_SETTINGS: SeoCoreSettings = {
	schemaVersion: 1,
	homepageDescription: null,
	defaultRobots: "index,follow",
	defaultOgImage: null,
	publisherType: "organization",
	publisherName: null,
	publisherLogoUrl: null,
	publisherSameAs: [],
};

const ROBOTS_POLICIES: RobotsPolicy[] = [
	"index,follow",
	"noindex,follow",
	"noindex,nofollow",
];

export function isRobotsPolicy(value: unknown): value is RobotsPolicy {
	return typeof value === "string" && ROBOTS_POLICIES.includes(value as RobotsPolicy);
}

export function normalizeRobotsPolicy(
	value: unknown,
	fallback: RobotsPolicy = DEFAULT_SETTINGS.defaultRobots,
): RobotsPolicy {
	return isRobotsPolicy(value) ? value : fallback;
}

export function normalizePublisherType(value: unknown): PublisherType {
	return value === "person" ? "person" : "organization";
}

export function normalizeSeoCoreSettings(value: unknown): {
	settings: SeoCoreSettings;
	invalid: boolean;
} {
	if (!value || typeof value !== "object") {
		return {
			settings: { ...DEFAULT_SETTINGS },
			invalid: value !== null && value !== undefined,
		};
	}

	const raw = value as Record<string, unknown>;
	let invalid = false;

	const homepageDescription = normalizeNullableText(raw.homepageDescription);
	const defaultRobots = normalizeRobotsPolicy(raw.defaultRobots);
	if (raw.defaultRobots !== undefined && !isRobotsPolicy(raw.defaultRobots)) {
		invalid = true;
	}

	const defaultOgImage = raw.defaultOgImage === undefined ? null : normalizeAbsoluteHttpUrl(raw.defaultOgImage);
	if (raw.defaultOgImage !== undefined && raw.defaultOgImage !== null && !defaultOgImage) {
		invalid = true;
	}

	const publisherType = normalizePublisherType(raw.publisherType);
	if (raw.publisherType !== undefined && raw.publisherType !== "organization" && raw.publisherType !== "person") {
		invalid = true;
	}

	const publisherName = normalizeNullableText(raw.publisherName);
	const publisherLogoUrl =
		raw.publisherLogoUrl === undefined ? null : normalizeAbsoluteHttpUrl(raw.publisherLogoUrl);
	if (raw.publisherLogoUrl !== undefined && raw.publisherLogoUrl !== null && !publisherLogoUrl) {
		invalid = true;
	}

	const sameAs = parseAbsoluteHttpUrlList(raw.publisherSameAs);
	if (sameAs.invalid.length > 0 || (raw.publisherSameAs !== undefined && typeof raw.publisherSameAs !== "string" && !Array.isArray(raw.publisherSameAs))) {
		invalid = true;
	}

	return {
		settings: {
			schemaVersion: 1,
			homepageDescription,
			defaultRobots,
			defaultOgImage,
			publisherType,
			publisherName,
			publisherLogoUrl,
			publisherSameAs: sameAs.urls,
		},
		invalid,
	};
}

export async function loadSeoCoreSettings(
	ctx: Pick<PluginContext, "kv" | "log">,
): Promise<SeoCoreSettings> {
	const stored = await ctx.kv.get<unknown>(SETTINGS_KEY);
	if (stored === null || stored === undefined) {
		return { ...DEFAULT_SETTINGS };
	}

	const normalized = normalizeSeoCoreSettings(stored);
	if (normalized.invalid) {
		ctx.log.warn("SEO Core detected invalid saved settings and normalized them to safe values.");
	}
	return normalized.settings;
}

export async function saveSeoCoreSettings(
	ctx: Pick<PluginContext, "kv">,
	settings: SeoCoreSettings,
): Promise<void> {
	await ctx.kv.set(SETTINGS_KEY, settings);
}

export function toSeoCoreSettingsFormState(settings: SeoCoreSettings): SeoCoreSettingsFormState {
	return {
		homepageDescription: settings.homepageDescription ?? "",
		defaultRobots: settings.defaultRobots,
		defaultOgImage: settings.defaultOgImage ?? "",
		publisherIsPerson: settings.publisherType === "person",
		publisherName: settings.publisherName ?? "",
		publisherLogoUrl: settings.publisherLogoUrl ?? "",
		publisherSameAs: settings.publisherSameAs.join(", "),
	};
}

export function formStateFromRawValues(values: Record<string, unknown>): SeoCoreSettingsFormState {
	return {
		homepageDescription:
			typeof values.homepageDescription === "string" ? values.homepageDescription : "",
		defaultRobots:
			typeof values.defaultRobots === "string"
				? values.defaultRobots
				: DEFAULT_SETTINGS.defaultRobots,
		defaultOgImage: typeof values.defaultOgImage === "string" ? values.defaultOgImage : "",
		publisherIsPerson: values.publisherIsPerson === true || values.publisherType === "person",
		publisherName: typeof values.publisherName === "string" ? values.publisherName : "",
		publisherLogoUrl: typeof values.publisherLogoUrl === "string" ? values.publisherLogoUrl : "",
		publisherSameAs: typeof values.publisherSameAs === "string" ? values.publisherSameAs : "",
	};
}

export function parseSeoCoreAdminValues(
	values: Record<string, unknown>,
):
	| {
			ok: true;
			settings: SeoCoreSettings;
	  }
	| {
			ok: false;
			fieldErrors: Record<string, string>;
	  } {
	const fieldErrors: Record<string, string> = {};

	const defaultRobotsInput =
		typeof values.defaultRobots === "string"
			? values.defaultRobots.trim()
			: DEFAULT_SETTINGS.defaultRobots;
	if (!isRobotsPolicy(defaultRobotsInput)) {
		fieldErrors.defaultRobots =
			"Use one of: index,follow, noindex,follow, or noindex,nofollow.";
	}

	const defaultOgImage = normalizeNullableText(values.defaultOgImage);
	if (defaultOgImage && !normalizeAbsoluteHttpUrl(defaultOgImage)) {
		fieldErrors.defaultOgImage = "Enter a full http:// or https:// image URL.";
	}

	const publisherLogoUrl = normalizeNullableText(values.publisherLogoUrl);
	if (publisherLogoUrl && !normalizeAbsoluteHttpUrl(publisherLogoUrl)) {
		fieldErrors.publisherLogoUrl = "Enter a full http:// or https:// logo URL.";
	}

	const sameAs = parseAbsoluteHttpUrlList(values.publisherSameAs);
	if (sameAs.invalid.length > 0) {
		fieldErrors.publisherSameAs = `These URLs are invalid: ${sameAs.invalid.join(", ")}`;
	}

	if (Object.keys(fieldErrors).length > 0) {
		return {
			ok: false,
			fieldErrors,
		};
	}

	return {
		ok: true,
		settings: {
			schemaVersion: 1,
			homepageDescription: normalizeNullableText(values.homepageDescription),
			defaultRobots: defaultRobotsInput as RobotsPolicy,
			defaultOgImage: defaultOgImage ? normalizeAbsoluteHttpUrl(defaultOgImage) : null,
			publisherType: values.publisherIsPerson === true ? "person" : "organization",
			publisherName: normalizeNullableText(values.publisherName),
			publisherLogoUrl: publisherLogoUrl ? normalizeAbsoluteHttpUrl(publisherLogoUrl) : null,
			publisherSameAs: sameAs.urls,
		},
	};
}
