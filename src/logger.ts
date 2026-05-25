import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface Logger {
  error(error: string | undefined): Promise<void>;
  silent(text: string): Promise<void>;
  stdout(text: string): Promise<void>;
}

export const createLogger = async (logFilePath: string): Promise<Logger> => {
  await mkdir(dirname(logFilePath), { recursive: true });

  const write = async (text: string): Promise<void> => {
    await appendFile(logFilePath, `${text}\n`, "utf8");
  };

  return {
    async error(error: string | undefined): Promise<void> {
      if (error !== undefined) {
        await write(`error: ${error}`);
      }
    },
    async silent(text: string): Promise<void> {
      await write(text);
    },
    async stdout(text: string): Promise<void> {
      console.log(text);
      await write(text);
    },
  };
};
