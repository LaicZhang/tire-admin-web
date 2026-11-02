import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import Segmented from "../src/index";

const options = [
  { label: "Day", value: 0, icon: "ep:sunny" },
  { label: () => h("b", "Week"), value: 1, tip: "Weekly" },
  { label: "", value: 2, disabled: true }
];

const stubs = {
  "iconify-icon-offline": true,
  "iconify-icon-online": true
};

describe("ReSegmented", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 40
    });
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get: () => 20
    });
  });

  it("emits numeric model updates and renders function/icon labels", async () => {
    const wrapper = mount(Segmented, {
      props: { options, modelValue: 0, block: true },
      global: { stubs, directives: { tippy: {} } }
    });
    await nextTick();
    expect(wrapper.find(".pure-segmented-block").exists()).toBe(true);
    expect(wrapper.text()).toContain("Day");
    expect(wrapper.text()).toContain("Week");
    expect(wrapper.find(".pure-segmented-item-icon").exists()).toBe(true);
    expect(wrapper.find(".pure-segmented-item-disabled").exists()).toBe(true);

    const labels = wrapper.findAll("label");
    await labels[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([1]);
    expect(wrapper.emitted("change")?.[0]).toEqual([
      { index: 1, option: options[1] }
    ]);
  });

  it("keeps a local index for string models and skips disabled options", async () => {
    const wrapper = mount(Segmented, {
      props: { options, modelValue: "day" },
      global: { stubs, directives: { tippy: {} } }
    });
    const labels = wrapper.findAll("label");
    await labels[1].trigger("click");
    await labels[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.emitted("change")).toEqual([
      [{ index: 1, option: options[1] }]
    ]);
    expect(labels[1].attributes("style") ?? "").toMatch(
      /rgba\(0, 0, 0, \.88\)/
    );
  });

  it("tracks hover state and clears it on mouse leave", async () => {
    const wrapper = mount(Segmented, {
      props: { options, modelValue: "day" },
      global: { stubs, directives: { tippy: {} } }
    });
    const labels = wrapper.findAll("label");
    await labels[1].trigger("mouseenter");
    expect(labels[1].attributes("style")).toContain("background");
    await labels[1].trigger("mouseleave");
    expect(labels[1].attributes("style") ?? "").not.toContain(
      "background: rgba"
    );
  });

  it("renders category labels and empty external labels", async () => {
    const wrapper = mount(Segmented, {
      props: {
        options: [
          { label: () => h("i", "Custom"), value: "custom" },
          { label: "", value: "empty" }
        ],
        modelValue: 1
      },
      global: { stubs, directives: { tippy: {} } }
    });
    expect(wrapper.find("i").text()).toBe("Custom");
    expect(wrapper.findAll("label")).toHaveLength(2);
  });
});
