# Audit Gate Summary

This file records repository-local policy values that are checked for drift.
Detailed cross-repository risk status is maintained in the workspace audit
execution tracker.

## Type safety

- `@typescript-eslint/no-explicit-any: error`

Run `pnpm audit:drift` after changing either this policy or `eslint.config.js`.
