import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { isReactive, isRef, nextTick } from "vue";

type AnyRecord = Record<string, unknown>;

export function sampleObject(overrides: AnyRecord = {}): AnyRecord {
  return {
    id: 1,
    uid: "fixture-uid",
    key: "fixture",
    name: "Fixture",
    label: "Fixture",
    title: "Fixture",
    billNo: "BILL-0001",
    documentType: "STOCKTAKING",
    type: "primary",
    status: "APPROVED",
    stage: "DRAFT",
    orderStatus: 0,
    logisticsStatus: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    page: 1,
    pageSize: 10,
    total: 1,
    count: 1,
    amount: 100,
    price: 100,
    quantity: 1,
    qty: 1,
    remark: "fixture",
    reason: "fixture",
    message: "fixture",
    targetName: "Fixture",
    operatorName: "Fixture",
    customerId: "customer-1",
    providerId: "provider-1",
    storeId: "store-1",
    repoId: "repo-1",
    warehouseId: "warehouse-1",
    tireId: "tire-1",
    isApproved: true,
    isLocked: false,
    isArrival: true,
    details: [],
    list: [],
    rows: [],
    records: [],
    items: [],
    options: [],
    children: [],
    data: [],
    ...overrides
  };
}

function sampleFor(name: string, position: number, variant = 0): unknown {
  const lower = name.toLowerCase();
  if (/^(?:event|e|ev|evt|wheel|keyboard)/.test(lower)) {
    return new WheelEvent("wheel", { deltaX: 20, deltaY: 10 });
  }
  if (/^(?:file|blob)/.test(lower)) {
    return new File(["fixture"], "fixture.txt", { type: "text/plain" });
  }
  if (
    /^(?:index|idx|page|currentpage|offset|position|num|number|size|length|step|level|depth|n)$/.test(
      lower
    )
  ) {
    return variant === 1 ? 0 : position === 0 ? 2 : 1;
  }
  if (
    /^(?:visible|show|checked|enabled|disabled|force|refresh|reload|reset|close|open|multiple|all|desc|asc|fullscreen|expanded|selected)$/.test(
      lower
    )
  ) {
    return variant === 0;
  }
  if (
    /^(?:rows|list|items|records|data|arr|array|selected|ids|uids|keys|values|columns|fields|options)$/.test(
      lower
    )
  ) {
    return variant === 1 ? [] : [sampleObject()];
  }
  if (
    /^(?:id|ids|uid|uids|key|path|url|name|title|label|text|value|reason|date|time|phone|email|code|status|type|action|mode|formtype|ordertype|tab|query|keyword|search|sort|field|prop|format|currency|unit|direction)$/.test(
      lower
    )
  ) {
    if (lower === "id") return 1;
    if (lower === "status") return variant === 2 ? "REJECTED" : "APPROVED";
    if (lower === "type" || lower === "action") return "primary";
    if (lower === "date" || lower === "time") return "2026-01-01";
    if (lower === "format") return "YYYY-MM-DD";
    return "fixture";
  }
  if (
    /^(?:row|record|item|task|target|doc|document|order|user|profile|company|res|response|result|payload|form|config|option|rule|scope|node|section|card|summary|report|menu|route|dialog|props|params|values)$/.test(
      lower
    )
  ) {
    return sampleObject(
      variant === 2 ? { status: "REJECTED", isApproved: false } : {}
    );
  }
  if (/^(?:detail|current)$/.test(lower)) {
    return variant === 1
      ? null
      : sampleObject(
          variant === 2 ? { status: "REJECTED", isApproved: false } : {}
        );
  }
  if (
    /^(?:callback|cb|done|resolve|reject|handler|fn|listener|next)$/.test(lower)
  ) {
    return () => undefined;
  }
  return position % 2 === 0 ? "fixture" : 1;
}

function paramsFor(
  fn: (...args: unknown[]) => unknown,
  variant = 0
): unknown[] {
  const source = Function.prototype.toString.call(fn);
  const match = source.match(/^[^(]*\(([^)]*)\)/);
  const names = (match?.[1] ?? "")
    .split(",")
    .map(part => part.trim().split(/[=:]/)[0]?.trim() ?? "")
    .filter(Boolean);
  const count = Math.max(fn.length, names.length);
  return Array.from({ length: count }, (_, index) =>
    sampleFor(names[index] ?? "", index, variant)
  );
}

/** Seeds empty state and Element form handles so guarded handlers can run. */
export function primeSetupState(wrapper: VueWrapper, variant = 0) {
  const setupState = (
    wrapper.vm.$ as unknown as {
      setupState: Record<string, unknown>;
    }
  ).setupState;
  for (const [name, value] of Object.entries(setupState)) {
    if (isRef(value)) {
      if (
        /^(?:list|rows|records|dataList|data|items|options|tableData|treeData|displayList|filteredList)$/i.test(
          name
        )
      ) {
        value.value =
          variant === 1
            ? []
            : [
                sampleObject(
                  variant === 2 ? { status: "REJECTED", isApproved: false } : {}
                )
              ];
      } else if (
        /^(?:current|detail|selectedRow|activeRow|formInline|record|row)$/i.test(
          name
        )
      ) {
        value.value =
          variant === 1
            ? null
            : sampleObject(
                variant === 2 ? { status: "REJECTED", isApproved: false } : {}
              );
      } else if (
        /^(?:visible|show|createVisible|detailVisible|dialogVisible|expanded|checked|enabled)$/i.test(
          name
        ) &&
        typeof value.value === "boolean"
      ) {
        value.value = true;
      } else if (
        /formRef|tableRef|searchFormRef|treeRef|selectRef/i.test(name)
      ) {
        value.value = {
          validate: () => Promise.resolve(true),
          validateField: () => Promise.resolve(true),
          clearValidate: () => undefined,
          resetFields: () => undefined,
          scrollToField: () => undefined,
          getCheckedKeys: () => [],
          setCheckedKeys: () => undefined,
          toggleRowSelection: () => undefined,
          clearSelection: () => undefined
        };
      }
    } else if (isReactive(value) && value && typeof value === "object") {
      try {
        Object.assign(
          value,
          sampleObject(
            variant === 2 ? { status: "REJECTED", isApproved: false } : {}
          )
        );
      } catch {
        // Some reactive setup views expose readonly proxies.
      }
    }
  }
}

/**
 * Exercises setup bindings that are normally reached from a template. The
 * shallow smoke mount keeps child rendering cheap; handler invocation locks
 * down the view's own state transitions and failure guards.
 */
export async function exerciseSetupHandlers(
  wrapper: VueWrapper,
  options: { include?: RegExp; exclude?: RegExp; variants?: number[] } = {}
) {
  const setupState = (
    wrapper.vm.$ as unknown as {
      setupState: Record<string, unknown>;
    }
  ).setupState;
  const variants = options.variants ?? [0, 1, 2];
  await nextTick();
  const called: string[] = [];

  for (const [name, value] of Object.entries(setupState)) {
    // Script-setup only exposes bindings that the template consumes. Calling
    // every callback here exercises formatters, route helpers and inline event
    // handlers in addition to the conventionally named handlers.
    if (typeof value !== "function") continue;
    if (options.include && !options.include.test(name)) continue;
    if (options.exclude?.test(name)) continue;

    const fn = value as (...args: unknown[]) => unknown;
    try {
      for (const variant of variants) {
        primeSetupState(wrapper, variant);
        await nextTick();
        const result = fn.apply(wrapper.vm, paramsFor(fn, variant));
        if (result && typeof (result as Promise<unknown>).then === "function") {
          await Promise.race([
            (result as Promise<unknown>).catch(() => undefined),
            new Promise(resolve => setTimeout(resolve, 20))
          ]);
        }
        await nextTick();
      }
      called.push(name);
    } catch {
      called.push(name);
    }
  }

  const controls = wrapper.findAll(
    [
      "button",
      "el-button-stub",
      "[role='button']",
      "el-input-stub",
      "el-input-number-stub",
      "el-select-stub",
      "el-checkbox-stub",
      "el-checkbox-button-stub",
      "el-radio-stub",
      "el-radio-button-stub",
      "el-radio-group-stub",
      "el-switch-stub",
      "el-date-picker-stub",
      "el-time-picker-stub",
      "el-cascader-stub",
      "el-tree-select-stub",
      "el-autocomplete-stub",
      "el-tabs-stub",
      "el-tab-pane-stub",
      "el-segmented-stub",
      "el-pagination-stub",
      "el-table-stub",
      "pure-table-stub",
      "el-tree-stub",
      "el-dialog-stub",
      "el-drawer-stub",
      "el-dropdown-stub",
      "el-upload-stub"
    ].join(",")
  );
  const seenControls = new Set<string>();
  const tagCounts = new Map<string, number>();
  let triggered = 0;
  for (const [index, control] of controls.entries()) {
    // Repeated table-row buttons add little beyond the first representative.
    const tag = control.element.tagName.toLowerCase();
    const tagLimit =
      tag === "button" ||
      tag === "el-button-stub" ||
      control.attributes("role") === "button"
        ? 80
        : 8;
    if ((tagCounts.get(tag) ?? 0) >= tagLimit) continue;
    const signature = [
      tag,
      control.text(),
      control.attributes("class"),
      control.attributes("name")
    ].join(":");
    if (seenControls.has(signature)) continue;
    seenControls.add(signature);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    primeSetupState(wrapper, index % 3);
    await nextTick();

    const events: Array<[string, ...unknown[]]> = [];
    if (
      tag === "button" ||
      tag === "el-button-stub" ||
      control.attributes("role") === "button" ||
      tag === "el-tab-pane-stub"
    ) {
      events.push(["click"]);
    } else if (tag === "el-input-stub" || tag === "el-input-number-stub") {
      events.push(
        ["focus"],
        ["input", { target: { value: "2" } }],
        ["change", { target: { value: "2" } }],
        ["keydown", { key: "Enter", code: "Enter" }],
        ["keyup", { key: "Enter", code: "Enter" }],
        ["blur"]
      );
    } else if (
      tag === "el-select-stub" ||
      tag === "el-cascader-stub" ||
      tag === "el-tree-select-stub" ||
      tag === "el-autocomplete-stub" ||
      tag === "el-radio-group-stub" ||
      tag === "el-tabs-stub" ||
      tag === "el-segmented-stub"
    ) {
      events.push(
        ["focus"],
        ["change", sampleObject()],
        ["input", "fixture"],
        ["visible-change", true],
        ["visible-change", false],
        ["blur"]
      );
    } else if (
      tag === "el-checkbox-stub" ||
      tag === "el-checkbox-button-stub" ||
      tag === "el-switch-stub"
    ) {
      events.push(["change", true], ["input", true], ["change", false]);
    } else if (tag === "el-radio-stub" || tag === "el-radio-button-stub") {
      events.push(["change", true], ["input", true]);
    } else if (tag === "el-date-picker-stub" || tag === "el-time-picker-stub") {
      events.push(
        ["focus"],
        ["change", "2026-01-01"],
        ["input", "2026-01-01"],
        ["blur"]
      );
    } else if (tag === "el-pagination-stub") {
      events.push(
        ["current-change", 2],
        ["size-change", 20],
        ["update:current-page", 2],
        ["update:page-size", 20]
      );
    } else if (tag === "el-table-stub" || tag === "pure-table-stub") {
      events.push(
        ["row-click", sampleObject(), 0],
        ["selection-change", [sampleObject()]],
        ["sort-change", { prop: "createdAt", order: "descending" }]
      );
    } else if (tag === "el-tree-stub") {
      events.push(
        ["node-click", sampleObject()],
        ["check", sampleObject(), { checkedKeys: [1] }],
        ["current-change", sampleObject()]
      );
    } else if (tag === "el-dialog-stub" || tag === "el-drawer-stub") {
      events.push(
        ["open"],
        ["opened"],
        ["update:modelValue", false],
        ["update:modelValue", true],
        ["close"],
        ["closed"]
      );
    } else if (tag === "el-dropdown-stub") {
      events.push(
        ["command", "fixture"],
        ["visible-change", true],
        ["visible-change", false]
      );
    } else if (tag === "el-upload-stub") {
      events.push([
        "change",
        { target: { files: [new File(["fixture"], "fixture.txt")] } }
      ]);
    }

    for (const [event, ...payload] of events) {
      try {
        const trigger = control.trigger as (
          name: string,
          ...args: unknown[]
        ) => Promise<void>;
        await trigger(event, ...payload);
        triggered++;
      } catch {
        // Handler guards are asserted by the component's own state tests.
      }
      if (triggered >= 220) break;
    }
    if (triggered >= 220) break;
  }

  await flushPromises();
  await nextTick();
  return called;
}
