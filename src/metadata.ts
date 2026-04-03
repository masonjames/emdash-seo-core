import type { PageMetadataContribution, PublicPageContext } from "emdash";

import { buildSeoCorePrimaryGraph } from "./jsonld.js";
import type { SeoCoreSettings } from "./types.js";
import {
	normalizeAbsoluteHttpUrl,
	normalizeNullableText,
	resolveEffectiveCanonical,
	resolveEffectiveMetaDescription,
	resolveEffectiveOgDescription,
	resolveEffectiveOgImage,
	resolveEffectivePublisherName,
	resolveEffectiveRobots,
} from "./utils.js";

export function buildSeoCoreContributions(
	page: PublicPageContext,
	settings: SeoCoreSettings,
): PageMetadataContribution[] {
	const contributions: PageMetadataContribution[] = [];

	const pageDescription = normalizeNullableText(page.description);
	const pageOgDescription = normalizeNullableText(page.seo?.ogDescription);
	const pageRobots = normalizeNullableText(page.seo?.robots);
	const pageCanonical = normalizeAbsoluteHttpUrl(page.canonical);
	const pageOgImage = normalizeNullableText(page.seo?.ogImage);
	const pageImage = normalizeNullableText(page.image);
	const pageSiteName = normalizeNullableText(page.siteName);

	const canonical = resolveEffectiveCanonical(page);
	const metaDescription = resolveEffectiveMetaDescription(page, settings);
	const ogDescription = resolveEffectiveOgDescription(page, settings);
	const robots = resolveEffectiveRobots(page, settings);
	const ogImage = resolveEffectiveOgImage(page, settings);
	const publisherName = resolveEffectivePublisherName(page, settings);

	if (!pageDescription && metaDescription) {
		contributions.push({
			kind: "meta",
			name: "description",
			content: metaDescription,
		});
	}

	if (!pageOgDescription && !pageDescription && ogDescription) {
		contributions.push(
			{
				kind: "property",
				property: "og:description",
				content: ogDescription,
			},
			{
				kind: "meta",
				name: "twitter:description",
				content: ogDescription,
			},
		);
	}

	if (!pageRobots) {
		contributions.push({
			kind: "meta",
			name: "robots",
			content: robots,
		});
	}

	if (!pageCanonical && canonical) {
		contributions.push(
			{
				kind: "link",
				rel: "canonical",
				href: canonical,
			},
			{
				kind: "property",
				property: "og:url",
				content: canonical,
			},
		);
	}

	if (!pageOgImage && !pageImage && ogImage) {
		contributions.push(
			{
				kind: "property",
				property: "og:image",
				content: ogImage,
			},
			{
				kind: "meta",
				name: "twitter:image",
				content: ogImage,
			},
			{
				kind: "meta",
				name: "twitter:card",
				content: "summary_large_image",
			},
		);
	}

	if (!pageSiteName && publisherName) {
		contributions.push({
			kind: "property",
			property: "og:site_name",
			content: publisherName,
		});
	}

	const graph = buildSeoCorePrimaryGraph(page, settings);
	if (graph) {
		contributions.push({
			kind: "jsonld",
			id: "primary",
			graph,
		});
	}

	return contributions;
}
