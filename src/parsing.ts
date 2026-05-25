export const getValueAfterSeparator = (values: string[]): string | undefined => {
  if (values[0] === "--") {
    return values[1];
  }

  return values[0];
};

export const parseWebhookUrl = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
};

export const parseJsonObject = (value: string | undefined): Record<string, unknown> | undefined => {
  if (value === undefined) {
    return undefined;
  }

  try {
    const parsedValue: unknown = JSON.parse(value);

    if (parsedValue === null || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return undefined;
    }

    return parsedValue as Record<string, unknown>;
  } catch {
    return undefined;
  }
};
