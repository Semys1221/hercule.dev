import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const GLOBALS_CSS = join(ROOT, "app", "globals.css");

const CSS_VAR_PATTERN = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
const FONT_PATTERN = /--font-(sans|mono)\s*:\s*([^;]+);/g;

export type DesignTokensSnapshot = {
  capturedAt: string;
  cssPath: string;
  variables: Record<string, string>;
  fonts: Record<string, string>;
  constraints: string[];
};

export function captureDesignTokens(): DesignTokensSnapshot {
  const css = readFileSync(GLOBALS_CSS, "utf8");
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  const themeBlock = css.match(/@theme inline\s*\{([\s\S]*?)\}/)?.[1] ?? "";
  const combined = `${rootBlock}\n${themeBlock}`;

  const variables: Record<string, string> = {};
  for (const match of combined.matchAll(CSS_VAR_PATTERN)) {
    const name = match[1];
    const value = match[2].trim();
    if (!name.startsWith("font-")) {
      variables[name] = value;
    }
  }

  const fonts: Record<string, string> = {};
  for (const match of combined.matchAll(FONT_PATTERN)) {
    fonts[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }

  return {
    capturedAt: new Date().toISOString(),
    cssPath: "app/globals.css",
    variables,
    fonts,
    constraints: [
      "Reuse project CSS variables from app/globals.css",
      "Use shadcn/ui components from components/ui",
      "Do not introduce a new visual language",
      "Match Geist typography and existing radius tokens",
    ],
  };
}

export function designTokensForTicket(): Record<string, string> {
  const snapshot = captureDesignTokens();
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot.variables)) {
    flat[`--${key}`] = value;
  }
  for (const [key, value] of Object.entries(snapshot.fonts)) {
    flat[`--font-${key}`] = value;
  }
  return flat;
}
