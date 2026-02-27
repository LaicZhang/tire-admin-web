// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";

import RollbackTraceDialog from "../RollbackTraceDialog.vue";

vi.mock("@/utils/message", () => ({
  message: vi.fn(),
  confirmBox: vi.fn(() => Promise.resolve())
}));

vi.mock("@/utils", () => ({
  handleApiError: vi.fn()
}));

const getAdminRollbackPlanApi = vi.fn();
const postAdminRollbackByTraceApi = vi.fn();
vi.mock("@/api/admin/rollback", () => ({
  getAdminRollbackPlanApi: (...args: unknown[]) =>
    getAdminRollbackPlanApi(...args),
  postAdminRollbackByTraceApi: (...args: unknown[]) =>
    postAdminRollbackByTraceApi(...args)
}));

// Minimal Element Plus stubs (render as native controls)
const ElButton = defineComponent({
  name: "ElButton",
  inheritAttrs: true,
  props: {
    disabled: Boolean,
    loading: Boolean
  },
  emits: ["click"],
  template:
    '<button v-bind="$attrs" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
});

const ElInput = defineComponent({
  name: "ElInput",
  inheritAttrs: true,
  props: {
    modelValue: { type: String, default: "" },
    type: { type: String, default: "text" }
  },
  emits: ["update:modelValue"],
  template:
    '<textarea v-if="type===\'textarea\'" v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' +
    '<input v-else v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
});

const ElSwitch = defineComponent({
  name: "ElSwitch",
  inheritAttrs: true,
  props: { modelValue: { type: Boolean, default: false } },
  emits: ["update:modelValue"],
  template:
    '<input v-bind="$attrs" type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
});

const ElAlert = defineComponent({
  name: "ElAlert",
  inheritAttrs: true,
  template: '<div v-bind="$attrs"><slot /></div>'
});

const ElTag = defineComponent({
  name: "ElTag",
  inheritAttrs: true,
  template: '<span v-bind="$attrs"><slot /></span>'
});

const ElSkeleton = defineComponent({
  name: "ElSkeleton",
  inheritAttrs: true,
  template: '<div v-bind="$attrs">loading</div>'
});

const ElTable = defineComponent({
  name: "ElTable",
  inheritAttrs: true,
  template: '<div v-bind="$attrs"><slot /></div>'
});

const ElTableColumn = defineComponent({
  name: "ElTableColumn",
  inheritAttrs: true,
  template: "<div />"
});

function mountDialog(props: { traceId: string }) {
  return shallowMount(RollbackTraceDialog, {
    props,
    global: {
      stubs: {
        "el-button": ElButton,
        "el-input": ElInput,
        "el-switch": ElSwitch,
        "el-alert": ElAlert,
        "el-tag": ElTag,
        "el-skeleton": ElSkeleton,
        "el-table": ElTable,
        "el-table-column": ElTableColumn
      }
    }
  });
}

describe("RollbackTraceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables execute when canRollback=false and force=false", async () => {
    getAdminRollbackPlanApi.mockResolvedValueOnce({
      code: 200,
      msg: "",
      data: {
        traceId: "t-1",
        canRollback: false,
        items: []
      }
    });

    const wrapper = mountDialog({ traceId: "t-1" });
    await flushPromises();

    const execute = wrapper.get('[data-test="execute"]');
    expect((execute.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("allows execute when force=true and reason valid even if canRollback=false", async () => {
    getAdminRollbackPlanApi.mockResolvedValueOnce({
      code: 200,
      msg: "",
      data: {
        traceId: "t-1",
        canRollback: false,
        items: []
      }
    });

    postAdminRollbackByTraceApi.mockResolvedValueOnce({
      code: 200,
      msg: "",
      data: {
        list: [
          {
            traceId: "t-1",
            success: true,
            restoredCount: 1,
            skippedCount: 0,
            errors: []
          }
        ]
      }
    });

    const wrapper = mountDialog({ traceId: "t-1" });
    await flushPromises();

    await wrapper.get('[data-test="force"]').setValue(true);
    await wrapper.get('[data-test="reason"]').setValue("rollback reason");

    const execute = wrapper.get('[data-test="execute"]');
    expect((execute.element as HTMLButtonElement).disabled).toBe(false);

    await execute.trigger("click");
    await flushPromises();

    expect(postAdminRollbackByTraceApi).toHaveBeenCalledWith({
      traceIds: ["t-1"],
      reason: "rollback reason",
      force: true
    });
  });

  it("does not call rollback API when reason < 5", async () => {
    getAdminRollbackPlanApi.mockResolvedValueOnce({
      code: 200,
      msg: "",
      data: {
        traceId: "t-1",
        canRollback: true,
        items: []
      }
    });

    const wrapper = mountDialog({ traceId: "t-1" });
    await flushPromises();

    await wrapper.get('[data-test="reason"]').setValue("1234");
    const execute = wrapper.get('[data-test="execute"]');
    expect((execute.element as HTMLButtonElement).disabled).toBe(true);
    await execute.trigger("click");
    await flushPromises();

    expect(postAdminRollbackByTraceApi).not.toHaveBeenCalled();
  });
});
