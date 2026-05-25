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

  logCommand("auth");

  if (webhookUrl === undefined) {
    logStatus(400);
    logSaved(false);
    logError("Invalid webhook URL. Expected an http or https URL.");
    logRequestBody(webhookUrlText ?? "");
    process.exitCode = 1;

    return;
  }

  logTestedUrl(webhookUrl);
  logRequestBody(requestBody);

  const result = await postJson(webhookUrl, requestBody);
  const saved = isSuccessStatus(result.status);

  if (saved) {
    await saveConfig({ webhookUrl });
  }

  logStatus(result.status);
  logSaved(saved);
  logOptionalError(result.error);
  logResponseBody(result.body);

  if (!saved) {
    process.exitCode = 1;
  }
};

const send = async (jsonText: string | undefined): Promise<void> => {
  const parsedBody = parseJsonObject(jsonText);

  if (parsedBody === undefined) {
    logStatus(400);
    logCommand("send");
    logError("Invalid JSON. Expected a JSON object.");
    logRequestBody(jsonText ?? "");
    process.exitCode = 1;

    return;
  }

  const config = await loadConfig();

  if (config === undefined) {
    logStatus(401);
    logCommand("send");
    logError("Webhook URL is not configured. Run `sendme auth -- DISCORD_WEBHOOK_URL` first.");
    logRequestBody(JSON.stringify(parsedBody));
    process.exitCode = 1;

    return;
  }

  const requestBody = JSON.stringify(parsedBody);
  const result = await postJson(config.webhookUrl, requestBody);

  if (isSuccessStatus(result.status)) {
    console.log(result.status);

    return;
  }

  logStatus(result.status);
  logCommand("send");
  logOptionalError(result.error);
  logRequestBody(requestBody);
  logResponseBody(result.body);
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

const logStatus = (status: number): void => {
  console.log(`status: ${status}`);
};

const logCommand = (command: string): void => {
  console.log(`command: ${command}`);
};

const logSaved = (saved: boolean): void => {
  console.log(`saved: ${saved}`);
};

const logTestedUrl = (testedUrl: string): void => {
  console.log(`testedUrl: ${testedUrl}`);
};

const logError = (error: string): void => {
  console.log(`error: ${error}`);
};

const logOptionalError = (error: string | undefined): void => {
  if (error !== undefined) {
    logError(error);
  }
};

const logRequestBody = (requestBody: string): void => {
  console.log("requestBody:");
  console.log(requestBody);
};

const logResponseBody = (responseBody: string): void => {
  console.log("responseBody:");
  console.log(responseBody);
};

await main();
