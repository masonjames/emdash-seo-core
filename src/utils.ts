import type { PublicPageContext } from "emdash";

import type { SeoCoreSettings } from "./types.js";

export function normalizeNullableText(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function normalizeAbsoluteHttpUrl(value: unknown): string | null {
	const trimmed = normalizeNullableText(value);
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

export function parseAbsoluteHttpUrlList(value: unknown): {
	urls: string[];
	invalid: string[];
} {
	const rawValues = Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: typeof value === "string"
			? value.split(/[\n,]/)
			: [];

	const urls: string[] = [];
	const invalid: string[] = [];

	for (const item of rawValues) {
		const trimmed = item.trim();
		if (!trimmed) continue;
		const normalized = normalizeAbsoluteHttpUrl(trimmed);
		if (normalized) {
			urls.push(normalized);
		} else {
			invalid.push(trimmed);
		}
	}

	return {
		urls: [...new Set(urls)],
		invalid,
	};
}

export function normalizePathname(pathname: string): string {
	if (!pathname || pathname === "/") return "/";
	return pathname.endsWith("/") ? pathname.slice(0, -1) || "/" : pathname;
}

export function getPagePathname(page: PublicPageContext): string {
	try {
		return normalizePathname(new URL(page.url).pathname);
	} catch {
		return normalizePathname(page.path);
	}
}

export function isHomepage(page: PublicPageContext): boolean {
	const pathname = getPagePathname(page);
	if (pathname === "/") return true;
	if (!page.locale) return false;
	return pathname === normalizePathname(`/${page.locale}`);
}

export function resolveEffectiveCanonical(page: PublicPageContext): string | null {
	const pageCanonical = normalizeAbsoluteHttpUrl(page.canonical);
	if (pageCanonical) return pageCanonical;

	try {
		const url = new URL(page.url);
		url.search = "";
		url.hash = "";
		return url.toString();
	} catch {
		return normalizeAbsoluteHttpUrl(page.url);
	}
}

export function resolveEffectiveMetaDescription(
	page: PublicPageContext,
	settings: SeoCoreSettings,
): string | null {
	return normalizeNullableText(page.description) ?? (isHomepage(page) ? settings.homepageDescription : null);
}

export function resolveEffectiveOgDescription(
	page: PublicPageContext,
	settings: SeoCoreSettings,
): string | null {
	return normalizeNullableText(page.seo?.ogDescription) ?? resolveEffectiveMetaDescription(page, settings);
}

export function resolveEffectiveOgTitle(page: PublicPageContext): string | null {
	return normalizeNullableText(page.seo?.ogTitle) ?? normalizeNullableText(page.title);
}

export function resolveEffectiveRobots(page: PublicPageContext, settings: SeoCoreSettings): string {
	return normalizeNullableText(page.seo?.robots) ?? settings.defaultRobots;
}

export function resolveEffectiveOgImage(
	page: PublicPageContext,
	settings: SeoCoreSettings,
): string | null {
	return normalizeNullableText(page.seo?.ogImage) ?? normalizeNullableText(page.image) ?? settings.defaultOgImage;
}

export function resolveEffectivePublisherName(
	page: Pick<PublicPageContext, "siteName">,
	settings: SeoCoreSettings,
): string | null {
	return settings.publisherName ?? normalizeNullableText(page.siteName);
}

export function resolveEffectiveSiteName(
	page: Pick<PublicPageContext, "siteName">,
	settings: SeoCoreSettings,
): string | null {
	return normalizeNullableText(page.siteName) ?? resolveEffectivePublisherName(page, settings);
}
