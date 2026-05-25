# sendme Agent Guide

## Repository Purpose

This repository contains a tiny Bun-compatible TypeScript CLI that sends JSON
objects to a saved Discord webhook.

Keep the CLI small and dependency-light. It is intended for AI agents to call
with minimal output.

## Tooling

- Package manager: pnpm only. Do not use npm or yarn.
- Runtime target: Bun-compatible ESM CLI.
- Module system: ESM with `"type": "module"`.
- TypeScript is configured as strict and `noEmit`.
- Linting and type checking are primarily handled by Oxlint, with ESLint used
  for TypeScript naming rules and autofix support.
- Formatting is handled by oxfmt.
- Git hooks are configured automatically during `postinstall`.

## Common Commands

Run all commands from the repository root.

| Task                 | Command           |
| -------------------- | ----------------- |
| Install dependencies | `pnpm install`    |
| Lint                 | `pnpm run lint`   |
| Format and autofix   | `pnpm run format` |

There is currently no `test`, `build`, or separate `typecheck` script.
`pnpm run lint` already runs Oxlint with `--type-aware --type-check`. Check
`package.json` before adding or running new lifecycle commands.

## Editing Rules

- Keep external code, comments, commit messages, and repository documentation in
  English.
- Preserve pnpm workspace catalog usage in `pnpm-workspace.yaml` when updating
  dependencies.
- Prefer small, direct changes over new abstractions.
- Do not add dependencies for simple CLI parsing, config, or HTTP behavior.
- Keep successful send output status-only.
- Store config under `~/.config/sendme`.

## Validation

For repository changes, run the narrowest relevant checks first. For normal CLI
maintenance, use:

```sh
pnpm run format
pnpm run lint
```

If a requested change adds a new script, runtime path, test framework, or build
step, update both `README.md` and this guide so future agents do not rely on
stale commands.
