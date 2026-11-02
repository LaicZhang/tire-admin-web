import type { Component } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { exerciseSetupHandlers } from "../../../tests/helpers/exercise-setup";
vi.mock("@/utils/http", () => import("../../../tests/mocks/http-rich"));
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
it("deep", async () => {
  const m = await import("../business/serviceWorkOrder/index.vue");
  const w = await mountSmokeComponent(
    async () => m as { default: Component },
    "business/serviceWorkOrder/index.vue",
    { keepMounted: true, deep: true, allowRenderErrors: true }
  );
  console.log(
    "HTML LEN",
    w.html().length,
    "STATE",
    (w.vm as any).list?.length,
    (w.vm as any).total
  );
  await exerciseSetupHandlers(w);
  console.log("AFTER LEN", w.html().length);
  console.log(w.html().match(/pure-table-stub[\s\S]{0,1000}/)?.[0]);
  w.unmount();
});
