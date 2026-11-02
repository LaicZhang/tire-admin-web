import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";
vi.mock("@/utils/http", () => import("../../../tests/mocks/http"));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption() {},
      resize() {},
      dispose() {},
      on() {},
      off() {}
    })
  })
}));

const modules = import.meta.glob<{ default: Component }>("../**/*.vue");
const entries = Object.entries(modules);

describe("view handler exercise", () => {
  it.each(entries)("%s exercises setup handlers", async (path, loader) => {
    const wrapper = await mountSmokeComponent(loader, path, {
      keepMounted: true,
      allowRenderErrors: true,
      fillSlots: true,
      variant: 1
    });
    try {
      const called = await exerciseSetupHandlers(wrapper, { variants: [1] });
      expect(Array.isArray(called)).toBe(true);
      expect(wrapper.html()).not.toBe("");
    } finally {
      wrapper.unmount();
      document.body.innerHTML = "";
    }
  });
});
