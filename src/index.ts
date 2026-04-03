import type { PluginDescriptor } from "emdash";

const VERSION = "0.1.0";
const PACKAGE_NAME = "@masonjames/emdash-seo-core";

export function seoCore(): PluginDescriptor {
	return {
		id: "seo-core",
		version: VERSION,
		format: "standard",
		entrypoint: `${PACKAGE_NAME}/sandbox`,
		capabilities: [],
		allowedHosts: [],
		adminPages: [{ path: "/settings", label: "SEO Core", icon: "globe" }],
	};
}

export default seoCore;
export type { PublisherType, RobotsPolicy, SeoCoreSettings } from "./types.js";
export { DEFAULT_SETTINGS } from "./settings.js";
