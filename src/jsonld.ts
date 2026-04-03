import type { PublicPageContext } from "emdash";

import type { SeoCoreSettings } from "./types.js";
import {
	resolveEffectiveCanonical,
	resolveEffectiveMetaDescription,
	resolveEffectiveOgDescription,
	resolveEffectiveOgImage,
	resolveEffectiveOgTitle,
	resolveEffectivePublisherName,
	resolveEffectiveSiteName,
} from "./utils.js";

function cleanJsonLdValue(value: unknown): unknown {
	if (value === null || value === undefined || value === "") {
		return undefined;
	}

	if (Array.isArray(value)) {
		const cleaned = value
			.map((item) => cleanJsonLdValue(item))
			.filter((item): item is NonNullable<typeof item> => item !== undefined);
		return cleaned.length > 0 ? cleaned : undefined;
	}

	if (typeof value === "object") {
		const cleaned: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) {
			const normalized = cleanJsonLdValue(entry);
			if (normalized !== undefined) {
				cleaned[key] = normalized;
			}
		}
		return Object.keys(cleaned).length > 0 ? cleaned : undefined;
	}

	return value;
}

function cleanJsonLdObject(object: Record<string, unknown>): Record<string, unknown> {
	return (cleanJsonLdValue(object) as Record<string, unknown> | undefined) ?? {};
}

export function buildSeoCorePrimaryGraph(
	page: PublicPageContext,
	settings: SeoCoreSettings,
): Record<string, unknown> | null {
	const canonical = resolveEffectiveCanonical(page);
	if (!canonical) return null;

	const description = resolveEffectiveOgDescription(page, settings);
	const title = resolveEffectiveOgTitle(page);
	const image = resolveEffectiveOgImage(page, settings);
	const publisherName = resolveEffectivePublisherName(page, settings);
	const siteName = resolveEffectiveSiteName(page, settings);
	const origin = new URL(canonical).origin;
	const websiteId = `${origin}#website`;
	const publisherId = `${origin}#publisher`;
	const webpageId = `${canonical}#webpage`;
	const articleId = `${canonical}#article`;

	const graph: Record<string, unknown>[] = [];

	if (siteName) {
		graph.push(
			cleanJsonLdObject({
				"@id": websiteId,
				"@type": "WebSite",
				name: siteName,
				url: origin,
				inLanguage: page.locale ?? undefined,
				publisher: publisherName ? { "@id": publisherId } : undefined,
			}),
		);
	}

	if (publisherName) {
		graph.push(
			cleanJsonLdObject({
				"@id": publisherId,
				"@type": settings.publisherType === "person" ? "Person" : "Organization",
				name: publisherName,
				logo:
					settings.publisherType === "organization" && settings.publisherLogoUrl
						? {
								"@type": "ImageObject",
								url: settings.publisherLogoUrl,
							}
						: undefined,
				sameAs: settings.publisherSameAs,
			}),
		);
	}

	const webPageNode = cleanJsonLdObject({
		"@id": webpageId,
		"@type": "WebPage",
		url: canonical,
		name: title,
		description,
		inLanguage: page.locale ?? undefined,
		isPartOf: siteName ? { "@id": websiteId } : undefined,
		mainEntity: page.pageType === "article" ? { "@id": articleId } : undefined,
	});
	if (Object.keys(webPageNode).length > 0) {
		graph.push(webPageNode);
	}

	if (page.pageType === "article") {
		graph.push(
			cleanJsonLdObject({
				"@id": articleId,
				"@type": "BlogPosting",
				headline: title,
				description,
				image: image ? [image] : undefined,
				url: canonical,
				datePublished: page.articleMeta?.publishedTime ?? undefined,
				dateModified:
					page.articleMeta?.modifiedTime ?? page.articleMeta?.publishedTime ?? undefined,
				author: page.articleMeta?.author
					? {
							"@type": "Person",
							name: page.articleMeta.author,
						}
					: undefined,
				publisher: publisherName ? { "@id": publisherId } : undefined,
				mainEntityOfPage: { "@id": webpageId },
				isPartOf: siteName ? { "@id": websiteId } : undefined,
				inLanguage: page.locale ?? undefined,
			}),
		);
	} else if (!siteName && !publisherName) {
		return null;
	}

	const cleanedGraph = graph.filter((node) => Object.keys(node).length > 0);
	if (cleanedGraph.length === 0) return null;

	return {
		"@context": "https://schema.org",
		"@graph": cleanedGraph,
	};
}
