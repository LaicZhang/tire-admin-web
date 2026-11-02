import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));
vi.mock("@/utils/echarts", () => ({
  getEcharts: async () => ({
    init: () => ({
      setOption() {},
      resize() {},
      dispose() {},
      on() {},
      off() {}
    }),
    graphic: { LinearGradient: class {} }
  })
}));
it("deep", async () => {
  const m = await import("../welcome/index.vue");
  const w = await mountSmokeComponent(
    async () => m as { default: Component },
    "welcome/index.vue",
    { keepMounted: true, deep: true, allowRenderErrors: true }
  );
  console.log(w.html().length, (w.vm as any).$.setupState);
  w.unmount();
});
