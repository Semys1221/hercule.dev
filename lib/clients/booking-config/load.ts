import pierremeniaudJson from "@/config/clients/pierremeniaud.json";

import {
  clientBookingConfigSchema,
  type ClientBookingConfig,
  type ClientBookingVerticalConfig,
} from "./schema";

const CONFIG_BY_KEY: Record<string, ClientBookingConfig> = {
  pierremeniaud: clientBookingConfigSchema.parse(pierremeniaudJson),
};

export function loadClientBookingConfig(clientKey: string): ClientBookingConfig {
  const config = CONFIG_BY_KEY[clientKey.trim()];
  if (!config) {
    throw new Error(`Unknown client booking config: ${clientKey}`);
  }
  return config;
}

export function getEnabledVerticals(
  config: ClientBookingConfig,
): Array<{ key: string; vertical: ClientBookingVerticalConfig }> {
  return Object.entries(config.verticals)
    .filter(([, vertical]) => vertical.enabled)
    .map(([key, vertical]) => ({ key, vertical }));
}

export function findVerticalByRouteSegment(
  config: ClientBookingConfig,
  routeSegment: string,
): ClientBookingVerticalConfig | null {
  const normalized = routeSegment.trim().toLowerCase();
  for (const vertical of Object.values(config.verticals)) {
    if (vertical.routeSegment.toLowerCase() === normalized && vertical.enabled) {
      return vertical;
    }
  }
  return null;
}
