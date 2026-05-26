# Changelog

All notable changes to **vowwch** will be documented in this file.

## 0.1.0

### Added

- `contract()` — wrap any function with input/output runtime guards
- `createContractor()` — factory for shared contract configuration across multiple functions
- `defineGuard()` — create reusable, composable type guard predicates
- `batch()` — validate every item in an array against a predicate
- Three enforcement modes: `strict` (throw), `warn` (console + callback), `silent` (callback only)
- Full TypeScript support with automatic type narrowing from predicates
- `onViolation` callback for custom violation handling in `warn` and `silent` modes
- Zero dependencies — works in Node.js, Deno, Bun, and all modern browsers
- ESM and CJS dual-format distribution
- ~900 B gzipped bundle size
