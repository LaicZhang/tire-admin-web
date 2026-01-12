# TypeScript Type Error Fix Patterns

This document provides patterns and solutions for common TypeScript type errors in the `tire-admin-web` project.

## Common Error Categories

### 1. `options.props` is of type `{}`

**Error:** When using `addDialog`, the `options.props` in `contentRenderer` or `beforeSure` callbacks is typed as `{}`.

**Solution:** Use proper type assertion when accessing `options.props.formInline`:

```typescript
// ❌ Wrong - causes error
beforeSure: (done, { options }) => {
  const curData = options.props!.formInline as FormItemProps;
};

// ✅ Correct - proper type assertion
beforeSure: (done, { options }) => {
  const curData = (options.props as { formInline: FormItemProps }).formInline;
};
```

### 2. `unknown[]` List Types

**Error:** Lists from `localForage` or API responses typed as `unknown[]` cause errors when accessing `.uid`, `.name` properties.

**Solution:** Define a proper interface and cast:

```typescript
// ❌ Wrong - unknown[] causes property access errors
const employeeList = ref<unknown[]>([]);

// ✅ Correct - define interface
interface SelectItem {
  uid: string;
  name: string;
  [key: string]: unknown; // For additional properties
}
const employeeList = ref<SelectItem[]>([]);

// When loading data:
employeeList.value = (data as SelectItem[]) || [];
```

### 3. `row` Parameter Typed as `unknown`

**Error:** Table operation handlers receive `row` typed as `unknown`.

**Solution:** Explicitly type the row parameter:

```typescript
// ❌ Wrong
const handleDelete = async (row: unknown) => {
  await deleteApi(row.uid); // Error: Property 'uid' does not exist on 'unknown'
};

// ✅ Correct - use proper type
const handleDelete = async (row: YourItemType) => {
  await deleteApi(row.uid);
};
```

### 4. Template Event Handler Type Assertions

**Error:** Using `$event as Type` in templates may cause errors.

**Solution:** Create wrapper functions in script:

```typescript
// In script:
const handleView = (row: unknown) => {
  openDialog('查看', row as SalesReturnOrder);
};

// In template:
// ❌ Wrong - template type assertion may fail
@view="openDialog('查看', $event as SalesReturnOrder)"

// ✅ Correct - use wrapper function
@view="handleView"
```

### 5. API Response `data.list` / `data.total`

**Error:** API response `data` is typed broadly, causing `.list` and `.total` errors.

**Solution:** Cast the response data:

```typescript
// ❌ Wrong
dataList.value = res.data.list; // Error: Property 'list' does not exist

// ✅ Correct - cast with proper type
const result = res.data as { list: ItemType[]; total: number };
dataList.value = result.list;
pagination.total = result.total;
```

### 6. `emit` with Template Literal Keys

**Error:** Using template literals with `emit()` causes type errors.

**Solution:** Use explicit emit calls:

```typescript
// ❌ Wrong - template literal causes error
emit(`update:${type}List`, newList);

// ✅ Correct - use conditional emit
if (type === "customer") emit("update:customerList", newList);
else if (type === "supplier") emit("update:supplierList", newList);
else emit("update:warehouseList", newList);
```

### 7. Missing DTO Fields

**Error:** DTO interfaces lack properties being used in queries.

**Solution:** Extend the DTO interface:

```typescript
// In api/xxx.ts
export interface OrderQueryDto {
  // existing fields...

  // Add missing optional fields
  fromRepositoryId?: string;
  toRepositoryId?: string;
  auditorId?: string;
}
```

### 8. Upload Callback Signatures

**Error:** `options.onSuccess` or `options.onError` signatures don't match.

**Solution:** Match the expected signatures:

```typescript
// ❌ Wrong
options.onSuccess?.({ code }, options.file);

// ✅ Correct - onSuccess only takes one argument
options.onSuccess?.({ code });

// For errors:
const error = err instanceof Error ? err : new Error(String(err));
options.onError?.(error);
```

### 9. `FormInstance` Type for Form Refs

**Error:** Form ref and `resetForm` parameter not properly typed.

**Solution:** Import and use `FormInstance`:

```typescript
import type { FormInstance } from "element-plus";

const searchFormRef = ref<FormInstance>();

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};
```

### 10. Optional Pagination Properties

**Error:** Assigning potentially undefined values to pagination properties.

**Solution:** Use defaults:

```typescript
// ❌ Wrong
pagination.currentPage = queryForm.pageNum;

// ✅ Correct - provide defaults
pagination.currentPage = queryForm.pageNum ?? 1;
pagination.pageSize = queryForm.pageSize ?? 10;
```

## Quick Reference Table

| Error Pattern              | Solution                                                   |
| -------------------------- | ---------------------------------------------------------- |
| `options.props` is `{}`    | Cast: `(options.props as { formInline: Type }).formInline` |
| `unknown[]` lists          | Define `SelectItem` interface, cast data                   |
| `row: unknown`             | Type parameter: `row: YourItemType`                        |
| Template `$event as Type`  | Create wrapper function in script                          |
| `data.list` access         | Cast: `res.data as { list: T[]; total: number }`           |
| emit with template literal | Use conditional if/else emit                               |
| Missing DTO fields         | Extend interface with optional fields                      |
| Upload callbacks           | Match expected signatures, use `new Error()`               |
| Form refs                  | Use `FormInstance` type                                    |
| Undefined pagination       | Use nullish coalescing `??`                                |

## Running Type Check

```bash
# Check all errors
npm run typecheck

# Count errors
npm run typecheck 2>&1 | grep -E "error TS" | wc -l

# Find files with most errors
npm run typecheck 2>&1 | grep -E "error TS" | cut -d':' -f1 | sort | uniq -c | sort -rn | head -20
```
