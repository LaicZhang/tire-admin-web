import { describe, expect, it } from "vitest";
import {
  collectChangedSettings,
  validateSystemParamValue
} from "../useSystemParamGroups";
import type { SystemParamItem } from "@/api/system/system-setting";

function makeItem(
  overrides: Partial<SystemParamItem> & Pick<SystemParamItem, "group" | "key">
): SystemParamItem {
  return {
    displayName: overrides.key,
    type: "number",
    value: "",
    storedValue: "",
    defaultValue: "",
    source: "default",
    ...overrides
  };
}

describe("validateSystemParamValue", () => {
  it("validates integer numbers and bounds", () => {
    const item = makeItem({
      group: "ops",
      key: "maxQueryLimit",
      type: "number",
      integer: true,
      min: 1,
      max: 1000
    });

    expect(validateSystemParamValue(item, "250")).toBeNull();
    expect(validateSystemParamValue(item, "")).toBe("请输入数值");
    expect(validateSystemParamValue(item, "1.5")).toBe("请输入整数");
    expect(validateSystemParamValue(item, "0")).toBe("不能小于 1");
    expect(validateSystemParamValue(item, "5000")).toBe("不能大于 1000");
  });

  it("validates enums and JSON", () => {
    const enumItem = makeItem({
      group: "env",
      key: "PAYLOAD_SANITIZE_MODE",
      type: "enum",
      enumValues: ["sanitize", "reject"]
    });
    expect(validateSystemParamValue(enumItem, "reject")).toBeNull();
    expect(validateSystemParamValue(enumItem, "nope")).toBe("请选择有效值");

    const jsonItem = makeItem({ group: "ops", key: "json", type: "json" });
    expect(validateSystemParamValue(jsonItem, '{"a":1}')).toBeNull();
    expect(validateSystemParamValue(jsonItem, "{")).toBe("请输入合法 JSON");
  });
});

describe("collectChangedSettings", () => {
  it("only includes changed keys grouped by storage group", () => {
    const items = [
      makeItem({ group: "ops", key: "maxQueryLimit" }),
      makeItem({ group: "ops", key: "importMaxRows" }),
      makeItem({ group: "env", key: "EMAIL_HOST", type: "string" })
    ];
    const initial = {
      maxQueryLimit: "100",
      importMaxRows: "5000",
      EMAIL_HOST: "smtp.qq.com"
    };

    const payload = collectChangedSettings(
      items,
      { ...initial, maxQueryLimit: "200", EMAIL_HOST: "smtp.example.com" },
      initial
    );

    expect(payload).toEqual({
      ops: { maxQueryLimit: "200" },
      env: { EMAIL_HOST: "smtp.example.com" }
    });
  });

  it("returns an empty payload when nothing changed", () => {
    const items = [makeItem({ group: "ops", key: "maxQueryLimit" })];
    const values = { maxQueryLimit: "100" };
    expect(collectChangedSettings(items, values, values)).toEqual({});
  });
});
