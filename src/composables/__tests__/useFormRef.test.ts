import { ref } from "vue";
import type { FormInstance } from "element-plus";
import { useFormRef } from "../useFormRef";

function form(overrides: Partial<FormInstance> = {}) {
  return {
    validate: vi.fn().mockResolvedValue(true),
    validateField: vi.fn().mockResolvedValue(true),
    resetFields: vi.fn(),
    clearValidate: vi.fn(),
    scrollToField: vi.fn(),
    model: { name: "old" },
    ...overrides
  } as unknown as FormInstance;
}

describe("useFormRef", () => {
  it("returns safe defaults when no form is mounted", async () => {
    const formRef = ref<FormInstance>();
    const api = useFormRef(formRef);
    expect(api.getInstance()).toBeUndefined();
    await expect(api.validate()).resolves.toBe(false);
    await expect(api.validateField("name")).resolves.toBe(false);
    expect(() => api.resetFields()).not.toThrow();
    expect(() => api.clearValidate()).not.toThrow();
    expect(() => api.scrollToField("name")).not.toThrow();
    expect(api.getFormData()).toEqual({});
    api.setFormData({ name: "ignored" });
  });

  it("delegates to a direct Element Plus form instance", async () => {
    const instance = form();
    const api = useFormRef(ref(instance));
    await expect(api.validate()).resolves.toBe(true);
    await expect(api.validateField(["name", "code"])).resolves.toBe(true);
    api.resetFields("name");
    api.clearValidate(["name", "code"]);
    api.scrollToField("name");
    api.setFormData({ name: "new" });

    expect(api.getInstance()).toEqual(instance);
    expect(instance.validate).toHaveBeenCalledOnce();
    expect(instance.validateField).toHaveBeenCalledWith(["name", "code"]);
    expect(instance.resetFields).toHaveBeenCalledWith("name");
    expect(instance.clearValidate).toHaveBeenCalledWith(["name", "code"]);
    expect(instance.scrollToField).toHaveBeenCalledWith("name");
    expect(api.getFormData()).toEqual({ name: "new" });
  });

  it("supports wrapper refs and reports rejected field validation", async () => {
    const instance = form({
      validate: vi.fn().mockRejectedValue(new Error("invalid")),
      validateField: vi.fn().mockRejectedValue(new Error("invalid field")),
      model: undefined
    });
    const api = useFormRef(ref({ formRef: instance }));
    await expect(api.validate()).rejects.toThrow("invalid");
    await expect(api.validateField("name")).resolves.toBe(false);
    expect(api.getFormData()).toEqual({});
    api.setFormData({ ignored: true });
  });
});
