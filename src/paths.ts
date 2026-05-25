import { homedir } from "node:os";
import { join } from "node:path";

export const configDirectoryPath = join(homedir(), ".config", "sendme");
export const configFilePath = join(configDirectoryPath, "config.json");
export const logDirectoryPath = join(homedir(), ".cache", "sendme", "log");

export const createLogFilePath = (): string => {
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return join(logDirectoryPath, `${timestamp}.log`);
};
