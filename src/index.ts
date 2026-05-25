#!/usr/bin/env bun

import { auth, send } from "./commands.ts";
import { getValueAfterSeparator } from "./parsing.ts";

const args = process.argv.slice(2);

const main = async (): Promise<void> => {
  if (args[0] === "auth") {
    await auth(getValueAfterSeparator(args.slice(1)));

    return;
  }

  const jsonText = getValueAfterSeparator(args);

  await send(jsonText);
};

await main();
