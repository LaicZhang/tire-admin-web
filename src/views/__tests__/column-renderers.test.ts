import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));

type AnyRecord = Record<string, unknown>;
type Callable = (...args: unknown[]) => unknown;

const modules = import.meta.glob<AnyRecord>("../**/columns.{ts,tsx}", {
  eager: true
});

const richRow = {
  id: 1,
  uid: "row-1",
  name: "Fixture",
  label: "Fixture",
  title: "Fixture",
  desc: "Fixture",
  remark: "Fixture",
  code: "FIXTURE",
  module: "orders",
  method: "POST",
  success: true,
  status: "APPROVED",
  stage: "DRAFT",
  type: "SALE",
  action: "primary",
  businessType: "SALE",
  invoiceRole: "BUYER",
  sourceType: "PURCHASE",
  paymentMethod: "CASH",
  redFlushStatus: "SUCCESS",
  province: "Zhejiang",
  city: "Hangzhou",
  createAt: "2026-01-01T10:20:30.000Z",
  createdAt: "2026-01-01T10:20:30.000Z",
  updateAt: "2026-01-01T10:20:30.000Z",
  updatedAt: "2026-01-01T10:20:30.000Z",
  deleteAt: "2026-01-02T10:20:30.000Z",
  invoiceDate: "2026-01-01",
  startTime: "2026-01-01",
  endTime: "2026-01-31",
  amount: 12345,
  totalAmount: 12345,
  remainingAmount: 500,
  receivableBalance: 100,
  count: 2,
  quantity: 2,
  percent: 80,
  percentage: 62.5,
  sourceColumn: { name: "源字段", sampleValues: ["A", "B", "C"] },
  targetField: { name: "目标字段", type: "string" },
  rate: 12.5,
  isPublic: true,
  isApproved: true,
  isDefault: true,
  isActive: true,
  logisticsStatus: "SHIPPED",
  isArrival: false,
  isShipped: true,
  isDelivered: false,
  enabled: true,
  statusBool: false,
  provider: { name: "Provider" },
  customer: { name: "Customer" },
  operator: { name: "Operator" },
  level: { name: "VIP" },
  record: { os: "macOS", browser: "Safari" },
  row: { status: "APPROVED", success: true, amount: 12345 },
  props: { size: "small" },
  column: { property: "fixture" },
  $index: 0,
  index: 0
};

const variants: AnyRecord[] = [
  { ...richRow },
  {
    ...richRow,
    status: "PENDING",
    stage: "APPROVED",
    type: "PURCHASE",
    success: false,
    isPublic: false,
    isApproved: false,
    isArrival: true,
    isShipped: false,
    isDelivered: true,
    enabled: false,
    statusBool: true,
    deleteAt: null,
    createAt: null,
    createdAt: null,
    amount: 0,
    totalAmount: 0,
    remainingAmount: 0,
    count: 0,
    quantity: 0,
    percent: 0,
    rate: 0
  },
  {
    ...richRow,
    status: "REJECTED",
    stage: "",
    type: "CLAIM",
    businessType: "RETURN",
    invoiceRole: "SELLER",
    sourceType: "SALE",
    paymentMethod: "BANK",
    redFlushStatus: "PENDING",
    province: "",
    city: "",
    desc: "",
    remark: "",
    code: "",
    module: "",
    method: "GET",
    record: {},
    row: {},
    amount: 1234,
    totalAmount: "12345",
    remainingAmount: "0",
    percent: 100,
    rate: 100
  },
  {
    ...richRow,
    id: 0,
    uid: "",
    name: "",
    status: "DRAFT",
    type: "OTHER",
    success: null,
    amount: 0,
    count: null,
    createAt: undefined,
    deleteAt: undefined,
    row: undefined,
    props: undefined,
    column: undefined
  }
];

function boxed(variant: AnyRecord, index: number) {
  return {
    ...variant,
    row: { ...variant, ...(variant.row ?? {}) },
    props: variant.props ?? {},
    column: variant.column ?? {},
    $index: index,
    index
  };
}

describe("column renderer contracts", () => {
  it("invokes formatters, renderers, hide predicates and paging callbacks", async () => {
    let callableCount = 0;
    let returnedValues = 0;
    let failedCalls = 0;
    const failures: string[] = [];

    const invoke = async (fn: Callable, path: string) => {
      callableCount++;
      const argSets: unknown[][] = [
        [boxed(variants[0], 0), variants[0], variants[0].amount, 0],
        [boxed(variants[1], 1), variants[1], variants[1].amount, 1],
        [boxed(variants[2], 2), variants[2], variants[2].amount, 2],
        [boxed(variants[3], 3), variants[3], variants[3].amount, 3]
      ];
      for (const args of argSets) {
        try {
          const value = /cellRenderer|render$/.test(path)
            ? (() => {
                const wrapper = mount(
                  { render: () => fn(...args) },
                  { global: { stubs: { "el-tag": true, "el-progress": true } } }
                );
                const rendered = wrapper.html();
                wrapper.unmount();
                return rendered;
              })()
            : fn(...args);
          if (value && typeof (value as Promise<unknown>).then === "function") {
            await (value as Promise<unknown>);
          } else if (value !== undefined) {
            returnedValues++;
          }
        } catch (error) {
          failedCalls++;
          failures.push(`${path}: ${String(error)}`);
        }
      }
    };

    const visit = async (
      value: unknown,
      path: string,
      depth = 0
    ): Promise<void> => {
      if (depth > 5 || value == null) return;
      if (typeof value === "function") {
        await invoke(value as Callable, path);
        return;
      }
      if (Array.isArray(value)) {
        for (const [index, item] of value.entries()) {
          await visit(item, `${path}[${index}]`, depth + 1);
        }
        return;
      }
      if (typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        await visit(child, `${path}.${key}`, depth + 1);
      }
    };

    for (const [path, module] of Object.entries(modules)) {
      for (const [name, exported] of Object.entries(module)) {
        if (name === "default") continue;
        if (typeof exported === "function") {
          const factory = exported as Callable;
          const result = await factory();
          let hasCallable = false;
          const scan = (value: unknown, depth = 0): boolean => {
            if (depth > 5 || value == null) return false;
            if (typeof value === "function") return true;
            if (Array.isArray(value))
              return value.some(item => scan(item, depth + 1));
            if (typeof value === "object") {
              return Object.values(value).some(child => scan(child, depth + 1));
            }
            return false;
          };
          hasCallable = scan(result);
          if (!hasCallable && Array.isArray(result)) {
            await visit(result, `${path}.${name}()`);
          } else if (!hasCallable && result !== undefined) {
            await visit(result, `${path}.${name}()`);
          } else if (result !== undefined) {
            await visit(result, `${path}.${name}()`);
          }
        } else {
          await visit(exported, `${path}.${name}`);
        }
      }
    }

    expect(Object.keys(modules).length).toBeGreaterThan(100);
    expect(callableCount).toBeGreaterThan(300);
    expect(returnedValues).toBeGreaterThan(100);
    expect(failedCalls / (callableCount * 4)).toBeLessThan(0.2);
    expect(failures.slice(0, 10)).toEqual([]);
  });
});
