#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { createLogger } from "./logger.ts";

const configDirectoryPath = join(homedir(), ".config", "sendme");
const configFilePath = join(configDirectoryPath, "config.json");
const logDirectoryPath = join(homedir(), ".cache", "sendme", "log");
const authTestBody = { content: "sendme auth test" };

interface Config {
  webhookUrl: string;
}

interface PostResult {
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
  const logger = await createLogger(createLogFilePath());
  const webhookUrl = parseWebhookUrl(webhookUrlText);
  const requestBody = JSON.stringify(authTestBody);

  if (webhookUrl === undefined) {
    await logger.stdout("saved: false");
    await logger.error("Invalid webhook URL. Expected an http or https URL.");
    await logger.stdout(`requestBody: ${webhookUrlText ?? ""}`);
    process.exitCode = 1;

    return;
  }

  await logger.stdout(`testedUrl: ${webhookUrl}`);
  await logger.stdout(`requestBody: ${requestBody}`);

  const result = await postJson(webhookUrl, requestBody);
  const saved = isSuccessStatus(result.status);

  if (saved) {
    await saveConfig({ webhookUrl });
  }

  await logger.stdout(`status: ${result.status}`);
  await logger.stdout(`saved: ${saved}`);
  await logger.error(result.error);
  await logger.stdout(`responseBody: ${result.body}`);

  if (!saved) {
    process.exitCode = 1;
  }
};

const send = async (jsonText: string | undefined): Promise<void> => {
  const logger = await createLogger(createLogFilePath());
  const parsedBody = parseJsonObject(jsonText);

  if (parsedBody === undefined) {
    await logger.error("Invalid JSON. Expected a JSON object.");
    await logger.stdout(`requestBody: ${jsonText ?? ""}`);
    process.exitCode = 1;

    return;
  }

  const config = await loadConfig();

  if (config === undefined) {
    await logger.error(
      "Webhook URL is not configured. Run `sendme auth -- DISCORD_WEBHOOK_URL` first.",
    );

    await logger.stdout(`requestBody: ${JSON.stringify(parsedBody)}`);
    process.exitCode = 1;

    return;
  }

  const requestBody = JSON.stringify(parsedBody);
  const result = await postJson(config.webhookUrl, requestBody);
  const status = String(result.status);

  await logger.stdout(status);

  if (isSuccessStatus(result.status)) {
    return;
  }

  await logger.error(result.error);
  await logger.stdout(`requestBody: ${requestBody}`);
  await logger.stdout(`responseBody: ${result.body}`);
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

const postJson = async (webhookUrl: string, body: string): Promise<PostResult> => {
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

const createLogFilePath = (): string => {
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return join(logDirectoryPath, `${timestamp}.log`);
};

await main();
