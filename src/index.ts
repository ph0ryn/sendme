#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const configDirectoryPath = join(homedir(), ".config", "sendme");
const configFilePath = join(configDirectoryPath, "config.json");
const authTestBody = { content: "sendme auth test" };

interface Config {
  webhookUrl: string;
}

interface SendResult {
  body: string;
  error?: string;
  status: number;
}

const args = process.argv.slice(2);

const main = async (): Promise<void> => {
  if (args[0] === "auth") {
    await auth(getValueAfterSeparator(args.slice(1)));

    return;
  }

  const jsonText = getValueAfterSeparator(args);

  await send(jsonText);
};

const auth = async (webhookUrlText: string | undefined): Promise<void> => {
  const webhookUrl = parseWebhookUrl(webhookUrlText);
  const requestBody = JSON.stringify(authTestBody);

  if (webhookUrl === undefined) {
    writeLog({
      command: "auth",
      error: "Invalid webhook URL. Expected an http or https URL.",
      requestBody: webhookUrlText ?? "",
      saved: false,
      status: 400,
    });

    process.exitCode = 1;

    return;
  }

  const result = await postJson(webhookUrl, requestBody);
  const saved = isSuccessStatus(result.status);

  if (saved) {
    await saveConfig({ webhookUrl });
  }

  writeLog({
    command: "auth",
    error: result.error,
    requestBody,
    responseBody: result.body,
    saved,
    status: result.status,
    testedUrl: webhookUrl,
  });

  if (!saved) {
    process.exitCode = 1;
  }
};

const send = async (jsonText: string | undefined): Promise<void> => {
  const parsedBody = parseJsonObject(jsonText);

  if (parsedBody === undefined) {
    writeLog({
      command: "send",
      error: "Invalid JSON. Expected a JSON object.",
      requestBody: jsonText ?? "",
      status: 400,
    });

    process.exitCode = 1;

    return;
  }

  const config = await loadConfig();

  if (config === undefined) {
    writeLog({
      command: "send",
      error: "Webhook URL is not configured. Run `sendme auth -- DISCORD_WEBHOOK_URL` first.",
      requestBody: JSON.stringify(parsedBody),
      status: 401,
    });

    process.exitCode = 1;

    return;
  }

  const requestBody = JSON.stringify(parsedBody);
  const result = await postJson(config.webhookUrl, requestBody);

  if (isSuccessStatus(result.status)) {
    console.log(result.status);

    return;
  }

  writeLog({
    command: "send",
    error: result.error,
    requestBody,
    responseBody: result.body,
    status: result.status,
  });

  process.exitCode = 1;
};

const getValueAfterSeparator = (values: string[]): string | undefined => {
  if (values[0] === "--") {
    return values[1];
  }

  return values[0];
};

const parseWebhookUrl = (value: string | undefined): string | undefined => {
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

const parseJsonObject = (value: string | undefined): Record<string, unknown> | undefined => {
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

const postJson = async (webhookUrl: string, body: string): Promise<SendResult> => {
  try {
    const response = await fetch(webhookUrl, {
      body,
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    return {
      body: await response.text(),
      status: response.status,
    };
  } catch (error: unknown) {
    let errorMessage = String(error);

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      body: "",
      error: errorMessage,
      status: 0,
    };
  }
};

const isSuccessStatus = (status: number): boolean => status >= 200 && status < 300;

const loadConfig = async (): Promise<Config | undefined> => {
  try {
    const configText = await readFile(configFilePath, "utf8");
    const configValue: unknown = JSON.parse(configText);

    if (
      configValue === null ||
      typeof configValue !== "object" ||
      !("webhookUrl" in configValue) ||
      typeof configValue.webhookUrl !== "string"
    ) {
      return undefined;
    }

    return { webhookUrl: configValue.webhookUrl };
  } catch {
    return undefined;
  }
};

const saveConfig = async (config: Config): Promise<void> => {
  await mkdir(configDirectoryPath, { recursive: true });
  await writeFile(configFilePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
};

const writeLog = (entries: {
  command: string;
  error?: string;
  requestBody: string;
  responseBody?: string;
  saved?: boolean;
  status: number;
  testedUrl?: string;
}): void => {
  const lines = [`status: ${entries.status}`, `command: ${entries.command}`];

  if (entries.saved !== undefined) {
    lines.push(`saved: ${entries.saved}`);
  }

  if (entries.testedUrl !== undefined) {
    lines.push(`testedUrl: ${entries.testedUrl}`);
  }

  if (entries.error !== undefined) {
    lines.push(`error: ${entries.error}`);
  }

  lines.push("requestBody:");
  lines.push(entries.requestBody);

  if (entries.responseBody !== undefined) {
    lines.push("responseBody:");
    lines.push(entries.responseBody);
  }

  console.log(lines.join("\n"));
};

await main();
