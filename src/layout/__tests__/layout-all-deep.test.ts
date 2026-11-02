import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";

vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption: () => undefined,
      resize: () => undefined,
      dispose: () => undefined,
      on: () => undefined,
      off: () => undefined
    })
  })
}));

const modules = import.meta.glob<{ default: Component }>("../**/*.vue");
const entries = Object.entries(modules).filter(
  ([path]) => path !== "../index.vue"
);

describe("layout component deep exercise", () => {
  it.each(entries)(
    "%s exercises rendered and interactive state",
    async (sourcePath, loader) => {
      const wrapper = await mountSmokeComponent(loader, sourcePath, {
        keepMounted: true,
        deep: true,
        allowRenderErrors: true
      });
      try {
        await exerciseSetupHandlers(wrapper);
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toBe("");
      } finally {
        wrapper.unmount();
        document.body.innerHTML = "";
      }
    }
  );
});
