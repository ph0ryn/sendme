import { mkdir, readFile, writeFile } from "node:fs/promises";

import { configDirectoryPath, configFilePath } from "./paths.ts";

export interface Config {
  webhookUrl: string;
}

export const loadConfig = async (): Promise<Config | undefined> => {
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

export const saveConfig = async (config: Config): Promise<void> => {
  await mkdir(configDirectoryPath, { recursive: true });
  await writeFile(configFilePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
};
