const VARIABLE_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export function extractVariableKeys(text: string): string[] {
  const keys = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const key = match[1]?.trim();
    if (key) {
      keys.add(key);
    }
  }
  return [...keys];
}

export function extractVariablesFromSteps(
  steps: Array<{ subject?: string; body?: string }>,
): string[] {
  const keys = new Set<string>();
  for (const step of steps) {
    for (const key of extractVariableKeys(step.subject ?? "")) {
      keys.add(key);
    }
    for (const key of extractVariableKeys(step.body ?? "")) {
      keys.add(key);
    }
  }
  return [...keys];
}

export function formatVariableToken(key: string): string {
  return `{{${key}}}`;
}
