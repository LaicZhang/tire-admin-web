import { config, flushPromises, mount, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, nextTick, reactive, type Component } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";

const noopDirective = {
  mounted: () => undefined,
  updated: () => undefined,
  unmounted: () => undefined
};

const EmptyRouteComponent = defineComponent({
  name: "EmptyRouteComponent",
  render: () => h("div", { class: "empty-route-component" })
});

const RouterViewStub = defineComponent({
  name: "RouterView",
  setup(_, { slots }) {
    const route = {
      path: "/",
      fullPath: "/",
      name: "home",
      meta: {},
      matched: [],
      params: {},
      query: {}
    };
    return () =>
      slots.default?.({ Component: EmptyRouteComponent, route }) ??
      h("div", { class: "router-view-stub" });
  }
});

const KeepAliveFrameStub = defineComponent({
  name: "KeepAliveFrame",
  props: ["currComp", "currRoute"],
  setup(_, { slots }) {
    return () =>
      slots.default?.({
        Comp: EmptyRouteComponent,
        fullPath: "/",
        frameInfo: {}
      }) ?? h("div", { class: "keep-alive-frame-stub" });
  }
});

config.global.plugins = [];
config.global.renderStubDefaultSlot = true;
config.global.stubs = {
  teleport: true,
  transition: true,
  "transition-group": true,
  RouterView: RouterViewStub,
  "router-view": RouterViewStub,
  RouterLink: defineComponent({
    name: "RouterLink",
    setup(_, { slots }) {
      return () => h("a", slots.default?.());
    }
  }),
  "router-link": defineComponent({
    name: "RouterLink",
    setup(_, { slots }) {
      return () => h("a", slots.default?.());
    }
  }),
  KeepAliveFrame: KeepAliveFrameStub,
  Footer: true,
  Auth: true,
  IconifyIconOffline: true,
  PureDescriptions: true,
  ReportSparkline: true,
  ReQrcode: true,
  "icon-ep-search": true,
  "i-ep-loading": true,
  ElMenu: defineComponent({
    setup(_props, { expose, slots }) {
      expose({ handleResize: () => undefined });
      return () => h("div", { class: "el-menu-stub" }, slots.default?.());
    }
  }),
  "pure-table": defineComponent({
    props: ["data", "columns"],
    setup(props, { slots }) {
      return () => {
        const rows = Array.isArray(props.data) ? props.data : [];
        return h(
          "div",
          { class: "pure-table-stub" },
          rows.flatMap((row, index) =>
            Object.entries(slots)
              .filter(([name]) => name !== "default")
              .flatMap(([, slot]) => slot?.({ row, $index: index }) ?? [])
          )
        );
      };
    }
  }),
  ElTableColumn: defineComponent({
    props: [
      "label",
      "prop",
      "width",
      "minWidth",
      "fixed",
      "align",
      "formatter"
    ],
    setup() {
      return () => h("div", { class: "el-table-column-stub" });
    }
  }),
  PureTableBar: defineComponent({
    props: ["title", "columns"],
    emits: ["refresh"],
    setup(_props, { slots }) {
      return () =>
        h("div", { class: "pure-table-bar-stub" }, [
          slots.buttons?.(),
          slots.default?.({ size: "default", dynamicColumns: [] })
        ]);
    }
  }),
  ElStatistic: defineComponent({
    props: ["title", "value", "prefix", "suffix", "precision"],
    setup(_props, { slots }) {
      return () => h("div", { class: "el-statistic-stub" }, slots.default?.());
    }
  })
};

// Deep mounts still skip Element Plus internals, which are unrelated to the
// page behavior under test and otherwise trigger recursive watcher updates.
const elementStubs: Record<string, boolean> = {};
for (const name of [
  "ElAffix",
  "ElAlert",
  "ElAnchor",
  "ElAnchorLink",
  "ElAutocomplete",
  "ElAvatar",
  "ElBacktop",
  "ElBadge",
  "ElBreadcrumb",
  "ElBreadcrumbItem",
  "ElButton",
  "ElButtonGroup",
  "ElCalendar",
  "ElCard",
  "ElCarousel",
  "ElCarouselItem",
  "ElCascader",
  "ElCascaderPanel",
  "ElCheckbox",
  "ElCheckboxButton",
  "ElCheckboxGroup",
  "ElCol",
  "ElCollapse",
  "ElCollapseItem",
  "ElColorPicker",
  "ElConfigProvider",
  "ElContainer",
  "ElAside",
  "ElFooter",
  "ElHeader",
  "ElMain",
  "ElDatePicker",
  "ElDescriptions",
  "ElDescriptionsItem",
  "ElDialog",
  "ElDivider",
  "ElDrawer",
  "ElDropdown",
  "ElDropdownItem",
  "ElDropdownMenu",
  "ElEmpty",
  "ElForm",
  "ElFormItem",
  "ElIcon",
  "ElImage",
  "ElImageViewer",
  "ElInput",
  "ElInputNumber",
  "ElLink",
  "ElLoading",
  "ElMenu",
  "ElMenuItem",
  "ElMenuItemGroup",
  "ElOption",
  "ElOptionGroup",
  "ElPagination",
  "ElPopconfirm",
  "ElPopover",
  "ElProgress",
  "ElRadio",
  "ElRadioButton",
  "ElRadioGroup",
  "ElRate",
  "ElResult",
  "ElRow",
  "ElScrollbar",
  "ElSegmented",
  "ElSelect",
  "ElSkeleton",
  "ElSkeletonItem",
  "ElSlider",
  "ElSpace",
  "ElSplitter",
  "ElSplitterPanel",
  "ElStatistic",
  "ElStep",
  "ElSteps",
  "ElSubMenu",
  "ElSwitch",
  "ElTable",
  "ElTableColumn",
  "ElTabPane",
  "ElTabs",
  "ElTag",
  "ElText",
  "ElTimePicker",
  "ElTimeSelect",
  "ElTimeline",
  "ElTimelineItem",
  "ElTooltip",
  "ElTransfer",
  "ElTree",
  "ElTreeSelect",
  "ElUpload",
  "ElWatermark"
]) {
  if (!(name in config.global.stubs)) elementStubs[name] = true;
}
config.global.stubs = { ...config.global.stubs, ...elementStubs };

const emptyRoleDashboardSection = {
  key: "store",
  title: "",
  targetPath: "/fixture",
  summaryCards: [],
  trend: [],
  ranking: [],
  alerts: []
};

const smokePropOverrides: Record<string, Record<string, unknown>> = {
  "components/keepAliveFrame/index.vue": {
    currRoute: {
      path: "/",
      fullPath: "/",
      name: "home",
      meta: {},
      matched: [],
      params: {},
      query: {},
      hash: "",
      redirectedFrom: undefined
    },
    currComp: EmptyRouteComponent
  },
  "ImportExport/ImportResultPanel.vue": {
    result: null
  },
  "error/components/ErrorPage.vue": {
    code: "404",
    message: "Not found",
    icon: defineComponent({
      render: () => h("span", { class: "fixture-icon" })
    })
  },
  "TableOperations/index.vue": {
    row: {}
  },
  "analysis/components/RoleDashboardContent.vue": {
    data: {
      roleProfile: {
        key: "admin",
        label: "总览",
        description: "",
        homeTitle: "",
        roles: []
      },
      filters: { startDate: "", endDate: "" },
      visibleModuleKeys: [],
      focusCards: [],
      todoItems: [],
      sections: []
    }
  },
  "analysis/components/RoleDashboardSection.vue": {
    section: emptyRoleDashboardSection
  },
  "business/purchase/inquiry/components/PurchaseQuotationFormDialog.vue": {
    inquiry: {
      id: 1,
      status: "PENDING",
      details: []
    }
  },
  "inventory/stocktaking/StocktakingDetailEditor.vue": {
    detail: {
      id: 1,
      taskId: 1,
      tireId: "fixture",
      bookCount: 1,
      bookSerialNos: [],
      actualSerialNos: []
    }
  },
  "analysis/traceWorkbench/components/TraceIncidentDetail.vue": {
    detail: {
      incident: {
        incidentId: "incident-1",
        title: "Fixture incident",
        module: "sales",
        incidentType: "salesAnomaly",
        severity: "warning",
        status: "open",
        occurredAt: "2026-01-01T00:00:00.000Z",
        operatorName: "Operator",
        traceId: "trace-1",
        summary: "Fixture summary"
      },
      documents: [
        {
          type: "order",
          id: "order-1",
          no: "SO-1",
          label: "销售单",
          targetPath: "/business/order"
        }
      ],
      timeline: [
        {
          time: "2026-01-01T00:00:00.000Z",
          action: "create",
          operatorName: "Operator",
          result: "success"
        }
      ],
      impact: {
        inventoryDelta: "-1",
        amountDelta: "-100",
        affectedOrderCount: 1,
        affectedSkuCount: 1
      },
      actions: {
        canPreviewRollback: true,
        canExecuteRollback: true,
        canOpenLogDetail: true
      }
    }
  },
  "monitor/shared/MonitorCenter.vue": {
    mode: "company"
  }
};

export function valueForProp(type: unknown, name = ""): unknown {
  if (name === "icon") return defineComponent({ render: () => h("span") });
  if (name === "statusMap") {
    return { fixture: { label: "fixture", type: "info" } };
  }
  if (name === "path") return "/fixture";
  if (name === "frameSrc" || name === "src" || name === "url") {
    return "https://example.com/";
  }
  if (
    ["value", "amount", "price", "total", "count", "precision"].includes(
      name
    ) &&
    (type === Number || type == null)
  ) {
    return 1;
  }
  if (name === "type" && (type === String || type == null)) return "primary";
  if (
    /^(is|has|show|hide|allow|can|enable|disabled|collapse|fixedHeader)/.test(
      name
    )
  ) {
    return true;
  }
  if (type === Boolean) return false;
  if (type === Number) return 0;
  if (type === String) return "";
  if (type === Array) return [];
  if (type === Object) {
    if (
      /^(?:detail|record|row|incident|role|user|profile|company|summary|report)$/i.test(
        name
      )
    ) {
      return null;
    }
    return {};
  }
  if (type === Function) return () => undefined;
  if (Array.isArray(type)) return valueForProp(type[0], name);
  if (typeof type === "function") {
    const typeName = type.name.toLowerCase();
    if (typeName.includes("boolean")) return false;
    if (typeName.includes("number")) return 0;
    if (typeName.includes("string")) return "";
    if (typeName.includes("array")) return [];
    if (typeName.includes("object")) return {};
    if (typeName.includes("function")) return () => undefined;
  }
  return undefined;
}

export function propsFor(component: Component): Record<string, unknown> {
  const declared = (component as { props?: string[] | Record<string, unknown> })
    .props;
  if (!declared) return {};
  if (Array.isArray(declared)) {
    return Object.fromEntries(declared.map(name => [name, undefined]));
  }
  return Object.fromEntries(
    Object.entries(declared).map(([name, definition]) => {
      const prop = definition as {
        type?: unknown;
        default?: unknown;
        validator?: (value: unknown) => boolean;
      };
      if (prop && typeof prop === "object" && prop.default !== undefined) {
        const fallback =
          typeof prop.default === "function" && prop.type !== Function
            ? prop.default()
            : prop.default;
        return [name, fallback];
      }
      if (
        prop &&
        typeof prop === "object" &&
        typeof prop.validator === "function"
      ) {
        const candidates = [
          "",
          "default",
          "small",
          "large",
          "always",
          "hover",
          "never",
          "primary",
          "success",
          "warning",
          "danger",
          "info",
          0,
          true
        ];
        const valid = candidates.find(value => prop.validator?.(value));
        if (valid !== undefined) return [name, valid];
      }
      return [name, valueForProp(prop?.type, name)];
    })
  );
}

const variantSample = {
  id: 1,
  uid: "fixture-uid",
  key: "fixture",
  billNo: "BILL-1",
  orderNumber: "ORDER-1",
  docNo: "DOC-1",
  name: "Fixture",
  label: "Fixture",
  title: "Fixture",
  targetName: "Fixture",
  barcode: "BARCODE",
  serialNo: "SERIAL-1",
  status: "APPROVED",
  stage: "DRAFT",
  orderStatus: "PENDING",
  logisticsStatus: "SHIPPED",
  type: "SALE",
  action: "primary",
  businessType: "SALE",
  sourceType: "PURCHASE",
  paymentMethod: "CASH",
  isApproved: true,
  isLocked: false,
  isArrival: true,
  isShipped: true,
  isDelivered: false,
  isPublic: true,
  isDefault: true,
  isActive: true,
  success: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  orderDate: "2026-01-01",
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  operatorName: "Operator",
  auditorName: "Auditor",
  providerName: "Provider",
  customerName: "Customer",
  repoName: "Repository",
  amount: 100,
  totalAmount: 100,
  unitPrice: 50,
  price: 50,
  count: 1,
  quantity: 1,
  percent: 80,
  rate: 10,
  remark: "fixture",
  reason: "fixture",
  details: [
    {
      id: 1,
      uid: "line-1",
      tireId: "tire-1",
      repoId: "repo-1",
      count: 1,
      quantity: 1,
      isArrival: true,
      isShipped: true,
      unitPrice: 50,
      total: 50
    }
  ],
  list: [],
  records: [],
  items: [],
  options: [],
  children: [],
  data: [],
  row: {},
  props: {},
  column: {}
};

function cloneShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneShape(item)])
    );
  }
  return value;
}

function filledShape(value: unknown): unknown {
  if (Array.isArray(value)) return [variantSample];
  if (value && typeof value === "object") {
    return {
      ...variantSample,
      ...Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, filledShape(item)])
      )
    };
  }
  if (typeof value === "boolean") return true;
  if (typeof value === "string") return "fixture";
  if (typeof value === "number") return 1;
  if (value === null) return variantSample;
  return value;
}

function emptyShape(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, emptyShape(item)])
    );
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (value === null) return {};
  return value;
}

const alternateStrings: Record<string, string> = {
  APPROVED: "PENDING",
  PENDING: "APPROVED",
  SALE: "PURCHASE",
  PURCHASE: "SALE",
  SHIPPED: "PENDING",
  primary: "danger",
  success: "warning"
};

function alternateShape(value: unknown): unknown {
  if (Array.isArray(value)) return [variantSample];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, alternateShape(item)])
    );
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "string") return alternateStrings[value] ?? "";
  if (typeof value === "number") return 0;
  if (value === null) return {};
  return value;
}

export function variantPropsFor(
  component: Component,
  variant: number,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const base = { ...propsFor(component), ...overrides };
  if (variant === 0) return base;
  const out = { ...base };
  for (const [name, value] of Object.entries(base)) {
    if (Object.prototype.hasOwnProperty.call(overrides, name)) continue;
    const propType = typeOfProp(component, name);
    if (variant === 1) {
      out[name] =
        Array.isArray(value) || propType === Array
          ? [variantSample]
          : filledShape(cloneShape(value));
    } else if (variant === 2) {
      out[name] =
        Array.isArray(value) || propType === Array
          ? []
          : emptyShape(cloneShape(value));
    } else if (variant === 3) {
      out[name] =
        Array.isArray(value) || propType === Array
          ? [variantSample]
          : alternateShape(cloneShape(value));
    }
  }
  return out;
}

function typeOfProp(component: Component, name: string): unknown {
  const declared = (component as { props?: string[] | Record<string, unknown> })
    .props;
  if (!declared || Array.isArray(declared)) return undefined;
  return (declared[name] as { type?: unknown } | undefined)?.type;
}

export async function mountSmokeComponent(
  loader: () => Promise<{ default: Component }>,
  sourcePath = "",
  options: {
    keepMounted?: boolean;
    deep?: boolean;
    allowRenderErrors?: boolean;
    variant?: number;
    fillSlots?: boolean;
    route?: string;
    props?: Record<string, unknown>;
    globalStubs?: Record<string, Component | boolean>;
  } = {}
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const storage = reactive({
    locale: { locale: "zh-CN" },
    layout: {
      layout: "vertical",
      theme: "light",
      darkMode: false,
      sidebarStatus: true,
      epThemeColor: "#409EFF",
      themeColor: "light",
      overallStyle: "light"
    },
    configure: {
      grey: false,
      weak: false,
      hideTabs: false,
      hideFooter: true,
      showLogo: true,
      showModel: "smart",
      multiTagsCache: false,
      stretch: false
    },
    tags: []
  });
  window.localStorage.setItem(
    "responsive-layout",
    JSON.stringify(storage.layout)
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: { template: "<div />" } },
      {
        path: "/:pathMatch(.*)*",
        name: "fallback",
        component: { template: "<div />" }
      }
    ]
  });
  await router.push(options.route ?? "/");
  await router.isReady();
  window.history.replaceState({}, "", "/");

  const module = await loader();
  const normalizedSourcePath = sourcePath
    .replace(/\\/g, "/")
    .replace(/^\.\.\//, "");
  const overrideKey = Object.keys(smokePropOverrides).find(
    key =>
      normalizedSourcePath === key || normalizedSourcePath.endsWith(`/${key}`)
  );
  const props = variantPropsFor(module.default, options.variant ?? 0, {
    ...(overrideKey ? smokePropOverrides[overrideKey] : {}),
    ...options.props
  });
  if (sourcePath.includes("ReDialog")) {
    const { getGlobalDialogStore } =
      await import("@/components/ReDialog/dialog-service");
    getGlobalDialogStore().value.push({
      title: "fixture",
      visible: true,
      contentRenderer: () => h("span", "fixture")
    });
  }
  const slots = options.fillSlots
    ? Object.fromEntries(
        Object.keys(
          (module.default as { slots?: Record<string, unknown> }).slots ?? {}
        ).map(name => [
          name,
          () => h("div", { class: `slot-${name}` }, "fixture")
        ])
      )
    : undefined;
  const renderErrors: unknown[] = [];
  const mountComponent = options.deep ? mount : shallowMount;
  const wrapper = mountComponent(module.default, {
    props,
    slots,
    global: {
      plugins: [pinia, router],
      stubs: options.globalStubs,
      directives: {
        auth: noopDirective,
        loading: noopDirective,
        tippy: noopDirective,
        motion: noopDirective,
        ripple: noopDirective
      },
      provide: sourcePath.includes("ReDialog")
        ? {
            [(await import("@/components/ReDialog/useDialogStore"))
              .DIALOG_STORE_KEY]: (
              await import("@/components/ReDialog/dialog-service")
            ).getGlobalDialogStore()
          }
        : {},
      config: {
        errorHandler: error => {
          renderErrors.push(error);
        },
        globalProperties: {
          $storage: storage,
          $config: {
            Title: "Tire Admin",
            Layout: "vertical",
            Theme: "light",
            SidebarStatus: true
          }
        }
      }
    }
  });

  await flushPromises();
  await nextTick();
  if (!options.allowRenderErrors) expect(renderErrors).toEqual([]);
  expect(wrapper.exists()).toBe(true);
  expect(
    wrapper.html(),
    renderErrors.map(error => String(error)).join("\n")
  ).not.toBe("");

  if (!options.keepMounted) {
    try {
      wrapper.unmount();
    } finally {
      document.body.innerHTML = "";
    }
  }
  return wrapper;
}
