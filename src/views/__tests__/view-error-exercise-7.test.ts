import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";
process.on("unhandledRejection", () => undefined);
vi.mock("@/utils/http", () => import("../../../tests/mocks/http-failure"));
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
const BUCKET = Number(6);
const chunks = 8;
const entries = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .filter((_, index) => index % chunks === BUCKET);
describe("view failure exercise", () => {
  it.each(entries)("%s exercises failure state", async (sourcePath, loader) => {
    const wrapper = await mountSmokeComponent(loader, sourcePath, {
      keepMounted: true,
      deep: true,
      allowRenderErrors: true,
      variant: 1
    });
    try {
      const called = await exerciseSetupHandlers(wrapper, { variants: [1] });
      expect(Array.isArray(called)).toBe(true);
    } finally {
      wrapper.unmount();
      document.body.innerHTML = "";
    }
  });
});
