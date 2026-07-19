# Admin client storage selection boundary (W8)

Three storage stacks exist on purpose. **Do not add a fourth** without an ADR.

| Library                    | Role                                                     | Primary entry             | When to use                                     |
| -------------------------- | -------------------------------------------------------- | ------------------------- | ----------------------------------------------- |
| `responsive-storage`       | Layout/theme responsive preferences (PureAdmin heritage) | `src/utils/responsive.ts` | App shell layout toggles only                   |
| `localforage`              | Large/async structured offline blobs                     | `src/utils/localforage/`  | Stock-taking bridge drafts, bulk offline drafts |
| `unstorage` + `idb-keyval` | Key-value store with drivers; Pinia-friendly             | `src/store/unstorage.ts`  | New feature state that needs SSR-safe async KV  |

## Rules for new code

1. Prefer **unstorage** (`src/store/unstorage.ts`) for new async key-value feature state.
2. Use **localforage** only when you need its existing helpers or large blob drafts already modeled there.
3. Do **not** introduce another persistence library (e.g. `dexie`, raw `localStorage` wrappers) for cross-page state.
4. `idb-keyval` is the unstorage IndexedDB driver peer — keep it; it is not redundant with localforage.

## Migration note

Existing call sites may stay; migrate opportunistically when touching a module. No big-bang rewrite in W8.