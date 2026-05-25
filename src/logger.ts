export interface Logger {
  error(error: string | undefined): void;
  log(text: string): void;
}

export const createLogger = (): Logger => ({
  error(error: string | undefined): void {
    if (error !== undefined) {
      console.log(`error: ${error}`);
    }
  },
  log(text: string): void {
    console.log(text);
  },
});
