# sendme-cli

Minimal CLI for agents to send messages to Discord.

## Installation

```sh
pnpm add -g sendme-cli
```

## Usage

Save a Discord webhook URL after verifying it with a test message:

```sh
sendme auth -- "DISCORD_WEBHOOK_URL"
```

Send a JSON object to the saved Discord webhook:

```sh
sendme -- '{"content":"hello"}'
```

On success, `sendme` prints only the HTTP status:

```text
204
```

Configuration is stored in `~/.config/sendme/config.json`.
