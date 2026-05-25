# sendme

Tiny Bun CLI for sending JSON to a Discord webhook.

## Requirements

- Bun-compatible runtime for the CLI entry point.
- pnpm for repository tooling.

## Auth

Save a Discord webhook URL after verifying it with a test message:

```sh
sendme auth -- "DISCORD_WEBHOOK_URL"
```

`auth` always prints a plain text log to stdout. If the test message receives a
2xx response, the URL is saved to `~/.config/sendme/config.json`. If the test
message fails, the URL is not saved.

## Send

Send a JSON object to the saved Discord webhook:

```sh
sendme -- '{"content":"hello"}'
```

On success, `sendme` prints only the HTTP status:

```text
204
```

On failure, `sendme` prints a plain text log to stdout and exits non-zero.

## Scripts

Run all commands from the repository root.

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm install`    | Install dependencies and configure Git hooks.    |
| `pnpm run lint`   | Run Oxlint type-aware linting and type checking. |
| `pnpm run format` | Run lint fixes, oxfmt, and ESLint fixes.         |
