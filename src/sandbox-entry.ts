import { definePlugin } from "emdash";
import type { PluginContext, PublicPageContext } from "emdash";

import { handleSeoCoreAdminRoute } from "./admin-route.js";
import { buildSeoCoreContributions } from "./metadata.js";
import { loadSeoCoreSettings } from "./settings.js";

export const seoCorePlugin = definePlugin({
	hooks: {
		"page:metadata": {
			priority: 500,
			handler: async (event: { page: PublicPageContext }, ctx: PluginContext) => {
				const settings = await loadSeoCoreSettings(ctx);
				return buildSeoCoreContributions(event.page, settings);
			},
		},
	},
	routes: {
		admin: {
			handler: async (routeCtx: { input: unknown }, ctx: PluginContext) => {
				return handleSeoCoreAdminRoute(routeCtx, ctx);
			},
		},
	},
});

export default seoCorePlugin;
