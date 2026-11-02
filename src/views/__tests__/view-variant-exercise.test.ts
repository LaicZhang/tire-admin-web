import type { Component } from "vue";
import { nextTick } from "vue";
import { mountSmokeComponent } from "../../../tests/helpers/component-smoke";
import { primeSetupState } from "../../../tests/helpers/exercise-setup";
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
const prefix = process.env.VARIANT_PREFIX;
const entries = Object.entries(modules).filter(
  ([path]) => !prefix || path.includes(prefix)
);
const variants = [
  { variant: 1, route: "/?keyword=fixture&orderType=sale" },
  { variant: 1, route: "/business/order?orderType=purchase" },
  { variant: 2, route: "/" },
  { variant: 3, route: "/business/order?orderType=claim-order" },
  { variant: 3, route: "/business/order?orderType=return-order" }
];
const cases = entries.flatMap(([path, loader]) =>
  variants.map(
    (options, index) => [`${path}#${index}`, path, loader, options] as const
  )
);

describe("view variant rendering", () => {
  it.each(cases)(
    "%s renders populated and empty variants",
    async (_label, path, loader, options) => {
      const wrapper = await mountSmokeComponent(loader, path, {
        deep: false,
        allowRenderErrors: true,
        variant: options.variant,
        route: options.route,
        fillSlots: true,
        keepMounted: true
      });
      try {
        primeSetupState(wrapper, options.variant);
        await nextTick();
        const controls = wrapper
          .findAll("button, el-button-stub, el-tab-pane-stub")
          .slice(0, 6);
        for (const control of controls) {
          await control.trigger("click").catch(() => undefined);
        }
        const inputs = wrapper
          .findAll("el-input-stub, el-select-stub, el-switch-stub")
          .slice(0, 4);
        for (const input of inputs) {
          await input.trigger("change", "fixture").catch(() => undefined);
        }
        await nextTick();
        expect(wrapper.html()).not.toBe("");
      } finally {
        wrapper.unmount();
        document.body.innerHTML = "";
      }
    }
  );
});
