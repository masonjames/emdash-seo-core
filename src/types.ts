export type RobotsPolicy = "index,follow" | "noindex,follow" | "noindex,nofollow";

export type PublisherType = "organization" | "person";

export interface SeoCoreSettings {
	schemaVersion: 1;
	homepageDescription: string | null;
	defaultRobots: RobotsPolicy;
	defaultOgImage: string | null;
	publisherType: PublisherType;
	publisherName: string | null;
	publisherLogoUrl: string | null;
	publisherSameAs: string[];
}

export interface SeoCoreSettingsFormState {
	homepageDescription: string;
	defaultRobots: string;
	defaultOgImage: string;
	publisherIsPerson: boolean;
	publisherName: string;
	publisherLogoUrl: string;
	publisherSameAs: string;
}

export interface SeoCoreToast {
	message: string;
	type: "success" | "error";
}

export interface SeoCoreAdminResponse {
	blocks: unknown[];
	toast?: SeoCoreToast;
}

export type SeoCoreAdminInteraction =
	| {
			type: "page_load";
			page?: string;
	  }
	| {
			type: "form_submit";
			action_id?: string;
			values?: Record<string, unknown>;
	  }
	| {
			type: "block_action";
			action_id?: string;
			values?: Record<string, unknown>;
	  };
