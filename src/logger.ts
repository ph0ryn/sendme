export type LogMode = "auth" | "send";

export interface Logger {
  command(): void;
  error(error: string | undefined): void;
  log(text: string): void;
}

export const createLogger = (mode: LogMode): Logger => ({
  command(): void {
    console.log(`command: ${mode}`);
  },
  error(error: string | undefined): void {
    if (error !== undefined) {
      console.log(`error: ${error}`);
    }
  },
  log(text: string): void {
    console.log(text);
  },
});
