import { loadConfig, saveConfig } from "./config.ts";
import { isSuccessStatus, postJson } from "./http.ts";
import { createLogger } from "./logger.ts";
import { parseJsonObject, parseWebhookUrl } from "./parsing.ts";
import { createLogFilePath } from "./paths.ts";

const authTestBody = { content: "sendme auth test" };

export const auth = async (webhookUrlText: string | undefined): Promise<void> => {
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

export const send = async (jsonText: string | undefined): Promise<void> => {
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
